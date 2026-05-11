/**
 * Unit tests — PRD-8 US-010
 * AC-7/AC-8: 5 unit tests · nock OpenAI mock
 * Tests: happy / oversize / timeout / rate-limit / API error
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import nock from 'nock';

// ── vi.hoisted — shared mocks ─────────────────────────────────────────────────

const { mockCostLogCreate, mockAssetCreate, mockIncr, mockExpire } = vi.hoisted(() => ({
  mockCostLogCreate: vi.fn().mockResolvedValue({ id: BigInt(1) }),
  mockAssetCreate: vi.fn().mockResolvedValue({ id: 1 }),
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
    asset: { create: mockAssetCreate },
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

import { OpenAITtsWorker } from '@/workers/tts/openai-tts';
import { checkTtsRateLimit, _todayKey } from '@/lib/rate-limit/tts';

// ── Helpers ────────────────────────────────────────────────────────────────────

const OPENAI_API = 'https://api.openai.com';
const FAKE_MP3 = Buffer.from('ID3fake-mp3-data-bytes');

// ── Setup/Teardown ────────────────────────────────────────────────────────────

beforeAll(() => {
  nock.disableNetConnect();
  process.env.OPENAI_API_KEY = 'sk-test-nock-tts';
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

describe('US-010 AC-7.1: happy path — synthesizes text, writes asset + cost_log', () => {
  it('1000-char text → TTS mock → publicUrl returned + asset written + cost_log written', async () => {
    const text = 'a'.repeat(1000);

    nock(OPENAI_API)
      .post('/v1/audio/speech')
      .reply(200, FAKE_MP3, { 'Content-Type': 'audio/mpeg' });

    const worker = new OpenAITtsWorker();
    const result = await worker.synthesize({
      text,
      accountId: 42,
      traceId: 'tr_tts_happy_001',
    });

    expect(result.publicUrl).toBe('/static/placeholder-audio.mp3');
    expect(result.sizeBytes).toBe(FAKE_MP3.length);
    // AC-4: ceil(1000/1000) * 0.015 = 1 * 0.015 = 0.015
    expect(result.costUsd).toBeCloseTo(0.015, 6);

    // AC-3: asset written with accountId
    expect(mockAssetCreate).toHaveBeenCalledOnce();
    const assetArgs = mockAssetCreate.mock.calls[0]?.[0] as { data: Record<string, unknown> };
    expect(assetArgs.data).toMatchObject({
      accountId: 42,
      assetType: 'tts_audio',
      mimeType: 'audio/mpeg',
      sizeBytes: FAKE_MP3.length,
      generationModel: 'tts-1',
      traceId: 'tr_tts_happy_001',
    });

    // AC-4: cost_log written with correct fields
    expect(mockCostLogCreate).toHaveBeenCalledOnce();
    const costArgs = mockCostLogCreate.mock.calls[0]?.[0] as { data: Record<string, unknown> };
    expect(costArgs.data).toMatchObject({
      accountId: 42,
      agentId: 'TtsWorker',
      eventType: 'tts_call',
      callType: 'tts_call',
      modelTier: 'audio',
      modelUsed: 'tts-1',
      provider: 'openai',
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      charactersIn: 1000,
      traceId: 'tr_tts_happy_001',
    });
  });
});

// ── Test 2: oversize ──────────────────────────────────────────────────────────

describe('US-010 AC-7.2: oversize — > 4000 chars rejects before OpenAI call', () => {
  it('text.length > 4000 → BAD_REQUEST thrown · no OpenAI HTTP call', async () => {
    const oversizeText = 'x'.repeat(4001);

    const worker = new OpenAITtsWorker();

    await expect(
      worker.synthesize({
        text: oversizeText,
        accountId: 42,
        traceId: 'tr_tts_oversize',
      }),
    ).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: expect.stringContaining('4000 字符限制'),
    });

    expect(nock.pendingMocks().length).toBe(0);
    expect(mockCostLogCreate).not.toHaveBeenCalled();
    expect(mockAssetCreate).not.toHaveBeenCalled();
  });

  it('exactly 4000 chars passes', async () => {
    const exactText = 'y'.repeat(4000);

    nock(OPENAI_API)
      .post('/v1/audio/speech')
      .reply(200, FAKE_MP3, { 'Content-Type': 'audio/mpeg' });

    const worker = new OpenAITtsWorker();
    const result = await worker.synthesize({
      text: exactText,
      accountId: 42,
      traceId: 'tr_tts_boundary',
    });

    expect(result.publicUrl).toBeTruthy();
    // AC-4: ceil(4000/1000) * 0.015 = 4 * 0.015 = 0.06
    expect(result.costUsd).toBeCloseTo(0.06, 6);
  });
});

// ── Test 3: timeout ───────────────────────────────────────────────────────────

describe('US-010 AC-7.3: timeout — TTS API timeout → INTERNAL_SERVER_ERROR', () => {
  it('nock delays 500ms · worker timeout=100ms → INTERNAL_SERVER_ERROR', async () => {
    const text = 'Hello world';

    nock(OPENAI_API)
      .post('/v1/audio/speech')
      .delay(500)
      .reply(200, FAKE_MP3, { 'Content-Type': 'audio/mpeg' });

    const worker = new OpenAITtsWorker({ timeoutMs: 100 });

    await expect(
      worker.synthesize({
        text,
        accountId: 42,
        traceId: 'tr_tts_timeout',
      }),
    ).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
    });

    expect(mockCostLogCreate).not.toHaveBeenCalled();
    expect(mockAssetCreate).not.toHaveBeenCalled();
  }, 10_000);
});

// ── Test 4: rate-limit ────────────────────────────────────────────────────────

describe('US-010 AC-7.4: rate-limit — 101st call per day → TOO_MANY_REQUESTS', () => {
  it('Redis incr > 100 → TOO_MANY_REQUESTS with correct message', async () => {
    vi.stubEnv('TTS_DAILY_LIMIT_PER_USER', '100');
    mockIncr.mockResolvedValueOnce(101);

    await expect(checkTtsRateLimit(42)).rejects.toMatchObject({
      code: 'TOO_MANY_REQUESTS',
      message: expect.stringContaining('100 次/天'),
    });

    // Key format check
    const [key] = mockIncr.mock.calls[0] as [string];
    expect(key).toMatch(/^rate:tts:user:42:\d{4}-\d{2}-\d{2}$/);

    vi.unstubAllEnvs();
  });

  it('100th call (boundary) passes', async () => {
    vi.stubEnv('TTS_DAILY_LIMIT_PER_USER', '100');
    mockIncr.mockResolvedValueOnce(100);

    await expect(checkTtsRateLimit(42)).resolves.toBeUndefined();

    vi.unstubAllEnvs();
  });

  it('_todayKey format is correct', () => {
    const key = _todayKey(7);
    expect(key).toMatch(/^rate:tts:user:7:\d{4}-\d{2}-\d{2}$/);
  });
});

// ── Test 5: API error ─────────────────────────────────────────────────────────

describe('US-010 AC-7.5: API error — OpenAI 4xx/5xx → INTERNAL_SERVER_ERROR', () => {
  it('OpenAI 500 error → INTERNAL_SERVER_ERROR thrown · no cost_log · no asset', async () => {
    const text = '测试文本';

    nock(OPENAI_API)
      .post('/v1/audio/speech')
      .reply(500, {
        error: { message: 'Internal server error', type: 'server_error' },
      });

    // maxRetries=0 prevents SDK retry loop on 5xx
    const worker = new OpenAITtsWorker({ maxRetries: 0 });

    await expect(
      worker.synthesize({
        text,
        accountId: 42,
        traceId: 'tr_tts_api_error',
      }),
    ).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
    });

    expect(mockCostLogCreate).not.toHaveBeenCalled();
    expect(mockAssetCreate).not.toHaveBeenCalled();
  });

  it('OpenAI 429 rate limit error → INTERNAL_SERVER_ERROR thrown', async () => {
    const text = '测试文本';

    nock(OPENAI_API)
      .post('/v1/audio/speech')
      .reply(429, {
        error: { message: 'Rate limit exceeded', type: 'rate_limit_error' },
      });

    const worker = new OpenAITtsWorker({ maxRetries: 0 });

    await expect(
      worker.synthesize({
        text,
        accountId: 42,
        traceId: 'tr_tts_openai_rate',
      }),
    ).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
    });
  });
});
