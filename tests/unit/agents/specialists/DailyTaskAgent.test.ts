/**
 * Unit tests — PRD-13 US-001 (TD-056 resolved)
 * DailyTaskAgent · apps/api/src/agents/specialists/DailyTaskAgent.ts
 * 4 describe blocks: 冷启动 / 非冷启动 LLM / schema retry / AbortError
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ZodError } from 'zod';
import { DailyTaskAgent } from '@/agents/specialists/DailyTaskAgent';
import { LLMTimeoutError, SchemaValidationError } from '@/specialists/base/errors';
import type { ILLMGateway } from '@/specialists/base/types';

// ── Hoisted mock state ────────────────────────────────────────────────────────

const { mockStepCount, mockEvolutionFindUnique, mockAssemble } = vi.hoisted(() => ({
  mockStepCount: vi.fn(),
  mockEvolutionFindUnique: vi.fn(),
  mockAssemble: vi.fn().mockResolvedValue({
    systemPrompt: '系统提示词',
    userPrompt: '<user_input></user_input>',
    tools: [],
    metadata: { contextTokens: 100, layersUsed: ['L2_step_data'], ragHits: [] },
  }),
}));

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/lib/prisma', () => ({
  prisma: {
    stepData: { count: mockStepCount },
    evolutionProfile: { findUnique: mockEvolutionFindUnique },
  },
}));

vi.mock('@/services/context-assembler/ContextAssembler', () => ({
  contextAssembler: { assemble: mockAssemble },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeValidTasks(count = 3) {
  const ids = [
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440004',
  ];
  const difficulties = ['easy', 'medium', 'hard'] as const;
  return Array.from({ length: count }, (_, i) => ({
    id: ids[i],
    title: `今日任务 ${i + 1} · 核心执行项`,
    description: `这是第 ${i + 1} 个任务的详细说明，包含具体操作步骤和预期效果。`,
    type: 'do_step' as const,
    ctaUrl: `/step/${i + 1}`,
    ctaText: '去完成',
    expectedOutcome: `完成任务 ${i + 1} 后系统将记录进度并给出下一步建议。`,
    estimatedMinutes: 10 + i * 5,
    difficulty: difficulties[i % 3],
    completed: false,
  }));
}

function makeGateway(content: unknown, model = 'lightweight-mock'): ILLMGateway {
  return {
    complete: vi.fn().mockResolvedValue({
      content,
      tokens: { prompt: 100, completion: 200, total: 300 },
      model,
    }),
  };
}

const BASE_REQ = {
  accountId: 1,
  userInput: { accountId: 1, taskDate: '2026-05-14' },
  traceId: 'test-trace-001',
};

// ── Describe 1: 冷启动 ────────────────────────────────────────────────────────

describe('DailyTaskAgent · 冷启动 (stepCount=0 OR evolutionProfile=null)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('stepCount=0 → returns 5 template tasks · isFallback=false · modelUsed=cold-start-template', async () => {
    mockStepCount.mockResolvedValue(0);
    mockEvolutionFindUnique.mockResolvedValue({ id: 1 });
    const agent = new DailyTaskAgent(makeGateway({}));

    const res = await agent.execute(BASE_REQ);

    expect(res.isFallback).toBe(false);
    expect(res.modelUsed).toBe('cold-start-template');
    expect(res.result.tasks).toHaveLength(5);
    expect(res.tokensUsed).toEqual({ prompt: 0, completion: 0, total: 0 });
  });

  it('evolutionProfile=null → cold start even when stepCount > 0', async () => {
    mockStepCount.mockResolvedValue(3);
    mockEvolutionFindUnique.mockResolvedValue(null);
    const agent = new DailyTaskAgent(makeGateway({}));

    const res = await agent.execute(BASE_REQ);

    expect(res.modelUsed).toBe('cold-start-template');
    expect(res.result.tasks).toHaveLength(5);
  });

  it('冷启动 5 模板任务结构验证 · ctaUrl 以 / 开头 · estimatedMinutes ∈ [5,30] · difficulty valid', async () => {
    mockStepCount.mockResolvedValue(0);
    mockEvolutionFindUnique.mockResolvedValue(null);
    const agent = new DailyTaskAgent(makeGateway({}));

    const res = await agent.execute(BASE_REQ);

    expect(res.result.tasks).toHaveLength(5);
    for (const task of res.result.tasks) {
      expect(task.ctaUrl).toMatch(/^\//);
      expect(task.estimatedMinutes).toBeGreaterThanOrEqual(5);
      expect(task.estimatedMinutes).toBeLessThanOrEqual(30);
      expect(['easy', 'medium', 'hard']).toContain(task.difficulty);
    }
  });

  it('accountId 缺失 → ZodError (AC-8)', async () => {
    mockStepCount.mockResolvedValue(0);
    mockEvolutionFindUnique.mockResolvedValue(null);
    const agent = new DailyTaskAgent(makeGateway({}));

    await expect(
      agent.execute({
        accountId: 1,
        userInput: { taskDate: '2026-05-14' } as never,
        traceId: 'test',
      }),
    ).rejects.toBeInstanceOf(ZodError);
  });

  it('taskDate 非 YYYY-MM-DD → ZodError (AC-8)', async () => {
    mockStepCount.mockResolvedValue(0);
    mockEvolutionFindUnique.mockResolvedValue(null);
    const agent = new DailyTaskAgent(makeGateway({}));

    await expect(
      agent.execute({
        accountId: 1,
        userInput: { accountId: 1, taskDate: '14/05/2026' },
        traceId: 'test',
      }),
    ).rejects.toBeInstanceOf(ZodError);
  });
});

// ── Describe 2: 非冷启动 LLM 调用 ────────────────────────────────────────────

describe('DailyTaskAgent · 非冷启动 LLM 调用', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStepCount.mockResolvedValue(5);
    mockEvolutionFindUnique.mockResolvedValue({ id: 42 });
    mockAssemble.mockResolvedValue({
      systemPrompt: '系统提示词',
      userPrompt: '<user_input></user_input>',
      tools: [],
      metadata: { contextTokens: 100, layersUsed: ['L2_step_data'], ragHits: [] },
    });
  });

  it('calls llmGateway.complete with model_tier=lightweight · timeout_ms=30000 · metadata.eventType=l5_agent', async () => {
    const gateway = makeGateway({ tasks: makeValidTasks(3) });
    const agent = new DailyTaskAgent(gateway);

    await agent.execute(BASE_REQ);

    expect(gateway.complete).toHaveBeenCalledOnce();
    const callArg = vi.mocked(gateway.complete).mock.calls[0][0];
    expect(callArg.model_tier).toBe('lightweight');
    expect(callArg.timeout_ms).toBe(30_000);
    expect(callArg.metadata.eventType).toBe('l5_agent');
  });

  it('returns parsed DailyTaskOutput · isFallback=false · modelUsed and tokensUsed from gateway', async () => {
    const tasks = makeValidTasks(3);
    const gateway = makeGateway({ tasks });
    const agent = new DailyTaskAgent(gateway);

    const res = await agent.execute(BASE_REQ);

    expect(res.isFallback).toBe(false);
    expect(res.result.tasks).toHaveLength(3);
    expect(res.modelUsed).toBe('lightweight-mock');
    expect(res.tokensUsed).toEqual({ prompt: 100, completion: 200, total: 300 });
  });
});

// ── Describe 3: schema retry ──────────────────────────────────────────────────

describe('DailyTaskAgent · schema retry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStepCount.mockResolvedValue(5);
    mockEvolutionFindUnique.mockResolvedValue({ id: 42 });
    mockAssemble.mockResolvedValue({
      systemPrompt: '系统提示词',
      userPrompt: '<user_input></user_input>',
      tools: [],
      metadata: { contextTokens: 0, layersUsed: [], ragHits: [] },
    });
  });

  it('第一次返回 invalid schema → retry → 第二次 OK · total gateway.complete 调用 2 次', async () => {
    const validTasks = makeValidTasks(3);
    const gateway: ILLMGateway = {
      complete: vi
        .fn()
        .mockResolvedValueOnce({
          content: { tasks: [] }, // invalid: min(3) 未满足
          tokens: { prompt: 100, completion: 200, total: 300 },
          model: 'lightweight-mock',
        })
        .mockResolvedValueOnce({
          content: { tasks: validTasks },
          tokens: { prompt: 100, completion: 200, total: 300 },
          model: 'lightweight-mock',
        }),
    };
    const agent = new DailyTaskAgent(gateway);

    const res = await agent.execute(BASE_REQ);

    expect(gateway.complete).toHaveBeenCalledTimes(2);
    expect(res.result.tasks).toHaveLength(3);
  });

  it('第二次 retry 仍失败 → throws SchemaValidationError · gateway 共调用 2 次', async () => {
    const gateway: ILLMGateway = {
      complete: vi.fn().mockResolvedValue({
        content: { tasks: [] }, // always invalid
        tokens: { prompt: 100, completion: 200, total: 300 },
        model: 'lightweight-mock',
      }),
    };
    const agent = new DailyTaskAgent(gateway);

    await expect(agent.execute(BASE_REQ)).rejects.toBeInstanceOf(SchemaValidationError);
    expect(gateway.complete).toHaveBeenCalledTimes(2);
  });
});

// ── Describe 4: AbortError → LLMTimeoutError ─────────────────────────────────

describe('DailyTaskAgent · AbortError → LLMTimeoutError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStepCount.mockResolvedValue(5);
    mockEvolutionFindUnique.mockResolvedValue({ id: 42 });
    mockAssemble.mockResolvedValue({
      systemPrompt: '系统提示词',
      userPrompt: '<user_input></user_input>',
      tools: [],
      metadata: { contextTokens: 0, layersUsed: [], ragHits: [] },
    });
  });

  it('gateway.complete throws AbortError → execute throws LLMTimeoutError', async () => {
    const abortErr = new Error('Request aborted');
    abortErr.name = 'AbortError';
    const gateway: ILLMGateway = {
      complete: vi.fn().mockRejectedValue(abortErr),
    };
    const agent = new DailyTaskAgent(gateway);

    const err = await agent.execute(BASE_REQ).catch((e: unknown) => e);

    expect(err).toBeInstanceOf(LLMTimeoutError);
    expect((err as LLMTimeoutError).agentId).toBe('DailyTaskAgent');
    expect((err as LLMTimeoutError).timeoutMs).toBe(30_000);
  });
});
