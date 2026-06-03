// PRD-29 · diagnosis router unit tests
// list(返回 + 分页) · detail(命中 + NOT_FOUND) · kpiStats(总数/均分/fallback占比; total=0 时 fallbackRate=0)

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ──────────────────────────────────────────────────────────

const mockDiagnosisReportFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockDiagnosisReportFindUnique = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockDiagnosisReportCount = vi.hoisted(() => vi.fn().mockResolvedValue(0));
const mockDiagnosisReportAggregate = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ _avg: { overallScore: null } }),
);

// adminRLS middleware calls ctx.prisma.$transaction — must mock it.
// It sets adminPrisma = tx inside the transaction, so the tx object must also
// expose diagnosisReport so the router can use ctx.adminPrisma ?? ctx.prisma.
const mockPrismaTransaction = vi.hoisted(() =>
  vi.fn().mockImplementation((cb: (tx: unknown) => unknown) =>
    cb({
      $executeRawUnsafe: vi.fn().mockResolvedValue(undefined),
      diagnosisReport: {
        findMany: mockDiagnosisReportFindMany,
        findUnique: mockDiagnosisReportFindUnique,
        count: mockDiagnosisReportCount,
        aggregate: mockDiagnosisReportAggregate,
      },
    }),
  ),
);

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: mockPrismaTransaction,
    diagnosisReport: {
      findMany: mockDiagnosisReportFindMany,
      findUnique: mockDiagnosisReportFindUnique,
      count: mockDiagnosisReportCount,
      aggregate: mockDiagnosisReportAggregate,
    },
  },
}));

// ── Imports (after mocks) ──────────────────────────────────────────────────

import type { AdminLuciaSession, AdminLuciaUser } from '@/lib/auth/lucia-admin';
import { prisma } from '@/lib/prisma';
import type { AdminTRPCContext } from '@/server/context-admin';
import { diagnosisRouter } from '@/trpc/routers/admin/diagnosis';

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
  id: 'sess-diagnosis-test',
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
    traceId: 'trace-diagnosis-test',
    req: new Request('http://localhost/trpc/admin/diagnosis', {
      headers: { 'x-forwarded-for': '10.0.0.1', 'user-agent': 'test/1.0' },
    }),
    resHeaders: new Headers(),
    adminSession: MOCK_SESSION,
    activeAdminUser: user,
    ...overrides,
  };
}

function makeCaller(user: AdminLuciaUser | null, overrides: Partial<AdminTRPCContext> = {}) {
  return diagnosisRouter.createCaller(makeCtx(user, overrides));
}

const MOCK_LIST_ITEM = {
  id: 1,
  accountId: 100,
  overallScore: 75,
  inferredStage: 'early',
  topPriority: '提升内容质量',
  agentId: 'diagnosis-agent-v1',
  isFallback: false,
  modelUsed: 'claude-sonnet',
  tokensUsed: 1200,
  createdAt: new Date('2026-01-15T10:00:00Z'),
};

const MOCK_DETAIL_ITEM = {
  ...MOCK_LIST_ITEM,
  recommendedSteps: ['步骤一', '步骤二'],
  durationMs: 3500,
  traceId: 'trace-abc-123',
  dimensions: { content: 80, engagement: 70 },
  answers: [{ q: '问题1', a: '回答1' }],
};

beforeEach(() => {
  vi.resetAllMocks();
  mockDiagnosisReportFindMany.mockResolvedValue([]);
  mockDiagnosisReportFindUnique.mockResolvedValue(null);
  mockDiagnosisReportCount.mockResolvedValue(0);
  mockDiagnosisReportAggregate.mockResolvedValue({ _avg: { overallScore: null } });
  // Re-establish $transaction after resetAllMocks
  mockPrismaTransaction.mockImplementation((cb: (tx: unknown) => unknown) =>
    cb({
      $executeRawUnsafe: vi.fn().mockResolvedValue(undefined),
      diagnosisReport: {
        findMany: mockDiagnosisReportFindMany,
        findUnique: mockDiagnosisReportFindUnique,
        count: mockDiagnosisReportCount,
        aggregate: mockDiagnosisReportAggregate,
      },
    }),
  );
});

