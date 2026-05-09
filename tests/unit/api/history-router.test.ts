/**
 * Unit tests — PRD-5 US-011
 * history.list: filter by agentId / agentMode / sourceType / dateRange / pagination
 * history.detail: RLS via explicit accountId + NOT_FOUND
 * history.delete: explicit accountId guard + { ok: true }
 * AC-12: limit > 100 → zod BAD_REQUEST
 * SHIELD REJ-013: protectedProcedure
 * SHIELD REJ-008: explicit accountId where
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';

import { historyRouter } from '@/trpc/routers/history';

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

// ── makeCtx ───────────────────────────────────────────────────────────────────

function makeCtx(overrides: Record<string, unknown> = {}) {
  const history = {
    findMany: vi.fn(async () => [{ ...MOCK_ROW }]),
    findFirst: vi.fn(async () => ({ ...MOCK_ROW })),
    deleteMany: vi.fn(async () => ({ count: 1 })),
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
