// PRD-29 · dailyTasks admin router unit tests
// list(返回 + 分页 + 过滤) · detail(命中 + NOT_FOUND) · kpiStats(总数/fallbackRate/avgCompletionRate/agentIdDist)
// auth guard: makeCaller(null).list({}) 应 reject UNAUTHORIZED

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ──────────────────────────────────────────────────────────

const mockDailyTaskFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockDailyTaskFindUnique = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockDailyTaskCount = vi.hoisted(() => vi.fn().mockResolvedValue(0));
const mockDailyTaskAggregate = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ _sum: { completedCount: 0, totalCount: 0 } }),
);
const mockDailyTaskGroupBy = vi.hoisted(() => vi.fn().mockResolvedValue([]));

// adminRLS middleware calls ctx.prisma.$transaction — must mock it.
// It sets adminPrisma = tx inside the transaction, so the tx object must also
// expose dailyTask so the router can use ctx.adminPrisma ?? ctx.prisma.
const mockPrismaTransaction = vi.hoisted(() =>
  vi.fn().mockImplementation((cb: (tx: unknown) => unknown) =>
    cb({
      $executeRawUnsafe: vi.fn().mockResolvedValue(undefined),
      dailyTask: {
        findMany: mockDailyTaskFindMany,
        findUnique: mockDailyTaskFindUnique,
        count: mockDailyTaskCount,
        aggregate: mockDailyTaskAggregate,
        groupBy: mockDailyTaskGroupBy,
      },
    }),
  ),
);

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: mockPrismaTransaction,
    dailyTask: {
      findMany: mockDailyTaskFindMany,
      findUnique: mockDailyTaskFindUnique,
      count: mockDailyTaskCount,
      aggregate: mockDailyTaskAggregate,
      groupBy: mockDailyTaskGroupBy,
    },
  },
}));

// ── Imports (after mocks) ──────────────────────────────────────────────────

import type { AdminLuciaSession, AdminLuciaUser } from '@/lib/auth/lucia-admin';
import { prisma } from '@/lib/prisma';
import type { AdminTRPCContext } from '@/server/context-admin';
import { dailyTasksAdminRouter } from '@/trpc/routers/admin/dailyTasks';

// ── Fixtures ───────────────────────────────────────────────────────────────

const SUPER_ADMIN: AdminLuciaUser = {
  id: 1,
  email: 'super@quanan.com',
  role: 'super_admin',
  isMock: false,
  isActive: true,
  allowedDomains: [],
};

const ADMIN_USER: AdminLuciaUser = {
  id: 2,
  email: 'admin@quanan.com',
  role: 'admin',
  isMock: false,
  isActive: true,
  allowedDomains: [],
};

const MOCK_SESSION: AdminLuciaSession = {
  id: 'sess-daily-tasks-test',
  expiresAt: new Date(Date.now() + 3_600_000),
  fresh: false,
} as AdminLuciaSession;

function makeCtx(
  user: AdminLuciaUser | null,
  overrides: Partial<AdminTRPCContext> = {},
): AdminTRPCContext {
  return {
    prisma: prisma,
    adminPrisma: prisma,
    traceId: 'trace-daily-tasks-test',
    req: new Request('http://localhost/trpc/admin/dailyTasks', {
      headers: { 'x-forwarded-for': '10.0.0.1', 'user-agent': 'test/1.0' },
    }),
    resHeaders: new Headers(),
    adminSession: MOCK_SESSION,
    activeAdminUser: user,
    ...overrides,
  };
}

function makeCaller(user: AdminLuciaUser | null, overrides: Partial<AdminTRPCContext> = {}) {
  return dailyTasksAdminRouter.createCaller(makeCtx(user, overrides));
}

const MOCK_TASK_DATE = new Date('2026-01-15T00:00:00Z');

