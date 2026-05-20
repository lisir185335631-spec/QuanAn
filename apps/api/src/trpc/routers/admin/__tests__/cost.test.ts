// PRD-11 US-012 · cost router unit tests — 27 tests
// aggregate(4 dim × 3 groupBy + edge cases) / top10 / specialistBreakdown / alerts / exportCsv

import { Prisma } from '@prisma/client';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ──────────────────────────────────────────────────────────

const mockLogAdminAction = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockCostLogQueryRaw = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockCostLogGroupBy = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockCostLogCount = vi.hoisted(() => vi.fn().mockResolvedValue(0));
const mockCostLogFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockUserFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockPrismaTransaction = vi.hoisted(() =>
  vi.fn().mockImplementation((cb: (tx: unknown) => unknown) => cb({
    $executeRawUnsafe: vi.fn().mockResolvedValue(undefined),
    $queryRaw: mockCostLogQueryRaw,
    costLog: {
      groupBy: mockCostLogGroupBy,
      count: mockCostLogCount,
      findMany: mockCostLogFindMany,
    },
    user: { findMany: mockUserFindMany },
    adminAuditLog: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
    },
  }))
);

vi.mock('@/services/admin/admin-audit-service', () => ({
  logAdminAction: mockLogAdminAction,
}));

vi.mock('@/lib/prisma', () => {
  return {
    prisma: {
      $transaction: mockPrismaTransaction,
      $executeRawUnsafe: vi.fn().mockResolvedValue(undefined),
      $queryRaw: mockCostLogQueryRaw,
      costLog: {
        groupBy: mockCostLogGroupBy,
        count: mockCostLogCount,
        findMany: mockCostLogFindMany,
      },
      user: { findMany: mockUserFindMany },
      adminAuditLog: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({}),
      },
    },
  };
});

// ── Imports (after mocks) ──────────────────────────────────────────────────
import type { AdminLuciaSession, AdminLuciaUser } from '@/lib/auth/lucia-admin';
import { prisma } from '@/lib/prisma';
import type { AdminTRPCContext } from '@/server/context-admin';
import { costRouter } from '@/trpc/routers/admin/cost';



// ── Fixtures ───────────────────────────────────────────────────────────────

const SUPER_ADMIN: AdminLuciaUser = {
  id: 1, email: 'super@quanan.com', role: 'super_admin', isMock: true, isActive: true,
  allowedDomains: [],
};
const ADMIN_USER: AdminLuciaUser = {
  id: 2, email: 'admin@quanan.com', role: 'admin', isMock: true, isActive: true,
  allowedDomains: [],
};

const MOCK_SESSION: AdminLuciaSession = {
  id: 'sess-cost-test',
  expiresAt: new Date(Date.now() + 3_600_000),
  fresh: false,
} as AdminLuciaSession;

function makeCtx(user: AdminLuciaUser | null, overrides: Partial<AdminTRPCContext> = {}): AdminTRPCContext {
  return {
    prisma: prisma,
    adminPrisma: prisma,
    traceId: 'trace-cost-test',
    req: new Request('http://localhost/trpc/admin/cost', {
      headers: { 'x-forwarded-for': '10.0.0.1', 'user-agent': 'test/1.0' },
    }),
    resHeaders: new Headers(),
    adminSession: MOCK_SESSION,
    activeAdminUser: user,
    ...overrides,
  };
}

function makeCaller(user: AdminLuciaUser | null, overrides: Partial<AdminTRPCContext> = {}) {
  return costRouter.createCaller(makeCtx(user, overrides));
}

const START = new Date('2026-01-01T00:00:00Z');
const END = new Date('2026-03-01T00:00:00Z');

const MOCK_AGG_ROW = {
  time_bucket: new Date('2026-01-01T00:00:00Z'),
  dimension_value: '42',
  total_cost: '5.000000',
  call_count: BigInt(3),
};

