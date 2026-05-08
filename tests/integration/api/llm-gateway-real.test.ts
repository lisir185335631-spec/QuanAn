/**
 * Integration test — PRD-2 US-007
 * AC-13: 1 integration test using nock to intercept Anthropic HTTP calls
 * Tests the real complete() flow with mocked network layer.
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import nock from 'nock';

// Mock modules that talk to external services (DB, Redis)
vi.mock('@/workers/llm-gateway/rate-limiter', () => ({
  checkRateLimit: vi.fn(async () => undefined),
  RateLimitError: class RateLimitError extends Error {
    readonly code = 'RATE_LIMIT_EXCEEDED' as const;
    constructor(public readonly userId: number) { super(`Rate limit exceeded for user ${userId}`); }
  },
}));

vi.mock('@/workers/llm-gateway/cost-logger', () => ({
  writeCostLog: vi.fn(async () => undefined),
}));

// Do NOT mock @anthropic-ai/sdk — nock will intercept the HTTP call
import { llmGateway } from '@/workers/llm-gateway/index';

const ANTHROPIC_API = 'https://api.anthropic.com';

beforeAll(() => {
  nock.disableNetConnect();
  process.env.ANTHROPIC_API_KEY = 'sk-ant-nock-test';
  process.env.OPENAI_API_KEY = 'sk-openai-nock-test';
});

afterAll(() => {
  nock.enableNetConnect();
  nock.cleanAll();
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.OPENAI_API_KEY;
});

beforeEach(() => {
  nock.cleanAll();
});

describe('LLMGateway · integration (nock)', () => {
  it('complete() calls Anthropic API and returns parsed response', async () => {
    nock(ANTHROPIC_API)
      .post('/v1/messages')
      .reply(200, {
        id: 'msg_nock_001',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'Hello from nock!' }],
        model: 'claude-sonnet-4-6',
        stop_reason: 'end_turn',
        usage: { input_tokens: 42, output_tokens: 17 },
      });

    const res = await llmGateway.complete({
      model_tier: 'reasoning',
      systemPrompt: 'You are a helpful assistant.',
      userPrompt: 'Say hello.',
      metadata: {
        trace_id: 'tr-nock-001',
        agentId: 'PositioningAgent',
        accountId: 1,
        userId: 1,
      },
    });

    expect(res.content).toBe('Hello from nock!');
    expect(res.tokens.prompt).toBe(42);
    expect(res.tokens.completion).toBe(17);
    expect(res.tokens.total).toBe(59);
    expect(res.model).toBe('claude-sonnet-4-6');
    expect(res.trace_id).toBe('tr-nock-001');
    expect(res.fallback).toBeUndefined();
    expect(nock.isDone()).toBe(true);
  });
});
