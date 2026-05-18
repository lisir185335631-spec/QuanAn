// PRD-13 US-010 · adminRouter.compliance unit tests
// 4 procedures: getKpiStats · getIndustryBreakdown · getTrend · listEvents
// AC-11: ≥ 1 test per procedure (contributes to ≥1670 total)

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ─────────────────────────────────────────────────────────

const mockQueryRaw = vi.hoisted(() => vi.fn());
const mockAdminAuditLogFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockExecuteRawUnsafe = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockTransaction = vi.hoisted(() =>
  vi.fn().mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
    const txProxy = {
      $executeRawUnsafe: mockExecuteRawUnsafe,
      adminAuditLog: { findMany: mockAdminAuditLogFindMany },
    };
    return fn(txProxy);
  }),
);

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: mockQueryRaw,
    $transaction: mockTransaction,
    adminAuditLog: {
      findMany: mockAdminAuditLogFindMany,
    },
  },
}));

// Silence unused mock warning
void mockExecuteRawUnsafe;

// ── Router imports ────────────────────────────────────────────────────────

import { complianceRouter } from '../compliance';
import type { AdminTRPCContext } from '@/server/context-admin';
import type { AdminLuciaSession, AdminLuciaUser } from '@/lib/auth/lucia-admin';
import type { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// ── Fixtures ──────────────────────────────────────────────────────────────

const SUPER_ADMIN: AdminLuciaUser = {
  id: 1,
  email: 'super@quanqn.com',
  role: 'super_admin',
  isMock: true,
  isActive: true,
};

const READONLY_ADMIN: AdminLuciaUser = {
  id: 3,
  email: 'legal@quanqn.com',
  role: 'readonly_admin',
  isMock: true,
  isActive: true,
};

const MOCK_SESSION = {
  id: 'sess-compliance-test',
  expiresAt: new Date(Date.now() + 3_600_000),
  fresh: false,
} as AdminLuciaSession;

function makeCtx(user: AdminLuciaUser | null = SUPER_ADMIN): AdminTRPCContext {
  return {
    prisma: prisma as PrismaClient,
    adminPrisma: prisma as PrismaClient,
    traceId: 'trace-compliance-test',
    req: new Request('http://localhost/trpc/admin/compliance', {
      headers: { 'x-forwarded-for': '10.0.0.1', 'user-agent': 'test/1.0' },
    }),
    resHeaders: new Headers(),
    adminSession: MOCK_SESSION,
    activeAdminUser: user,
  };
}

function makeCallerWith(user: AdminLuciaUser | null) {
  return complianceRouter.createCaller(makeCtx(user));
}

// ── Default mock responses ─────────────────────────────────────────────────

const EMPTY_KPI_MOCK = [
  [], // todayDisclaimerRows
  [{ cnt: BigInt(0) }], // bannedWordRows
  [{ pii_count: BigInt(0), total_count: BigInt(0) }], // piiRows
  [], // industryTop5Rows
  [], // bannedWordTrendRows
  [], // piiTrendRows
];

beforeEach(() => {
  vi.clearAllMocks();
  mockQueryRaw.mockResolvedValue([]);
  mockAdminAuditLogFindMany.mockResolvedValue([]);
});

// ── getKpiStats ────────────────────────────────────────────────────────────

describe('getKpiStats', () => {
  it('returns zeroed KPIs when no compliance events exist', async () => {
    let call = 0;
    mockQueryRaw.mockImplementation(() => Promise.resolve(EMPTY_KPI_MOCK[call++] ?? []));

    const caller = makeCallerWith(SUPER_ADMIN);
    const result = await caller.getKpiStats();

    expect(result.todayDisclaimerCount).toBe(0);
    expect(result.bannedWordCount).toBe(0);
    expect(result.piiHitRate).toBe(0);
    expect(result.industryTop5).toHaveLength(0);
  });

  it('aggregates todayDisclaimerCount from disclaimer rows', async () => {
    let call = 0;
    const discRows = [
      { industry: '金融', cnt: BigInt(5) },
      { industry: '医疗', cnt: BigInt(3) },
    ];
    mockQueryRaw.mockImplementation(() => {
      const idx = call++;
      if (idx === 0) return Promise.resolve(discRows); // todayDisclaimer
      if (idx === 1) return Promise.resolve([{ cnt: BigInt(12) }]); // bannedWord
      if (idx === 2) return Promise.resolve([{ pii_count: BigInt(4), total_count: BigInt(20) }]); // pii
      return Promise.resolve([]);
    });

    const caller = makeCallerWith(SUPER_ADMIN);
    const result = await caller.getKpiStats();

    expect(result.todayDisclaimerCount).toBe(8); // 5 + 3
    expect(result.disclaimerByIndustry).toHaveLength(2);
    expect(result.disclaimerByIndustry[0]).toMatchObject({ industry: '金融', count: 5 });
    expect(result.bannedWordCount).toBe(12);
    expect(result.piiHitRate).toBe(20); // 4/20 * 100 = 20%
  });

  it('returns piiHitRate=0 when totalParsed=0 (no division by zero)', async () => {
    let call = 0;
    mockQueryRaw.mockImplementation(() => {
      const idx = call++;
      if (idx === 2) return Promise.resolve([{ pii_count: BigInt(0), total_count: BigInt(0) }]);
      return Promise.resolve([]);
    });

    const caller = makeCallerWith(READONLY_ADMIN);
    const result = await caller.getKpiStats();

    expect(result.piiHitRate).toBe(0);
  });

  it('allows readonly_admin access', async () => {
    let call = 0;
    mockQueryRaw.mockImplementation(() => Promise.resolve(EMPTY_KPI_MOCK[call++] ?? []));

    const caller = makeCallerWith(READONLY_ADMIN);
    const result = await caller.getKpiStats();

    expect(result).toBeDefined();
    expect(result.todayDisclaimerCount).toBe(0);
  });
});

// ── getIndustryBreakdown ────────────────────────────────────────────────────

describe('getIndustryBreakdown', () => {
  it('returns empty when no events', async () => {
    mockQueryRaw.mockResolvedValueOnce([]);

    const caller = makeCallerWith(SUPER_ADMIN);
    const result = await caller.getIndustryBreakdown();

    expect(result.all).toHaveLength(0);
    expect(result.pieData).toHaveLength(0);
  });

  it('splits top 10 + other bucket when >10 industries', async () => {
    const rows = Array.from({ length: 15 }, (_, i) => ({
      industry: `行业${i + 1}`,
      cnt: BigInt(15 - i), // counts: 15, 14, 13, ..., 1 (all positive)
    }));
    mockQueryRaw.mockResolvedValueOnce(rows);

    const caller = makeCallerWith(SUPER_ADMIN);
    const result = await caller.getIndustryBreakdown();

    expect(result.all).toHaveLength(15);
    expect(result.pieData).toHaveLength(11); // top10 + '其他'
    const other = result.pieData.find((r) => r.industry === '其他');
    expect(other).toBeDefined();
    // rows 11-15 have counts: 5,4,3,2,1 → sum=15
    expect(other!.count).toBe(5 + 4 + 3 + 2 + 1);
  });

  it('accepts optional date range input', async () => {
    mockQueryRaw.mockResolvedValueOnce([{ industry: '科技', cnt: BigInt(7) }]);

    const caller = makeCallerWith(READONLY_ADMIN);
    const result = await caller.getIndustryBreakdown({
      startDate: new Date('2026-05-01'),
      endDate: new Date('2026-05-31'),
    });

    expect(result.all).toHaveLength(1);
    expect(result.all[0]).toMatchObject({ industry: '科技', count: 7 });
  });
});

// ── getTrend ───────────────────────────────────────────────────────────────

describe('getTrend', () => {
  it('returns empty trend when no events', async () => {
    mockQueryRaw.mockResolvedValueOnce([]);

    const caller = makeCallerWith(SUPER_ADMIN);
    const result = await caller.getTrend({ groupBy: 'day' });

    expect(result).toHaveLength(0);
  });

  it('returns aggregated trend rows with day groupBy', async () => {
    const rows = [
      { date: new Date('2026-05-01'), cnt: BigInt(10) },
      { date: new Date('2026-05-02'), cnt: BigInt(8) },
    ];
    mockQueryRaw.mockResolvedValueOnce(rows);

    const caller = makeCallerWith(SUPER_ADMIN);
    const result = await caller.getTrend({ groupBy: 'day' });

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ date: '2026-05-01', industry: null, count: 10 });
    expect(result[1]).toMatchObject({ date: '2026-05-02', industry: null, count: 8 });
  });

  it('filters by industries when provided', async () => {
    const rows = [
      { date: new Date('2026-05-01'), industry: '金融', cnt: BigInt(5) },
    ];
    mockQueryRaw.mockResolvedValueOnce(rows);

    const caller = makeCallerWith(SUPER_ADMIN);
    const result = await caller.getTrend({ groupBy: 'week', industries: ['金融'] });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ industry: '金融', count: 5 });
  });

  it('allows readonly_admin access', async () => {
    mockQueryRaw.mockResolvedValueOnce([]);

    const caller = makeCallerWith(READONLY_ADMIN);
    const result = await caller.getTrend({ groupBy: 'month' });

    expect(result).toHaveLength(0);
  });
});

