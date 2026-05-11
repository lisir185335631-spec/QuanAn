/**
 * Unit tests — PRD-9 US-001 AC-9
 * 5 tests: happy(100 tokens) / oversize(8200 tokens) / timeout / API error / cost_log fields
 * nock OpenAI mock · maxRetries=0 防 retry 拖死
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
  },
}));

// ── Imports after mocks ────────────────────────────────────────────────────────

import { OpenAIEmbeddingWorker } from '@/workers/embedding/openai-embedding';
import { checkEmbeddingRateLimit, _todayKey } from '@/lib/rate-limit/embedding';

// ── Helpers ────────────────────────────────────────────────────────────────────

const OPENAI_API = 'https://api.openai.com';

function makeEmbeddingResponse(tokens: number, dims = 1536) {
  return {
    object: 'list',
    data: [{ object: 'embedding', index: 0, embedding: new Array(dims).fill(0.1) }],
    model: 'text-embedding-3-small',
    usage: { prompt_tokens: tokens, total_tokens: tokens },
  };
}

// ── Setup/Teardown ────────────────────────────────────────────────────────────

beforeAll(() => {
  nock.disableNetConnect();
  process.env.OPENAI_API_KEY = 'sk-test-nock-embed';
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

describe('US-001 AC-9.1: happy path — 100 tokens · embedding returned · cost_log written', () => {
  it('text → OpenAI mock(100 tokens) → 1536-dim vector returned + cost_log written', async () => {
    nock(OPENAI_API)
      .post('/v1/embeddings')
      .reply(200, makeEmbeddingResponse(100));

    const worker = new OpenAIEmbeddingWorker({ maxRetries: 0 });
    const result = await worker.embed({
      text: 'hello world',
      accountId: 42,
      traceId: 'tr_embed_happy',
    });

    expect(result.embedding).toHaveLength(1536);
    expect(result.tokens).toBe(100);
    // AC-5: ceil(100/1000) * 0.00002 = 1 * 0.00002
    expect(result.costUsd).toBeCloseTo(0.00002, 8);

    expect(mockCostLogCreate).toHaveBeenCalledOnce();
  });
});

// ── Test 2: oversize — 8200 tokens returned → BAD_REQUEST ────────────────────

describe('US-001 AC-9.2: oversize — API returns 8200 tokens → BAD_REQUEST', () => {
  it('API reports 8200 tokens → throws BAD_REQUEST · no cost_log', async () => {
    nock(OPENAI_API)
      .post('/v1/embeddings')
      .reply(200, makeEmbeddingResponse(8200));

    const worker = new OpenAIEmbeddingWorker({ maxRetries: 0 });

    await expect(
      worker.embed({ text: 'x'.repeat(100), accountId: 42, traceId: 'tr_embed_oversize' }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

    expect(mockCostLogCreate).not.toHaveBeenCalled();
  });
});

// ── Test 3: timeout ───────────────────────────────────────────────────────────

describe('US-001 AC-9.3: timeout — API timeout → INTERNAL_SERVER_ERROR', () => {
  it('nock delays 500ms · worker timeout=100ms → INTERNAL_SERVER_ERROR', async () => {
    nock(OPENAI_API)
      .post('/v1/embeddings')
      .delay(500)
      .reply(200, makeEmbeddingResponse(50));

    const worker = new OpenAIEmbeddingWorker({ timeoutMs: 100, maxRetries: 0 });

    await expect(
      worker.embed({ text: 'slow', accountId: 42, traceId: 'tr_embed_timeout' }),
    ).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });

    expect(mockCostLogCreate).not.toHaveBeenCalled();
  }, 10_000);
});

// ── Test 4: API error ─────────────────────────────────────────────────────────

describe('US-001 AC-9.4: API error — OpenAI 500 → INTERNAL_SERVER_ERROR', () => {
  it('OpenAI 500 → INTERNAL_SERVER_ERROR · no cost_log', async () => {
    nock(OPENAI_API)
      .post('/v1/embeddings')
      .reply(500, { error: { message: 'Internal server error', type: 'server_error' } });

    const worker = new OpenAIEmbeddingWorker({ maxRetries: 0 });

    await expect(
      worker.embed({ text: 'err', accountId: 42, traceId: 'tr_embed_api_err' }),
    ).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });

    expect(mockCostLogCreate).not.toHaveBeenCalled();
  });
});

// ── Test 5: cost_log fields ───────────────────────────────────────────────────

describe('US-001 AC-9.5: cost_log fields — complete write verification', () => {
  it('verifies all required cost_log fields: eventType + provider + modelUsed + promptTokens + charactersIn + audioSeconds=null', async () => {
    const inputText = 'embed me';
    nock(OPENAI_API)
      .post('/v1/embeddings')
      .reply(200, makeEmbeddingResponse(10));

    const worker = new OpenAIEmbeddingWorker({ maxRetries: 0 });
    await worker.embed({ text: inputText, accountId: 7, traceId: 'tr_embed_cost' });

    expect(mockCostLogCreate).toHaveBeenCalledOnce();
    const callArg = mockCostLogCreate.mock.calls[0]?.[0] as { data: Record<string, unknown> };
    expect(callArg.data).toMatchObject({
      accountId: 7,
      agentId: 'EmbeddingWorker',
      eventType: 'embedding_call',
      callType: 'embedding_call',
      provider: 'openai',
      modelUsed: 'text-embedding-3-small',
      promptTokens: 10,
      audioSeconds: null,
      charactersIn: inputText.length,
    });
  });
});

// ── Test 6: rate-limit boundary ──────────────────────────────────────────────

describe('US-001 AC-7: rate-limit boundary tests (50th / 100th pass · 101st fail)', () => {
  it('50th call (boundary low) passes', async () => {
    vi.stubEnv('EMBEDDING_DAILY_LIMIT_PER_USER', '100');
    mockIncr.mockResolvedValueOnce(50);

    await expect(checkEmbeddingRateLimit(42)).resolves.toBeUndefined();
    vi.unstubAllEnvs();
  });

  it('100th call (boundary high) passes', async () => {
    vi.stubEnv('EMBEDDING_DAILY_LIMIT_PER_USER', '100');
    mockIncr.mockResolvedValueOnce(100);

    await expect(checkEmbeddingRateLimit(42)).resolves.toBeUndefined();
    vi.unstubAllEnvs();
  });

  it('101st call → TOO_MANY_REQUESTS · key format correct', async () => {
    vi.stubEnv('EMBEDDING_DAILY_LIMIT_PER_USER', '100');
    mockIncr.mockResolvedValueOnce(101);

    await expect(checkEmbeddingRateLimit(42)).rejects.toMatchObject({
      code: 'TOO_MANY_REQUESTS',
      message: expect.stringContaining('100 次/天'),
    });

    const [key] = mockIncr.mock.calls[0] as [string];
    expect(key).toMatch(/^rate:embedding:user:42:\d{4}-\d{2}-\d{2}$/);
    vi.unstubAllEnvs();
  });

  it('_todayKey format: rate:embedding:user:{id}:{UTC-date}', () => {
    const key = _todayKey(99);
    expect(key).toMatch(/^rate:embedding:user:99:\d{4}-\d{2}-\d{2}$/);
  });
});