beforeEach(() => {
  vi.resetAllMocks();
  // Re-establish default implementations after resetAllMocks wipes them
  mockLogAdminAction.mockResolvedValue(undefined);
  mockCostLogQueryRaw.mockResolvedValue([]);
  mockCostLogGroupBy.mockResolvedValue([]);
  mockCostLogCount.mockResolvedValue(0);
  mockCostLogFindMany.mockResolvedValue([]);
  mockUserFindMany.mockResolvedValue([]);
  mockPrismaTransaction.mockImplementation((cb: (tx: unknown) => unknown) =>
    cb({
      $executeRawUnsafe: vi.fn().mockResolvedValue(undefined),
      $queryRaw: mockCostLogQueryRaw,
      costLog: {
        groupBy: mockCostLogGroupBy,
        count: mockCostLogCount,
        findMany: mockCostLogFindMany,
      },
      user: { findMany: mockUserFindMany },
      adminAuditLog: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({}),
      },
    })
  );
});

// ── aggregate ─────────────────────────────────────────────────────────────

describe('aggregate', () => {
  it('dimension=user groupBy=day returns correct shape', async () => {
    mockCostLogQueryRaw.mockResolvedValueOnce([MOCK_AGG_ROW]);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.aggregate({ startDate: START, endDate: END, dimension: 'user', groupBy: 'day' });
    expect(result.aggregations).toHaveLength(1);
    expect(result.aggregations[0]).toMatchObject({
      dimensionValue: '42',
      totalCost: '5',
      callCount: 3,
    });
    expect(result.summary.totalCost).toBe('5');
  });

  it('dimension=specialist groupBy=week returns correct shape', async () => {
    mockCostLogQueryRaw.mockResolvedValueOnce([
      { ...MOCK_AGG_ROW, dimension_value: 'specialist-1', total_cost: '10.500000' },
    ]);
    const caller = makeCaller(ADMIN_USER);
    const result = await caller.aggregate({ startDate: START, endDate: END, dimension: 'specialist', groupBy: 'week' });
    expect(result.aggregations[0]?.dimensionValue).toBe('specialist-1');
    expect(result.aggregations[0]?.totalCost).toBe('10.5');
  });

  it('dimension=model groupBy=month returns correct shape', async () => {
    mockCostLogQueryRaw.mockResolvedValueOnce([
      { ...MOCK_AGG_ROW, dimension_value: 'claude-opus', total_cost: '2.100000' },
    ]);
    const caller = makeCaller(ADMIN_USER);
    const result = await caller.aggregate({ startDate: START, endDate: END, dimension: 'model', groupBy: 'month' });
    expect(result.aggregations[0]?.dimensionValue).toBe('claude-opus');
  });

  it('dimension=provider groupBy=day returns correct shape', async () => {
    mockCostLogQueryRaw.mockResolvedValueOnce([
      { ...MOCK_AGG_ROW, dimension_value: 'anthropic', total_cost: '8.200000' },
    ]);
    const caller = makeCaller(ADMIN_USER);
    const result = await caller.aggregate({ startDate: START, endDate: END, dimension: 'provider', groupBy: 'day' });
    expect(result.aggregations[0]?.dimensionValue).toBe('anthropic');
    expect(result.summary.totalCost).toBe('8.2');
  });

  it('multiple rows: totalCost sums with Decimal precision', async () => {
    mockCostLogQueryRaw.mockResolvedValueOnce([
      { ...MOCK_AGG_ROW, total_cost: '0.000001' },
      { ...MOCK_AGG_ROW, total_cost: '0.000002' },
      { ...MOCK_AGG_ROW, total_cost: '0.000003' },
    ]);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.aggregate({ startDate: START, endDate: END, dimension: 'user', groupBy: 'day' });
    // Decimal-precise sum: 0.000001 + 0.000002 + 0.000003 = 0.000006
    expect(result.summary.totalCost).toBe('0.000006');
  });

  it('empty data returns {aggregations:[], summary:{totalCost:"0.00"}}', async () => {
    mockCostLogQueryRaw.mockResolvedValueOnce([]);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.aggregate({ startDate: START, endDate: END, dimension: 'user', groupBy: 'day' });
    expect(result.aggregations).toEqual([]);
    expect(result.summary.totalCost).toBe('0.00');
  });

  it('startDate > endDate throws BAD_REQUEST', async () => {
    const caller = makeCaller(SUPER_ADMIN);
    await expect(
      caller.aggregate({ startDate: END, endDate: START, dimension: 'user', groupBy: 'day' }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST', message: 'startDate must be before endDate' });
  });

  it('date range > 365 days throws BAD_REQUEST with "date range too large"', async () => {
    const longEnd = new Date(START.getTime() + 366 * 24 * 60 * 60 * 1000);
    const caller = makeCaller(SUPER_ADMIN);
    await expect(
      caller.aggregate({ startDate: START, endDate: longEnd, dimension: 'user', groupBy: 'day' }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST', message: 'date range too large' });
  });

  it('callCount converts bigint to number', async () => {
    mockCostLogQueryRaw.mockResolvedValueOnce([
      { ...MOCK_AGG_ROW, call_count: BigInt(9999) },
    ]);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.aggregate({ startDate: START, endDate: END, dimension: 'user', groupBy: 'day' });
    expect(typeof result.aggregations[0]?.callCount).toBe('number');
    expect(result.aggregations[0]?.callCount).toBe(9999);
  });
});

// ── top10 ─────────────────────────────────────────────────────────────────

describe('top10', () => {
  it('returns userTop10 with correct shape', async () => {
    mockCostLogGroupBy
      .mockResolvedValueOnce([
        { userId: 1, _sum: { costUsd: new Prisma.Decimal('10.5') }, _count: { _all: 5 } },
        { userId: 2, _sum: { costUsd: new Prisma.Decimal('7.3') }, _count: { _all: 3 } },
      ])
      .mockResolvedValueOnce([]); // accountTop10 empty
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.top10();
    expect(result.userTop10).toHaveLength(2);
    expect(result.userTop10[0]).toMatchObject({ userId: 1, totalCost: '10.5', callCount: 5 });
    expect(result.userTop10[1]).toMatchObject({ userId: 2, totalCost: '7.3', callCount: 3 });
  });

  it('returns accountTop10 with correct shape', async () => {
    mockCostLogGroupBy
      .mockResolvedValueOnce([]) // userTop10 empty
      .mockResolvedValueOnce([
        { accountId: 10, _sum: { costUsd: new Prisma.Decimal('20.0') }, _count: { _all: 10 } },
      ]);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.top10();
    expect(result.accountTop10).toHaveLength(1);
    expect(result.accountTop10[0]).toMatchObject({ accountId: 10, totalCost: '20', callCount: 10 });
  });

  it('handles null _sum.costUsd as "0"', async () => {
    mockCostLogGroupBy
      .mockResolvedValueOnce([
        { userId: 5, _sum: { costUsd: null }, _count: { _all: 1 } },
      ])
      .mockResolvedValueOnce([]);
    const caller = makeCaller(ADMIN_USER);
    const result = await caller.top10();
    expect(result.userTop10[0]?.totalCost).toBe('0');
  });

  it('both lists empty when no data', async () => {
    mockCostLogGroupBy.mockResolvedValue([]);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.top10();
    expect(result.userTop10).toEqual([]);
    expect(result.accountTop10).toEqual([]);
  });
});

// ── specialistBreakdown ───────────────────────────────────────────────────

describe('specialistBreakdown', () => {
  it('groups by agentId and returns expected shape', async () => {
    mockCostLogGroupBy.mockResolvedValueOnce([
      { agentId: 'specialist-1', _sum: { costUsd: new Prisma.Decimal('6.0') }, _count: { _all: 3 } },
      { agentId: 'specialist-2', _sum: { costUsd: new Prisma.Decimal('2.0') }, _count: { _all: 1 } },
    ]);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.specialistBreakdown();
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      specialistId: 'specialist-1',
      totalCost: '6',
      callCount: 3,
    });
  });

  it('avgCostPerCall = totalCost / callCount (Decimal precision)', async () => {
    mockCostLogGroupBy.mockResolvedValueOnce([
      { agentId: 'sp-1', _sum: { costUsd: new Prisma.Decimal('1.0') }, _count: { _all: 3 } },
    ]);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.specialistBreakdown();
    // 1.0 / 3 = 0.333... (Decimal)
    expect(result[0]?.avgCostPerCall).toMatch(/^0\.3+/);
  });

  it('avgCostPerCall is "0" when callCount is 0', async () => {
    mockCostLogGroupBy.mockResolvedValueOnce([
      { agentId: 'sp-1', _sum: { costUsd: new Prisma.Decimal('5.0') }, _count: { _all: 0 } },
    ]);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.specialistBreakdown();
    expect(result[0]?.avgCostPerCall).toBe('0');
  });

  it('returns [] when no data', async () => {
    mockCostLogGroupBy.mockResolvedValueOnce([]);
    const caller = makeCaller(ADMIN_USER);
    const result = await caller.specialistBreakdown();
    expect(result).toEqual([]);
  });
});

// ── alerts ────────────────────────────────────────────────────────────────

describe('alerts', () => {
  it('users above $5 threshold are included in alerts', async () => {
    mockCostLogGroupBy.mockResolvedValueOnce([
      { userId: 7, _sum: { costUsd: new Prisma.Decimal('8.0') }, _count: { _all: 4 } },
    ]);
    mockUserFindMany.mockResolvedValueOnce([{ id: 7, email: 'heavy@example.com' }]);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.alerts();
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      userId: 7,
      email: 'heavy@example.com',
      dailySpent: '8',
      threshold: '5',
    });
  });

  it('users at or below $5 threshold are filtered out', async () => {
    mockCostLogGroupBy.mockResolvedValueOnce([
      { userId: 10, _sum: { costUsd: new Prisma.Decimal('4.999999') }, _count: { _all: 2 } },
      { userId: 11, _sum: { costUsd: new Prisma.Decimal('5.0') }, _count: { _all: 3 } },
    ]);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.alerts();
    expect(result).toHaveLength(0); // strictly greater than $5
  });

  it('exactly $5.000001 is included', async () => {
    mockCostLogGroupBy.mockResolvedValueOnce([
      { userId: 12, _sum: { costUsd: new Prisma.Decimal('5.000001') }, _count: { _all: 1 } },
    ]);
    mockUserFindMany.mockResolvedValueOnce([{ id: 12, email: 'borderline@example.com' }]);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.alerts();
    expect(result).toHaveLength(1);
  });

  it('severity=low for $5-$10 range', async () => {
    mockCostLogGroupBy.mockResolvedValueOnce([
      { userId: 20, _sum: { costUsd: new Prisma.Decimal('7.5') }, _count: { _all: 1 } },
    ]);
    mockUserFindMany.mockResolvedValueOnce([{ id: 20, email: 'a@b.com' }]);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.alerts();
    expect(result[0]?.severity).toBe('low');
  });

  it('severity=medium for $10-$15 range', async () => {
    mockCostLogGroupBy.mockResolvedValueOnce([
      { userId: 21, _sum: { costUsd: new Prisma.Decimal('12.0') }, _count: { _all: 1 } },
    ]);
    mockUserFindMany.mockResolvedValueOnce([{ id: 21, email: 'b@c.com' }]);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.alerts();
    expect(result[0]?.severity).toBe('medium');
  });

  it('severity=high for >= $15', async () => {
    mockCostLogGroupBy.mockResolvedValueOnce([
      { userId: 22, _sum: { costUsd: new Prisma.Decimal('20.0') }, _count: { _all: 1 } },
    ]);
    mockUserFindMany.mockResolvedValueOnce([{ id: 22, email: 'c@d.com' }]);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.alerts();
    expect(result[0]?.severity).toBe('high');
  });

  it('returns [] when no users above threshold', async () => {
    mockCostLogGroupBy.mockResolvedValueOnce([
      { userId: 30, _sum: { costUsd: new Prisma.Decimal('3.0') }, _count: { _all: 1 } },
    ]);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.alerts();
    expect(result).toEqual([]);
    expect(mockUserFindMany).not.toHaveBeenCalled();
  });

  it('returns email from user lookup', async () => {
    mockCostLogGroupBy.mockResolvedValueOnce([
      { userId: 50, _sum: { costUsd: new Prisma.Decimal('6.0') }, _count: { _all: 1 } },
    ]);
    mockUserFindMany.mockResolvedValueOnce([{ id: 50, email: 'lookup@test.com' }]);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.alerts();
    expect(result[0]?.email).toBe('lookup@test.com');
  });
});