const MOCK_LIST_ITEM = {
  id: 1,
  accountId: 100,
  taskDate: MOCK_TASK_DATE,
  completedCount: 3,
  totalCount: 5,
  agentId: 'DailyTaskAgent',
  modelUsed: 'claude-3-5-sonnet-20241022',
  isFallback: false,
  createdAt: new Date('2026-01-15T10:00:00Z'),
};

const MOCK_DETAIL_ITEM = {
  ...MOCK_LIST_ITEM,
  tasks: [
    { title: '任务一', completed: true },
    { title: '任务二', completed: false },
  ],
  updatedAt: new Date('2026-01-15T11:00:00Z'),
};

beforeEach(() => {
  vi.resetAllMocks();
  mockDailyTaskFindMany.mockResolvedValue([]);
  mockDailyTaskFindUnique.mockResolvedValue(null);
  mockDailyTaskCount.mockResolvedValue(0);
  mockDailyTaskAggregate.mockResolvedValue({ _sum: { completedCount: 0, totalCount: 0 } });
  mockDailyTaskGroupBy.mockResolvedValue([]);
  // Re-establish $transaction after resetAllMocks
  mockPrismaTransaction.mockImplementation((cb: (tx: unknown) => unknown) =>
    cb({
      $executeRawUnsafe: vi.fn().mockResolvedValue(undefined),
      dailyTask: {
        findMany: mockDailyTaskFindMany,
        findUnique: mockDailyTaskFindUnique,
        count: mockDailyTaskCount,
        aggregate: mockDailyTaskAggregate,
        groupBy: mockDailyTaskGroupBy,
      },
    }),
  );
});

// ── auth guard ─────────────────────────────────────────────────────────────

