// PRD-13 US-011 · adminRouter.approvals unit tests
// AC-14: ≥ 8 tests · covers getKpiStats, listPending, listDecided, approveRequest,
//        rejectRequest, emergencyApprove, postReviewApprove, listPostReview

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';

// ── Hoisted mocks ─────────────────────────────────────────────────────────

const mockApproveRequestSvc = vi.hoisted(() => vi.fn());
const mockEmergencyApproveSvc = vi.hoisted(() => vi.fn());
const mockPostReviewApproveSvc = vi.hoisted(() => vi.fn());
const mockLogAdminAction = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

const mockQueryRaw = vi.hoisted(() => vi.fn());
const mockExecuteRawUnsafe = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockApprovalCount = vi.hoisted(() => vi.fn().mockResolvedValue(0));
const mockApprovalFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockApprovalFindUniqueOrThrow = vi.hoisted(() => vi.fn());
const mockApprovalUpdate = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const mockAdminUserFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockTransaction = vi.hoisted(() =>
  vi.fn().mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
    const txProxy = { $executeRawUnsafe: mockExecuteRawUnsafe };
    return fn(txProxy);
  }),
);

vi.mock('@/services/admin/approval/approvalGateService', () => ({
  approveRequest: mockApproveRequestSvc,
  emergencyApprove: mockEmergencyApproveSvc,
  postReviewApprove: mockPostReviewApproveSvc,
}));

vi.mock('@/services/admin/admin-audit-service', () => ({
  logAdminAction: mockLogAdminAction,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: mockQueryRaw,
    $transaction: mockTransaction,
    approvalRequest: {
      count: mockApprovalCount,
      findMany: mockApprovalFindMany,
      findUniqueOrThrow: mockApprovalFindUniqueOrThrow,
      update: mockApprovalUpdate,
    },
    adminUser: {
      findMany: mockAdminUserFindMany,
    },
  },
}));

// ── Router imports (after mocks) ──────────────────────────────────────────

import { approvalsRouter } from '../approvals';
import type { AdminTRPCContext } from '@/server/context-admin';
import type { AdminLuciaSession, AdminLuciaUser } from '@/lib/auth/lucia-admin';
import type { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// ── Fixtures ──────────────────────────────────────────────────────────────

const SUPER_ADMIN: AdminLuciaUser = {
  id: 1,
  email: 'super@quanan.com',
  role: 'super_admin',
  isMock: true,
  isActive: true,
};

const ADMIN: AdminLuciaUser = {
  id: 2,
  email: 'admin@quanan.com',
  role: 'admin',
  isMock: true,
  isActive: true,
};

const READONLY: AdminLuciaUser = {
  id: 3,
  email: 'readonly@quanan.com',
  role: 'readonly_admin',
  isMock: true,
  isActive: true,
};

const MOCK_SESSION: AdminLuciaSession = {
  id: 'sess-001',
  expiresAt: new Date(Date.now() + 3600_000),
  fresh: false,
};

function makeCtx(user: AdminLuciaUser = SUPER_ADMIN): AdminTRPCContext {
  return {
    prisma: prisma as PrismaClient,
    adminPrisma: prisma as PrismaClient,
    traceId: 'trace-approvals-test',
    req: new Request('http://localhost/trpc/admin/approvals', {
      headers: { 'x-forwarded-for': '10.0.0.1', 'user-agent': 'test/1.0' },
    }),
    resHeaders: new Headers(),
    adminSession: MOCK_SESSION,
    activeAdminUser: user,
  };
}

const MOCK_APPROVAL_REQUEST = {
  id: 1,
  requesterAdminId: 3,
  requesterRole: 'admin',
  actionType: 'adjust_quota',
  actionPayload: { userId: 100, oldQuota: 50, newQuota: 350 },
  actionContext: null,
  riskLevel: 'medium',
  requireDualApproval: false,
  isEmergency: false,
  requesterReason: 'Test reason for adjustment',
  emergencyMode: false,
  emergencyIncidentId: null,
  postReviewRequired: false,
  postReviewerAdminId: null,
  postReviewResult: null,
  postReviewedAt: null,
  status: 'pending',
  approverAdminId: null,
  decisionReason: null,
  secondApproverAdminId: null,
  secondApprovedAt: null,
  secondDecisionReason: null,
  createdAt: new Date('2026-05-14T10:00:00Z'),
  decidedAt: null,
  expiresAt: new Date('2026-05-15T10:00:00Z'),
  executedAt: null,
  postReviewAt: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  // Default queryRaw responses for KPI
  let callIdx = 0;
  mockQueryRaw.mockImplementation(() => {
    callIdx++;
    if (callIdx === 1) return Promise.resolve([{ avg_hours: null }]); // avgTime
    if (callIdx === 2) return Promise.resolve([{ total: BigInt(0), rejected: BigInt(0) }]); // rate
    if (callIdx === 3) return Promise.resolve([{ total: BigInt(0), sla_met: BigInt(0) }]); // SLA
    return Promise.resolve([]);
  });
  mockApprovalCount.mockResolvedValue(0);
  mockApprovalFindMany.mockResolvedValue([]);
  mockAdminUserFindMany.mockResolvedValue([]);
  mockApprovalFindUniqueOrThrow.mockResolvedValue(MOCK_APPROVAL_REQUEST);
  mockApprovalUpdate.mockResolvedValue({ ...MOCK_APPROVAL_REQUEST, status: 'approved' });
});

