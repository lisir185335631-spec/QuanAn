/**
 * Unit tests — PRD-4 US-010
 * LivestreamAgent: 单 mode · 4 场景(happy / fallback / edge(experience 非法) / cold start)
 * AC-8: ≥ 4 tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LivestreamAgent, LivestreamOutputSchema } from '@/specialists/LivestreamAgent';
import { SchemaValidationError } from '@/specialists/base/errors';
import type { ILLMGateway, InvokeLLMResult } from '@/specialists/base/types';

// ── Hoisted shared state ──────────────────────────────────────────────────────

const { mockAssemble, mockCostLogCreate } = vi.hoisted(() => ({
  mockAssemble: vi.fn().mockResolvedValue({
    systemPrompt: '- step1: {"industry":"beauty"}\n- step3: {"nickname":["测试主播"]}',
    userPrompt: '<user_input>{}</user_input>',
    tools: [],
    metadata: { contextTokens: 0, layersUsed: ['L2_step_data', 'constants'], ragHits: [] },
  }),
  mockCostLogCreate: vi.fn().mockResolvedValue({ id: BigInt(1) }),
}));

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/services/context-assembler/ContextAssembler', () => ({
  contextAssembler: { assemble: mockAssemble },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: { costLog: { create: mockCostLogCreate } },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const VALID_LIVESTREAM_CONTENT = {
  lastResult:
    '大家好！欢迎来到我的直播间！今天给大家带来了一款超级好用的护肤神器！这款产品我自己用了三个月，'.repeat(5) +
    '皮肤真的变好了很多！接下来让我给大家详细介绍一下这款产品的成分和功效，绝对让你物超所值！',
  lastOptimizedResult:
    '哇哦！今天的直播间真的超级热闹！姐妹们，你们有没有被色斑、暗沉、痘印困扰过？我之前也是！'.repeat(5) +
    '直到我遇到了这款产品，一切都改变了！不信你看我的前后对比！限时优惠只有今天，错过再等一年！',
};

function makeGateway(contents: unknown[]): ILLMGateway {
  let callIdx = 0;
  return {
    complete: vi.fn().mockImplementation(async () => {
      const content = contents[callIdx] ?? contents[contents.length - 1];
      callIdx++;
      return {
        content,
        tokens: { prompt: 300, completion: 800, total: 1100 },
        model: 'claude-sonnet-4-6',
      } satisfies InvokeLLMResult;
    }),
  };
}

const BASE_REQ = {
  accountId: 42,
  userInput: {
    experience: '中级' as const,
    topic: '护肤精华推荐',
    targetAudience: '25-35岁女性，关注护肤',
  },
  traceId: 'trace-livestream-001',
  stepKey: 'step8',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('LivestreamAgent', () => {
  beforeEach(() => {
    mockCostLogCreate.mockClear();
    mockAssemble.mockResolvedValue({
      systemPrompt: '- step1: {"industry":"beauty"}\n- step3: {"nickname":["测试主播"]}',
      userPrompt: '<user_input>{}</user_input>',
      tools: [],
      metadata: { contextTokens: 0, layersUsed: ['L2_step_data', 'constants'], ragHits: [] },
    });
  });

  // ── happy path (AC-2) ────────────────────────────────────────────────────

  it('happy path: returns lastResult + lastOptimizedResult ≥200 chars each, writes cost_log', async () => {
    const agent = new LivestreamAgent(makeGateway([VALID_LIVESTREAM_CONTENT]));
    const res = await agent.execute(BASE_REQ);

    const result = res.result as typeof VALID_LIVESTREAM_CONTENT;
    expect(result.lastResult.length).toBeGreaterThanOrEqual(200);
    expect(result.lastOptimizedResult.length).toBeGreaterThanOrEqual(200);
    expect(LivestreamOutputSchema.safeParse(res.result).success).toBe(true);
    expect(res.isFallback).toBe(false);
    expect(mockCostLogCreate).toHaveBeenCalledOnce();
    expect(mockCostLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          agentId: 'LivestreamAgent',
          callType: 'specialist_call',
        }),
      }),
    );
  });

  // ── fallback: lastResult < 200 chars → zod min(200) fails → retry → SchemaValidationError (AC-4) ──

  it('fallback: lastResult shorter than 200 chars → SchemaValidationError after retry', async () => {
    const shortContent = {
      lastResult: '短话术不足200字',
      lastOptimizedResult: '优化版也不足200字',
    };
    const agent = new LivestreamAgent(makeGateway([shortContent, shortContent]));
    await expect(agent.execute(BASE_REQ)).rejects.toThrow(SchemaValidationError);
  });

  // ── edge: experience 非法 → input zod 拒 (AC-5) ──────────────────────────

  it('edge: invalid experience value → ZodError before LLM call (AC-5)', async () => {
    const gateway = makeGateway([VALID_LIVESTREAM_CONTENT]);
    const agent = new LivestreamAgent(gateway);
    await expect(
      agent.execute({
        ...BASE_REQ,
        userInput: { experience: '专家' as 'new手', topic: '测试' },
      }),
    ).rejects.toThrow();
    // LLM gateway should NOT have been called
    expect((gateway.complete as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(0);
  });

  // ── cold start: no step1/step3 context in systemPrompt (AC-6) ────────────

  it('cold start: no step data in context → still produces valid output', async () => {
    mockAssemble.mockResolvedValueOnce({
      systemPrompt: '[新用户 · 暂无 step 数据]',
      userPrompt: '<user_input>{}</user_input>',
      tools: [],
      metadata: { contextTokens: 0, layersUsed: [], ragHits: [] },
    });

    const agent = new LivestreamAgent(makeGateway([VALID_LIVESTREAM_CONTENT]));
    const res = await agent.execute({ ...BASE_REQ, userInput: { experience: '新手' } });

    expect(res.isFallback).toBe(false);
    expect(LivestreamOutputSchema.safeParse(res.result).success).toBe(true);
  });

  // ── config validation (AC-1, AC-6, AC-7) ─────────────────────────────────

  it('config: five-layer structure, model_tier=reasoning, timeout_ms=30000, industries constant (AC-1/AC-6/AC-7)', () => {
    const agent = new LivestreamAgent();
    expect(agent.config.agentId).toBe('LivestreamAgent');
    expect(agent.config.memory.l2_read).toContain('stepData');
    expect(agent.config.knowledge.constants).toContain('industries');
    expect(agent.config.tools).toContain('llm.complete');
    expect(agent.config.execution.model_tier).toBe('reasoning');
    expect(agent.config.execution.timeout_ms).toBe(30_000);
    expect(agent.config.execution.streaming).toBe(false);
  });
});
