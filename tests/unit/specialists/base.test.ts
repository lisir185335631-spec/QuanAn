/**
 * Unit tests — PRD-4 US-001
 * BaseSpecialist 抽象类(模板方法 + 五层配置 + 错误类)
 * AC-8: ≥ 8 unit tests · 覆盖 input/output schema 校验 + 模板方法 4 步
 *        + 错误降级 + 五层配置完整性 + mock LLMGateway 注入 + cost_log 写入字段完整
 * AC-9: 类初始化 < 5ms · mock test 100 次 < 1s
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { BaseSpecialist } from '@/specialists/base/BaseSpecialist';
import {
  SchemaValidationError,
  LLMTimeoutError,
  FallbackTriggeredError,
} from '@/specialists/base/errors';
import type {
  SpecialistConfig,
  SpecialistRequest,
  InvokeLLMResult,
  ILLMGateway,
  AssembledContext,
} from '@/specialists/base/types';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/agents/base/ContextAssembler', () => ({
  contextAssembler: {
    assemble: vi.fn().mockResolvedValue({
      systemPrompt: '[system-stub]',
      userPrompt: '[user-stub]',
      tools: [],
      metadata: { contextTokens: 0, layersUsed: ['L2'], ragHits: [] },
    }),
    assembleStep: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    costLog: {
      create: vi.fn().mockResolvedValue({ id: BigInt(1) }),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── Test fixtures ─────────────────────────────────────────────────────────────

const FIVE_LAYER_CONFIG: SpecialistConfig = {
  agentId: 'PositioningAgent',
  persona: { role: '行业定位师', goal: '找准赛道', boundaries: ['不编造数据'] },
  memory: {
    l1_readonly: ['account'],
    l2_read: ['stepData'],
    l2_write: ['stepData'],
  },
  knowledge: {
    constants: ['industries'],
    rag: ['knowledge_cases'],
    refresh_interval_sec: 600,
  },
  tools: ['llm.complete'],
  execution: {
    timeout_ms: 30_000,
    retry: 1,
    model_tier: 'reasoning',
    streaming: false,
  },
};

const InputSchema = z.object({ topic: z.string().min(1) });
const OutputSchema = z.object({ positioning: z.string().min(1) });

type TIn = z.infer<typeof InputSchema>;
type TOut = z.infer<typeof OutputSchema>;

function makeMockGateway(override?: Partial<InvokeLLMResult>): ILLMGateway {
  return {
    complete: vi.fn().mockResolvedValue({
      content: { positioning: '宠物博主·专注猫粮科普' },
      tokens: { prompt: 100, completion: 50, total: 150 },
      model: 'claude-sonnet-4-6',
      isFallback: false,
      ...override,
    }),
  };
}

class TestSpecialist extends BaseSpecialist<TIn, TOut> {
  readonly config = FIVE_LAYER_CONFIG;
  readonly inputSchema = InputSchema;
  readonly outputSchema = OutputSchema;

  protected async invokeLLM(
    _ctx: AssembledContext,
    _req: SpecialistRequest<TIn>,
  ): Promise<InvokeLLMResult> {
    const resp = await this.llmGateway.complete({
      model_tier: this.config.execution.model_tier,
      systemPrompt: _ctx.systemPrompt,
      userPrompt: _ctx.userPrompt,
      metadata: {
        trace_id: _req.traceId ?? '',
        agentId: this.config.agentId,
        accountId: _req.accountId,
        userId: 0,
      },
    });
    return resp;
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('BaseSpecialist — input schema validation', () => {
  it('AC-8: valid input passes inputSchema.parse and proceeds', async () => {
    const agent = new TestSpecialist(makeMockGateway());
    const req: SpecialistRequest<TIn> = {
      accountId: 1,
      userInput: { topic: '宠物博主' },
      traceId: 'tr-test-001',
    };
    const result = await agent.execute(req);
    expect(result.result).toMatchObject({ positioning: expect.any(String) });
  });

  it('AC-8: invalid input (empty topic) throws ZodError before LLM call', async () => {
    const mockGateway = makeMockGateway();
    const agent = new TestSpecialist(mockGateway);
    const req: SpecialistRequest<TIn> = {
      accountId: 1,
      userInput: { topic: '' },
    };
    await expect(agent.execute(req)).rejects.toThrow();
    expect(mockGateway.complete).not.toHaveBeenCalled();
  });
});

describe('BaseSpecialist — output schema validation', () => {
  it('AC-8: SchemaValidationError thrown when output fails outputSchema.safeParse', async () => {
    const invalidGateway = makeMockGateway({ content: { wrong_field: 'oops' } });
    const agent = new TestSpecialist(invalidGateway);
    const req: SpecialistRequest<TIn> = {
      accountId: 1,
      userInput: { topic: '宠物博主' },
    };
    await expect(agent.execute(req)).rejects.toBeInstanceOf(SchemaValidationError);
  });

  it('AC-8: valid output passes safeParse and returns SpecialistResponse', async () => {
    const agent = new TestSpecialist(makeMockGateway());
    const result = await agent.execute({ accountId: 2, userInput: { topic: '美食博主' } });
    expect(result).toMatchObject({
      result: { positioning: expect.any(String) },
      isFallback: false,
      modelUsed: 'claude-sonnet-4-6',
    });
    expect(typeof result.durationMs).toBe('number');
    expect(typeof result.traceId).toBe('string');
  });
});

describe('BaseSpecialist — template method 4 steps', () => {
  it('AC-8: execute() calls contextAssembler.assemble before invokeLLM', async () => {
    const { contextAssembler } = await import('@/agents/base/ContextAssembler');
    const spyAssemble = vi.spyOn(contextAssembler, 'assemble');
    const mockGateway = makeMockGateway();
    const agent = new TestSpecialist(mockGateway);

    await agent.execute({ accountId: 3, userInput: { topic: '健身博主' } });

    expect(spyAssemble).toHaveBeenCalledOnce();
    expect(spyAssemble).toHaveBeenCalledWith(
      expect.objectContaining({ agentId: 'PositioningAgent', accountId: 3 }),
    );
    expect(mockGateway.complete).toHaveBeenCalledOnce();
  });

  it('AC-8: execute() result contains tokensUsed matching gateway response', async () => {
    const agent = new TestSpecialist(makeMockGateway());
    const result = await agent.execute({ accountId: 4, userInput: { topic: '科技博主' } });
    expect(result.tokensUsed).toEqual({ prompt: 100, completion: 50, total: 150 });
  });
});

describe('BaseSpecialist — 五层配置完整性', () => {
  it('AC-8: config has all 5 required layers (persona/memory/knowledge/tools/execution)', () => {
    const agent = new TestSpecialist(makeMockGateway());
    const c = agent.config;
    expect(c.persona).toBeDefined();
    expect(c.memory).toBeDefined();
    expect(c.knowledge).toBeDefined();
    expect(c.tools).toBeDefined();
    expect(c.execution).toBeDefined();
    expect(c.agentId).toBe('PositioningAgent');
  });

  it('AC-8: config.execution.model_tier drives model selection (no hardcoded model names)', () => {
    const agent = new TestSpecialist(makeMockGateway());
    expect(agent.config.execution.model_tier).toMatch(/^(reasoning|lightweight)$/);
  });
});

describe('BaseSpecialist — mock LLMGateway injection', () => {
  it('AC-8: injected gateway.complete is called with model_tier from config', async () => {
    const mockGateway = makeMockGateway();
    const agent = new TestSpecialist(mockGateway);

    await agent.execute({ accountId: 5, userInput: { topic: '母婴博主' } });

    expect(mockGateway.complete).toHaveBeenCalledWith(
      expect.objectContaining({ model_tier: 'reasoning' }),
    );
  });

  it('AC-8: isFallback=true propagated when gateway returns isFallback', async () => {
    const fallbackGateway = makeMockGateway({
      content: { positioning: '降级模板' },
      isFallback: true,
    });
    const agent = new TestSpecialist(fallbackGateway);
    const result = await agent.execute({ accountId: 6, userInput: { topic: '教育博主' } });
    expect(result.isFallback).toBe(true);
  });
});

describe('BaseSpecialist — cost_log 写入字段完整(AC-7)', () => {
  it('AC-8: writeCostLog called with all 7 required fields', async () => {
    const { prisma } = await import('@/lib/prisma');
    const mockCreate = vi.spyOn(prisma.costLog, 'create');
    const agent = new TestSpecialist(makeMockGateway());

    await agent.execute({
      accountId: 7,
      userInput: { topic: '旅游博主' },
      traceId: 'tr-cost-test',
    });

    expect(mockCreate).toHaveBeenCalledOnce();
    const callData = mockCreate.mock.calls[0]?.[0]?.data;
    expect(callData).toMatchObject({
      agentId: 'PositioningAgent',      // agent_id ✓
      accountId: 7,                      // account_id ✓
      traceId: 'tr-cost-test',           // trace_id ✓
      modelUsed: 'claude-sonnet-4-6',    // model_used ✓
      promptTokens: 100,                 // prompt_tokens ✓
      completionTokens: 50,              // completion_tokens ✓
      // duration_ms checked separately (dynamic)
    });
    expect(typeof callData?.durationMs).toBe('number'); // duration_ms ✓
  });
});

describe('BaseSpecialist — 性能(AC-9)', () => {
  it('AC-9: class instantiation < 5ms', () => {
    const t0 = Date.now();
    for (let i = 0; i < 10; i++) {
      new TestSpecialist(makeMockGateway());
    }
    expect(Date.now() - t0).toBeLessThan(50); // 10 × 5ms = 50ms
  });

  it('AC-9: 100 mock execute() runs without LLM < 1s', async () => {
    const agent = new TestSpecialist(makeMockGateway());
    const t0 = Date.now();
    await Promise.all(
      Array.from({ length: 100 }, (_, i) =>
        agent.execute({ accountId: i + 1, userInput: { topic: `topic-${i}` } }),
      ),
    );
    expect(Date.now() - t0).toBeLessThan(1000);
  });
});

describe('Error classes', () => {
  it('SchemaValidationError has correct name and issues', () => {
    const err = new SchemaValidationError('field required');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('SchemaValidationError');
    expect(err.message).toContain('field required');
    expect(err.issues).toBe('field required');
  });

  it('LLMTimeoutError has correct name, agentId, timeoutMs', () => {
    const err = new LLMTimeoutError('PositioningAgent', 30_000);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('LLMTimeoutError');
    expect(err.agentId).toBe('PositioningAgent');
    expect(err.timeoutMs).toBe(30_000);
  });

  it('FallbackTriggeredError has correct name and reason', () => {
    const err = new FallbackTriggeredError('LLM timeout');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('FallbackTriggeredError');
    expect(err.reason).toBe('LLM timeout');
  });
});
