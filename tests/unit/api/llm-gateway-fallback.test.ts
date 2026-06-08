/**
 * Unit tests — PRD-2 US-007 (fallback, API key, cost_log paths)
 * AC-3: primary fail → retry 1 → fallback model
 * AC-4: both failed → template + llm.both_failed log + cost_log success=false
 * AC-5: missing API key → specific error message
 * AC-6: cost_log written with correct fields
 *
 * NOTE: .env sets LLM_REASONING_MODEL=deepseek-v4-pro / LLM_REASONING_FALLBACK_MODEL=deepseek-v4-flash
 *       Both are non-claude → go through _callOpenAI (OpenAI-compatible path).
 *       _callAnthropic is only exercised when a claude-* model is forced via env stub (AC-5).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted to define mock refs before vi.mock factories run
const { mockWriteCostLog } = vi.hoisted(() => ({
  mockWriteCostLog: vi.fn(async () => undefined),
}));

vi.mock('@/workers/llm-gateway/rate-limiter', () => ({
  checkRateLimit: vi.fn(async () => undefined),
  RateLimitError: class RateLimitError extends Error {
    readonly code = 'RATE_LIMIT_EXCEEDED' as const;
    constructor(public readonly userId: number) {
      super(`Rate limit exceeded for user ${userId}`);
    }
  },
}));

vi.mock('@/workers/llm-gateway/cost-logger', () => ({
  writeCostLog: mockWriteCostLog,
}));

// Stub SDK imports so no module-load errors (actual calls controlled via spyOn below)
vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = {
      create: vi.fn(async () => {
        throw new Error('MockAnthropic not configured — use spyOn _callAnthropic');
      }),
    };
  },
}));

vi.mock('openai', () => ({
  default: class MockOpenAI {
    chat = {
      completions: {
        create: vi.fn(async () => {
          throw new Error('MockOpenAI not configured — use spyOn _callOpenAI');
        }),
      },
    };
  },
}));

import { llmGateway, invalidateLlmKeyCache } from '@/workers/llm-gateway/index';

// Current default models as set by .env
// reasoning: primary=deepseek-v4-pro, fallback=deepseek-v4-flash (both → _callOpenAI)
// lightweight: primary=deepseek-v4-flash, fallback=deepseek-v4-flash
const DEEPSEEK_PRIMARY = 'deepseek-v4-pro';
const DEEPSEEK_FALLBACK = 'deepseek-v4-flash';
const DEEPSEEK_LIGHTWEIGHT = 'deepseek-v4-flash';

// Canonical mock responses matching CompleteResponse shape
const PRIMARY_RES = {
  content: 'deepseek primary ok',
  tokens: { prompt: 100, completion: 50, total: 150 },
  model: DEEPSEEK_PRIMARY,
  duration_ms: 80,
  trace_id: 'tr-001',
};

const FALLBACK_RES = {
  content: 'deepseek fallback ok',
  tokens: { prompt: 100, completion: 50, total: 150 },
  model: DEEPSEEK_FALLBACK,
  duration_ms: 80,
  trace_id: 'tr-001',
};

const BASE_REQ = {
  model_tier: 'reasoning' as const,
  systemPrompt: 'system',
  userPrompt: 'user',
  metadata: { trace_id: 'tr-001', agentId: 'PositioningAgent', accountId: 1, userId: 1 },
};

// Spy handles — reset per test
let spyAnthropic: ReturnType<typeof vi.spyOn>;
let spyOpenAI: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.clearAllMocks();
  process.env.OPENAI_API_KEY = 'sk-openai-test';
  // Ensure LLM key cache is cleared so env changes take effect
  invalidateLlmKeyCache();
  // Spy on private provider methods to control per-test behavior
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  spyAnthropic = vi.spyOn(llmGateway as any, '_callAnthropic' as string);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  spyOpenAI = vi.spyOn(llmGateway as any, '_callOpenAI' as string);
});

afterEach(() => {
  spyAnthropic.mockRestore();
  spyOpenAI.mockRestore();
  delete process.env.OPENAI_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.LLM_REASONING_MODEL;
  invalidateLlmKeyCache();
});

describe('LLMGateway · fallback', () => {
  it('AC-3: happy path — primary (deepseek-v4-pro) succeeds via _callOpenAI, no fallback field', async () => {
    (spyOpenAI as ReturnType<typeof vi.fn>).mockResolvedValue(PRIMARY_RES);
    const res = await llmGateway.complete(BASE_REQ);
    expect(res.content).toBe('deepseek primary ok');
    expect(res.fallback).toBeUndefined();
    // _callAnthropic not called; only _callOpenAI (primary, 1 attempt)
    expect((spyAnthropic as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(0);
    expect((spyOpenAI as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1);
  });

  it('AC-3: primary fails both attempts → falls back to deepseek-v4-flash', async () => {
    // _callOpenAI called 3 times total: primary attempt 0, primary retry 1, then fallback
    (spyOpenAI as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error('deepseek 503'))  // primary attempt 0
      .mockRejectedValueOnce(new Error('deepseek 503'))  // primary retry 1
      .mockResolvedValueOnce(FALLBACK_RES);              // fallback
    const res = await llmGateway.complete(BASE_REQ);
    expect(res.fallback).toMatchObject({
      from: DEEPSEEK_PRIMARY,
      to: DEEPSEEK_FALLBACK,
    });
    expect(typeof res.fallback?.reason).toBe('string');
    // primary was tried twice (1 retry), fallback once
    expect((spyAnthropic as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(0);
    expect((spyOpenAI as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(3);
  });

  it('AC-3: retry once — fails first, succeeds second (same primary deepseek-v4-pro)', async () => {
    (spyOpenAI as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error('transient 500'))
      .mockResolvedValueOnce(PRIMARY_RES);
    const res = await llmGateway.complete(BASE_REQ);
    expect(res.content).toBe('deepseek primary ok');
    expect(res.fallback).toBeUndefined();
    expect((spyOpenAI as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(2);
    expect((spyAnthropic as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(0);
  });

  it('AC-4: both providers fail → returns fallback template string', async () => {
    (spyOpenAI as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('deepseek down'));
    const res = await llmGateway.complete(BASE_REQ);
    expect(typeof res.content).toBe('string');
    expect((res.content as string).length).toBeGreaterThan(5);
    expect(res.fallback).toBeDefined();
  });

  it('AC-4: both fail → cost_log written with success=false', async () => {
    (spyOpenAI as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('down'));
    await llmGateway.complete(BASE_REQ);
    expect(mockWriteCostLog).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, errorCode: 'BOTH_FAILED' }),
    );
  });

  it('AC-5: ANTHROPIC_API_KEY missing → _callAnthropic throws specific "ANTHROPIC_API_KEY missing" error', async () => {
    // MODEL_BY_TIER is a module-load-time constant — cannot override LLM_REASONING_MODEL at runtime.
    // Test the fail-fast anthropic key check directly by calling _callAnthropic with no key set.
    delete process.env.ANTHROPIC_API_KEY;
    invalidateLlmKeyCache();
    spyAnthropic.mockRestore(); // let real _callAnthropic execute → hits getAnthropicClient → throws
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const callAnthropic = (model: string, req: unknown, timeoutMs: number) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (llmGateway as any)._callAnthropic(model, req, timeoutMs);
    const dummyReq = { ...BASE_REQ, metadata: { ...BASE_REQ.metadata } };
    await expect(callAnthropic('claude-sonnet-4-6', dummyReq, 30_000)).rejects.toThrow(
      /ANTHROPIC_API_KEY missing for reasoning tier/,
    );
  });

  it('AC-6: cost_log written on success with correct fields', async () => {
    (spyOpenAI as ReturnType<typeof vi.fn>).mockResolvedValue(PRIMARY_RES);
    await llmGateway.complete(BASE_REQ);
    expect(mockWriteCostLog).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        req: expect.objectContaining({ metadata: expect.objectContaining({ trace_id: 'tr-001' }) }),
        res: expect.objectContaining({ model: DEEPSEEK_PRIMARY }),
      }),
    );
  });

  it('AC-6: cost_log res.fallback present when fallback used', async () => {
    (spyOpenAI as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error('fail'))  // primary attempt 0
      .mockRejectedValueOnce(new Error('fail'))  // primary retry 1
      .mockResolvedValueOnce(FALLBACK_RES);      // fallback
    await llmGateway.complete(BASE_REQ);
    expect(mockWriteCostLog).toHaveBeenCalledWith(
      expect.objectContaining({
        res: expect.objectContaining({ fallback: expect.objectContaining({ to: DEEPSEEK_FALLBACK }) }),
      }),
    );
  });

  it('lightweight tier: primary is deepseek-v4-flash, fallback is deepseek-v4-flash', async () => {
    const lightReq = { ...BASE_REQ, model_tier: 'lightweight' as const };
    // lightweight primary also goes via _callOpenAI; force it to fail then fallback succeeds
    (spyOpenAI as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error('flash 503'))   // primary attempt 0
      .mockRejectedValueOnce(new Error('flash 503'))   // primary retry 1
      .mockResolvedValueOnce({ ...FALLBACK_RES, model: DEEPSEEK_LIGHTWEIGHT }); // fallback
    const res = await llmGateway.complete(lightReq);
    expect(res.fallback).toMatchObject({ from: DEEPSEEK_LIGHTWEIGHT, to: DEEPSEEK_LIGHTWEIGHT });
  });
});
