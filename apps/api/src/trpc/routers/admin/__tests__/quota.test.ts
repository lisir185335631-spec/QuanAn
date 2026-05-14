// PRD-13 US-005 · adminRouter.quota unit tests — 6 procedures
// AC-13: ≥ 6 tests

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';

// ── Hoisted mocks (vi.hoisted must be at module level) ────────────────────

const mockLogAdminAction = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockAdjustUserQuota = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ adjustmentLogId: 1, approvalRequestId: 10, needsApproval: false }),
);
const mockListUserQuotas = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ items: [], nextCursor: undefined }),
);
const mockGetUserQuotaTimeline = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockScheduleQuotaExpiry = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

const mockUserQuotaCount = vi.hoisted(() => vi.fn().mockResolvedValue(0));
const mockUserQuotaFindUnique = vi.hoisted(() => vi.fn());
const mockUserQuotaFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockQuotaLogFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockAuditFindFirst = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockAuditCreate = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const mockExecuteRawUnsafe = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock('@/services/admin/admin-audit-service', () => ({
  logAdminAction: mockLogAdminAction,
}));

vi.mock('@/services/admin/quota/quota-adjustment.service', () => ({
  adjustUserQuota: mockAdjustUserQuota,
  listUserQuotas: mockListUserQuotas,
  getUserQuotaTimeline: mockGetUserQuotaTimeline,
}));

vi.mock('@/jobs/admin/quota-expiry.job', () => ({
  scheduleQuotaExpiry: mockScheduleQuotaExpiry,
}));

vi.mock('@/lib/prisma', () => {
  const txProxy = {
    $executeRawUnsafe: mockExecuteRawUnsafe,
    adminAuditLog: {
      findFirst: mockAuditFindFirst,
      create: mockAuditCreate,
    },
  };

  return {
    prisma: {
      $transaction: vi.fn().mockImplementation((cb: (tx: unknown) => unknown) => cb(txProxy)),
      userQuota: {
        count: mockUserQuotaCount,
        findUnique: mockUserQuotaFindUnique,
        findMany: mockUserQuotaFindMany,
      },
      quotaAdjustmentLog: {
        findMany: mockQuotaLogFindMany,
      },
      adminAuditLog: {
        findFirst: mockAuditFindFirst,
        create: mockAuditCreate,
      },
    },
  };
});

// ── Imports (after mocks) ──────────────────────────────────────────────────

import { quotaRouter } from '@/trpc/routers/admin/quota';
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
  email: 'readonly@quanqn.com',
  role: 'readonly_admin',
  isMock: true,
  isActive: true,
};

const MOCK_SESSION = {
  id: 'sess-quota-test',
  expiresAt: new Date(Date.now() + 3600_000),
  fresh: false,
} as AdminLuciaSession;

const QUOTA_ROW = {
  id: 1,
  userId: 100,
  plan: 'free',
  dailyQuota: 50,
  dailyUsed: 10,
  monthlyQuota: 1500,
  monthlyUsed: 0,
  imageDailyQuota: 0,
  imageDailyUsed: 0,
  isOnWhitelist: false,
  whitelistExpiresAt: null,
  dailyResetAt: new Date(),
  monthlyResetAt: new Date(),
  updatedAt: new Date(),
  adjustments: [],
};

function makeCtx(
  user: AdminLuciaUser | null = SUPER_ADMIN,
  overrides: Partial<AdminTRPCContext> = {},
): AdminTRPCContext {
  return {
    prisma: prisma as PrismaClient,
    adminPrisma: prisma as PrismaClient,
    traceId: 'trace-quota-test',
    req: new Request('http://localhost/trpc/admin/quota', {
      headers: {
        'x-forwarded-for': '10.0.0.1',
        'user-agent': 'test-agent/1.0',
      },
    }),
    resHeaders: new Headers(),
    adminSession: MOCK_SESSION,
    activeAdminUser: user,
    ...overrides,
  };
}

function makeCallerWith(user: AdminLuciaUser | null, overrides: Partial<AdminTRPCContext> = {}) {
  return quotaRouter.createCaller(makeCtx(user, overrides));
}

beforeEach(() => {
  vi.clearAllMocks();
  mockLogAdminAction.mockResolvedValue(undefined);
  mockAdjustUserQuota.mockResolvedValue({
    adjustmentLogId: 1,
    approvalRequestId: 10,
    needsApproval: false,
  });
  mockListUserQuotas.mockResolvedValue({ items: [], nextCursor: undefined });
  mockGetUserQuotaTimeline.mockResolvedValue([]);
  mockScheduleQuotaExpiry.mockResolvedValue(undefined);
  mockUserQuotaCount.mockResolvedValue(0);
  mockUserQuotaFindMany.mockResolvedValue([]);
  mockQuotaLogFindMany.mockResolvedValue([]);
  mockAuditFindFirst.mockResolvedValue(null);
  mockExecuteRawUnsafe.mockResolvedValue(undefined);
});

