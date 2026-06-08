/**
 * Integration test — PRD-2 US-007
 * AC-13: 1 integration test using nock to intercept LLM HTTP calls
 * Tests the real complete() flow with mocked network layer.
 *
 * 2026-06-08 现代化:网关默认链已从 anthropic(claude-*)迁到 OpenAI-compatible
 * (DeepSeek / 中转,LLM_REASONING_MODEL + LLM_OPENAI_BASE_URL env 驱动)。
 * 本测试从同样的 env 推导拦截端点与期望模型名(MODEL_BY_TIER 在网关模块加载时固化,
 * setup.ts 已先 dotenv),claude 主链与 OpenAI 兼容主链两种配置都能跑。
 * nock 封网 · 不打真网络 · 无需真 key —— 永远运行,不挂 RUN_REAL_LLM 开关。
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

// Do NOT mock the SDKs — nock will intercept the HTTP call
import { llmGateway, invalidateLlmKeyCache } from '@/workers/llm-gateway/index';

// ── 与网关 MODEL_BY_TIER 同源推导(模块加载时 env 已由 setup.ts dotenv 注入)────
const PRIMARY_MODEL = process.env.LLM_REASONING_MODEL ?? 'claude-sonnet-4-6';
const IS_ANTHROPIC_PRIMARY = PRIMARY_MODEL.startsWith('claude-');
// OpenAI 路径 baseURL 解析逻辑与 getOpenAIClient 一致(SDK 缺省 api.openai.com/v1)
const OPENAI_BASE = new URL(
  process.env.LLM_OPENAI_BASE_URL ?? process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
);
const OPENAI_CHAT_PATH = `${OPENAI_BASE.pathname.replace(/\/$/, '')}/chat/completions`;

beforeAll(() => {
  nock.disableNetConnect();
  process.env.ANTHROPIC_API_KEY = 'sk-ant-nock-test';
  process.env.OPENAI_API_KEY = 'sk-openai-nock-test';
  // 清 5min key 缓存 + 已构造的 SDK client(singleFork 共享进程,可能带着别的测试的状态)
  invalidateLlmKeyCache();
});

afterAll(() => {
  nock.enableNetConnect();
  nock.cleanAll();
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.OPENAI_API_KEY;
  // 别让假 key 的缓存泄漏给同进程的后续测试
  invalidateLlmKeyCache();
});

beforeEach(() => {
  nock.cleanAll();
});

describe('LLMGateway · integration (nock)', () => {
  it('complete() calls the primary-chain LLM HTTP API and returns parsed response', async () => {
    if (IS_ANTHROPIC_PRIMARY) {
      nock('https://api.anthropic.com')
        .post('/v1/messages')
        .reply(200, {
          id: 'msg_nock_001',
          type: 'message',
          role: 'assistant',
          content: [{ type: 'text', text: 'Hello from nock!' }],
          model: PRIMARY_MODEL,
          stop_reason: 'end_turn',
          usage: { input_tokens: 42, output_tokens: 17 },
        });
    } else {
      nock(OPENAI_BASE.origin)
        .post(OPENAI_CHAT_PATH)
        .reply(200, {
          id: 'chatcmpl_nock_001',
          object: 'chat.completion',
          created: 1700000000,
          model: PRIMARY_MODEL,
          choices: [
            {
              index: 0,
              message: { role: 'assistant', content: 'Hello from nock!' },
              finish_reason: 'stop',
            },
          ],
          usage: { prompt_tokens: 42, completion_tokens: 17, total_tokens: 59 },
        });
    }

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
    expect(res.model).toBe(PRIMARY_MODEL);
    expect(res.trace_id).toBe('tr-nock-001');
    expect(res.fallback).toBeUndefined();
    expect(nock.isDone()).toBe(true);
  });
});
