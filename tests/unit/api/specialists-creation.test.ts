/**
 * Unit tests — PRD-2 US-004 · PRD-4 US-009
 * 5 Specialist mock routers: copywriting/videoAnalysis/videoProduction/boomGenerate/monetization
 * AC-10: ≥ 11 unit tests · ≥ 1 per procedure
 * AC-7: mutations write History row with trace_id
 * US-009: copywriting.generate now calls real CopywritingAgent — mock it here
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── US-009: Mock CopywritingAgent before router import ────────────────────────

const MOCK_COPYWRITING_MARKDOWN = '# 爆款文案标题\n\n这是第一段文案内容，包含有价值的干货信息。\n\n这是第二段内容。' + 'x'.repeat(450);

const MOCK_BOOM_CANDIDATE = '候选文案内容备用'.padEnd(210, '爆款创作方法论，精准触达目标受众，快速积累内容影响力。');

// ── US-009 (PRD-5): Mock AnalysisAgent before router import ──────────────────

const MOCK_VIRAL_RESULT_CREATION = {
  analysis: {
    elements: ['curiosity', 'contrast'],
    structure: '钩子→痛点→案例→CTA',
    hookType: 'opening_5s',
    viralFormula: '好奇+反差→情绪共鸣→行动',
  },
  insights: [
    { element: 'curiosity', explanation: '触发点击冲动', impact: '高' },
    { element: 'contrast', explanation: '加深情绪共鸣', impact: '高' },
    { element: 'resonance', explanation: '触发认同感', impact: '中' },
  ],
  rewriteVersion:
    '这是基于爆款元素心理学重写的仿写版文案，融入了好奇心钩子和反差情绪两个核心要素，完整呈现了一套高转化内容结构。',
};

// ── PRD-6 US-003: Mock VideoAgent (generate now calls real agent) ─────────────

vi.mock('@/specialists/VideoAgent', () => ({
  videoAgent: {
    execute: vi.fn(async () => ({
      result: {
        shotList: [
          {
            scene: '开场',
            duration: '5s',
            action: '面向镜头',
            dialogue: '大家好',
            cameraAngle: '正面中景',
            prop: '无',
            lighting: '柔光',
            transition: '切入',
            sfx: '无',
            voiceover: '欢迎',
            subtitle: '开场',
            costume: '休闲',
            location: '室内',
          },
        ],
        equipment: ['手机', '三脚架'],
        schedule: '上午10点拍摄',
      },
      isFallback: false,
      durationMs: 1000,
      tokensUsed: { prompt: 100, completion: 200, total: 300 },
      modelUsed: 'claude-sonnet-4-6',
      traceId: 'test-trace-001',
    })),
  },
}));

vi.mock('@/specialists/AnalysisAgent', () => ({
  analysisAgent: {
    execute: vi.fn(async () => ({
      result: MOCK_VIRAL_RESULT_CREATION,
      isFallback: false,
      durationMs: 1000,
      tokensUsed: { prompt: 150, completion: 350, total: 500 },
      modelUsed: 'claude-sonnet-4-6',
      traceId: 'test-trace-001',
    })),
  },
}));

vi.mock('@/specialists/CopywritingAgent', () => ({
  copywritingAgent: {
    execute: vi.fn(async (req: { mode?: string }) => {
      if (req.mode === 'boom') {
        return {
          result: {
            candidates: [
              MOCK_BOOM_CANDIDATE,
              MOCK_BOOM_CANDIDATE,
              MOCK_BOOM_CANDIDATE,
              MOCK_BOOM_CANDIDATE,
              MOCK_BOOM_CANDIDATE,
            ],
            metadata: { count: 5 as const, elements: ['curiosity'] },
          },
          isFallback: false,
          durationMs: 1000,
          tokensUsed: { prompt: 500, completion: 2000, total: 2500 },
          modelUsed: 'test-model',
          traceId: 'test-trace-001',
        };
      }
      return {
        result: {
          markdown: MOCK_COPYWRITING_MARKDOWN,
          structure: '痛点引入→解决方案→CTA',
          hooks: ['这是一个吸引人的钩子'],
          cta: '点击关注获取更多干货',
        },
        isFallback: false,
        durationMs: 1000,
        tokensUsed: { prompt: 500, completion: 2000, total: 2500 },
        modelUsed: 'test-model',
        traceId: 'test-trace-001',
      };
    }),
  },
}));

import { copywritingRouter } from '@/trpc/routers/copywriting';
import { videoAnalysisRouter } from '@/trpc/routers/videoAnalysis';
import { videoProductionRouter } from '@/trpc/routers/videoProduction';
import { boomGenerateRouter } from '@/trpc/routers/boomGenerate';
import { monetizationRouter } from '@/trpc/routers/monetization';

// ─── Shared mock history row ─────────────────────────────────────────────────

const MOCK_HISTORY_ROW = {
  id: 1,
  content: '[mock]',
  agentId: 'mock',
  traceId: 'test-trace-001',
  createdAt: new Date('2026-01-01'),
};

// ─── Helper: minimal tRPC context with mocked prisma ─────────────────────────

function makeCtx(overrides: Record<string, unknown> = {}) {
  const history = {
    create: vi.fn(async () => ({ ...MOCK_HISTORY_ROW })),
    findMany: vi.fn(async () => [{ ...MOCK_HISTORY_ROW }]),
    findFirst: vi.fn(async () => ({ ...MOCK_HISTORY_ROW })),
    delete: vi.fn(async () => ({})),
  };

  const ipAccount = {
    findUnique: vi.fn(async () => ({ industry: '教育' })),
  };

  const tx = {
    history,
    ipAccount,
    $executeRaw: vi.fn(async () => 0),
  };

  const prisma = {
    history,
    ipAccount,
    $transaction: vi.fn(async (fn: (tx: typeof tx) => Promise<unknown>) => fn(tx)),
    _tx: tx,
  };

  return {
    ctx: {
      traceId: 'test-trace-001',
      activeAccountId: 1 as number | null,
      user: { id: 42, activeAccountId: 1 } as { id: number; activeAccountId: number | null } | null,
      prisma,
      req: new Request('http://localhost', { headers: { 'x-trace-id': 'test-trace-001' } }),
      sessionId: 'sess-001',
      ...overrides,
    },
    prisma,
  };
}

// ─── copywriting.generate ────────────────────────────────────────────────────

describe('copywriting.generate', () => {
  it('US-009 AC-5/AC-7: calls CopywritingAgent, writes real markdown to History row', async () => {
    const { ctx, prisma } = makeCtx();
    const caller = copywritingRouter.createCaller(ctx);
    const result = await caller.generate({ stepKey: 'step7' });
    expect(prisma.history.create).toHaveBeenCalledOnce();
    const createArgs = prisma.history.create.mock.calls[0]?.[0] as {
      data: { agentId: string; traceId: string; content: string };
    };
    expect(createArgs.data.agentId).toBe('CopywritingAgent'); // US-009: real agent
    expect(createArgs.data.traceId).toBe('test-trace-001');
    expect(createArgs.data.content).toBe(MOCK_COPYWRITING_MARKDOWN); // real markdown
    expect(result.content).toBe('[mock]'); // prisma.history.create mock returns MOCK_HISTORY_ROW
  });
});

// ─── copywriting.optimize ────────────────────────────────────────────────────

describe('copywriting.optimize', () => {
  it('AC-7: creates History row for optimization with traceId', async () => {
    const { ctx, prisma } = makeCtx();
    const caller = copywritingRouter.createCaller(ctx);
    const result = await caller.optimize({ historyId: 10, instruction: 'make it punchier' });
    expect(prisma.history.create).toHaveBeenCalledOnce();
    const createArgs = prisma.history.create.mock.calls[0]?.[0] as {
      data: { agentId: string; traceId: string };
    };
    expect(createArgs.data.agentId).toBe('CopywritingAgent');
    expect(createArgs.data.traceId).toBe('test-trace-001');
    expect(result.content).toBe('[mock]');
  });
});

// ─── copywriting.list ────────────────────────────────────────────────────────

describe('copywriting.list', () => {
  it('returns array of history entries without hitting history.create', async () => {
    const { ctx, prisma } = makeCtx();
    const caller = copywritingRouter.createCaller(ctx);
    const result = await caller.list({});
    expect(prisma.history.findMany).toHaveBeenCalledOnce();
    expect(prisma.history.create).not.toHaveBeenCalled();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── copywriting.delete ──────────────────────────────────────────────────────

describe('copywriting.delete', () => {
  it('calls history.delete with the given historyId and returns {ok: true}', async () => {
    const { ctx, prisma } = makeCtx();
    const caller = copywritingRouter.createCaller(ctx);
    const result = await caller.delete({ historyId: 5 });
    expect(result).toEqual({ ok: true });
    expect(prisma.history.delete).toHaveBeenCalledWith({ where: { id: 5 } });
  });
});

// ─── videoAnalysis.analyze ───────────────────────────────────────────────────
// US-009: analyze uses viral mode via AnalysisAgent (mocked above) · rewrite deleted(D-028)

describe('videoAnalysis.analyze', () => {
  it('AC-7: calls AnalysisAgent(viral), creates History row with agentId=AnalysisAgent and traceId', async () => {
    const { ctx, prisma } = makeCtx();
    const caller = videoAnalysisRouter.createCaller(ctx);
    const result = await caller.analyze({
      lastCopy: '这是一篇需要拆解的爆款文案内容，包含超过十个字符的正文用于测试分析功能。',
      lastTitle: '爆款测试标题',
    });
    expect(prisma.history.create).toHaveBeenCalledOnce();
    const createArgs = prisma.history.create.mock.calls[0]?.[0] as {
      data: { agentId: string; traceId: string };
    };
    expect(createArgs.data.agentId).toBe('AnalysisAgent');
    expect(createArgs.data.traceId).toBe('test-trace-001');
    expect(result.content).toBe('[mock]');
  });
});

// ─── videoProduction.generate ────────────────────────────────────────────────

describe('videoProduction.generate', () => {
  it('AC-7: calls VideoAgent(production), creates History row with agentId=VideoAgent and traceId', async () => {
    const { ctx, prisma } = makeCtx();
    const caller = videoProductionRouter.createCaller(ctx);
    const result = await caller.generate({
      sourceCopy: '这是一段有效的视频制作文案素材，超过十个字符用于测试。',
    });
    expect(prisma.history.create).toHaveBeenCalledOnce();
    const createArgs = prisma._tx.history.create.mock.calls[0]?.[0] as {
      data: { agentId: string; traceId: string };
    };
    expect(createArgs.data.agentId).toBe('VideoAgent');
    expect(createArgs.data.traceId).toBe('test-trace-001');
    expect(result.content).toBe('[mock]');
  });
});

// ─── videoProduction.generateStoryboard ──────────────────────────────────────

describe('videoProduction.generateStoryboard', () => {
  it('AC-7: creates History row for storyboard with traceId', async () => {
    const { ctx, prisma } = makeCtx();
    const caller = videoProductionRouter.createCaller(ctx);
    const result = await caller.generateStoryboard({ stepKey: 'step6' });
    expect(prisma.history.create).toHaveBeenCalledOnce();
    const createArgs = prisma.history.create.mock.calls[0]?.[0] as {
      data: { agentId: string; traceId: string };
    };
    expect(createArgs.data.agentId).toBe('VideoAgent');
    expect(createArgs.data.traceId).toBe('test-trace-001');
    expect(result.content).toBe('[mock]');
  });
});

// ─── videoProduction.generateSceneImage ──────────────────────────────────────

describe('videoProduction.generateSceneImage', () => {
  it('AC-7: creates History row for scene image with traceId', async () => {
    const { ctx, prisma } = makeCtx();
    const caller = videoProductionRouter.createCaller(ctx);
    const result = await caller.generateSceneImage({ storyboardHistoryId: 3, sceneIndex: 0 });
    expect(prisma.history.create).toHaveBeenCalledOnce();
    const createArgs = prisma.history.create.mock.calls[0]?.[0] as {
      data: { agentId: string; traceId: string };
    };
    expect(createArgs.data.agentId).toBe('VideoAgent');
    expect(createArgs.data.traceId).toBe('test-trace-001');
    expect(result.content).toBe('[mock]');
  });
});

// ─── boomGenerate.generate ───────────────────────────────────────────────────

describe('boomGenerate.generate', () => {
  it('AC-7: creates History row with agentId=CopywritingAgent and traceId', async () => {
    const { ctx, prisma } = makeCtx();
    const caller = boomGenerateRouter.createCaller(ctx);
    const result = await caller.generate({ elements: ['curiosity', 'contrast'] });
    expect(prisma._tx.history.create).toHaveBeenCalledOnce();
    const createArgs = prisma._tx.history.create.mock.calls[0]?.[0] as {
      data: { agentId: string; traceId: string };
    };
    expect(createArgs.data.agentId).toBe('CopywritingAgent');
    expect(createArgs.data.traceId).toBe('test-trace-001');
    expect(result.content).toBe('[mock]');
  });
});

// ─── monetization.generate ───────────────────────────────────────────────────

describe('monetization.generate', () => {
  it('AC-7: creates History row with agentId=monetization and traceId', async () => {
    const { ctx, prisma } = makeCtx();
    const caller = monetizationRouter.createCaller(ctx);
    const result = await caller.generate({});
    expect(prisma.history.create).toHaveBeenCalledOnce();
    const createArgs = prisma.history.create.mock.calls[0]?.[0] as {
      data: { agentId: string; traceId: string };
    };
    expect(createArgs.data.agentId).toBe('MonetizationAgent');
    expect(createArgs.data.traceId).toBe('test-trace-001');
    expect(result.content).toBe('[mock]');
  });
});
