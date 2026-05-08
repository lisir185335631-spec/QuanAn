/**
 * Unit tests — PRD-2 US-004
 * 5 Specialist mock routers: copywriting/videoAnalysis/videoProduction/boomGenerate/monetization
 * AC-10: ≥ 11 unit tests · ≥ 1 per procedure
 * AC-7: mutations write History row with trace_id
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
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
    delete: vi.fn(async () => ({})),
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
  it('AC-7: creates History row with traceId and returns mock content', async () => {
    const { ctx, prisma } = makeCtx();
    const caller = copywritingRouter.createCaller(ctx);
    const result = await caller.generate({ stepKey: 'step7' });
    expect(prisma.history.create).toHaveBeenCalledOnce();
    const createArgs = prisma.history.create.mock.calls[0]?.[0] as {
      data: { agentId: string; traceId: string; content: string };
    };
    expect(createArgs.data.agentId).toBe('copywriting');
    expect(createArgs.data.traceId).toBe('test-trace-001');
    expect(createArgs.data.content).toBe('[mock]');
    expect(result.content).toBe('[mock]');
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
    expect(createArgs.data.agentId).toBe('copywriting');
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

describe('videoAnalysis.analyze', () => {
  it('AC-7: creates History row with agentId=video_analysis and traceId', async () => {
    const { ctx, prisma } = makeCtx();
    const caller = videoAnalysisRouter.createCaller(ctx);
    const result = await caller.analyze({ videoUrl: 'https://example.com/v.mp4' });
    expect(prisma.history.create).toHaveBeenCalledOnce();
    const createArgs = prisma.history.create.mock.calls[0]?.[0] as {
      data: { agentId: string; traceId: string };
    };
    expect(createArgs.data.agentId).toBe('video_analysis');
    expect(createArgs.data.traceId).toBe('test-trace-001');
    expect(result.content).toBe('[mock]');
  });
});

// ─── videoAnalysis.rewrite ───────────────────────────────────────────────────

describe('videoAnalysis.rewrite', () => {
  it('AC-7: creates History row for rewrite with traceId', async () => {
    const { ctx, prisma } = makeCtx();
    const caller = videoAnalysisRouter.createCaller(ctx);
    const result = await caller.rewrite({ historyId: 2 });
    expect(prisma.history.create).toHaveBeenCalledOnce();
    const createArgs = prisma.history.create.mock.calls[0]?.[0] as {
      data: { agentId: string; traceId: string };
    };
    expect(createArgs.data.agentId).toBe('video_analysis');
    expect(createArgs.data.traceId).toBe('test-trace-001');
    expect(result.content).toBe('[mock]');
  });
});

// ─── videoProduction.generate ────────────────────────────────────────────────

describe('videoProduction.generate', () => {
  it('AC-7: creates History row with agentId=video_production', async () => {
    const { ctx, prisma } = makeCtx();
    const caller = videoProductionRouter.createCaller(ctx);
    const result = await caller.generate({ stepKey: 'step6' });
    expect(prisma.history.create).toHaveBeenCalledOnce();
    const createArgs = prisma.history.create.mock.calls[0]?.[0] as {
      data: { agentId: string; traceId: string };
    };
    expect(createArgs.data.agentId).toBe('video_production');
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
    expect(createArgs.data.agentId).toBe('video_production');
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
    expect(createArgs.data.agentId).toBe('video_production');
    expect(createArgs.data.traceId).toBe('test-trace-001');
    expect(result.content).toBe('[mock]');
  });
});

// ─── boomGenerate.generate ───────────────────────────────────────────────────

describe('boomGenerate.generate', () => {
  it('AC-7: creates History row with agentId=boom_generate and traceId', async () => {
    const { ctx, prisma } = makeCtx();
    const caller = boomGenerateRouter.createCaller(ctx);
    const result = await caller.generate({ stepKey: 'boom_generate' });
    expect(prisma.history.create).toHaveBeenCalledOnce();
    const createArgs = prisma.history.create.mock.calls[0]?.[0] as {
      data: { agentId: string; traceId: string };
    };
    expect(createArgs.data.agentId).toBe('boom_generate');
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
    expect(createArgs.data.agentId).toBe('monetization');
    expect(createArgs.data.traceId).toBe('test-trace-001');
    expect(result.content).toBe('[mock]');
  });
});
