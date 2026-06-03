// PRD-29 · stepData router unit tests
// list(返回 + 分页 + 过滤) · detail(命中 + NOT_FOUND) · kpiStats(总数/fallback/avgTokens/stepKeyDist; total=0 时 fallbackRate=0)

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ──────────────────────────────────────────────────────────

const mockStepDataFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockStepDataFindUnique = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockStepDataCount = vi.hoisted(() => vi.fn().mockResolvedValue(0));
const mockStepDataAggregate = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ _avg: { tokensUsed: null } }),
);
const mockStepDataGroupBy = vi.hoisted(() => vi.fn().mockResolvedValue([]));

// adminRLS middleware calls ctx.prisma.$transaction — must mock it.
// It sets adminPrisma = tx inside the transaction, so the tx object must also
// expose stepData so the router can use ctx.adminPrisma ?? ctx.prisma.
const mockPrismaTransaction = vi.hoisted(() =>
  vi.fn().mockImplementation((cb: (tx: unknown) => unknown) =>
    cb({
      $executeRawUnsafe: vi.fn().mockResolvedValue(undefined),
      stepData: {
        findMany: mockStepDataFindMany,
        findUnique: mockStepDataFindUnique,
        count: mockStepDataCount,
        aggregate: mockStepDataAggregate,
        groupBy: mockStepDataGroupBy,
      },
    }),
  ),
);

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: mockPrismaTransaction,
    stepData: {
      findMany: mockStepDataFindMany,
      findUnique: mockStepDataFindUnique,
      count: mockStepDataCount,
      aggregate: mockStepDataAggregate,
      groupBy: mockStepDataGroupBy,
    },
  },
}));

// ── Imports (after mocks) ──────────────────────────────────────────────────

import type { AdminLuciaSession, AdminLuciaUser } from '@/lib/auth/lucia-admin';
import { prisma } from '@/lib/prisma';
import type { AdminTRPCContext } from '@/server/context-admin';
import { stepDataRouter } from '@/trpc/routers/admin/stepData';

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
  id: 'sess-stepdata-test',
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
    traceId: 'trace-stepdata-test',
    req: new Request('http://localhost/trpc/admin/stepData', {
      headers: { 'x-forwarded-for': '10.0.0.1', 'user-agent': 'test/1.0' },
    }),
    resHeaders: new Headers(),
    adminSession: MOCK_SESSION,
    activeAdminUser: user,
    ...overrides,
  };
}

function makeCaller(user: AdminLuciaUser | null, overrides: Partial<AdminTRPCContext> = {}) {
  return stepDataRouter.createCaller(makeCtx(user, overrides));
}

const MOCK_LIST_ITEM = {
  id: 1,
  accountId: 100,
  stepKey: 'step3b',
  status: 'completed',
  agentId: 'step3b-agent-v1',
  isFallback: false,
  modelUsed: 'claude-sonnet',
  tokensUsed: 800,
  durationMs: 2200,
  updatedAt: new Date('2026-01-15T10:00:00Z'),
};

const MOCK_DETAIL_ITEM = {
  ...MOCK_LIST_ITEM,
  traceId: 'trace-stepdata-001',
  inputs: { topic: '视频内容', style: 'casual' },
  result: { script: '脚本内容', tags: ['短视频', '娱乐'] },
  createdAt: new Date('2026-01-15T09:55:00Z'),
};

