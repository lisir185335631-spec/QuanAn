// PRD-29 · history admin router unit tests
// list(返回 + 分页 + 过滤) · detail(命中 + NOT_FOUND) · kpiStats(总数/fallback/agentIdDist/scriptTypeDist)
// auth guard: makeCaller(null).list({}) 应 reject UNAUTHORIZED

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ──────────────────────────────────────────────────────────

const mockHistoryFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockHistoryFindUnique = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockHistoryCount = vi.hoisted(() => vi.fn().mockResolvedValue(0));
const mockHistoryGroupBy = vi.hoisted(() => vi.fn().mockResolvedValue([]));

// adminRLS middleware calls ctx.prisma.$transaction — must mock it.
// It sets adminPrisma = tx inside the transaction, so the tx object must also
// expose history so the router can use ctx.adminPrisma ?? ctx.prisma.
const mockPrismaTransaction = vi.hoisted(() =>
  vi.fn().mockImplementation((cb: (tx: unknown) => unknown) =>
    cb({
      $executeRawUnsafe: vi.fn().mockResolvedValue(undefined),
      history: {
        findMany: mockHistoryFindMany,
        findUnique: mockHistoryFindUnique,
        count: mockHistoryCount,
        groupBy: mockHistoryGroupBy,
      },
    }),
  ),
);

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: mockPrismaTransaction,
    history: {
      findMany: mockHistoryFindMany,
      findUnique: mockHistoryFindUnique,
      count: mockHistoryCount,
      groupBy: mockHistoryGroupBy,
    },
  },
}));

// ── Imports (after mocks) ──────────────────────────────────────────────────

import type { AdminLuciaSession, AdminLuciaUser } from '@/lib/auth/lucia-admin';
import { prisma } from '@/lib/prisma';
import type { AdminTRPCContext } from '@/server/context-admin';
import { historyAdminRouter } from '@/trpc/routers/admin/history';

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
  id: 'sess-history-test',
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
    traceId: 'trace-history-test',
    req: new Request('http://localhost/trpc/admin/history', {
      headers: { 'x-forwarded-for': '10.0.0.1', 'user-agent': 'test/1.0' },
    }),
    resHeaders: new Headers(),
    adminSession: MOCK_SESSION,
    activeAdminUser: user,
    ...overrides,
  };
}

function makeCaller(user: AdminLuciaUser | null, overrides: Partial<AdminTRPCContext> = {}) {
  return historyAdminRouter.createCaller(makeCtx(user, overrides));
}

const MOCK_LIST_ITEM = {
  id: 1,
  accountId: 100,
  agentId: 'CopywritingAgent',
  agentMode: 'default',
  sourceType: 'trending',
  inputSummary: '测试视频内容摘要',
  contentType: 'markdown',
  scriptType: 'short_video',
  elements: ['hook', 'body', 'cta'],
  isFallback: false,
  traceId: 'trace-hist-001',
  createdAt: new Date('2026-01-15T10:00:00Z'),
};

const MOCK_DETAIL_ITEM = {
  ...MOCK_LIST_ITEM,
  content: '# 视频脚本\n\n这是一段测试脚本内容。',
  updatedAt: new Date('2026-01-15T10:05:00Z'),
};