// ── list ───────────────────────────────────────────────────────────────────

describe('list', () => {
  it('returns items and total with default pagination', async () => {
    mockDiagnosisReportFindMany.mockResolvedValueOnce([MOCK_LIST_ITEM]);
    mockDiagnosisReportCount.mockResolvedValueOnce(1);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.list({});
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.items[0]).toMatchObject({ id: 1, accountId: 100, overallScore: 75 });
  });

  it('returns empty items when no reports', async () => {
    mockDiagnosisReportFindMany.mockResolvedValueOnce([]);
    mockDiagnosisReportCount.mockResolvedValueOnce(0);
    const caller = makeCaller(ADMIN_USER);
    const result = await caller.list({});
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('applies accountId filter (passes it to where clause)', async () => {
    mockDiagnosisReportFindMany.mockResolvedValueOnce([MOCK_LIST_ITEM]);
    mockDiagnosisReportCount.mockResolvedValueOnce(1);
    const caller = makeCaller(SUPER_ADMIN);
    await caller.list({ accountId: 100 });
    const whereArg = mockDiagnosisReportFindMany.mock.calls[0]?.[0]?.where;
    expect(whereArg).toMatchObject({ accountId: 100 });
  });

  it('applies minScore filter', async () => {
    mockDiagnosisReportFindMany.mockResolvedValueOnce([]);
    mockDiagnosisReportCount.mockResolvedValueOnce(0);
    const caller = makeCaller(SUPER_ADMIN);
    await caller.list({ minScore: 60 });
    const whereArg = mockDiagnosisReportFindMany.mock.calls[0]?.[0]?.where;
    expect(whereArg?.overallScore).toMatchObject({ gte: 60 });
  });

  it('applies maxScore filter', async () => {
    mockDiagnosisReportFindMany.mockResolvedValueOnce([]);
    mockDiagnosisReportCount.mockResolvedValueOnce(0);
    const caller = makeCaller(SUPER_ADMIN);
    await caller.list({ maxScore: 50 });
    const whereArg = mockDiagnosisReportFindMany.mock.calls[0]?.[0]?.where;
    expect(whereArg?.overallScore).toMatchObject({ lte: 50 });
  });

  it('applies minScore + maxScore together', async () => {
    mockDiagnosisReportFindMany.mockResolvedValueOnce([]);
    mockDiagnosisReportCount.mockResolvedValueOnce(0);
    const caller = makeCaller(SUPER_ADMIN);
    await caller.list({ minScore: 40, maxScore: 70 });
    const whereArg = mockDiagnosisReportFindMany.mock.calls[0]?.[0]?.where;
    expect(whereArg?.overallScore).toMatchObject({ gte: 40, lte: 70 });
  });

  it('uses correct skip for page 2', async () => {
    mockDiagnosisReportFindMany.mockResolvedValueOnce([]);
    mockDiagnosisReportCount.mockResolvedValueOnce(30);
    const caller = makeCaller(SUPER_ADMIN);
    await caller.list({ page: 2, pageSize: 10 });
    const callArg = mockDiagnosisReportFindMany.mock.calls[0]?.[0];
    expect(callArg?.skip).toBe(10);
    expect(callArg?.take).toBe(10);
  });

  it('returns page and pageSize in response', async () => {
    mockDiagnosisReportFindMany.mockResolvedValueOnce([]);
    mockDiagnosisReportCount.mockResolvedValueOnce(0);
    const caller = makeCaller(ADMIN_USER);
    const result = await caller.list({ page: 3, pageSize: 5 });
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(5);
  });
});

// ── detail ─────────────────────────────────────────────────────────────────

describe('detail', () => {
  it('returns full report when found', async () => {
    mockDiagnosisReportFindUnique.mockResolvedValueOnce(MOCK_DETAIL_ITEM);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.detail({ id: 1 });
    expect(result).toMatchObject({
      id: 1,
      accountId: 100,
      overallScore: 75,
      inferredStage: 'early',
      recommendedSteps: ['步骤一', '步骤二'],
      traceId: 'trace-abc-123',
    });
    expect(result.dimensions).toEqual({ content: 80, engagement: 70 });
  });

  it('throws NOT_FOUND when report does not exist', async () => {
    mockDiagnosisReportFindUnique.mockResolvedValueOnce(null);
    const caller = makeCaller(SUPER_ADMIN);
    await expect(caller.detail({ id: 9999 })).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'diagnosis_report_not_found',
    });
  });

  it('queries by correct id', async () => {
    mockDiagnosisReportFindUnique.mockResolvedValueOnce(MOCK_DETAIL_ITEM);
    const caller = makeCaller(ADMIN_USER);
    await caller.detail({ id: 42 });
    const whereArg = mockDiagnosisReportFindUnique.mock.calls[0]?.[0]?.where;
    expect(whereArg).toEqual({ id: 42 });
  });
});