// ── getKpiStats ────────────────────────────────────────────────────────────

describe('getKpiStats', () => {
  it('returns zeroed KPIs when no requests exist', async () => {
    const caller = approvalsRouter.createCaller(makeCtx());
    const result = await caller.getKpiStats();

    expect(result.pendingCount).toBe(0);
    expect(result.avgDecisionTimeHours).toBeNull();
    expect(result.rejectionRate).toBe(0);
    expect(result.emergencySlaRate).toBe(100); // no emergencies → 100%
  });

  it('computes rejectionRate correctly', async () => {
    let call = 0;
    mockQueryRaw.mockImplementation(() => {
      call++;
      if (call === 1) return Promise.resolve([{ avg_hours: 2.5 }]);
      if (call === 2) return Promise.resolve([{ total: BigInt(10), rejected: BigInt(3) }]);
      return Promise.resolve([{ total: BigInt(5), sla_met: BigInt(4) }]);
    });
    mockApprovalCount.mockResolvedValue(2);

    const caller = approvalsRouter.createCaller(makeCtx());
    const result = await caller.getKpiStats();

    expect(result.pendingCount).toBe(2);
    expect(result.avgDecisionTimeHours).toBe(2.5);
    expect(result.rejectionRate).toBe(30); // 3/10 = 30%
    expect(result.emergencySlaRate).toBe(80); // 4/5 = 80%
  });
});

// ── listPending ────────────────────────────────────────────────────────────

describe('listPending', () => {
  it('returns empty list when no pending requests', async () => {
    mockApprovalFindMany.mockResolvedValue([]);
    const caller = approvalsRouter.createCaller(makeCtx());
    const result = await caller.listPending({ limit: 20 });

    expect(result.items).toHaveLength(0);
    expect(result.nextCursor).toBeUndefined();
  });

  it('enriches items with displayStatus derived field', async () => {
    const dualPendingAfterFirst = {
      ...MOCK_APPROVAL_REQUEST,
      id: 10,
      requireDualApproval: true,
      approverAdminId: 2, // first approval done
      status: 'pending',
    };
    mockApprovalFindMany.mockResolvedValue([dualPendingAfterFirst]);
    mockAdminUserFindMany.mockResolvedValue([{ id: 2, email: 'admin@quanan.com' }]);

    const caller = approvalsRouter.createCaller(makeCtx());
    const result = await caller.listPending({ limit: 20 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.displayStatus).toBe('first_approved');
    expect(result.items[0]!.firstApproverEmail).toBe('admin@quanan.com');
  });
});

// ── listDecided ────────────────────────────────────────────────────────────

describe('listDecided', () => {
  it('returns decided requests in order', async () => {
    const decided = { ...MOCK_APPROVAL_REQUEST, status: 'approved', approverAdminId: 1, decidedAt: new Date() };
    mockApprovalFindMany.mockResolvedValue([decided]);
    mockAdminUserFindMany.mockResolvedValue([{ id: 1, email: 'super@quanan.com' }]);

    const caller = approvalsRouter.createCaller(makeCtx());
    const result = await caller.listDecided({ limit: 20 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.status).toBe('approved');
    expect(result.items[0]!.firstApproverEmail).toBe('super@quanan.com');
  });
});

// ── approveRequest ─────────────────────────────────────────────────────────

describe('approveRequest', () => {
  it('delegates to approveRequest service and returns ok', async () => {
    mockApproveRequestSvc.mockResolvedValue({
      ...MOCK_APPROVAL_REQUEST,
      status: 'approved',
      approverAdminId: 1,
      requireDualApproval: false,
      secondApproverAdminId: null,
    });

    const caller = approvalsRouter.createCaller(makeCtx());
    const result = await caller.approveRequest({ requestId: 1, decisionReason: 'Approved after review' });

    expect(result.ok).toBe(true);
    expect(mockApproveRequestSvc).toHaveBeenCalledWith(1, 1); // adminId=1, requestId=1
  });

  it('rejects when decisionReason is too short', async () => {
    const caller = approvalsRouter.createCaller(makeCtx());
    await expect(
      caller.approveRequest({ requestId: 1, decisionReason: 'short' }),
    ).rejects.toThrow();
  });

  it('throws FORBIDDEN for readonly_admin', async () => {
    const caller = approvalsRouter.createCaller(makeCtx(READONLY));
    await expect(
      caller.approveRequest({ requestId: 1, decisionReason: 'Valid reason text here' }),
    ).rejects.toThrow(TRPCError);
  });
});

// ── rejectRequest ──────────────────────────────────────────────────────────

describe('rejectRequest', () => {
  it('rejects a pending request and returns ok', async () => {
    mockApprovalFindUniqueOrThrow.mockResolvedValue({ ...MOCK_APPROVAL_REQUEST, status: 'pending' });
    mockApprovalUpdate.mockResolvedValue({ ...MOCK_APPROVAL_REQUEST, status: 'rejected' });

    const caller = approvalsRouter.createCaller(makeCtx(ADMIN));
    const result = await caller.rejectRequest({ requestId: 1, decisionReason: 'Risk too high for this change' });

    expect(result.ok).toBe(true);
    expect(mockApprovalUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: expect.objectContaining({ status: 'rejected' }),
      }),
    );
  });

  it('throws BAD_REQUEST when request is already approved', async () => {
    mockApprovalFindUniqueOrThrow.mockResolvedValue({ ...MOCK_APPROVAL_REQUEST, status: 'approved' });

    const caller = approvalsRouter.createCaller(makeCtx());
    await expect(
      caller.rejectRequest({ requestId: 1, decisionReason: 'Attempt to reject already approved' }),
    ).rejects.toThrow(TRPCError);
  });
});