beforeEach(() => {
  vi.resetAllMocks();
  mockHistoryFindMany.mockResolvedValue([]);
  mockHistoryFindUnique.mockResolvedValue(null);
  mockHistoryCount.mockResolvedValue(0);
  mockHistoryGroupBy.mockResolvedValue([]);
  // Re-establish $transaction after resetAllMocks
  mockPrismaTransaction.mockImplementation((cb: (tx: unknown) => unknown) =>
    cb({
      $executeRawUnsafe: vi.fn().mockResolvedValue(undefined),
      history: {
        findMany: mockHistoryFindMany,
        findUnique: mockHistoryFindUnique,
        count: mockHistoryCount,
        groupBy: mockHistoryGroupBy,
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
    mockHistoryFindMany.mockResolvedValueOnce([MOCK_LIST_ITEM]);
    mockHistoryCount.mockResolvedValueOnce(1);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.list({});
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.items[0]).toMatchObject({ id: 1, accountId: 100, agentId: 'CopywritingAgent' });
  });

  it('returns empty items when no records', async () => {
    mockHistoryFindMany.mockResolvedValueOnce([]);
    mockHistoryCount.mockResolvedValueOnce(0);
    const caller = makeCaller(ADMIN_USER);
    const result = await caller.list({});
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('applies accountId filter (passes it to where clause)', async () => {
    mockHistoryFindMany.mockResolvedValueOnce([MOCK_LIST_ITEM]);
    mockHistoryCount.mockResolvedValueOnce(1);
    const caller = makeCaller(SUPER_ADMIN);
    await caller.list({ accountId: 100 });
    const whereArg = mockHistoryFindMany.mock.calls[0]?.[0]?.where;
    expect(whereArg).toMatchObject({ accountId: 100 });
  });

  it('applies agentId filter', async () => {
    mockHistoryFindMany.mockResolvedValueOnce([]);
    mockHistoryCount.mockResolvedValueOnce(0);
    const caller = makeCaller(SUPER_ADMIN);
    await caller.list({ agentId: 'CopywritingAgent' });
    const whereArg = mockHistoryFindMany.mock.calls[0]?.[0]?.where;
    expect(whereArg).toMatchObject({ agentId: 'CopywritingAgent' });
  });

  it('applies scriptType filter', async () => {
    mockHistoryFindMany.mockResolvedValueOnce([]);
    mockHistoryCount.mockResolvedValueOnce(0);
    const caller = makeCaller(SUPER_ADMIN);
    await caller.list({ scriptType: 'short_video' });
    const whereArg = mockHistoryFindMany.mock.calls[0]?.[0]?.where;
    expect(whereArg).toMatchObject({ scriptType: 'short_video' });
  });

  it('applies sourceType filter', async () => {
    mockHistoryFindMany.mockResolvedValueOnce([]);
    mockHistoryCount.mockResolvedValueOnce(0);
    const caller = makeCaller(SUPER_ADMIN);
    await caller.list({ sourceType: 'trending' });
    const whereArg = mockHistoryFindMany.mock.calls[0]?.[0]?.where;
    expect(whereArg).toMatchObject({ sourceType: 'trending' });
  });

  it('applies isFallback filter', async () => {
    mockHistoryFindMany.mockResolvedValueOnce([]);
    mockHistoryCount.mockResolvedValueOnce(0);
    const caller = makeCaller(SUPER_ADMIN);
    await caller.list({ isFallback: true });
    const whereArg = mockHistoryFindMany.mock.calls[0]?.[0]?.where;
    expect(whereArg).toMatchObject({ isFallback: true });
  });

  it('uses correct skip for page 2', async () => {
    mockHistoryFindMany.mockResolvedValueOnce([]);
    mockHistoryCount.mockResolvedValueOnce(30);
    const caller = makeCaller(SUPER_ADMIN);
    await caller.list({ page: 2, pageSize: 10 });
    const callArg = mockHistoryFindMany.mock.calls[0]?.[0];
    expect(callArg?.skip).toBe(10);
    expect(callArg?.take).toBe(10);
  });

  it('returns page and pageSize in response', async () => {
    mockHistoryFindMany.mockResolvedValueOnce([]);
    mockHistoryCount.mockResolvedValueOnce(0);
    const caller = makeCaller(ADMIN_USER);
    const result = await caller.list({ page: 3, pageSize: 5 });
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(5);
  });

  it('orders by createdAt desc', async () => {
    mockHistoryFindMany.mockResolvedValueOnce([]);
    mockHistoryCount.mockResolvedValueOnce(0);
    const caller = makeCaller(SUPER_ADMIN);
    await caller.list({});
    const callArg = mockHistoryFindMany.mock.calls[0]?.[0];
    expect(callArg?.orderBy).toEqual({ createdAt: 'desc' });
  });

  it('list select does NOT include content field', async () => {
    mockHistoryFindMany.mockResolvedValueOnce([]);
    mockHistoryCount.mockResolvedValueOnce(0);
    const caller = makeCaller(SUPER_ADMIN);
    await caller.list({});
    const callArg = mockHistoryFindMany.mock.calls[0]?.[0];
    expect(callArg?.select?.content).toBeUndefined();
  });

  it('applies dateFrom/dateTo filter — passes correct gte/lte to where.createdAt', async () => {
    mockHistoryFindMany.mockResolvedValueOnce([]);
    mockHistoryCount.mockResolvedValueOnce(0);
    const caller = makeCaller(SUPER_ADMIN);
    await caller.list({ dateFrom: '2026-01-01', dateTo: '2026-01-31' });
    const whereArg = mockHistoryFindMany.mock.calls[0]?.[0]?.where;
    expect(whereArg?.createdAt?.gte).toEqual(new Date('2026-01-01'));
    expect(whereArg?.createdAt?.lte).toEqual(new Date('2026-01-31T23:59:59.999Z'));
  });
});

// ── detail ─────────────────────────────────────────────────────────────────

describe('detail', () => {
  it('returns full record including content when found', async () => {
    mockHistoryFindUnique.mockResolvedValueOnce(MOCK_DETAIL_ITEM);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.detail({ id: 1 });
    expect(result).toMatchObject({
      id: 1,
      accountId: 100,
      agentId: 'CopywritingAgent',
      traceId: 'trace-hist-001',
    });
    expect(result.content).toBe('# 视频脚本\n\n这是一段测试脚本内容。');
  });

  it('throws NOT_FOUND when record does not exist', async () => {
    mockHistoryFindUnique.mockResolvedValueOnce(null);
    const caller = makeCaller(SUPER_ADMIN);
    await expect(caller.detail({ id: 9999 })).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'history_not_found',
    });
  });

  it('queries by correct id', async () => {
    mockHistoryFindUnique.mockResolvedValueOnce(MOCK_DETAIL_ITEM);
    const caller = makeCaller(ADMIN_USER);
    await caller.detail({ id: 42 });
    const whereArg = mockHistoryFindUnique.mock.calls[0]?.[0]?.where;
    expect(whereArg).toEqual({ id: 42 });
  });
});

// ── kpiStats ───────────────────────────────────────────────────────────────

describe('kpiStats', () => {
  it('returns correct shape with populated data', async () => {
    // count calls: total, recentCount, fallbackCount
    mockHistoryCount
      .mockResolvedValueOnce(500)  // total
      .mockResolvedValueOnce(80)   // recentCount (7d)
      .mockResolvedValueOnce(50);  // fallbackCount
    mockHistoryGroupBy
      .mockResolvedValueOnce([
        { agentId: 'CopywritingAgent', _count: { id: 200 } },
        { agentId: 'VideoAgent', _count: { id: 150 } },
        { agentId: 'TrendingAgent', _count: { id: 100 } },
      ])
      .mockResolvedValueOnce([
        { scriptType: 'short_video', _count: { id: 250 } },
        { scriptType: 'long_article', _count: { id: 100 } },
        { scriptType: null, _count: { id: 150 } },
      ]);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.kpiStats();
    expect(result.total).toBe(500);
    expect(result.recentCount).toBe(80);
    // fallbackRate = round(50/500 * 1000) / 10 = round(100) / 10 = 10
    expect(result.fallbackRate).toBe(10);
    expect(result.agentIdDistribution).toEqual({
      CopywritingAgent: 200,
      VideoAgent: 150,
      TrendingAgent: 100,
    });
    // null scriptType should be excluded from distribution
    expect(result.scriptTypeDistribution).toEqual({
      short_video: 250,
      long_article: 100,
    });
  });

  it('fallbackRate=0 when total=0 (no divide-by-zero)', async () => {
    mockHistoryCount
      .mockResolvedValueOnce(0)  // total
      .mockResolvedValueOnce(0)  // recentCount
      .mockResolvedValueOnce(0); // fallbackCount
    mockHistoryGroupBy
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.kpiStats();
    expect(result.total).toBe(0);
    expect(result.fallbackRate).toBe(0);
    expect(result.agentIdDistribution).toEqual({});
    expect(result.scriptTypeDistribution).toEqual({});
  });

  it('fallbackRate is rounded to 1 decimal place', async () => {
    mockHistoryCount
      .mockResolvedValueOnce(3)   // total
      .mockResolvedValueOnce(1)   // recentCount
      .mockResolvedValueOnce(1);  // fallbackCount
    mockHistoryGroupBy
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.kpiStats();
    // 1/3 * 100 = 33.333... → round(33.333... * 10) / 10 = 33.3
    expect(result.fallbackRate).toBe(33.3);
  });

  it('agentIdDistribution maps groupBy result correctly', async () => {
    mockHistoryCount
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(5);
    mockHistoryGroupBy
      .mockResolvedValueOnce([
        { agentId: 'CopywritingAgent', _count: { id: 60 } },
        { agentId: 'VideoProductionAgent', _count: { id: 40 } },
      ])
      .mockResolvedValueOnce([]);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.kpiStats();
    expect(result.agentIdDistribution['CopywritingAgent']).toBe(60);
    expect(result.agentIdDistribution['VideoProductionAgent']).toBe(40);
  });
});
