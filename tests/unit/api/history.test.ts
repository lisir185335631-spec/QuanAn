/**
 * Unit tests — PRD-15 US-008 AC-10
 * history.stats: aggregates cost_log for dashboard view
 * Covers: totalCalls + failureRate + avgDurationMs + topTools + dailyTrend + durationHistogram + modelDistribution
 * SHIELD REJ-013: protectedProcedure
 * SHIELD REJ-008: explicit accountId in all cost_log where clauses
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { historyRouter } from '@/trpc/routers/app/history';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const now = new Date('2026-05-16T10:00:00Z');

const MOCK_COST_RECORDS = [
  { createdAt: new Date('2026-05-16T09:00:00Z'), durationMs: 2500 },
  { createdAt: new Date('2026-05-16T08:00:00Z'), durationMs: 500 },
  { createdAt: new Date('2026-05-15T14:00:00Z'), durationMs: 8000 },
  { createdAt: new Date('2026-05-14T10:00:00Z'), durationMs: 45000 },
];

// ── makeCtx ───────────────────────────────────────────────────────────────────

function makeCtx(overrides: Record<string, unknown> = {}) {
  const costLog = {
    count: vi.fn(async () => 0),
    aggregate: vi.fn(async () => ({ _avg: { durationMs: 3000 } })),
    groupBy: vi.fn(async () => []),
    findMany: vi.fn(async () => []),
  };

  const history = {
    findMany: vi.fn(async () => []),
    findFirst: vi.fn(async () => null),
    deleteMany: vi.fn(async () => ({ count: 0 })),
  };

  const asset = {
    findMany: vi.fn(async () => []),
  };

  const tx = {
    history,
    costLog,
    asset,
    $executeRaw: vi.fn(async () => 0),
  };

  const prisma = {
    history,
    costLog,
    asset,
    $transaction: vi.fn(async (fn: (tx: typeof tx) => Promise<unknown>) => fn(tx)),
    _tx: tx,
  };

  return {
    ctx: {
      traceId: 'test-trace-us008',
      activeAccountId: 1 as number | null,
      user: { id: 10, activeAccountId: 1 } as { id: number; activeAccountId: number | null } | null,
      prisma,
      req: new Request('http://localhost', { headers: { 'x-trace-id': 'test-trace-us008' } }),
      sessionId: 'sess-us008',
      ...overrides,
    },
    prisma,
    costLog: tx.costLog,
  };
}

// ── stats tests ───────────────────────────────────────────────────────────────

describe('history.stats', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('AC-10: stats — costLog.count called with accountId (total + fail)', async () => {
    const { ctx, costLog } = makeCtx();
    costLog.count
      .mockResolvedValueOnce(10)  // totalCalls
      .mockResolvedValueOnce(2);  // failCount

    const caller = historyRouter.createCaller(ctx as Parameters<typeof historyRouter.createCaller>[0]);
    const result = await caller.stats({});

    // count called twice: once total, once with success: false
    expect(costLog.count).toHaveBeenCalledTimes(2);
    expect(costLog.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ accountId: 1 }) }),
    );
    expect(result.totalCalls).toBe(10);
  });

  it('AC-10: stats — failureRate = failCount / totalCalls', async () => {
    const { ctx, costLog } = makeCtx();
    costLog.count
      .mockResolvedValueOnce(20)  // totalCalls
      .mockResolvedValueOnce(4);  // failCount

    const caller = historyRouter.createCaller(ctx as Parameters<typeof historyRouter.createCaller>[0]);
    const result = await caller.stats({});

    expect(result.failureRate).toBeCloseTo(0.2);
  });

  it('AC-10: stats — failureRate = 0 when totalCalls = 0', async () => {
    const { ctx, costLog } = makeCtx();
    costLog.count.mockResolvedValue(0);

    const caller = historyRouter.createCaller(ctx as Parameters<typeof historyRouter.createCaller>[0]);
    const result = await caller.stats({});

    expect(result.failureRate).toBe(0);
  });

  it('AC-10: stats — avgDurationMs rounded from aggregate', async () => {
    const { ctx, costLog } = makeCtx();
    costLog.count.mockResolvedValue(5);
    costLog.aggregate.mockResolvedValue({ _avg: { durationMs: 2750.6 } });

    const caller = historyRouter.createCaller(ctx as Parameters<typeof historyRouter.createCaller>[0]);
    const result = await caller.stats({});

    expect(result.avgDurationMs).toBe(2751);
  });

  it('AC-10: stats — topTools from groupBy agentId (5 entries)', async () => {
    const { ctx, costLog } = makeCtx();
    costLog.count.mockResolvedValue(0);
    costLog.groupBy
      .mockResolvedValueOnce([
        { agentId: 'CopywritingAgent', _count: { id: 50 } },
        { agentId: 'TrendingAgent', _count: { id: 30 } },
      ])
      .mockResolvedValueOnce([]);

    const caller = historyRouter.createCaller(ctx as Parameters<typeof historyRouter.createCaller>[0]);
    const result = await caller.stats({});

    expect(result.topTools).toHaveLength(2);
    expect(result.topTools[0]).toMatchObject({ agentId: 'CopywritingAgent', count: 50 });
  });

  it('AC-10: stats — dailyTrend groups createdAt by date key', async () => {
    const { ctx, costLog } = makeCtx();
    costLog.count.mockResolvedValue(0);
    costLog.findMany.mockResolvedValue([...MOCK_COST_RECORDS]);

    const caller = historyRouter.createCaller(ctx as Parameters<typeof historyRouter.createCaller>[0]);
    const result = await caller.stats({});

    // 3 distinct dates from MOCK_COST_RECORDS
    expect(result.dailyTrend.length).toBe(3);
    // Sorted descending
    expect(result.dailyTrend[0]!.date >= result.dailyTrend[1]!.date).toBe(true);
    // 2026-05-16 has 2 records
    const day16 = result.dailyTrend.find((d) => d.date === '2026-05-16');
    expect(day16?.count).toBe(2);
  });

  it('AC-10: stats — durationHistogram buckets <1s/1-3s/3-10s/10-30s/>30s', async () => {
    const { ctx, costLog } = makeCtx();
    costLog.count.mockResolvedValue(0);
    costLog.findMany.mockResolvedValue([...MOCK_COST_RECORDS]);

    const caller = historyRouter.createCaller(ctx as Parameters<typeof historyRouter.createCaller>[0]);
    const result = await caller.stats({});

    const labels = result.durationHistogram.map((b) => b.label);
    expect(labels).toEqual(['<1s', '1-3s', '3-10s', '10-30s', '>30s']);

    // 500ms → <1s
    expect(result.durationHistogram.find((b) => b.label === '<1s')?.count).toBe(1);
    // 2500ms → 1-3s
    expect(result.durationHistogram.find((b) => b.label === '1-3s')?.count).toBe(1);
    // 8000ms → 3-10s
    expect(result.durationHistogram.find((b) => b.label === '3-10s')?.count).toBe(1);
    // 45000ms → >30s
    expect(result.durationHistogram.find((b) => b.label === '>30s')?.count).toBe(1);
  });

  it('AC-10: stats — modelDistribution from groupBy modelUsed', async () => {
    const { ctx, costLog } = makeCtx();
    costLog.count.mockResolvedValue(0);
    costLog.groupBy
      .mockResolvedValueOnce([])                           // topTools (by agentId)
      .mockResolvedValueOnce([
        { modelUsed: 'gpt-4o', _count: { id: 20 } },
        { modelUsed: 'claude-sonnet', _count: { id: 15 } },
      ]);

    const caller = historyRouter.createCaller(ctx as Parameters<typeof historyRouter.createCaller>[0]);
    const result = await caller.stats({});

    expect(result.modelDistribution).toHaveLength(2);
    expect(result.modelDistribution[0]).toMatchObject({ model: 'gpt-4o', count: 20 });
  });

  it('AC-10: stats — dateRange=today applies createdAt ≥ midnight filter', async () => {
    const { ctx, costLog } = makeCtx();

    const caller = historyRouter.createCaller(ctx as Parameters<typeof historyRouter.createCaller>[0]);
    await caller.stats({ dateRange: 'today' });

    const countCall = (costLog.count as ReturnType<typeof vi.fn>).mock.calls[0][0] as {
      where: { createdAt?: { gte: Date } };
    };
    expect(countCall.where.createdAt?.gte).toBeInstanceOf(Date);
    const gteHour = countCall.where.createdAt!.gte.getHours();
    expect(gteHour).toBe(0); // midnight
  });

  it('AC-10: stats — tools filter maps slugs to agentId IN list', async () => {
    const { ctx, costLog } = makeCtx();

    const caller = historyRouter.createCaller(ctx as Parameters<typeof historyRouter.createCaller>[0]);
    await caller.stats({ tools: ['copywriting', 'trending'] });

    const countCall = (costLog.count as ReturnType<typeof vi.fn>).mock.calls[0][0] as {
      where: { agentId?: { in: string[] } };
    };
    expect(countCall.where.agentId?.in).toBeDefined();
    expect(countCall.where.agentId!.in).toContain('CopywritingAgent');
    expect(countCall.where.agentId!.in).toContain('TrendingAgent');
  });
});

// ── list.tools filter tests ───────────────────────────────────────────────────

describe('history.list tools filter (AC-7)', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('list with tools=["copywriting"] → where.agentId.in includes CopywritingAgent', async () => {
    const { ctx, prisma } = makeCtx();
    prisma._tx.history.findMany.mockResolvedValue([]);

    const caller = historyRouter.createCaller(ctx as Parameters<typeof historyRouter.createCaller>[0]);
    await caller.list({ tools: ['copywriting'] });

    expect(prisma._tx.history.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          agentId: { in: expect.arrayContaining(['CopywritingAgent']) },
        }),
      }),
    );
  });

  it('list with tools=["aiVideo","videoProduction"] → agentId.in includes VideoAgent', async () => {
    const { ctx, prisma } = makeCtx();
    prisma._tx.history.findMany.mockResolvedValue([]);

    const caller = historyRouter.createCaller(ctx as Parameters<typeof historyRouter.createCaller>[0]);
    await caller.list({ tools: ['aiVideo', 'videoProduction'] });

    const call = (prisma._tx.history.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0] as {
      where: { agentId?: { in: string[] } };
    };
    expect(call.where.agentId?.in).toContain('VideoAgent');
  });

  it('list without tools → no agentId.in filter (backward compat)', async () => {
    const { ctx, prisma } = makeCtx();
    prisma._tx.history.findMany.mockResolvedValue([]);

    const caller = historyRouter.createCaller(ctx as Parameters<typeof historyRouter.createCaller>[0]);
    await caller.list({});

    const call = (prisma._tx.history.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0] as {
      where: Record<string, unknown>;
    };
    expect(call.where.agentId).toBeUndefined();
  });

  it('list dateRange=today → createdAt ≥ midnight filter', async () => {
    const { ctx, prisma } = makeCtx();
    prisma._tx.history.findMany.mockResolvedValue([]);

    const caller = historyRouter.createCaller(ctx as Parameters<typeof historyRouter.createCaller>[0]);
    await caller.list({ dateRange: 'today' });

    const call = (prisma._tx.history.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0] as {
      where: { createdAt?: { gte: Date } };
    };
    expect(call.where.createdAt?.gte).toBeInstanceOf(Date);
    expect(call.where.createdAt!.gte.getHours()).toBe(0);
  });
});