// ── emergencyApprove ───────────────────────────────────────────────────────

describe('emergencyApprove', () => {
  it('calls emergencyApproveSvc with incidentId and returns ok', async () => {
    mockEmergencyApproveSvc.mockResolvedValue({ ...MOCK_APPROVAL_REQUEST, id: 5, status: 'approved' });

    const caller = approvalsRouter.createCaller(makeCtx(SUPER_ADMIN));
    const result = await caller.emergencyApprove({
      requestId: 5,
      incidentId: 'INC-2026-001',
      decisionReason: 'Critical production incident requiring immediate action',
    });

    expect(result.ok).toBe(true);
    expect(result.id).toBe(5);
    expect(mockEmergencyApproveSvc).toHaveBeenCalledWith(5, 1, 'INC-2026-001', 'super_admin', expect.any(String));
  });

  it('throws FORBIDDEN when non-super_admin calls emergencyApprove', async () => {
    const caller = approvalsRouter.createCaller(makeCtx(ADMIN));
    await expect(
      caller.emergencyApprove({ requestId: 1, incidentId: 'INC-001', decisionReason: 'test reason here' }),
    ).rejects.toThrow(TRPCError);
  });

  it('throws validation error when incidentId is empty', async () => {
    const caller = approvalsRouter.createCaller(makeCtx(SUPER_ADMIN));
    await expect(
      caller.emergencyApprove({ requestId: 1, incidentId: '', decisionReason: 'Valid reason here for emergency' }),
    ).rejects.toThrow();
  });
});

// ── listPostReview ─────────────────────────────────────────────────────────

describe('listPostReview', () => {
  it('returns post-review items for super_admin', async () => {
    const postReviewItem = {
      ...MOCK_APPROVAL_REQUEST,
      id: 20,
      postReviewRequired: true,
      postReviewedAt: null,
      status: 'approved',
      decidedAt: new Date(Date.now() - 8 * 3600_000), // 8h ago
    };
    mockApprovalFindMany.mockResolvedValue([postReviewItem]);

    const caller = approvalsRouter.createCaller(makeCtx(SUPER_ADMIN));
    const result = await caller.listPostReview();

    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe(20);
  });

  it('throws FORBIDDEN for non-super_admin', async () => {
    const caller = approvalsRouter.createCaller(makeCtx(ADMIN));
    await expect(caller.listPostReview()).rejects.toThrow(TRPCError);
  });
});

// ── postReviewApprove ──────────────────────────────────────────────────────

describe('postReviewApprove', () => {
  it('delegates to postReviewApproveSvc', async () => {
    mockPostReviewApproveSvc.mockResolvedValue({ ok: true });

    const caller = approvalsRouter.createCaller(makeCtx(SUPER_ADMIN));
    const result = await caller.postReviewApprove({ requestId: 1, result: 'confirmed' });

    expect(result.ok).toBe(true);
    expect(mockPostReviewApproveSvc).toHaveBeenCalledWith(1, 1, 'confirmed', expect.any(String));
  });
});
