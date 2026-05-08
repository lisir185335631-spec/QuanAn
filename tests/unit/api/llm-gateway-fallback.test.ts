/**
 * Unit tests — PRD-2 US-007 (fallback, API key, cost_log paths)
 * AC-3: primary fail → retry 1 → fallback model
 * AC-4: both failed → template + llm.both_failed log + cost_log success=false
 * AC-5: missing API key → specific error message
 * AC-6: cost_log written with correct fields
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

import { llmGateway } from '@/workers/llm-gateway/index';

// Canonical mock responses matching CompleteResponse shape
const ANTHROPIC_RES = {
  content: 'anthropic ok',
  tokens: { prompt: 100, completion: 50, total: 150 },
  model: 'claude-sonnet-4-6',
  duration_ms: 80,
  trace_id: 'tr-001',
};

const OPENAI_RES = {
  content: 'openai ok',
  tokens: { prompt: 100, completion: 50, total: 150 },
  model: 'gpt-4o',
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => any;
let spyAnthropic: ReturnType<typeof vi.spyOn>;
let spyOpenAI: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.clearAllMocks();
  process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
  process.env.OPENAI_API_KEY = 'sk-openai-test';
  // Spy on private provider methods to control per-test behavior
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  spyAnthropic = vi.spyOn(llmGateway as any, '_callAnthropic' as string);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  spyOpenAI = vi.spyOn(llmGateway as any, '_callOpenAI' as string);
});

afterEach(() => {
  spyAnthropic.mockRestore();
  spyOpenAI.mockRestore();
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.OPENAI_API_KEY;
});

describe('LLMGateway · fallback', () => {
  it('AC-3: happy path — primary succeeds, no fallback field', async () => {
    (spyAnthropic as ReturnType<typeof vi.fn>).mockResolvedValue(ANTHROPIC_RES);
    const res = await llmGateway.complete(BASE_REQ);
    expect(res.content).toBe('anthropic ok');
    expect(res.fallback).toBeUndefined();
  });

  it('AC-3: primary fails both attempts → falls back to gpt-4o', async () => {
    (spyAnthropic as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('anthropic 503'));
    (spyOpenAI as ReturnType<typeof vi.fn>).mockResolvedValue(OPENAI_RES);
    const res = await llmGateway.complete(BASE_REQ);
    expect(res.fallback).toMatchObject({
      from: 'claude-sonnet-4-6',
      to: 'gpt-4o',
    });
    expect(typeof res.fallback?.reason).toBe('string');
    // primary was tried twice (1 retry), openai once
    expect((spyAnthropic as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(2);
    expect((spyOpenAI as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1);
  });

  it('AC-3: retry once — fails first, succeeds second (same primary)', async () => {
    (spyAnthropic as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error('transient 500'))
      .mockResolvedValueOnce(ANTHROPIC_RES);
    const res = await llmGateway.complete(BASE_REQ);
    expect(res.content).toBe('anthropic ok');
    expect(res.fallback).toBeUndefined();
    expect((spyAnthropic as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(2);
    expect((spyOpenAI as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(0);
  });

  it('AC-4: both providers fail → returns fallback template string', async () => {
    (spyAnthropic as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('anthropic down'));
    (spyOpenAI as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('openai down'));
    const res = await llmGateway.complete(BASE_REQ);
    expect(typeof res.content).toBe('string');
    expect((res.content as string).length).toBeGreaterThan(5);
    expect(res.fallback).toBeDefined();
  });

  it('AC-4: both fail → cost_log written with success=false', async () => {
    (spyAnthropic as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('down'));
    (spyOpenAI as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('down'));
    await llmGateway.complete(BASE_REQ);
    expect(mockWriteCostLog).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, errorCode: 'BOTH_FAILED' }),
    );
  });

  it('AC-5: ANTHROPIC_API_KEY missing → throws specific error', async () => {
    spyAnthropic.mockRestore(); // let real code run to hit key check
    spyOpenAI.mockRestore();
    delete process.env.ANTHROPIC_API_KEY;
    await expect(llmGateway.complete(BASE_REQ)).rejects.toThrow(
      /ANTHROPIC_API_KEY missing for reasoning tier/,
    );
  });

  it('AC-6: cost_log written on success with correct fields', async () => {
    (spyAnthropic as ReturnType<typeof vi.fn>).mockResolvedValue(ANTHROPIC_RES);
    await llmGateway.complete(BASE_REQ);
    expect(mockWriteCostLog).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        req: expect.objectContaining({ metadata: expect.objectContaining({ trace_id: 'tr-001' }) }),
        res: expect.objectContaining({ model: 'claude-sonnet-4-6' }),
      }),
    );
  });

  it('AC-6: cost_log res.fallback present when fallback used', async () => {
    (spyAnthropic as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
    (spyOpenAI as ReturnType<typeof vi.fn>).mockResolvedValue(OPENAI_RES);
    await llmGateway.complete(BASE_REQ);
    expect(mockWriteCostLog).toHaveBeenCalledWith(
      expect.objectContaining({
        res: expect.objectContaining({ fallback: expect.objectContaining({ to: 'gpt-4o' }) }),
      }),
    );
  });

  it('lightweight tier: primary is haiku, fallback is gpt-4o-mini', async () => {
    const lightReq = { ...BASE_REQ, model_tier: 'lightweight' as const };
    const haiku403 = new Error('haiku 403');
    const miniRes = { ...OPENAI_RES, model: 'gpt-4o-mini' };
    (spyAnthropic as ReturnType<typeof vi.fn>).mockRejectedValue(haiku403);
    (spyOpenAI as ReturnType<typeof vi.fn>).mockResolvedValue(miniRes);
    const res = await llmGateway.complete(lightReq);
    expect(res.fallback).toMatchObject({ from: 'claude-haiku-4-5', to: 'gpt-4o-mini' });
  });
});