// ── listEvents ─────────────────────────────────────────────────────────────

describe('listEvents', () => {
  it('returns empty list when no events', async () => {
    const caller = makeCallerWith(SUPER_ADMIN);
    const result = await caller.listEvents({ limit: 50, grouping: 'none' });

    expect(result.items).toHaveLength(0);
    expect(result.nextCursor).toBeUndefined();
  });

  it('returns items with masked userId (SHIELD: LD-A-3 redacted)', async () => {
    const mockEvent = {
      id: 42,
      eventCategory: 'compliance',
      eventType: 'pii_redacted',
      targetUserId: 100,
      createdAt: new Date(),
      payload: { industry: '医疗', content: '[SENSITIVE DATA - should not appear]' },
      success: true,
    };
    mockAdminAuditLogFindMany.mockResolvedValueOnce([mockEvent]);

    const caller = makeCallerWith(SUPER_ADMIN);
    const result = await caller.listEvents({ limit: 50, grouping: 'none' });

    expect(result.items).toHaveLength(1);
    const item = result.items[0]!;
    // SHIELD: userId must be masked
    expect(item.userId).toBe('user-100');
    // SHIELD: payloadSummary only, not raw payload
    expect(item.payloadSummary).toContain('pii_redacted');
    expect(item.payloadSummary).not.toContain('SENSITIVE DATA');
    // industry extracted correctly
    expect(item.industry).toBe('医疗');
  });

  it('applies eventType filter correctly', async () => {
    const caller = makeCallerWith(SUPER_ADMIN);
    await caller.listEvents({ limit: 50, grouping: 'none', eventTypeFilter: 'banned_word_hit' });

    expect(mockAdminAuditLogFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ eventType: 'banned_word_hit' }),
      }),
    );
  });

  it('groups by eventType when grouping=eventType', async () => {
    const events = [
      {
        id: 1, eventCategory: 'compliance', eventType: 'pii_redacted',
        targetUserId: null, createdAt: new Date(), payload: { industry: '金融' }, success: true,
      },
      {
        id: 2, eventCategory: 'compliance', eventType: 'banned_word_hit',
        targetUserId: null, createdAt: new Date(), payload: { industry: '医疗' }, success: true,
      },
    ];
    mockAdminAuditLogFindMany.mockResolvedValueOnce(events);

    const caller = makeCallerWith(SUPER_ADMIN);
    const result = await caller.listEvents({ limit: 50, grouping: 'eventType' });

    expect(result.grouped).toBeDefined();
    expect(Object.keys(result.grouped!)).toContain('pii_redacted');
    expect(Object.keys(result.grouped!)).toContain('banned_word_hit');
  });

  it('groups by industry when grouping=industry', async () => {
    const events = [
      {
        id: 1, eventCategory: 'compliance', eventType: 'pii_redacted',
        targetUserId: null, createdAt: new Date(), payload: { industry: '金融' }, success: true,
      },
      {
        id: 2, eventCategory: 'compliance', eventType: 'pii_redacted',
        targetUserId: null, createdAt: new Date(), payload: { industry: '金融' }, success: true,
      },
      {
        id: 3, eventCategory: 'compliance', eventType: 'banned_word_hit',
        targetUserId: null, createdAt: new Date(), payload: { industry: '医疗' }, success: true,
      },
    ];
    mockAdminAuditLogFindMany.mockResolvedValueOnce(events);

    const caller = makeCallerWith(SUPER_ADMIN);
    const result = await caller.listEvents({ limit: 50, grouping: 'industry' });

    expect(result.grouped).toBeDefined();
    expect(result.grouped!['金融']).toHaveLength(2);
    expect(result.grouped!['医疗']).toHaveLength(1);
  });

  it('handles null industry in payload gracefully', async () => {
    const events = [
      {
        id: 1, eventCategory: 'compliance', eventType: 'pii_redacted',
        targetUserId: null, createdAt: new Date(), payload: null, success: true,
      },
    ];
    mockAdminAuditLogFindMany.mockResolvedValueOnce(events);

    const caller = makeCallerWith(READONLY_ADMIN);
    const result = await caller.listEvents({ limit: 50, grouping: 'none' });

    expect(result.items[0]!.industry).toBeNull();
    expect(result.items[0]!.userId).toBeNull();
  });

  it('paginates with cursor correctly', async () => {
    const events = Array.from({ length: 51 }, (_, i) => ({
      id: 51 - i, eventCategory: 'compliance', eventType: 'pii_redacted',
      targetUserId: null, createdAt: new Date(), payload: {}, success: true,
    }));
    mockAdminAuditLogFindMany.mockResolvedValueOnce(events);

    const caller = makeCallerWith(SUPER_ADMIN);
    const result = await caller.listEvents({ limit: 50, grouping: 'none' });

    expect(result.items).toHaveLength(50);
    expect(result.nextCursor).toBeDefined();
  });
});