// ── getQuotaOverview ───────────────────────────────────────────────────────

describe('getQuotaOverview', () => {
  it('returns plan distribution counts', async () => {
    mockUserQuotaCount
      .mockResolvedValueOnce(10) // free
      .mockResolvedValueOnce(5)  // pro
      .mockResolvedValueOnce(2)  // enterprise
      .mockResolvedValueOnce(1); // whitelist

    const caller = makeCallerWith(SUPER_ADMIN);
    const result = await caller.getQuotaOverview();

    expect(result).toEqual({ free: 10, pro: 5, enterprise: 2, activeWhitelist: 1, total: 17 });
  });
});

// ── listUserQuotas ─────────────────────────────────────────────────────────

describe('listUserQuotas', () => {
  it('delegates to listUserQuotas service', async () => {
    mockListUserQuotas.mockResolvedValueOnce({ items: [QUOTA_ROW], nextCursor: undefined });

    const caller = makeCallerWith(SUPER_ADMIN);
    const result = await caller.listUserQuotas({ limit: 20 });

    expect(result.items).toHaveLength(1);
    expect(mockListUserQuotas).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 20 }),
    );
  });
});

// ── getUserDetail ──────────────────────────────────────────────────────────

describe('getUserDetail', () => {
  it('returns quota + timeline for valid userId', async () => {
    mockUserQuotaFindUnique.mockResolvedValueOnce({ ...QUOTA_ROW, adjustments: [] });
    mockGetUserQuotaTimeline.mockResolvedValueOnce([
      { date: '2026-05-14', callCount: 3, costUsd: 0.03 },
    ]);

    const caller = makeCallerWith(SUPER_ADMIN);
    const result = await caller.getUserDetail({ userId: 100, timelineDays: 7 });

    expect(result.quota.userId).toBe(100);
    expect(result.timeline).toHaveLength(1);
  });

  it('throws NOT_FOUND for unknown userId', async () => {
    mockUserQuotaFindUnique.mockResolvedValueOnce(null);

    const caller = makeCallerWith(SUPER_ADMIN);
    await expect(caller.getUserDetail({ userId: 9999, timelineDays: 7 })).rejects.toThrow(
      TRPCError,
    );
  });
});

// ── adjustQuota ────────────────────────────────────────────────────────────

describe('adjustQuota', () => {
  it('executes adjustment and schedules expiry job', async () => {
    const caller = makeCallerWith(SUPER_ADMIN);
    const result = await caller.adjustQuota({
      userId: 100,
      adjustmentType: 'increase_daily',
      delta: 100,
      reason: 'test adjustment',
    });

    expect(result.needsApproval).toBe(false);
    expect(mockScheduleQuotaExpiry).toHaveBeenCalledWith(1);
  });

  it('returns needsApproval=true for dual-approval path', async () => {
    mockAdjustUserQuota.mockResolvedValueOnce({
      approvalRequestId: 99,
      needsApproval: true,
    });

    const caller = makeCallerWith(SUPER_ADMIN);
    const result = await caller.adjustQuota({
      userId: 100,
      adjustmentType: 'increase_daily',
      delta: 600,
      reason: 'large adjustment',
    });

    expect(result.needsApproval).toBe(true);
    expect(mockScheduleQuotaExpiry).not.toHaveBeenCalled();
  });

  it('throws FORBIDDEN for readonly_admin', async () => {
    const caller = makeCallerWith(READONLY_ADMIN);
    await expect(
      caller.adjustQuota({
        userId: 100,
        adjustmentType: 'increase_daily',
        delta: 100,
        reason: 'test',
      }),
    ).rejects.toThrow(TRPCError);
  });
});

// ── listAdjustmentLog ──────────────────────────────────────────────────────

describe('listAdjustmentLog', () => {
  it('returns adjustment logs', async () => {
    const logs = [{ id: 1, userId: 100, adminId: 1, field: 'dailyQuota', delta: 100 }];
    mockQuotaLogFindMany.mockResolvedValueOnce(logs);

    const caller = makeCallerWith(SUPER_ADMIN);
    const result = await caller.listAdjustmentLog({ userId: 100, limit: 20 });

    expect(result.items).toHaveLength(1);
  });
});

// ── getActiveAdjustments ───────────────────────────────────────────────────

describe('getActiveAdjustments', () => {
  it('returns active (non-expired) adjustments', async () => {
    const active = [{ id: 1, userId: 100, isExpired: false }];
    mockQuotaLogFindMany.mockResolvedValueOnce(active);

    const caller = makeCallerWith(SUPER_ADMIN);
    const result = await caller.getActiveAdjustments({ userId: 100 });

    expect(result).toHaveLength(1);
    expect(mockQuotaLogFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ isExpired: false }) }),
    );
  });
});
