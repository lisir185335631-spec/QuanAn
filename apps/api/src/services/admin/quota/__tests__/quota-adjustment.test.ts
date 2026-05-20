// PRD-13 US-005 · quota-adjustment.service unit tests
// AC-13: ≥ 10 tests covering _adjustQuotaInTx + adjustUserQuota + listUserQuotas + getUserQuotaTimeline

import { TRPCError } from '@trpc/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks (vi.hoisted must be at module level) ────────────────────

const mockLogAdminAction = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockRequestApproval = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ id: 42, requireDualApproval: false }),
);
const mockRequiresDualApproval = vi.hoisted(() => vi.fn().mockReturnValue(false));

const mockUserQuotaFindUnique = vi.hoisted(() => vi.fn());
const mockUserQuotaUpdate = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const mockUserQuotaFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockUserQuotaCount = vi.hoisted(() => vi.fn().mockResolvedValue(0));

const mockQuotaLogCreate = vi.hoisted(() => vi.fn().mockResolvedValue({ id: 1 }));
const mockQuotaLogFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));

const mockAuditFindFirst = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockAuditCreate = vi.hoisted(() => vi.fn().mockResolvedValue({}));

const mockQueryRaw = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockUserFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));

vi.mock('@/services/admin/admin-audit-service', () => ({
  logAdminAction: mockLogAdminAction,
}));

vi.mock('@/services/admin/approval/approvalGateService', () => ({
  requestApproval: mockRequestApproval,
  requiresDualApproval: mockRequiresDualApproval,
}));

vi.mock('@/lib/prisma', () => {
  const txProxy = {
    $executeRawUnsafe: vi.fn().mockResolvedValue(undefined),
    userQuota: {
      findUnique: mockUserQuotaFindUnique,
      update: mockUserQuotaUpdate,
    },
    quotaAdjustmentLog: {
      create: mockQuotaLogCreate,
    },
    adminAuditLog: {
      findFirst: mockAuditFindFirst,
      create: mockAuditCreate,
    },
  };

  return {
    prisma: {
      $transaction: vi.fn().mockImplementation((cb: (tx: unknown) => unknown) => cb(txProxy)),
      $queryRaw: mockQueryRaw,
      userQuota: {
        findUnique: mockUserQuotaFindUnique,
        update: mockUserQuotaUpdate,
        findMany: mockUserQuotaFindMany,
        count: mockUserQuotaCount,
      },
      quotaAdjustmentLog: {
        create: mockQuotaLogCreate,
        findMany: mockQuotaLogFindMany,
      },
      user: { findMany: mockUserFindMany },
      adminAuditLog: {
        findFirst: mockAuditFindFirst,
        create: mockAuditCreate,
      },
    },
  };
});

// ── Imports (after mocks) ──────────────────────────────────────────────────

import {
  _adjustQuotaInTx,
  adjustUserQuota,
  listUserQuotas,
  getUserQuotaTimeline,
} from '@/services/admin/quota/quota-adjustment.service';

// ── Fixtures ──────────────────────────────────────────────────────────────

const QUOTA_ROW = {
  id: 1,
  userId: 100,
  plan: 'free',
  dailyQuota: 50,
  dailyUsed: 10,
  monthlyQuota: 1500,
  monthlyUsed: 100,
  imageDailyQuota: 0,
  imageDailyUsed: 0,
  isOnWhitelist: false,
  whitelistExpiresAt: null,
  dailyResetAt: new Date(),
  monthlyResetAt: new Date(),
  updatedAt: new Date(),
  adjustments: [],
};

const BASE_PARAMS = {
  userId: 100,
  adminId: 1,
  adjustmentType: 'increase_daily' as const,
  delta: 100,
  reason: 'test reason',
  approvalRequestId: 42,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockLogAdminAction.mockResolvedValue(undefined);
  mockRequestApproval.mockResolvedValue({ id: 42, requireDualApproval: false });
  mockRequiresDualApproval.mockReturnValue(false);
  mockUserQuotaFindUnique.mockResolvedValue(QUOTA_ROW);
  mockUserQuotaUpdate.mockResolvedValue({});
  mockQuotaLogCreate.mockResolvedValue({ id: 1 });
  mockAuditFindFirst.mockResolvedValue(null);
  mockAuditCreate.mockResolvedValue({});
});

// ── _adjustQuotaInTx ───────────────────────────────────────────────────────

// Build a tx object for _adjustQuotaInTx tests
function makeTx() {
  return {
    userQuota: {
      findUnique: mockUserQuotaFindUnique,
      update: mockUserQuotaUpdate,
    },
    quotaAdjustmentLog: {
      create: mockQuotaLogCreate,
    },
    adminAuditLog: {
      findFirst: mockAuditFindFirst,
      create: mockAuditCreate,
    },
  };
}

