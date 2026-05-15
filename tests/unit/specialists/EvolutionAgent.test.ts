/**
 * Unit tests — PRD-8 US-003 AC-11
 * EvolutionAgent: happy / fallback / 累积合并
 * enqueueIfThresholdMet: 阈值边界 5/19/20/49/50/99/100
 * Total: ≥ 8 tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { EvolutionAgent, EvolutionInsightContentSchema } from '@/agents/evolution/EvolutionAgent';

import type { ILLMGateway, InvokeLLMResult } from '@/specialists/base/types';

// ── 全局 Mocks (单份 · 避免 vi.mock 重复覆盖) ────────────────────────────────

vi.mock('@/services/context-assembler/ContextAssembler', () => ({
  contextAssembler: {
    assemble: vi.fn().mockResolvedValue({
      systemPrompt: '[system: EvolutionAgent]',
      userPrompt: '<user_input>{}</user_input>',
      tools: [],
      evolutionInsight: null,
      metadata: { contextTokens: 0, layersUsed: [], ragHits: [] },
    }),
  },
}));

const {
  mockPrismaFeedbackLogFindMany,
  mockPrismaTransaction,
  mockPrismaProfileUpdate,
  mockPrismaInsightCreate,
  mockPrismaProfileFindUnique,
  mockPrismaQueryRaw,
} = vi.hoisted(() => ({
  mockPrismaFeedbackLogFindMany: vi.fn().mockResolvedValue([]),
  mockPrismaTransaction: vi.fn().mockImplementation(async (ops: unknown[]) => Promise.all(ops as Promise<unknown>[])),
  mockPrismaProfileUpdate: vi.fn().mockResolvedValue({ level: 'L1' }),
  mockPrismaInsightCreate: vi.fn().mockResolvedValue({ id: 1 }),
  mockPrismaProfileFindUnique: vi.fn().mockResolvedValue({
    level: 'L1',
    feedbackCountGood: 3,
    feedbackCountBad: 1,
    feedbackCountTotal: 4,
  }),
  mockPrismaQueryRaw: vi.fn(),
}));

// Single prisma mock — covers EvolutionAgent + trigger tests
vi.mock('@/lib/prisma', () => ({
  prisma: {
    feedbackLog: { findMany: mockPrismaFeedbackLogFindMany },
    evolutionProfile: {
      update: mockPrismaProfileUpdate,
      findUnique: mockPrismaProfileFindUnique,
    },
    evolutionInsight: { create: mockPrismaInsightCreate },
    $transaction: mockPrismaTransaction,
    $queryRaw: mockPrismaQueryRaw,
  },
}));

vi.mock('@/memory/l4-profile', () => ({
  getLatestInsight: vi.fn().mockResolvedValue(null),
  getDeepLearningSamples: vi.fn().mockResolvedValue([]),
}));

// PRD-14 US-012: mock feature-flag service so kill switch defaults to OFF in existing tests
vi.mock('@/services/admin/feature-flag/feature-flag.service', () => ({
  getFeatureFlagValue: vi.fn().mockResolvedValue(false),
  getSystemConfigValue: vi.fn().mockResolvedValue(false),
  invalidateFeatureFlagCache: vi.fn(),
  invalidateSystemConfigCache: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/constants/evolution', () => ({
  inferLevel: vi.fn().mockReturnValue('L2'),
}));

const { mockEvolutionQueueAdd } = vi.hoisted(() => ({
  mockEvolutionQueueAdd: vi.fn().mockResolvedValue({ id: 'job-1' }),
}));

vi.mock('@/workers/evolution/queue', () => ({
  evolutionQueue: { add: mockEvolutionQueueAdd },
  EVOLUTION_QUEUE_NAME: 'evolution',
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const VALID_INSIGHT: Parameters<typeof EvolutionInsightContentSchema.parse>[0] = {
  direction: '综合',
  insights: {
    preferredCatchphrases: ['宝子', '干货', '测评'],
    styleTone: '亲切幽默',
    avoidList: ['广告感', '硬推'],
    strongPoints: ['真实测评', '科学护肤'],
    weakPoints: ['更新频率待提升'],
  },
};

const BASE_REQ = {
  accountId: 42,
  userInput: { accountId: 42, triggerType: 'threshold:5' },
  traceId: 'trace-evo-001',
};

function makeGateway(content: unknown = VALID_INSIGHT): ILLMGateway {
  return {
    complete: vi.fn().mockResolvedValue({
      content,
      tokens: { prompt: 500, completion: 300, total: 800 },
      model: 'claude-sonnet-4-6',
      duration_ms: 1200,
      trace_id: 'trace-evo-001',
    } as unknown as InvokeLLMResult),
  };
}

function makeAgent(gatewayContent?: unknown): EvolutionAgent {
  return new EvolutionAgent(makeGateway(gatewayContent));
}

// ── EvolutionAgent Tests ──────────────────────────────────────────────────────

describe('EvolutionAgent (US-003)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Restore default mocks
    mockPrismaFeedbackLogFindMany.mockResolvedValue([]);
    mockPrismaProfileFindUnique.mockResolvedValue({
      level: 'L1',
      feedbackCountGood: 3,
      feedbackCountBad: 1,
      feedbackCountTotal: 4,
    });
    mockPrismaTransaction.mockImplementation(async (ops: unknown[]) => Promise.all(ops as Promise<unknown>[]));
    mockPrismaProfileUpdate.mockResolvedValue({ level: 'L1' });
    mockPrismaInsightCreate.mockResolvedValue({ id: 1 });
  });

  // Test 1: happy path
  it('happy path: LLM 成功 → insight 写入原子事务 · isFallback=false', async () => {
    const agent = makeAgent(VALID_INSIGHT);
    const res = await agent.execute(BASE_REQ);

    expect(res.isFallback).toBe(false);
    expect(EvolutionInsightContentSchema.safeParse(res.result).success).toBe(true);
    expect(res.result.direction).toBe('综合');
    // AC-3: $transaction called
    expect(mockPrismaTransaction).toHaveBeenCalledOnce();
  });

  // Test 2: fallback — schema invalid → previousInsight
  it('fallback path: schema 无效 · previousInsight 可用 → isFallback=true · 不写 insight', async () => {
    const { contextAssembler } = await import(
      '@/services/context-assembler/ContextAssembler'
    );
    vi.mocked(contextAssembler.assemble).mockResolvedValueOnce({
      systemPrompt: '[system]',
      userPrompt: '<user_input>{}</user_input>',
      tools: [],
      evolutionInsight: VALID_INSIGHT,
      metadata: { contextTokens: 0, layersUsed: ['L4_evolution_insight'], ragHits: [] },
    } as unknown as Awaited<ReturnType<typeof contextAssembler.assemble>>);

    // LLM returns invalid schema twice (retry)
    const agent = new EvolutionAgent({
      complete: vi.fn().mockResolvedValue({
        content: { invalid: 'schema' },
        tokens: { prompt: 100, completion: 50, total: 150 },
        model: 'claude-sonnet-4-6',
        duration_ms: 500,
        trace_id: 'trace-fallback',
      }),
    });

    const res = await agent.execute(BASE_REQ);

    expect(res.isFallback).toBe(true);
    expect(res.result).toEqual(VALID_INSIGHT);
    expect(res.modelUsed).toBe('fallback');
    // AC-5: 不写 insight
    expect(mockPrismaTransaction).not.toHaveBeenCalled();
  });

  // Test 3: cumulative merge (AC-4 Rule 3)
  it('cumulative merge: (fresh ∪ prev) 去重 · avoidList 同理 · 不超 top 10', async () => {
    const prevInsight = {
      direction: '综合' as const,
      insights: {
        preferredCatchphrases: ['老金句1', '老金句2', '宝子'], // '宝子' overlap with fresh
        styleTone: '原有风格',
        avoidList: ['老避忌1', '广告感'],
        strongPoints: [],
        weakPoints: [],
      },
    };

    const freshInsight = {
      direction: '综合' as const,
      insights: {
        preferredCatchphrases: ['宝子', '干货', '测评'], // '宝子' overlap
        styleTone: '新风格',
        avoidList: ['广告感', '硬推'], // '广告感' overlap
        strongPoints: ['真实测评'],
        weakPoints: [],
      },
    };

    const { contextAssembler } = await import(
      '@/services/context-assembler/ContextAssembler'
    );
    vi.mocked(contextAssembler.assemble).mockResolvedValueOnce({
      systemPrompt: '[system]',
      userPrompt: '<user_input>{}</user_input>',
      tools: [],
      evolutionInsight: prevInsight,
      metadata: { contextTokens: 0, layersUsed: ['L4_evolution_insight'], ragHits: [] },
    } as unknown as Awaited<ReturnType<typeof contextAssembler.assemble>>);

    const agent = new EvolutionAgent({
      complete: vi.fn().mockResolvedValue({
        content: freshInsight,
        tokens: { prompt: 500, completion: 300, total: 800 },
        model: 'claude-sonnet-4-6',
        duration_ms: 1000,
        trace_id: 'trace-merge',
      }),
    });

    const res = await agent.execute(BASE_REQ);

    expect(res.isFallback).toBe(false);
    // fresh entries come first
    expect(res.result.insights.preferredCatchphrases).toContain('宝子');
    expect(res.result.insights.preferredCatchphrases).toContain('老金句1');
    // deduplication
    expect(
      res.result.insights.preferredCatchphrases.filter((v) => v === '宝子'),
    ).toHaveLength(1);
    expect(
      res.result.insights.avoidList.filter((v) => v === '广告感'),
    ).toHaveLength(1);
    // top 10
    expect(res.result.insights.preferredCatchphrases.length).toBeLessThanOrEqual(10);
    expect(res.result.insights.avoidList.length).toBeLessThanOrEqual(10);
  });
});

// ── enqueueIfThresholdMet 阈值边界 Tests ─────────────────────────────────────

describe('enqueueIfThresholdMet threshold boundaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function runTrigger(count: number): Promise<void> {
    mockPrismaQueryRaw.mockResolvedValueOnce([{ count: BigInt(count) }]);
    // Dynamic import to ensure fresh module with mocks applied
    const { enqueueIfThresholdMet } = await import('@/lib/evolution/trigger');
    await enqueueIfThresholdMet(42, 'trace-threshold-test');
  }

  it('count=5 → 触发 enqueue (threshold:5)', async () => {
    await runTrigger(5);
    expect(mockEvolutionQueueAdd).toHaveBeenCalledOnce();
    expect(mockEvolutionQueueAdd).toHaveBeenCalledWith(
      'evolve',
      expect.objectContaining({ triggerType: 'threshold:5', accountId: 42 }),
      expect.objectContaining({ jobId: 'evo:42:5' }),
    );
  });

  it('count=19 → 不触发 enqueue', async () => {
    await runTrigger(19);
    expect(mockEvolutionQueueAdd).not.toHaveBeenCalled();
  });

  it('count=20 → 触发 enqueue (threshold:20)', async () => {
    await runTrigger(20);
    expect(mockEvolutionQueueAdd).toHaveBeenCalledOnce();
    expect(mockEvolutionQueueAdd).toHaveBeenCalledWith(
      'evolve',
      expect.objectContaining({ triggerType: 'threshold:20' }),
      expect.objectContaining({ jobId: 'evo:42:20' }),
    );
  });

  it('count=49 → 不触发 enqueue', async () => {
    await runTrigger(49);
    expect(mockEvolutionQueueAdd).not.toHaveBeenCalled();
  });

  it('count=50 → 触发 enqueue (threshold:50)', async () => {
    await runTrigger(50);
    expect(mockEvolutionQueueAdd).toHaveBeenCalledOnce();
    expect(mockEvolutionQueueAdd).toHaveBeenCalledWith(
      'evolve',
      expect.objectContaining({ triggerType: 'threshold:50' }),
      expect.objectContaining({ jobId: 'evo:42:50' }),
    );
  });

  it('count=99 → 不触发 enqueue', async () => {
    await runTrigger(99);
    expect(mockEvolutionQueueAdd).not.toHaveBeenCalled();
  });

  it('count=100 → 触发 enqueue (threshold:100)', async () => {
    await runTrigger(100);
    expect(mockEvolutionQueueAdd).toHaveBeenCalledOnce();
    expect(mockEvolutionQueueAdd).toHaveBeenCalledWith(
      'evolve',
      expect.objectContaining({ triggerType: 'threshold:100' }),
      expect.objectContaining({ jobId: 'evo:42:100' }),
    );
  });
});