describe('auth guard', () => {
  it('list rejects with UNAUTHORIZED when activeAdminUser is null', async () => {
    const caller = makeCaller(null);
    await expect(caller.list({})).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('detail rejects with UNAUTHORIZED when activeAdminUser is null', async () => {
    const caller = makeCaller(null);
    await expect(caller.detail({ id: 1 })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('kpiStats rejects with UNAUTHORIZED when activeAdminUser is null', async () => {
    const caller = makeCaller(null);
    await expect(caller.kpiStats()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });
});

// ── list ───────────────────────────────────────────────────────────────────

describe('list', () => {
  it('returns items and total with default pagination', async () => {
    mockDailyTaskFindMany.mockResolvedValueOnce([MOCK_LIST_ITEM]);
    mockDailyTaskCount.mockResolvedValueOnce(1);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.list({});
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.items[0]).toMatchObject({ id: 1, accountId: 100, agentId: 'DailyTaskAgent' });
    // admin 默认查全表不漏行：where 不含 accountId 键
    const whereArg = mockDailyTaskFindMany.mock.calls[0]?.[0]?.where;
    expect(whereArg).not.toHaveProperty('accountId');
  });

  it('returns empty items when no records', async () => {
    mockDailyTaskFindMany.mockResolvedValueOnce([]);
    mockDailyTaskCount.mockResolvedValueOnce(0);
    const caller = makeCaller(ADMIN_USER);
    const result = await caller.list({});
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('applies accountId filter (passes it to where clause)', async () => {
    mockDailyTaskFindMany.mockResolvedValueOnce([MOCK_LIST_ITEM]);
    mockDailyTaskCount.mockResolvedValueOnce(1);
    const caller = makeCaller(SUPER_ADMIN);
    await caller.list({ accountId: 100 });
    const whereArg = mockDailyTaskFindMany.mock.calls[0]?.[0]?.where;
    expect(whereArg).toMatchObject({ accountId: 100 });
  });

  it('applies agentId filter', async () => {
    mockDailyTaskFindMany.mockResolvedValueOnce([]);
    mockDailyTaskCount.mockResolvedValueOnce(0);
    const caller = makeCaller(SUPER_ADMIN);
    await caller.list({ agentId: 'DailyTaskAgent' });
    const whereArg = mockDailyTaskFindMany.mock.calls[0]?.[0]?.where;
    expect(whereArg).toMatchObject({ agentId: 'DailyTaskAgent' });
  });

  it('applies isFallback filter', async () => {
    mockDailyTaskFindMany.mockResolvedValueOnce([]);
    mockDailyTaskCount.mockResolvedValueOnce(0);
    const caller = makeCaller(SUPER_ADMIN);
    await caller.list({ isFallback: true });
    const whereArg = mockDailyTaskFindMany.mock.calls[0]?.[0]?.where;
    expect(whereArg).toMatchObject({ isFallback: true });
  });

  it('uses correct skip for page 2', async () => {
    mockDailyTaskFindMany.mockResolvedValueOnce([]);
    mockDailyTaskCount.mockResolvedValueOnce(30);
    const caller = makeCaller(SUPER_ADMIN);
    await caller.list({ page: 2, pageSize: 10 });
    const callArg = mockDailyTaskFindMany.mock.calls[0]?.[0];
    expect(callArg?.skip).toBe(10);
    expect(callArg?.take).toBe(10);
  });

  it('returns page and pageSize in response', async () => {
    mockDailyTaskFindMany.mockResolvedValueOnce([]);
    mockDailyTaskCount.mockResolvedValueOnce(0);
    const caller = makeCaller(ADMIN_USER);
    const result = await caller.list({ page: 3, pageSize: 5 });
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(5);
  });

  it('orders by taskDate desc', async () => {
    mockDailyTaskFindMany.mockResolvedValueOnce([]);
    mockDailyTaskCount.mockResolvedValueOnce(0);
    const caller = makeCaller(SUPER_ADMIN);
    await caller.list({});
    const callArg = mockDailyTaskFindMany.mock.calls[0]?.[0];
    expect(callArg?.orderBy).toEqual({ taskDate: 'desc' });
  });

  it('list select does NOT include tasks field', async () => {
    mockDailyTaskFindMany.mockResolvedValueOnce([]);
    mockDailyTaskCount.mockResolvedValueOnce(0);
    const caller = makeCaller(SUPER_ADMIN);
    await caller.list({});
    const callArg = mockDailyTaskFindMany.mock.calls[0]?.[0];
    expect(callArg?.select?.tasks).toBeUndefined();
  });

  it('applies dateFrom/dateTo filter — passes correct gte/lte to where.taskDate', async () => {
    mockDailyTaskFindMany.mockResolvedValueOnce([]);
    mockDailyTaskCount.mockResolvedValueOnce(0);
    const caller = makeCaller(SUPER_ADMIN);
    await caller.list({ dateFrom: '2026-01-01', dateTo: '2026-01-31' });
    const whereArg = mockDailyTaskFindMany.mock.calls[0]?.[0]?.where;
    // taskDate 是 @db.Date 列 — 直接用 date 字符串，不追加时分秒(否则非 UTC 环境多捞一天)
    expect(whereArg?.taskDate?.gte).toEqual(new Date('2026-01-01'));
    expect(whereArg?.taskDate?.lte).toEqual(new Date('2026-01-31'));
  });

  it('list select does NOT include inputSnapshot or traceId (sensitive/snapshot fields)', async () => {
    mockDailyTaskFindMany.mockResolvedValueOnce([]);
    mockDailyTaskCount.mockResolvedValueOnce(0);
    const caller = makeCaller(SUPER_ADMIN);
    await caller.list({});
    const callArg = mockDailyTaskFindMany.mock.calls[0]?.[0];
    expect(callArg?.select?.inputSnapshot).toBeUndefined();
    expect(callArg?.select?.traceId).toBeUndefined();
  });
});

// ── detail ─────────────────────────────────────────────────────────────────

describe('detail', () => {
  it('returns full record including tasks JSON when found', async () => {
    mockDailyTaskFindUnique.mockResolvedValueOnce(MOCK_DETAIL_ITEM);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.detail({ id: 1 });
    expect(result).toMatchObject({
      id: 1,
      accountId: 100,
      agentId: 'DailyTaskAgent',
    });
    expect(result.tasks).toBeDefined();
    expect(Array.isArray(result.tasks)).toBe(true);
  });

  it('throws NOT_FOUND when record does not exist', async () => {
    mockDailyTaskFindUnique.mockResolvedValueOnce(null);
    const caller = makeCaller(SUPER_ADMIN);
    await expect(caller.detail({ id: 9999 })).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'daily_task_not_found',
    });
  });

  it('queries by correct id', async () => {
    mockDailyTaskFindUnique.mockResolvedValueOnce(MOCK_DETAIL_ITEM);
    const caller = makeCaller(ADMIN_USER);
    await caller.detail({ id: 42 });
    const whereArg = mockDailyTaskFindUnique.mock.calls[0]?.[0]?.where;
    expect(whereArg).toEqual({ id: 42 });
  });
});

// ── kpiStats ───────────────────────────────────────────────────────────────

describe('kpiStats', () => {
  it('returns correct shape with populated data', async () => {
    // count calls order: total, recentCount, fallbackCount
    mockDailyTaskCount
      .mockResolvedValueOnce(200) // total
      .mockResolvedValueOnce(30)  // recentCount (7d)
      .mockResolvedValueOnce(20); // fallbackCount
    mockDailyTaskAggregate.mockResolvedValueOnce({
      _sum: { completedCount: 400, totalCount: 800 },
    });
    mockDailyTaskGroupBy.mockResolvedValueOnce([
      { agentId: 'DailyTaskAgent', _count: { id: 180 } },
      { agentId: 'FallbackAgent', _count: { id: 20 } },
    ]);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.kpiStats();
    expect(result.total).toBe(200);
    expect(result.recentCount).toBe(30);
    expect(result.fallbackRate).toBeCloseTo(0.1); // 20/200
    expect(result.avgCompletionRate).toBeCloseTo(0.5); // 400/800
    expect(result.agentIdDistribution).toEqual({
      DailyTaskAgent: 180,
      FallbackAgent: 20,
    });
  });

  it('returns zeros when no records', async () => {
    mockDailyTaskCount
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);
    mockDailyTaskAggregate.mockResolvedValueOnce({
      _sum: { completedCount: null, totalCount: null },
    });
    mockDailyTaskGroupBy.mockResolvedValueOnce([]);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.kpiStats();
    expect(result.total).toBe(0);
    expect(result.recentCount).toBe(0);
    expect(result.fallbackRate).toBe(0);
    expect(result.avgCompletionRate).toBe(0); // no divide-by-zero
    expect(result.agentIdDistribution).toEqual({});
  });

  it('avgCompletionRate does not divide by zero when totalCount sum is 0', async () => {
    mockDailyTaskCount
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0);
    mockDailyTaskAggregate.mockResolvedValueOnce({
      _sum: { completedCount: 0, totalCount: 0 },
    });
    mockDailyTaskGroupBy.mockResolvedValueOnce([]);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.kpiStats();
    // Must not throw and must return 0 (not NaN or Infinity)
    expect(result.avgCompletionRate).toBe(0);
    expect(Number.isFinite(result.avgCompletionRate)).toBe(true);
  });

  it('agentIdDistribution maps groupBy result correctly', async () => {
    mockDailyTaskCount
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(5);
    mockDailyTaskAggregate.mockResolvedValueOnce({
      _sum: { completedCount: 200, totalCount: 500 },
    });
    mockDailyTaskGroupBy.mockResolvedValueOnce([
      { agentId: 'DailyTaskAgent', _count: { id: 80 } },
      { agentId: 'CustomAgent', _count: { id: 20 } },
    ]);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.kpiStats();
    expect(result.agentIdDistribution['DailyTaskAgent']).toBe(80);
    expect(result.agentIdDistribution['CustomAgent']).toBe(20);
  });
});