describe('_adjustQuotaInTx', () => {
  it('increase_daily: increments dailyQuota and creates log', async () => {
    const tx = makeTx();
    const logId = await _adjustQuotaInTx(tx as never, BASE_PARAMS);

    expect(logId).toBe(1);
    expect(mockUserQuotaUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { dailyQuota: { increment: 100 } } }),
    );
    expect(mockQuotaLogCreate).toHaveBeenCalledOnce();
  });

  it('increase_monthly: increments monthlyQuota', async () => {
    const tx = makeTx();
    await _adjustQuotaInTx(tx as never, {
      ...BASE_PARAMS,
      adjustmentType: 'increase_monthly',
    });

    expect(mockUserQuotaUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { monthlyQuota: { increment: 100 } } }),
    );
  });

  it('whitelist_add: sets isOnWhitelist=true and whitelistExpiresAt', async () => {
    const tx = makeTx();
    await _adjustQuotaInTx(tx as never, {
      ...BASE_PARAMS,
      adjustmentType: 'whitelist_add',
      delta: 0,
    });

    expect(mockUserQuotaUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isOnWhitelist: true }),
      }),
    );
  });

  it('throws NOT_FOUND when user_quota row missing', async () => {
    mockUserQuotaFindUnique.mockResolvedValueOnce(null);
    const tx = makeTx();

    await expect(
      _adjustQuotaInTx(tx as never, BASE_PARAMS),
    ).rejects.toThrow(TRPCError);
  });

  it('writes admin_audit_log after adjustment', async () => {
    const tx = makeTx();
    await _adjustQuotaInTx(tx as never, BASE_PARAMS);

    expect(mockLogAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        eventCategory: 'quota_management',
        eventType: 'quota_increase_daily',
        targetUserId: 100,
      }),
    );
  });

  it('log record has correct field mapping for whitelist_add', async () => {
    const tx = makeTx();
    await _adjustQuotaInTx(tx as never, {
      ...BASE_PARAMS,
      adjustmentType: 'whitelist_add',
      delta: 0,
    });

    expect(mockQuotaLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ field: 'whitelist' }) }),
    );
  });
});

// ── adjustUserQuota ────────────────────────────────────────────────────────

describe('adjustUserQuota', () => {
  it('delta <= 500: single-approval, executes immediately', async () => {
    const result = await adjustUserQuota({
      userId: 100,
      adminId: 1,
      adminRole: 'admin',
      adjustmentType: 'increase_daily',
      delta: 100,
      reason: 'test',
    });

    expect(result.needsApproval).toBe(false);
    expect(result.adjustmentLogId).toBe(1);
  });

  it('delta > 500: requires dual-approval, returns approvalRequestId only', async () => {
    const result = await adjustUserQuota({
      userId: 100,
      adminId: 1,
      adminRole: 'admin',
      adjustmentType: 'increase_daily',
      delta: 501,
      reason: 'large adjustment',
    });

    expect(result.needsApproval).toBe(true);
    expect(result.approvalRequestId).toBe(42);
  });

  it('whitelist_add: always dual-approval regardless of delta', async () => {
    const result = await adjustUserQuota({
      userId: 100,
      adminId: 1,
      adminRole: 'super_admin',
      adjustmentType: 'whitelist_add',
      delta: 0,
      reason: 'whitelist test',
    });

    expect(result.needsApproval).toBe(true);
  });
});

// ── listUserQuotas ─────────────────────────────────────────────────────────

describe('listUserQuotas', () => {
  it('returns paginated quota list', async () => {
    mockUserQuotaFindMany.mockResolvedValueOnce([{ ...QUOTA_ROW, adjustments: [] }]);

    const result = await listUserQuotas({ limit: 10 });

    expect(result.items).toHaveLength(1);
    expect(result.nextCursor).toBeUndefined();
  });

  it('returns nextCursor when more items exist', async () => {
    const rows = Array.from({ length: 11 }, (_, i) => ({
      ...QUOTA_ROW,
      id: i + 1,
      adjustments: [],
    }));
    mockUserQuotaFindMany.mockResolvedValueOnce(rows);

    const result = await listUserQuotas({ limit: 10 });

    expect(result.items).toHaveLength(10);
    expect(result.nextCursor).toBe(10);
  });
});

// ── getUserQuotaTimeline ───────────────────────────────────────────────────

describe('getUserQuotaTimeline', () => {
  it('returns aggregated daily timeline', async () => {
    mockQueryRaw.mockResolvedValueOnce([
      { date: '2026-05-13', call_count: BigInt(5), cost_usd: '0.050000' },
      { date: '2026-05-14', call_count: BigInt(3), cost_usd: '0.030000' },
    ]);

    const result = await getUserQuotaTimeline(100, 7);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ date: '2026-05-13', callCount: 5 });
  });

  it('returns empty array when no cost_log entries', async () => {
    mockQueryRaw.mockResolvedValueOnce([]);

    const result = await getUserQuotaTimeline(100, 7);

    expect(result).toHaveLength(0);
  });
});
