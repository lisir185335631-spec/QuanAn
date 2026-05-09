/**
 * Unit tests — PRD-5 US-009
 * videoAnalysis.analyze: 4 unit tests
 * AC-1: protectedProcedure · calls AnalysisAgent(mode='viral')
 * AC-2: history.create writes agentMode='viral' + contentType='json' + elements=analysis.elements + full fields
 * AC-7: zod fail lastCopy < 10 字 → BAD_REQUEST
 * Fallback: agent isFallback=true (SchemaValidationError caught by BaseSpecialist) → history isFallback=true
 * AC-9: elements 空数组 → history.elements=[] 不阻断
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock AnalysisAgent before router import ───────────────────────────────────

vi.mock('@/specialists/AnalysisAgent', () => ({
  analysisAgent: {
    execute: vi.fn(),
  },
}));

import { videoAnalysisRouter } from '@/trpc/routers/videoAnalysis';
import { analysisAgent as _mockedAgent } from '@/specialists/AnalysisAgent';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_VIRAL_RESULT = {
  analysis: {
    elements: ['curiosity', 'contrast'],
    structure: '钩子→痛点→案例→CTA',
    hookType: 'opening_5s',
    viralFormula: '好奇+反差→情绪共鸣→行动',
  },
  insights: [
    {
      element: 'curiosity',
      explanation: '标题制造信息缺口，触发用户「我要知道答案」的冲动，是驱动点击的核心心理机制。',
      impact: '高',
    },
    {
      element: 'contrast',
      explanation: '通过对比展现落差感，强化用户对理想状态vs现实状态的感知，加深情绪共鸣。',
      impact: '高',
    },
    {
      element: 'resonance',
      explanation: '内容与目标用户日常经历高度重合，触发「说的就是我」的强烈认同感。',
      impact: '中',
    },
  ],
  rewriteVersion:
    '这是基于爆款元素心理学重写的仿写版文案，融入了好奇心钩子和反差情绪两个核心要素，完整呈现了一套高转化内容结构。',
};

const FALLBACK_VIRAL_RESULT = {
  analysis: {
    elements: ['curiosity', 'contrast'],
    structure: '钩子→痛点→案例→仿写（系统备用）',
    hookType: 'opening_5s',
    viralFormula: '好奇 + 反差 → 情绪共鸣 → 行动（系统备用模板）',
  },
  insights: [
    {
      element: 'curiosity',
      explanation: '标题制造信息缺口，让用户产生「我要知道答案」的冲动，是驱动点击的核心心理机制。',
      impact: '高',
    },
    {
      element: 'contrast',
      explanation: '通过对比展现落差感，强化用户对「理想状态 vs 现实状态」的感知，加深情绪共鸣。',
      impact: '高',
    },
    {
      element: 'resonance',
      explanation: '内容与目标用户日常经历高度重合，触发「说的就是我」的强烈认同感。',
      impact: '中',
    },
  ],
  rewriteVersion:
    '这是一篇基于爆款元素心理学重写的仿写版文案，融入了钩子、情绪共鸣和行动引导三个核心要素。这是一篇基于爆款元素心理学重写的仿写版文案，融入了钩子、情绪共鸣和行动引导三个核心要素。',
};

const MOCK_HISTORY_ROW = {
  id: 101,
  content: JSON.stringify(MOCK_VIRAL_RESULT),
  contentType: 'json',
  agentId: 'AnalysisAgent',
  agentMode: 'viral',
  scriptType: null,
  elements: ['curiosity', 'contrast'],
  isFallback: false,
  tokensUsed: 500,
  modelUsed: 'claude-sonnet-4-6',
  durationMs: 1800,
  traceId: 'test-trace-009',
  createdAt: new Date('2026-01-01'),
};

// ── Helper: build a minimal tRPC context ─────────────────────────────────────

function makeCtx(overrides: Record<string, unknown> = {}) {
  const history = {
    create: vi.fn(async () => ({ ...MOCK_HISTORY_ROW })),
  };

  const tx = {
    history,
    $executeRaw: vi.fn(async () => 0),
  };

  const prisma = {
    history,
    $transaction: vi.fn(async (fn: (tx: typeof tx) => Promise<unknown>) => fn(tx)),
    _tx: tx,
  };

  return {
    ctx: {
      traceId: 'test-trace-009',
      activeAccountId: 1 as number | null,
      user: { id: 99, activeAccountId: 1 } as { id: number; activeAccountId: number | null } | null,
      prisma,
      req: new Request('http://localhost', { headers: { 'x-trace-id': 'test-trace-009' } }),
      sessionId: 'sess-009',
      ...overrides,
    },
    prisma,
  };
}

const VALID_INPUT = {
  lastCopy: '这是一篇需要拆解的爆款文案内容，包含超过十个字符的正文，用于测试 viral mode 分析功能。',
  lastTitle: '爆款测试标题',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe('videoAnalysis.analyze — happy path', () => {
  it('calls AnalysisAgent(mode=viral), writes history with agentMode=viral + contentType=json + elements + full fields', async () => {
    const { ctx, prisma } = makeCtx();

    vi.mocked(_mockedAgent.execute).mockResolvedValueOnce({
      result: MOCK_VIRAL_RESULT,
      isFallback: false,
      durationMs: 1800,
      tokensUsed: { prompt: 150, completion: 350, total: 500 },
      modelUsed: 'claude-sonnet-4-6',
      traceId: 'test-trace-009',
    });

    const caller = videoAnalysisRouter.createCaller(ctx);
    const result = await caller.analyze(VALID_INPUT);

    // AC-1: agent called with mode=viral, userInput={ lastCopy, lastTitle }
    expect(vi.mocked(_mockedAgent.execute)).toHaveBeenCalledOnce();
    expect(vi.mocked(_mockedAgent.execute)).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: 1,
        mode: 'viral',
        userInput: { lastCopy: VALID_INPUT.lastCopy, lastTitle: VALID_INPUT.lastTitle },
      }),
    );

    // AC-2: history.create with full fields
    const createArgs = prisma._tx.history.create.mock.calls[0]?.[0] as {
      data: Record<string, unknown>;
    };
    expect(createArgs.data).toMatchObject({
      accountId: 1,
      agentId: 'AnalysisAgent',
      agentMode: 'viral',
      sourceType: 'user',
      inputSummary: VALID_INPUT.lastTitle,
      content: JSON.stringify(MOCK_VIRAL_RESULT),
      contentType: 'json',
      scriptType: null,
      elements: ['curiosity', 'contrast'],
      isFallback: false,
      tokensUsed: 500,
      modelUsed: 'claude-sonnet-4-6',
      durationMs: 1800,
    });

    expect(result.id).toBe(101);
    expect(result.contentType).toBe('json');
    expect(result.agentMode).toBe('viral');
  });
});

describe('videoAnalysis.analyze — zod validation', () => {
  it('lastCopy empty (< 10 字) → TRPCError BAD_REQUEST', async () => {
    const { ctx } = makeCtx();
    const caller = videoAnalysisRouter.createCaller(ctx);

    await expect(caller.analyze({ lastCopy: '' })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });
});

describe('videoAnalysis.analyze — fallback path (Specialist schema fail → isFallback)', () => {
  it('agent returns isFallback=true (viral mode insights < 3 caught internally) → history written isFallback=true', async () => {
    const { ctx, prisma } = makeCtx();

    vi.mocked(_mockedAgent.execute).mockResolvedValueOnce({
      result: FALLBACK_VIRAL_RESULT,
      isFallback: true,
      durationMs: 200,
      tokensUsed: { prompt: 0, completion: 0, total: 0 },
      modelUsed: 'fallback',
      traceId: 'test-trace-009',
    });

    const caller = videoAnalysisRouter.createCaller(ctx);
    await caller.analyze(VALID_INPUT);

    const createArgs = prisma._tx.history.create.mock.calls[0]?.[0] as {
      data: { isFallback: boolean; modelUsed: string; tokensUsed: number };
    };
    expect(createArgs.data.isFallback).toBe(true);
    expect(createArgs.data.modelUsed).toBe('fallback');
    expect(createArgs.data.tokensUsed).toBe(0);
  });
});

describe('videoAnalysis.analyze — elements 数组传递', () => {
  it('elements 空数组 → history.elements=[] 不阻断(AC-9 · LLM 无识别元素场景)', async () => {
    const { ctx, prisma } = makeCtx();

    const viralResultEmptyElements = {
      ...MOCK_VIRAL_RESULT,
      analysis: { ...MOCK_VIRAL_RESULT.analysis, elements: [] },
    };

    vi.mocked(_mockedAgent.execute).mockResolvedValueOnce({
      result: viralResultEmptyElements,
      isFallback: false,
      durationMs: 1200,
      tokensUsed: { prompt: 120, completion: 280, total: 400 },
      modelUsed: 'claude-sonnet-4-6',
      traceId: 'test-trace-009',
    });

    const caller = videoAnalysisRouter.createCaller(ctx);
    const result = await caller.analyze(VALID_INPUT);

    // history.elements should be [] without throwing
    const createArgs = prisma._tx.history.create.mock.calls[0]?.[0] as {
      data: { elements: string[] };
    };
    expect(createArgs.data.elements).toEqual([]);
    // Router should complete successfully
    expect(result.id).toBe(101);
  });
});