beforeEach(() => {
  vi.resetAllMocks();
  mockStepDataFindMany.mockResolvedValue([]);
  mockStepDataFindUnique.mockResolvedValue(null);
  mockStepDataCount.mockResolvedValue(0);
  mockStepDataAggregate.mockResolvedValue({ _avg: { tokensUsed: null } });
  mockStepDataGroupBy.mockResolvedValue([]);
  // Re-establish $transaction after resetAllMocks
  mockPrismaTransaction.mockImplementation((cb: (tx: unknown) => unknown) =>
    cb({
      $executeRawUnsafe: vi.fn().mockResolvedValue(undefined),
      stepData: {
        findMany: mockStepDataFindMany,
        findUnique: mockStepDataFindUnique,
        count: mockStepDataCount,
        aggregate: mockStepDataAggregate,
        groupBy: mockStepDataGroupBy,
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
});

// ── list ───────────────────────────────────────────────────────────────────

describe('list', () => {
  it('returns items and total with default pagination', async () => {
    mockStepDataFindMany.mockResolvedValueOnce([MOCK_LIST_ITEM]);
    mockStepDataCount.mockResolvedValueOnce(1);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.list({});
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.items[0]).toMatchObject({ id: 1, accountId: 100, stepKey: 'step3b' });
  });

  it('returns empty items when no records', async () => {
    mockStepDataFindMany.mockResolvedValueOnce([]);
    mockStepDataCount.mockResolvedValueOnce(0);
    const caller = makeCaller(ADMIN_USER);
    const result = await caller.list({});
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('applies accountId filter (passes it to where clause)', async () => {
    mockStepDataFindMany.mockResolvedValueOnce([MOCK_LIST_ITEM]);
    mockStepDataCount.mockResolvedValueOnce(1);
    const caller = makeCaller(SUPER_ADMIN);
    await caller.list({ accountId: 100 });
    const whereArg = mockStepDataFindMany.mock.calls[0]?.[0]?.where;
    expect(whereArg).toMatchObject({ accountId: 100 });
  });

  it('applies stepKey filter', async () => {
    mockStepDataFindMany.mockResolvedValueOnce([]);
    mockStepDataCount.mockResolvedValueOnce(0);
    const caller = makeCaller(SUPER_ADMIN);
    await caller.list({ stepKey: 'step3b' });
    const whereArg = mockStepDataFindMany.mock.calls[0]?.[0]?.where;
    expect(whereArg).toMatchObject({ stepKey: 'step3b' });
  });

  it('applies status filter', async () => {
    mockStepDataFindMany.mockResolvedValueOnce([]);
    mockStepDataCount.mockResolvedValueOnce(0);
    const caller = makeCaller(SUPER_ADMIN);
    await caller.list({ status: 'completed' });
    const whereArg = mockStepDataFindMany.mock.calls[0]?.[0]?.where;
    expect(whereArg).toMatchObject({ status: 'completed' });
  });

  it('uses correct skip for page 2', async () => {
    mockStepDataFindMany.mockResolvedValueOnce([]);
    mockStepDataCount.mockResolvedValueOnce(30);
    const caller = makeCaller(SUPER_ADMIN);
    await caller.list({ page: 2, pageSize: 10 });
    const callArg = mockStepDataFindMany.mock.calls[0]?.[0];
    expect(callArg?.skip).toBe(10);
    expect(callArg?.take).toBe(10);
  });

  it('returns page and pageSize in response', async () => {
    mockStepDataFindMany.mockResolvedValueOnce([]);
    mockStepDataCount.mockResolvedValueOnce(0);
    const caller = makeCaller(ADMIN_USER);
    const result = await caller.list({ page: 3, pageSize: 5 });
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(5);
  });

  it('orders by updatedAt desc', async () => {
    mockStepDataFindMany.mockResolvedValueOnce([]);
    mockStepDataCount.mockResolvedValueOnce(0);
    const caller = makeCaller(SUPER_ADMIN);
    await caller.list({});
    const callArg = mockStepDataFindMany.mock.calls[0]?.[0];
    expect(callArg?.orderBy).toEqual({ updatedAt: 'desc' });
  });
});

// ── detail ─────────────────────────────────────────────────────────────────

describe('detail', () => {
  it('returns full record when found', async () => {
    mockStepDataFindUnique.mockResolvedValueOnce(MOCK_DETAIL_ITEM);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.detail({ id: 1 });
    expect(result).toMatchObject({
      id: 1,
      accountId: 100,
      stepKey: 'step3b',
      status: 'completed',
      traceId: 'trace-stepdata-001',
    });
    expect(result.inputs).toEqual({ topic: '视频内容', style: 'casual' });
    expect(result.result).toEqual({ script: '脚本内容', tags: ['短视频', '娱乐'] });
  });

  it('throws NOT_FOUND when record does not exist', async () => {
    mockStepDataFindUnique.mockResolvedValueOnce(null);
    const caller = makeCaller(SUPER_ADMIN);
    await expect(caller.detail({ id: 9999 })).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'step_data_not_found',
    });
  });

  it('queries by correct id', async () => {
    mockStepDataFindUnique.mockResolvedValueOnce(MOCK_DETAIL_ITEM);
    const caller = makeCaller(ADMIN_USER);
    await caller.detail({ id: 42 });
    const whereArg = mockStepDataFindUnique.mock.calls[0]?.[0]?.where;
    expect(whereArg).toEqual({ id: 42 });
  });
});

// ── kpiStats ───────────────────────────────────────────────────────────────

describe('kpiStats', () => {
  it('returns correct shape with populated data', async () => {
    // count calls: total, recentCount, fallbackCount
    mockStepDataCount
      .mockResolvedValueOnce(200)  // total
      .mockResolvedValueOnce(30)   // recentCount (7d)
      .mockResolvedValueOnce(20);  // fallbackCount
    mockStepDataAggregate.mockResolvedValueOnce({ _avg: { tokensUsed: 950.5 } });
    mockStepDataGroupBy.mockResolvedValueOnce([
      { stepKey: 'step3b', _count: { id: 80 } },
      { stepKey: 'step4', _count: { id: 60 } },
      { stepKey: 'step3', _count: { id: 60 } },
    ]);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.kpiStats();
    expect(result.total).toBe(200);
    expect(result.recentCount).toBe(30);
    // fallbackRate = round(20/200 * 1000) / 10 = round(100) / 10 = 10
    expect(result.fallbackRate).toBe(10);
    expect(result.avgTokens).toBe(951); // Math.round(950.5)
    expect(result.stepKeyDistribution).toEqual({ step3b: 80, step4: 60, step3: 60 });
  });

  it('fallbackRate=0 when total=0 (no divide-by-zero)', async () => {
    mockStepDataCount
      .mockResolvedValueOnce(0)  // total
      .mockResolvedValueOnce(0)  // recentCount
      .mockResolvedValueOnce(0); // fallbackCount
    mockStepDataAggregate.mockResolvedValueOnce({ _avg: { tokensUsed: null } });
    mockStepDataGroupBy.mockResolvedValueOnce([]);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.kpiStats();
    expect(result.total).toBe(0);
    expect(result.fallbackRate).toBe(0);
    expect(result.avgTokens).toBe(0);
    expect(result.stepKeyDistribution).toEqual({});
  });

  it('avgTokens falls back to 0 when _avg.tokensUsed is null', async () => {
    mockStepDataCount
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1);
    mockStepDataAggregate.mockResolvedValueOnce({ _avg: { tokensUsed: null } });
    mockStepDataGroupBy.mockResolvedValueOnce([]);
    const caller = makeCaller(ADMIN_USER);
    const result = await caller.kpiStats();
    expect(result.avgTokens).toBe(0);
  });

  it('fallbackRate is rounded to 1 decimal place', async () => {
    mockStepDataCount
      .mockResolvedValueOnce(3)   // total
      .mockResolvedValueOnce(1)   // recentCount
      .mockResolvedValueOnce(1);  // fallbackCount
    mockStepDataAggregate.mockResolvedValueOnce({ _avg: { tokensUsed: 600 } });
    mockStepDataGroupBy.mockResolvedValueOnce([]);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.kpiStats();
    // 1/3 * 100 = 33.333... → round(33.333... * 10) / 10 = 33.3
    expect(result.fallbackRate).toBe(33.3);
  });

  it('stepKeyDistribution maps groupBy result correctly', async () => {
    mockStepDataCount
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(5);
    mockStepDataAggregate.mockResolvedValueOnce({ _avg: { tokensUsed: 1000 } });
    mockStepDataGroupBy.mockResolvedValueOnce([
      { stepKey: 'step1', _count: { id: 45 } },
      { stepKey: 'step3b', _count: { id: 55 } },
    ]);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.kpiStats();
    expect(result.stepKeyDistribution['step1']).toBe(45);
    expect(result.stepKeyDistribution['step3b']).toBe(55);
  });
});
