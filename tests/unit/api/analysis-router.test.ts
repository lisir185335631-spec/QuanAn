/**
 * Unit tests — PRD-5 US-007
 * analysis.analyze: 4 unit tests
 * AC-1: protectedProcedure · calls AnalysisAgent(mode='structural')
 * AC-2: history.create writes contentType='json' + content=JSON.stringify(result) + full fields
 * AC-7: zod fail copy < 10 字 → BAD_REQUEST
 * AC-8: agent isFallback=true (SchemaValidationError caught by BaseSpecialist) → history isFallback=true
 * agentMode: agentMode='structural' always written
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock AnalysisAgent before router import ───────────────────────────────────

vi.mock('@/specialists/AnalysisAgent', () => ({
  analysisAgent: {
    execute: vi.fn(),
  },
}));

import { analysisRouter } from '@/trpc/routers/analysis';
import { analysisAgent as _mockedAgent } from '@/specialists/AnalysisAgent';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_STRUCTURAL_RESULT = {
  scores: {
    hook: 75,
    structure: 80,
    emotion: 65,
    specificity: 70,
    cta: 60,
    overall: 70,
  },
  optimizations: [
    { dimension: 'hook', issue: '开场钩子吸引力不足', suggestion: '在第一句加入数字或反问句' },
    { dimension: 'specificity', issue: '描述较为抽象', suggestion: '用真实数据替换抽象描述' },
    { dimension: 'cta', issue: '结尾行动引导不明确', suggestion: '明确告诉读者下一步' },
  ],
  rewriteSnippet: '这是优化后的关键段落，融合了更清晰的钩子和更强的行动引导，建议参考改写全文。',
};

const FALLBACK_STRUCTURAL_RESULT = {
  scores: { hook: 65, structure: 70, emotion: 60, specificity: 55, cta: 50, overall: 60 },
  optimizations: [
    { dimension: 'hook', issue: '开场钩子不足', suggestion: '加入数字或悬念' },
    { dimension: 'specificity', issue: '描述抽象', suggestion: '用数据替代' },
    { dimension: 'cta', issue: '引导不明确', suggestion: '明确下一步行动' },
  ],
  rewriteSnippet: '这是系统备用优化版本，包含通用的结构改写建议，具体内容请参考专业文案指导。',
};

const MOCK_HISTORY_ROW = {
  id: 55,
  content: JSON.stringify(MOCK_STRUCTURAL_RESULT),
  contentType: 'json',
  agentId: 'AnalysisAgent',
  agentMode: 'structural',
  scriptType: null,
  elements: [],
  isFallback: false,
  tokensUsed: 500,
  modelUsed: 'claude-sonnet-4-6',
  durationMs: 1800,
  traceId: 'test-trace-007',
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
      traceId: 'test-trace-007',
      activeAccountId: 1 as number | null,
      user: { id: 99, activeAccountId: 1 } as { id: number; activeAccountId: number | null } | null,
      prisma,
      req: new Request('http://localhost', { headers: { 'x-trace-id': 'test-trace-007' } }),
      sessionId: 'sess-007',
      ...overrides,
    },
    prisma,
  };
}

const VALID_INPUT = {
  copy: '这是一篇需要分析的用户文案内容，包含超过十个字符的正文。',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe('analysis.analyze — happy path', () => {
  it('calls AnalysisAgent(mode=structural), writes history with contentType=json + full fields', async () => {
    const { ctx, prisma } = makeCtx();

    vi.mocked(_mockedAgent.execute).mockResolvedValueOnce({
      result: MOCK_STRUCTURAL_RESULT,
      isFallback: false,
      durationMs: 1800,
      tokensUsed: { prompt: 150, completion: 350, total: 500 },
      modelUsed: 'claude-sonnet-4-6',
      traceId: 'test-trace-007',
    });

    const caller = analysisRouter.createCaller(ctx);
    const result = await caller.analyze(VALID_INPUT);

    // AC-1: agent called with mode=structural, userInput={copy}
    expect(vi.mocked(_mockedAgent.execute)).toHaveBeenCalledOnce();
    expect(vi.mocked(_mockedAgent.execute)).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: 1,
        mode: 'structural',
        userInput: { copy: VALID_INPUT.copy },
      }),
    );

    // AC-2: history.create with contentType='json' + JSON.stringify content + full fields
    const createArgs = prisma._tx.history.create.mock.calls[0]?.[0] as {
      data: Record<string, unknown>;
    };
    expect(createArgs.data).toMatchObject({
      accountId: 1,
      agentId: 'AnalysisAgent',
      agentMode: 'structural',
      sourceType: 'user',
      content: JSON.stringify(MOCK_STRUCTURAL_RESULT),
      contentType: 'json',
      scriptType: null,
      elements: [],
      isFallback: false,
      tokensUsed: 500,
      modelUsed: 'claude-sonnet-4-6',
      durationMs: 1800,
    });

    expect(result.id).toBe(55);
    expect(result.contentType).toBe('json');
  });
});

describe('analysis.analyze — zod validation', () => {
  it('copy < 10 字 (empty string) → TRPCError BAD_REQUEST', async () => {
    const { ctx } = makeCtx();
    const caller = analysisRouter.createCaller(ctx);

    await expect(caller.analyze({ copy: '' })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });
});

describe('analysis.analyze — fallback path', () => {
  it('agent returns isFallback=true (SchemaValidationError caught internally) → history written isFallback=true', async () => {
    const { ctx, prisma } = makeCtx();

    vi.mocked(_mockedAgent.execute).mockResolvedValueOnce({
      result: FALLBACK_STRUCTURAL_RESULT,
      isFallback: true,
      durationMs: 200,
      tokensUsed: { prompt: 0, completion: 0, total: 0 },
      modelUsed: 'fallback',
      traceId: 'test-trace-007',
    });

    const caller = analysisRouter.createCaller(ctx);
    await caller.analyze(VALID_INPUT);

    const createArgs = prisma._tx.history.create.mock.calls[0]?.[0] as {
      data: { isFallback: boolean; modelUsed: string; tokensUsed: number };
    };
    expect(createArgs.data.isFallback).toBe(true);
    expect(createArgs.data.modelUsed).toBe('fallback');
    expect(createArgs.data.tokensUsed).toBe(0);
  });
});

describe('analysis.analyze — agentMode field', () => {
  it('agentMode="structural" is always written to history regardless of result', async () => {
    const { ctx, prisma } = makeCtx();

    vi.mocked(_mockedAgent.execute).mockResolvedValueOnce({
      result: MOCK_STRUCTURAL_RESULT,
      isFallback: false,
      durationMs: 900,
      tokensUsed: { prompt: 100, completion: 200, total: 300 },
      modelUsed: 'claude-haiku-4-5',
      traceId: 'test-trace-007',
    });

    const caller = analysisRouter.createCaller(ctx);
    await caller.analyze(VALID_INPUT);

    const createArgs = prisma._tx.history.create.mock.calls[0]?.[0] as {
      data: { agentMode: string };
    };
    expect(createArgs.data.agentMode).toBe('structural');
  });
});