// ── kpiStats ───────────────────────────────────────────────────────────────

describe('kpiStats', () => {
  it('returns correct shape with populated data', async () => {
    // count calls: total, recentCount, fallbackCount
    mockDiagnosisReportCount
      .mockResolvedValueOnce(100)  // total
      .mockResolvedValueOnce(15)   // recentCount (7d)
      .mockResolvedValueOnce(12);  // fallbackCount
    mockDiagnosisReportAggregate.mockResolvedValueOnce({ _avg: { overallScore: 72.6 } });
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.kpiStats();
    expect(result.total).toBe(100);
    expect(result.recentCount).toBe(15);
    expect(result.avgScore).toBe(72.6);
    // fallbackRate = round(12/100 * 1000) / 10 = round(120) / 10 = 12.0
    expect(result.fallbackRate).toBe(12);
  });

  it('fallbackRate=0 when total=0 (no divide-by-zero)', async () => {
    mockDiagnosisReportCount
      .mockResolvedValueOnce(0)  // total
      .mockResolvedValueOnce(0)  // recentCount
      .mockResolvedValueOnce(0); // fallbackCount
    mockDiagnosisReportAggregate.mockResolvedValueOnce({ _avg: { overallScore: null } });
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.kpiStats();
    expect(result.total).toBe(0);
    expect(result.fallbackRate).toBe(0);
    expect(result.avgScore).toBe(0);
  });

  it('avgScore falls back to 0 when _avg.overallScore is null', async () => {
    mockDiagnosisReportCount
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1);
    mockDiagnosisReportAggregate.mockResolvedValueOnce({ _avg: { overallScore: null } });
    const caller = makeCaller(ADMIN_USER);
    const result = await caller.kpiStats();
    expect(result.avgScore).toBe(0);
  });

  it('fallbackRate is rounded to 1 decimal place', async () => {
    mockDiagnosisReportCount
      .mockResolvedValueOnce(3)   // total
      .mockResolvedValueOnce(1)   // recentCount
      .mockResolvedValueOnce(1);  // fallbackCount
    mockDiagnosisReportAggregate.mockResolvedValueOnce({ _avg: { overallScore: 60 } });
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.kpiStats();
    // 1/3 * 100 = 33.333... → round(33.333... * 10) / 10 = 33.3
    expect(result.fallbackRate).toBe(33.3);
  });

  it('avgScore is rounded to 1 decimal place', async () => {
    mockDiagnosisReportCount
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(2);
    mockDiagnosisReportAggregate.mockResolvedValueOnce({ _avg: { overallScore: 68.777 } });
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.kpiStats();
    expect(result.avgScore).toBe(68.8);
  });
});
