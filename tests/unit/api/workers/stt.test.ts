/**
 * Unit tests — PRD-8 US-009
 * AC-6/AC-7: 5 unit tests · nock OpenAI mock
 * Tests: happy / oversize / timeout / rate-limit / API error
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import nock from 'nock';

// ── vi.hoisted — shared mocks ─────────────────────────────────────────────────

const { mockCostLogCreate, mockIncr, mockExpire } = vi.hoisted(() => ({
  mockCostLogCreate: vi.fn().mockResolvedValue({ id: BigInt(1) }),
  mockIncr: vi.fn(),
  mockExpire: vi.fn().mockResolvedValue(1),
}));

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    costLog: { create: mockCostLogCreate },
  },
}));

vi.mock('@/lib/redis', () => ({
  redis: {
    incr: mockIncr,
    expire: mockExpire,
    get: vi.fn().mockResolvedValue(null),
  },
}));

// ── Imports after mocks ────────────────────────────────────────────────────────

import { WhisperSttWorker } from '@/workers/stt/whisper';
import { checkSttRateLimit, _todayKey } from '@/lib/rate-limit/stt';

// ── Helpers ────────────────────────────────────────────────────────────────────

const OPENAI_API = 'https://api.openai.com';

/**
 * Build a minimal valid PCM WAV buffer for testing.
 * durationSec at 16000Hz mono 16-bit PCM.
 */
function buildWavBuffer(durationSec: number): Buffer {
  const sampleRate = 16000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const numSamples = Math.floor(sampleRate * durationSec);
  const dataSize = numSamples * numChannels * bytesPerSample;

  const buf = Buffer.alloc(44 + dataSize, 0);

  buf.write('RIFF', 0, 'ascii');
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8, 'ascii');
  buf.write('fmt ', 12, 'ascii');
  buf.writeUInt32LE(16, 16);           // fmt chunk size
  buf.writeUInt16LE(1, 20);            // PCM
  buf.writeUInt16LE(numChannels, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28); // byte rate
  buf.writeUInt16LE(numChannels * bytesPerSample, 32);              // block align
  buf.writeUInt16LE(bitsPerSample, 34);
  buf.write('data', 36, 'ascii');
  buf.writeUInt32LE(dataSize, 40);

  return buf;
}

// ── Setup/Teardown ────────────────────────────────────────────────────────────

beforeAll(() => {
  nock.disableNetConnect();
  process.env.OPENAI_API_KEY = 'sk-test-nock-stt';
});

afterAll(() => {
  nock.enableNetConnect();
  nock.cleanAll();
  delete process.env.OPENAI_API_KEY;
});

beforeEach(() => {
  vi.clearAllMocks();
  nock.cleanAll();
});

afterEach(() => {
  nock.cleanAll();
});

// ── Test 1: happy path ────────────────────────────────────────────────────────

describe('US-009 AC-7.1: happy path — transcribes audio, writes cost_log', () => {
  it('5s WAV → Whisper mock → transcript returned + cost_log written', async () => {
    const wavBuffer = buildWavBuffer(5); // 5-second test audio

    nock(OPENAI_API)
      .post('/v1/audio/transcriptions')
      .reply(200, '大家好');

    const worker = new WhisperSttWorker();
    const result = await worker.transcribe({
      audioBuffer: wavBuffer,
      mimeType: 'audio/wav',
      accountId: 42,
      traceId: 'tr_stt_happy_001',
    });

    expect(result.transcript).toBe('大家好');
    expect(result.durationSec).toBeCloseTo(5, 0);
    expect(result.costUsd).toBeGreaterThan(0);

    // AC-3: cost_log written with correct fields
    expect(mockCostLogCreate).toHaveBeenCalledOnce();
    const createArgs = mockCostLogCreate.mock.calls[0]?.[0] as { data: Record<string, unknown> };
    expect(createArgs.data).toMatchObject({
      accountId: 42,
      agentId: 'SttWorker',
      eventType: 'stt_call',
      callType: 'stt_call',
      modelTier: 'audio',
      modelUsed: 'whisper-1',
      provider: 'openai',
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      traceId: 'tr_stt_happy_001',
    });
    expect(Number(String(createArgs.data.costUsd))).toBeGreaterThan(0);
  });
});

// ── Test 2: oversize ──────────────────────────────────────────────────────────

