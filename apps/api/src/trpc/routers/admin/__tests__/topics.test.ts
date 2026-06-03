// PRD-29 · topics admin router unit tests
// list(返回 + 分页 + 过滤) · detail(命中 + NOT_FOUND) · kpiStats(总数/sourceTypeDist/categoryDist/recentCount)
// auth guard: makeCaller(null).list({}) 应 reject UNAUTHORIZED

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ──────────────────────────────────────────────────────────

const mockTopicFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockTopicFindUnique = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockTopicCount = vi.hoisted(() => vi.fn().mockResolvedValue(0));
const mockTopicGroupBy = vi.hoisted(() => vi.fn().mockResolvedValue([]));

// adminRLS middleware calls ctx.prisma.$transaction — must mock it.
// It sets adminPrisma = tx inside the transaction, so the tx object must also
// expose topic so the router can use ctx.adminPrisma ?? ctx.prisma.
const mockPrismaTransaction = vi.hoisted(() =>
  vi.fn().mockImplementation((cb: (tx: unknown) => unknown) =>
    cb({
      $executeRawUnsafe: vi.fn().mockResolvedValue(undefined),
      topic: {
        findMany: mockTopicFindMany,
        findUnique: mockTopicFindUnique,
        count: mockTopicCount,
        groupBy: mockTopicGroupBy,
      },
    }),
  ),
);

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: mockPrismaTransaction,
    topic: {
      findMany: mockTopicFindMany,
      findUnique: mockTopicFindUnique,
      count: mockTopicCount,
      groupBy: mockTopicGroupBy,
    },
  },
}));

// ── Imports (after mocks) ──────────────────────────────────────────────────

import type { AdminLuciaSession, AdminLuciaUser } from '@/lib/auth/lucia-admin';
import { prisma } from '@/lib/prisma';
import type { AdminTRPCContext } from '@/server/context-admin';
import { topicsAdminRouter } from '@/trpc/routers/admin/topics';

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
  id: 'sess-topics-test',
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
    traceId: 'trace-topics-test',
    req: new Request('http://localhost/trpc/admin/topics', {
      headers: { 'x-forwarded-for': '10.0.0.1', 'user-agent': 'test/1.0' },
    }),
    resHeaders: new Headers(),
    adminSession: MOCK_SESSION,
    activeAdminUser: user,
    ...overrides,
  };
}

function makeCaller(user: AdminLuciaUser | null, overrides: Partial<AdminTRPCContext> = {}) {
  return topicsAdminRouter.createCaller(makeCtx(user, overrides));
}

const MOCK_LIST_ITEM = {
  id: 1,
  accountId: 100,
  title: '10个让你脱颖而出的职场技巧',
  category: '职场',
  platform: '小红书',
  sourceType: 'manual',
  createdAt: new Date('2026-01-15T10:00:00Z').toISOString(),
};

const MOCK_DETAIL_ITEM = {
  ...MOCK_LIST_ITEM,
  hook: '你知道为什么大多数人在职场中止步不前吗？',
  structure: null,
  formula: null,
  presentStyle: null,
  difficulty: 'medium',
  viralPotential: 'high',
  logicType: 'listicle',
  sourceTrendingId: null,
  userTags: ['职场', '干货'],
  isUsed: false,
  usedAt: null,
  generatedHistoryId: null,
  traceId: 'trace-topic-001',
};

