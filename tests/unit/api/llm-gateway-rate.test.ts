/**
 * Unit tests — PRD-2 US-007 (rate limiting path)
 * AC-2: token bucket Free/Pro/Enterprise quotas
 * AC-11: user over quota → RateLimitError, no LLM call
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock modules with external deps before importing index
vi.mock('@/workers/llm-gateway/rate-limiter', () => ({
  checkRateLimit: vi.fn(async () => undefined),
  RateLimitError: class RateLimitError extends Error {
    readonly code = 'RATE_LIMIT_EXCEEDED' as const;
    constructor(public readonly userId: number, public readonly resetAfterMs?: number) {
      super(`Rate limit exceeded for user ${userId}`);
      this.name = 'RateLimitError';
    }
  },
}));

vi.mock('@/workers/llm-gateway/cost-logger', () => ({
  writeCostLog: vi.fn(async () => undefined),
}));

// Stub SDK imports so no real HTTP calls are made
vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = { create: vi.fn() };
  },
}));

vi.mock('openai', () => ({
  default: class MockOpenAI {
    chat = { completions: { create: vi.fn() } };
  },
}));

import { llmGateway, RateLimitError } from '@/workers/llm-gateway/index';
import { checkRateLimit } from '@/workers/llm-gateway/rate-limiter';

const MOCK_RESPONSE = {
  content: 'mock response',
  tokens: { prompt: 100, completion: 50, total: 150 },
  model: 'claude-sonnet-4-6',
  duration_ms: 100,
  trace_id: 'tr-test-001',
};

const BASE_REQ = {
  model_tier: 'reasoning' as const,
  systemPrompt: 'You are helpful.',
  userPrompt: 'Hello',
  metadata: { trace_id: 'tr-test-001', agentId: 'PositioningAgent', accountId: 1, userId: 42 },
};

let callProviderSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.clearAllMocks();
  process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
  process.env.OPENAI_API_KEY = 'sk-openai-test';
  // Spy on private _callProvider to avoid real SDK calls
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callProviderSpy = vi.spyOn(llmGateway as any, '_callProvider').mockResolvedValue(MOCK_RESPONSE);
});

afterEach(() => {
  callProviderSpy.mockRestore();
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.OPENAI_API_KEY;
});

describe('LLMGateway · rate limiting', () => {
  it('AC-11: throws RateLimitError when quota exceeded, no LLM call', async () => {
    const { checkRateLimit: mockedCheck } = await import('@/workers/llm-gateway/rate-limiter');
    const err = new RateLimitError(42);
    (mockedCheck as ReturnType<typeof vi.fn>).mockRejectedValueOnce(err);

    await expect(llmGateway.complete(BASE_REQ)).rejects.toThrow(RateLimitError);
    expect(callProviderSpy).not.toHaveBeenCalled();
  });

  it('AC-11: RateLimitError has correct userId and code', async () => {
    const { checkRateLimit: mockedCheck } = await import('@/workers/llm-gateway/rate-limiter');
    const err = new RateLimitError(42);
    (mockedCheck as ReturnType<typeof vi.fn>).mockRejectedValueOnce(err);

    await expect(llmGateway.complete(BASE_REQ)).rejects.toMatchObject({
      code: 'RATE_LIMIT_EXCEEDED',
      userId: 42,
    });
  });

  it('AC-11: checkRateLimit is called with userId from metadata', async () => {
    await llmGateway.complete(BASE_REQ);
    expect(checkRateLimit).toHaveBeenCalledWith(42);
  });

  it('checkRateLimit called once per complete() call', async () => {
    await llmGateway.complete(BASE_REQ);
    await llmGateway.complete({ ...BASE_REQ, metadata: { ...BASE_REQ.metadata, userId: 99 } });
    expect(checkRateLimit).toHaveBeenCalledTimes(2);
    expect(checkRateLimit).toHaveBeenNthCalledWith(1, 42);
    expect(checkRateLimit).toHaveBeenNthCalledWith(2, 99);
  });

  it('RateLimitError constructor sets message and code', () => {
    const err = new RateLimitError(7, 5000);
    expect(err.message).toContain('7');
    expect(err.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(err.userId).toBe(7);
    expect(err.resetAfterMs).toBe(5000);
  });

  it('complete() succeeds when rate limit passes', async () => {
    const res = await llmGateway.complete(BASE_REQ);
    expect(res.trace_id).toBe('tr-test-001');
    expect(typeof res.content).toBe('string');
    expect(callProviderSpy).toHaveBeenCalled();
  });
});