// ── exportCsv ─────────────────────────────────────────────────────────────

describe('exportCsv', () => {
  const MOCK_ROW = {
    createdAt: new Date('2026-01-15T10:00:00Z'),
    userId: 42,
    agentId: 'specialist-1',
    modelUsed: 'claude-sonnet',
    provider: 'anthropic',
    costUsd: new Prisma.Decimal('0.123456'),
    traceId: 'trace-abc',
    user: { email: 'user@example.com' },
  };

  it('startDate > endDate throws BAD_REQUEST', async () => {
    const caller = makeCaller(SUPER_ADMIN);
    await expect(
      caller.exportCsv({ startDate: END, endDate: START }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST', message: 'startDate must be before endDate' });
  });

  it('date range > 365 days throws BAD_REQUEST "date range too large"', async () => {
    const longEnd = new Date(START.getTime() + 366 * 24 * 60 * 60 * 1000);
    const caller = makeCaller(SUPER_ADMIN);
    await expect(
      caller.exportCsv({ startDate: START, endDate: longEnd }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST', message: 'date range too large' });
  });

  it('> 500k rows throws BAD_REQUEST "export rows > 500000"', async () => {
    mockCostLogCount.mockResolvedValueOnce(500_001);
    const caller = makeCaller(SUPER_ADMIN);
    await expect(
      caller.exportCsv({ startDate: START, endDate: END }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST', message: 'export rows > 500000' });
  });

  it('returns CSV with correct header line', async () => {
    mockCostLogCount.mockResolvedValueOnce(1);
    mockCostLogFindMany.mockResolvedValueOnce([MOCK_ROW]).mockResolvedValueOnce([]);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.exportCsv({ startDate: START, endDate: END });
    const lines = result.csv.split('\n');
    expect(lines[0]).toBe('timestamp,userId,email,specialistId,model,provider,costUsd,traceId');
  });

  it('returns CSV rows with correct field values', async () => {
    mockCostLogCount.mockResolvedValueOnce(1);
    mockCostLogFindMany.mockResolvedValueOnce([MOCK_ROW]).mockResolvedValueOnce([]);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.exportCsv({ startDate: START, endDate: END });
    const lines = result.csv.split('\n');
    expect(lines).toHaveLength(2); // header + 1 row
    expect(lines[1]).toContain('42');
    expect(lines[1]).toContain('user@example.com');
    expect(lines[1]).toContain('specialist-1');
    expect(lines[1]).toContain('0.123456');
    expect(lines[1]).toContain('trace-abc');
  });

  it('returns rowCount in result', async () => {
    mockCostLogCount.mockResolvedValueOnce(3);
    mockCostLogFindMany.mockResolvedValueOnce([MOCK_ROW, MOCK_ROW, MOCK_ROW]).mockResolvedValueOnce([]);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.exportCsv({ startDate: START, endDate: END });
    expect(result.rowCount).toBe(3);
  });

  it('empty data returns only header line', async () => {
    mockCostLogCount.mockResolvedValueOnce(0);
    mockCostLogFindMany.mockResolvedValueOnce([]);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.exportCsv({ startDate: START, endDate: END });
    expect(result.csv).toBe('timestamp,userId,email,specialistId,model,provider,costUsd,traceId');
    expect(result.rowCount).toBe(0);
  });

  it('chunks DB reads: calls findMany multiple times for large datasets', async () => {
    mockCostLogCount.mockResolvedValueOnce(2000);
    // simulate 2 full chunks of 1000 + 1 empty chunk
    const chunk = Array(1000).fill(MOCK_ROW);
    mockCostLogFindMany
      .mockResolvedValueOnce(chunk)
      .mockResolvedValueOnce(chunk)
      .mockResolvedValueOnce([]);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.exportCsv({ startDate: START, endDate: END });
    expect(mockCostLogFindMany).toHaveBeenCalledTimes(3);
    // header + 2000 data rows
    expect(result.csv.split('\n')).toHaveLength(2001);
  });

  it('exactly 500k rows succeeds (boundary)', async () => {
    mockCostLogCount.mockResolvedValueOnce(500_000);
    mockCostLogFindMany.mockResolvedValueOnce([MOCK_ROW]).mockResolvedValueOnce([]);
    const caller = makeCaller(SUPER_ADMIN);
    await expect(caller.exportCsv({ startDate: START, endDate: END })).resolves.toBeDefined();
  });
});