beforeEach(() => {
  vi.resetAllMocks();
  mockTopicFindMany.mockResolvedValue([]);
  mockTopicFindUnique.mockResolvedValue(null);
  mockTopicCount.mockResolvedValue(0);
  mockTopicGroupBy.mockResolvedValue([]);
  // Re-establish $transaction after resetAllMocks
  mockPrismaTransaction.mockImplementation((cb: (tx: unknown) => unknown) =>
    cb({
      $executeRawUnsafe: vi.fn().mockResolvedValue(undefined),
      topic: {
        findMany: mockTopicFindMany,
        findUnique: mockTopicFindUnique,
        count: mockTopicCount,
        groupBy: mockTopicGroupBy,
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
    mockTopicFindMany.mockResolvedValueOnce([MOCK_LIST_ITEM]);
    mockTopicCount.mockResolvedValueOnce(1);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.list({});
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.items[0]).toMatchObject({ id: 1, accountId: 100, title: '10个让你脱颖而出的职场技巧' });
    // admin 默认查全表不漏行：where 不含 sourceType 键
    const whereArg = mockTopicFindMany.mock.calls[0]?.[0]?.where;
    expect(whereArg).not.toHaveProperty('sourceType');
  });

  it('returns empty items when no records', async () => {
    mockTopicFindMany.mockResolvedValueOnce([]);
    mockTopicCount.mockResolvedValueOnce(0);
    const caller = makeCaller(ADMIN_USER);
    const result = await caller.list({});
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('applies accountId filter (passes it to where clause)', async () => {
    mockTopicFindMany.mockResolvedValueOnce([MOCK_LIST_ITEM]);
    mockTopicCount.mockResolvedValueOnce(1);
    const caller = makeCaller(SUPER_ADMIN);
    await caller.list({ accountId: 100 });
    const whereArg = mockTopicFindMany.mock.calls[0]?.[0]?.where;
    expect(whereArg).toMatchObject({ accountId: 100 });
  });

  it('applies sourceType filter', async () => {
    mockTopicFindMany.mockResolvedValueOnce([]);
    mockTopicCount.mockResolvedValueOnce(0);
    const caller = makeCaller(SUPER_ADMIN);
    await caller.list({ sourceType: 'manual' });
    const whereArg = mockTopicFindMany.mock.calls[0]?.[0]?.where;
    expect(whereArg).toMatchObject({ sourceType: 'manual' });
  });

  it('applies category filter', async () => {
    mockTopicFindMany.mockResolvedValueOnce([]);
    mockTopicCount.mockResolvedValueOnce(0);
    const caller = makeCaller(SUPER_ADMIN);
    await caller.list({ category: '职场' });
    const whereArg = mockTopicFindMany.mock.calls[0]?.[0]?.where;
    expect(whereArg).toMatchObject({ category: '职场' });
  });

  it('applies platform filter', async () => {
    mockTopicFindMany.mockResolvedValueOnce([]);
    mockTopicCount.mockResolvedValueOnce(0);
    const caller = makeCaller(SUPER_ADMIN);
    await caller.list({ platform: '小红书' });
    const whereArg = mockTopicFindMany.mock.calls[0]?.[0]?.where;
    expect(whereArg).toMatchObject({ platform: '小红书' });
  });

  it('uses correct skip for page 2', async () => {
    mockTopicFindMany.mockResolvedValueOnce([]);
    mockTopicCount.mockResolvedValueOnce(30);
    const caller = makeCaller(SUPER_ADMIN);
    await caller.list({ page: 2, pageSize: 10 });
    const callArg = mockTopicFindMany.mock.calls[0]?.[0];
    expect(callArg?.skip).toBe(10);
    expect(callArg?.take).toBe(10);
  });

  it('returns page and pageSize in response', async () => {
    mockTopicFindMany.mockResolvedValueOnce([]);
    mockTopicCount.mockResolvedValueOnce(0);
    const caller = makeCaller(ADMIN_USER);
    const result = await caller.list({ page: 3, pageSize: 5 });
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(5);
  });

  it('orders by createdAt desc', async () => {
    mockTopicFindMany.mockResolvedValueOnce([]);
    mockTopicCount.mockResolvedValueOnce(0);
    const caller = makeCaller(SUPER_ADMIN);
    await caller.list({});
    const callArg = mockTopicFindMany.mock.calls[0]?.[0];
    expect(callArg?.orderBy).toEqual({ createdAt: 'desc' });
  });

  it('list select does NOT include hook field', async () => {
    mockTopicFindMany.mockResolvedValueOnce([]);
    mockTopicCount.mockResolvedValueOnce(0);
    const caller = makeCaller(SUPER_ADMIN);
    await caller.list({});
    const callArg = mockTopicFindMany.mock.calls[0]?.[0];
    expect(callArg?.select?.hook).toBeUndefined();
  });

  it('applies dateFrom/dateTo filter — passes correct gte/lte to where.createdAt', async () => {
    mockTopicFindMany.mockResolvedValueOnce([]);
    mockTopicCount.mockResolvedValueOnce(0);
    const caller = makeCaller(SUPER_ADMIN);
    await caller.list({ dateFrom: '2026-01-01', dateTo: '2026-01-31' });
    const whereArg = mockTopicFindMany.mock.calls[0]?.[0]?.where;
    expect(whereArg?.createdAt?.gte).toEqual(new Date('2026-01-01'));
    expect(whereArg?.createdAt?.lte).toEqual(new Date('2026-01-31T23:59:59.999Z'));
  });
});

// ── detail ─────────────────────────────────────────────────────────────────

describe('detail', () => {
  it('returns full record including hook when found', async () => {
    mockTopicFindUnique.mockResolvedValueOnce(MOCK_DETAIL_ITEM);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.detail({ id: 1 });
    expect(result).toMatchObject({
      id: 1,
      accountId: 100,
      title: '10个让你脱颖而出的职场技巧',
      traceId: 'trace-topic-001',
    });
    expect(result.hook).toBe('你知道为什么大多数人在职场中止步不前吗？');
  });

  it('throws NOT_FOUND when record does not exist', async () => {
    mockTopicFindUnique.mockResolvedValueOnce(null);
    const caller = makeCaller(SUPER_ADMIN);
    await expect(caller.detail({ id: 9999 })).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'topic_not_found',
    });
  });

  it('queries by correct id', async () => {
    mockTopicFindUnique.mockResolvedValueOnce(MOCK_DETAIL_ITEM);
    const caller = makeCaller(ADMIN_USER);
    await caller.detail({ id: 42 });
    const whereArg = mockTopicFindUnique.mock.calls[0]?.[0]?.where;
    expect(whereArg).toEqual({ id: 42 });
  });
});

// ── kpiStats ───────────────────────────────────────────────────────────────

describe('kpiStats', () => {
  it('returns correct shape with populated data', async () => {
    // count calls: total, recentCount
    mockTopicCount
      .mockResolvedValueOnce(300)  // total
      .mockResolvedValueOnce(45);  // recentCount (7d)
    mockTopicGroupBy
      .mockResolvedValueOnce([
        { sourceType: 'manual', _count: { id: 180 } },
        { sourceType: 'ai_generated', _count: { id: 100 } },
        { sourceType: 'trending', _count: { id: 20 } },
      ])
      .mockResolvedValueOnce([
        { category: '职场', _count: { id: 120 } },
        { category: '美食', _count: { id: 80 } },
        { category: null, _count: { id: 100 } },
      ]);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.kpiStats();
    expect(result.total).toBe(300);
    expect(result.recentCount).toBe(45);
    expect(result.sourceTypeDistribution).toEqual({
      manual: 180,
      ai_generated: 100,
      trending: 20,
    });
    // null category should be excluded from distribution
    expect(result.categoryDistribution).toEqual({
      '职场': 120,
      '美食': 80,
    });
  });

  it('returns zeros and empty distributions when no records', async () => {
    mockTopicCount
      .mockResolvedValueOnce(0)   // total
      .mockResolvedValueOnce(0);  // recentCount
    mockTopicGroupBy
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.kpiStats();
    expect(result.total).toBe(0);
    expect(result.recentCount).toBe(0);
    expect(result.sourceTypeDistribution).toEqual({});
    expect(result.categoryDistribution).toEqual({});
  });

  it('sourceTypeDistribution maps groupBy result correctly', async () => {
    mockTopicCount
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(10);
    mockTopicGroupBy
      .mockResolvedValueOnce([
        { sourceType: 'manual', _count: { id: 60 } },
        { sourceType: 'ai_generated', _count: { id: 40 } },
      ])
      .mockResolvedValueOnce([]);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.kpiStats();
    expect(result.sourceTypeDistribution['manual']).toBe(60);
    expect(result.sourceTypeDistribution['ai_generated']).toBe(40);
  });

  it('null category is excluded from categoryDistribution', async () => {
    mockTopicCount
      .mockResolvedValueOnce(50)
      .mockResolvedValueOnce(5);
    mockTopicGroupBy
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { category: '健身', _count: { id: 30 } },
        { category: null, _count: { id: 20 } },
      ]);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.kpiStats();
    expect(result.categoryDistribution['健身']).toBe(30);
    expect(Object.keys(result.categoryDistribution)).not.toContain('null');
    expect(Object.keys(result.categoryDistribution)).toHaveLength(1);
  });
});
