/**
 * Unit tests — PRD-5 US-011 · PRD-6 US-013
 * history.list: filter by agentId / agentMode / sourceType / dateRange / pagination
 * history.list US-013: filter agentMode=production / acquisition(video) / storyboard
 * history.detail: RLS via explicit accountId + NOT_FOUND
 * history.detail US-013: storyboard → join Asset → scenes[] with sceneImageUrl
 * history.delete: explicit accountId guard + { ok: true }
 * AC-12: limit > 100 → zod BAD_REQUEST
 * SHIELD REJ-013: protectedProcedure
 * SHIELD REJ-008: explicit accountId where
 * US-013 AC-8: (1) list production filter (2) list acquisition(video) (3) storyboard scenes
 *              (4) detail join Asset sceneImageUrl (5) cross-account RLS isolation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';

import { historyRouter } from '@/trpc/routers/app/history';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_ROW = {
  id: 1,
  agentId: 'CopywritingAgent',
  agentMode: 'free',
  sourceType: 'user',
  inputSummary: '如何提升内容完播率和互动率',
  content: '这是一篇关于内容创作的脚本',
  contentType: 'markdown',
  scriptType: null,
  elements: ['curiosity', 'contrast'],
  isFallback: false,
  traceId: 'trace-011',
  createdAt: new Date('2026-05-01'),
};

const MOCK_ROW_2 = {
  ...MOCK_ROW,
  id: 2,
  agentId: 'AnalysisAgent',
  agentMode: 'structural',
  inputSummary: '文案结构分析输入摘要',
  content: '{"scores":{"overall":75}}',
  contentType: 'json',
};

// US-013 fixtures
const MOCK_STORYBOARD_ROW = {
  id: 3,
  agentId: 'VideoAgent',
  agentMode: 'storyboard',
  sourceType: 'user',
  inputSummary: '故事板原始文案输入摘要',
  content: JSON.stringify({
    title: '测试视频',
    totalDuration: '30s',
    scenes: [
      { index: 1, description: '开场白', imagePromptEn: 'opening scene', duration: '5s', sceneImageUrl: null, status: 'pending' },
      { index: 2, description: '主要内容', imagePromptEn: 'main content', duration: '10s', sceneImageUrl: null, status: 'completed' },
    ],
  }),
  contentType: 'json',
  scriptType: null,
  elements: [],
  isFallback: false,
  traceId: 'trace-013',
  createdAt: new Date('2026-05-10'),
};

const MOCK_ASSETS = [
  { sceneIndex: 1, publicUrl: 'https://cdn.example.com/scene-1.png' },
  { sceneIndex: 2, publicUrl: 'https://cdn.example.com/scene-2.png' },
];

// ── makeCtx ───────────────────────────────────────────────────────────────────

function makeCtx(overrides: Record<string, unknown> = {}) {
  const history = {
    findMany: vi.fn(async () => [{ ...MOCK_ROW }]),
    findFirst: vi.fn(async () => ({ ...MOCK_ROW })),
    deleteMany: vi.fn(async () => ({ count: 1 })),
  };

  // US-013: asset mock for storyboard detail join (must be on tx — middleware passes tx as prisma)
  const asset = {
    findMany: vi.fn(async () => [] as typeof MOCK_ASSETS),
  };

  const tx = {
    history,
    asset,
    $executeRaw: vi.fn(async () => 0),
  };

  const prisma = {
    history,
    asset,
    $transaction: vi.fn(async (fn: (tx: typeof tx) => Promise<unknown>) => fn(tx)),
    _tx: tx,
  };

  return {
    ctx: {
      traceId: 'test-trace-011',
      activeAccountId: 1 as number | null,
      user: { id: 10, activeAccountId: 1 } as { id: number; activeAccountId: number | null } | null,
      prisma,
      req: new Request('http://localhost', { headers: { 'x-trace-id': 'test-trace-011' } }),
      sessionId: 'sess-011',
      ...overrides,
    },
    prisma,
  };
}

// ── list tests ────────────────────────────────────────────────────────────────

describe('history.list', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('AC-2: list all — findMany called with accountId + orderBy createdAt desc', async () => {
    const { ctx, prisma } = makeCtx();
    const caller = historyRouter.createCaller(ctx as Parameters<typeof historyRouter.createCaller>[0]);

    const rows = await caller.list({});

    expect(prisma._tx.history.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ accountId: 1 }),
        orderBy: { createdAt: 'desc' },
      }),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: MOCK_ROW.id, agentMode: 'free' });
  });

  it('AC-2: filter by agentMode — where includes agentMode', async () => {
    const { ctx, prisma } = makeCtx();
    prisma._tx.history.findMany.mockResolvedValue([{ ...MOCK_ROW_2 }]);
    const caller = historyRouter.createCaller(ctx as Parameters<typeof historyRouter.createCaller>[0]);

    await caller.list({ agentMode: 'structural' });

    expect(prisma._tx.history.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ accountId: 1, agentMode: 'structural' }),
      }),
    );
  });

  it('AC-2: filter by agentId', async () => {
    const { ctx, prisma } = makeCtx();
    const caller = historyRouter.createCaller(ctx as Parameters<typeof historyRouter.createCaller>[0]);

    await caller.list({ agentId: 'AnalysisAgent' });

    expect(prisma._tx.history.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ accountId: 1, agentId: 'AnalysisAgent' }),
      }),
    );
  });

  it('AC-2: filter by sourceType', async () => {
    const { ctx, prisma } = makeCtx();
    const caller = historyRouter.createCaller(ctx as Parameters<typeof historyRouter.createCaller>[0]);

    await caller.list({ sourceType: 'user' });

    expect(prisma._tx.history.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ accountId: 1, sourceType: 'user' }),
      }),
    );
  });

  it('AC-2: dateRange=last_7d → createdAt gte filter added', async () => {
    const { ctx, prisma } = makeCtx();
    const caller = historyRouter.createCaller(ctx as Parameters<typeof historyRouter.createCaller>[0]);

    await caller.list({ dateRange: 'last_7d' });

    const callArg = (prisma._tx.history.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0] as {
      where: { createdAt?: { gte: Date } };
    };
    expect(callArg.where.createdAt).toBeDefined();
    expect(callArg.where.createdAt?.gte).toBeInstanceOf(Date);
  });

  it('AC-2: pagination — take=limit skip=offset passed through', async () => {
    const { ctx, prisma } = makeCtx();
    const caller = historyRouter.createCaller(ctx as Parameters<typeof historyRouter.createCaller>[0]);

    await caller.list({ limit: 5, offset: 10 });

    expect(prisma._tx.history.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5, skip: 10 }),
    );
  });

  it('AC-12: limit > 100 → zod BAD_REQUEST', async () => {
    const { ctx } = makeCtx();
    const caller = historyRouter.createCaller(ctx as Parameters<typeof historyRouter.createCaller>[0]);

    await expect(caller.list({ limit: 101 })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    });
  });
});

// ── detail tests ──────────────────────────────────────────────────────────────

describe('history.detail', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('AC-3: detail — findFirst with id + accountId', async () => {
    const { ctx, prisma } = makeCtx();
    const caller = historyRouter.createCaller(ctx as Parameters<typeof historyRouter.createCaller>[0]);

    const row = await caller.detail({ id: 1 });

    expect(prisma._tx.history.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1, accountId: 1 },
      }),
    );
    expect(row).toMatchObject({ id: 1, agentMode: 'free' });
  });

  it('AC-13: detail not found → NOT_FOUND', async () => {
    const { ctx, prisma } = makeCtx();
    prisma._tx.history.findFirst.mockResolvedValue(null);
    const caller = historyRouter.createCaller(ctx as Parameters<typeof historyRouter.createCaller>[0]);

    await expect(caller.detail({ id: 999 })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});

// ── US-013 list filter tests ──────────────────────────────────────────────────

describe('history.list US-013', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('US-013 AC-8 (1): list filter agentMode=production → findMany includes production filter', async () => {
    const { ctx, prisma } = makeCtx();
    prisma._tx.history.findMany.mockResolvedValue([{
      ...MOCK_ROW, id: 10, agentId: 'VideoAgent', agentMode: 'production',
    }]);
    const caller = historyRouter.createCaller(ctx as Parameters<typeof historyRouter.createCaller>[0]);

    const rows = await caller.list({ agentMode: 'production' });

    expect(prisma._tx.history.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ accountId: 1, agentMode: 'production' }),
      }),
    );
    expect(rows[0]).toMatchObject({ agentMode: 'production', agentId: 'VideoAgent' });
  });

  it('US-013 AC-8 (2): list filter agentMode=acquisition(video) → VideoAgent rows returned', async () => {
    const { ctx, prisma } = makeCtx();
    prisma._tx.history.findMany.mockResolvedValue([{
      ...MOCK_ROW, id: 11, agentId: 'VideoAgent', agentMode: 'acquisition',
    }]);
    const caller = historyRouter.createCaller(ctx as Parameters<typeof historyRouter.createCaller>[0]);

    const rows = await caller.list({ agentMode: 'acquisition' });

    expect(prisma._tx.history.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ accountId: 1, agentMode: 'acquisition' }),
      }),
    );
    expect(rows[0]).toMatchObject({ agentMode: 'acquisition', agentId: 'VideoAgent' });
  });
});

// ── US-013 detail tests ───────────────────────────────────────────────────────

describe('history.detail US-013', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('US-013 AC-8 (3): storyboard detail → scenes array returned', async () => {
    const { ctx, prisma } = makeCtx();
    prisma._tx.history.findFirst.mockResolvedValue({ ...MOCK_STORYBOARD_ROW });
    prisma.asset.findMany.mockResolvedValue([]);
    const caller = historyRouter.createCaller(ctx as Parameters<typeof historyRouter.createCaller>[0]);

    const row = await caller.detail({ id: 3 });

    expect(row).toHaveProperty('scenes');
    const rowWithScenes = row as typeof row & { scenes: unknown[] };
    expect(Array.isArray(rowWithScenes.scenes)).toBe(true);
    expect(rowWithScenes.scenes).toHaveLength(2);
  });

  it('US-013 AC-8 (4): detail join Asset → sceneImageUrl from Asset.publicUrl', async () => {
    const { ctx, prisma } = makeCtx();
    prisma._tx.history.findFirst.mockResolvedValue({ ...MOCK_STORYBOARD_ROW });
    prisma.asset.findMany.mockResolvedValue([...MOCK_ASSETS]);
    const caller = historyRouter.createCaller(ctx as Parameters<typeof historyRouter.createCaller>[0]);

    const row = await caller.detail({ id: 3 });

    // Asset table queried with explicit accountId double-guard (LD-009)
    expect(prisma.asset.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ relatedHistoryId: 3, accountId: 1 }),
      }),
    );

    const rowWithScenes = row as typeof row & { scenes: Array<{ index: number; sceneImageUrl: string | null }> };
    expect(rowWithScenes.scenes[0]).toMatchObject({
      index: 1,
      sceneImageUrl: 'https://cdn.example.com/scene-1.png',
    });
    expect(rowWithScenes.scenes[1]).toMatchObject({
      index: 2,
      sceneImageUrl: 'https://cdn.example.com/scene-2.png',
    });
  });

  it('US-013 AC-8 (5): cross-account detail → NOT_FOUND (accountId double-layer guard)', async () => {
    // account 2 tries to access storyboard history owned by account 1
    const { ctx, prisma } = makeCtx({ activeAccountId: 2 });
    prisma._tx.history.findFirst.mockResolvedValue(null); // no match for accountId=2
    const caller = historyRouter.createCaller(ctx as Parameters<typeof historyRouter.createCaller>[0]);

    await expect(caller.detail({ id: 3 })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });

    expect(prisma._tx.history.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 3, accountId: 2 }, // explicit accountId prevents cross-account leak
      }),
    );
  });
});

// ── delete tests ──────────────────────────────────────────────────────────────

describe('history.delete', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('AC-4: delete — deleteMany with id + accountId → { ok: true }', async () => {
    const { ctx, prisma } = makeCtx();
    const caller = historyRouter.createCaller(ctx as Parameters<typeof historyRouter.createCaller>[0]);

    const result = await caller.delete({ id: 1 });

    expect(prisma._tx.history.deleteMany).toHaveBeenCalledWith({
      where: { id: 1, accountId: 1 },
    });
    expect(result).toEqual({ ok: true });
  });

  it('AC-13: delete cross-account blocked by explicit accountId where', async () => {
    const { ctx, prisma } = makeCtx({ activeAccountId: 2 });
    const caller = historyRouter.createCaller(ctx as Parameters<typeof historyRouter.createCaller>[0]);

    await caller.delete({ id: 1 });

    expect(prisma._tx.history.deleteMany).toHaveBeenCalledWith({
      where: { id: 1, accountId: 2 },
    });
  });
});