describe('US-009 AC-7.2: oversize — > 25MB rejects before OpenAI call', () => {
  it('Buffer > 25MB → BAD_REQUEST thrown · no OpenAI HTTP call', async () => {
    const bigBuffer = Buffer.alloc(26 * 1024 * 1024, 0); // 26MB

    const worker = new WhisperSttWorker();

    await expect(
      worker.transcribe({
        audioBuffer: bigBuffer,
        mimeType: 'audio/wav',
        accountId: 42,
        traceId: 'tr_stt_oversize',
      }),
    ).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: expect.stringContaining('25MB'),
    });

    // No OpenAI call made
    expect(nock.pendingMocks().length).toBe(0);
    expect(mockCostLogCreate).not.toHaveBeenCalled();
  });
});

// ── Test 3: timeout ───────────────────────────────────────────────────────────

describe('US-009 AC-7.3: timeout — Whisper API timeout → INTERNAL_SERVER_ERROR', () => {
  it('nock delays 500ms · worker timeout=100ms → INTERNAL_SERVER_ERROR', async () => {
    const wavBuffer = buildWavBuffer(3);

    nock(OPENAI_API)
      .post('/v1/audio/transcriptions')
      .delay(500)  // delay longer than 100ms worker timeout
      .reply(200, '应该超时了');

    const worker = new WhisperSttWorker({ timeoutMs: 100 });

    await expect(
      worker.transcribe({
        audioBuffer: wavBuffer,
        mimeType: 'audio/wav',
        accountId: 42,
        traceId: 'tr_stt_timeout',
      }),
    ).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
    });

    expect(mockCostLogCreate).not.toHaveBeenCalled();
  }, 10_000);
});

// ── Test 4: rate-limit ────────────────────────────────────────────────────────

describe('US-009 AC-7.4: rate-limit — 51st call per day → TOO_MANY_REQUESTS', () => {
  it('Redis incr > 50 → TOO_MANY_REQUESTS with correct message', async () => {
    vi.stubEnv('STT_DAILY_LIMIT_PER_USER', '50');
    mockIncr.mockResolvedValueOnce(51);

    await expect(checkSttRateLimit(42)).rejects.toMatchObject({
      code: 'TOO_MANY_REQUESTS',
      message: expect.stringContaining('50 次/天'),
    });

    // Key format check
    const [key] = mockIncr.mock.calls[0] as [string];
    expect(key).toMatch(/^rate:stt:user:42:\d{4}-\d{2}-\d{2}$/);

    vi.unstubAllEnvs();
  });

  it('50th call (boundary) passes', async () => {
    vi.stubEnv('STT_DAILY_LIMIT_PER_USER', '50');
    mockIncr.mockResolvedValueOnce(50);

    await expect(checkSttRateLimit(42)).resolves.toBeUndefined();

    vi.unstubAllEnvs();
  });

  it('_todayKey format is correct', () => {
    const key = _todayKey(1);
    expect(key).toMatch(/^rate:stt:user:1:\d{4}-\d{2}-\d{2}$/);
  });
});

// ── Test 5: API error ─────────────────────────────────────────────────────────

describe('US-009 AC-7.5: API error — OpenAI 4xx/5xx → INTERNAL_SERVER_ERROR', () => {
  it('OpenAI 500 error → INTERNAL_SERVER_ERROR thrown · no cost_log', async () => {
    const wavBuffer = buildWavBuffer(3);

    nock(OPENAI_API)
      .post('/v1/audio/transcriptions')
      .reply(500, {
        error: { message: 'Internal server error', type: 'server_error' },
      });

    // maxRetries=0 prevents SDK retry loop on 5xx (otherwise times out)
    const worker = new WhisperSttWorker({ maxRetries: 0 });

    await expect(
      worker.transcribe({
        audioBuffer: wavBuffer,
        mimeType: 'audio/wav',
        accountId: 42,
        traceId: 'tr_stt_api_error',
      }),
    ).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
    });

    expect(mockCostLogCreate).not.toHaveBeenCalled();
  });

  it('OpenAI 429 rate limit error → INTERNAL_SERVER_ERROR thrown', async () => {
    const wavBuffer = buildWavBuffer(3);

    nock(OPENAI_API)
      .post('/v1/audio/transcriptions')
      .reply(429, {
        error: { message: 'Rate limit exceeded', type: 'rate_limit_error' },
      });

    // maxRetries=0 prevents SDK retry loop on 429 (otherwise times out)
    const worker = new WhisperSttWorker({ maxRetries: 0 });

    await expect(
      worker.transcribe({
        audioBuffer: wavBuffer,
        mimeType: 'audio/wav',
        accountId: 42,
        traceId: 'tr_stt_openai_rate',
      }),
    ).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
    });
  });
});
