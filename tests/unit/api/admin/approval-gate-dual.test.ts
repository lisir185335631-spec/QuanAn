// PRD-13 US-002 · dual-approval service unit tests
// AC-11: ≥ 8 tests covering dual approval + emergency + post-review + backward compat
// AC-4/5/6/7: approveRequest dual / emergencyApprove / postReviewApprove / SHIELD checks

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';

// ---------------------------------------------------------------------------
// Hoisted mock factories
// ---------------------------------------------------------------------------

const mockApprovalFindUnique = vi.hoisted(() => vi.fn());
const mockApprovalUpdate = vi.hoisted(() => vi.fn());
const mockApprovalCreate = vi.hoisted(() => vi.fn());
const mockAuditLogCreate = vi.hoisted(() => vi.fn().mockResolvedValue({ id: 1 }));
const mockAuditLogFindFirst = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockTransaction = vi.hoisted(() =>
  vi.fn().mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => fn(mockTxClient)),
);

const mockTxClient = {
  approvalRequest: {
    update: vi.fn(),
  },
};

vi.mock('@/lib/prisma', () => ({
  prisma: {
    approvalRequest: {
      findUniqueOrThrow: mockApprovalFindUnique,
      update: mockApprovalUpdate,
      create: mockApprovalCreate,
      findMany: vi.fn().mockResolvedValue([]),
    },
    adminAuditLog: {
      create: mockAuditLogCreate,
      findFirst: mockAuditLogFindFirst,
    },
    $transaction: mockTransaction,
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// logAdminAction mock — fire-and-forget, never throws
vi.mock('@/services/admin/admin-audit-service', () => ({
  logAdminAction: vi.fn().mockResolvedValue(undefined),
}));

// ---------------------------------------------------------------------------
// Import SUT after mocks
// ---------------------------------------------------------------------------

const {
  requestApproval,
  approveRequest,
  emergencyApprove,
  postReviewApprove,
  requiresDualApproval,
  _approveRequestInTx,
} = await import('@/services/admin/approval/approvalGateService');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(overrides: Partial<{
  id: number;
  status: string;
  requireDualApproval: boolean;
  approverAdminId: number | null;
  postReviewRequired: boolean;
  postReviewedAt: Date | null;
}> = {}) {
  return {
    id: 1,
    status: 'pending',
    requireDualApproval: false,
    approverAdminId: null,
    actionType: 'ban_uploader',
    riskLevel: 'high',
    postReviewRequired: false,
    postReviewedAt: null,
    emergencyMode: false,
    emergencyIncidentId: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('requiresDualApproval', () => {
  it('returns true for dual-approval actionTypes', () => {
    expect(requiresDualApproval('ban_uploader')).toBe(true);
    expect(requiresDualApproval('publish_prompt')).toBe(true);
    expect(requiresDualApproval('adjust_quota')).toBe(true);
  });

  it('returns false for single-approval actionTypes', () => {
    expect(requiresDualApproval('evolution_anomaly_resolve')).toBe(false);
    expect(requiresDualApproval('quota_adjust_small')).toBe(false);
    expect(requiresDualApproval('prompt_canary_adjust')).toBe(false);
  });
});

describe('requestApproval', () => {
  beforeEach(() => {
    mockApprovalCreate.mockResolvedValue({ id: 1, status: 'pending' });
  });

  it('creates approval request with requireDualApproval derived from actionType', async () => {
    await requestApproval({
      actionType: 'ban_uploader',
      requesterAdminId: 1,
      requesterRole: 'admin',
      actionPayload: { userId: 42 },
      riskLevel: 'high',
    });

    expect(mockApprovalCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          requireDualApproval: true,
          actionType: 'ban_uploader',
          status: 'pending',
        }),
      }),
    );
  });

  it('throws BAD_REQUEST when emergencyMode=true but no emergencyIncidentId', async () => {
    await expect(
      requestApproval({
        actionType: 'publish_prompt',
        requesterAdminId: 1,
        requesterRole: 'super_admin',
        actionPayload: {},
        riskLevel: 'high',
        emergencyMode: true,
      }),
    ).rejects.toThrow(TRPCError);
  });

  it('backward compat: requireDualApproval=false creates single-approval request (PRD-10/11/12)', async () => {
    await requestApproval({
      actionType: 'ban_uploader',
      requesterAdminId: 0,
      requesterRole: 'system',
      actionPayload: { userId: 99 },
      riskLevel: 'high',
      requireDualApproval: false,
    });

    expect(mockApprovalCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ requireDualApproval: false }),
      }),
    );
  });
});

describe('approveRequest — single approval path', () => {
  beforeEach(() => {
    const req = makeRequest({ requireDualApproval: false });
    mockApprovalFindUnique.mockResolvedValue(req);
    mockTxClient.approvalRequest.update.mockResolvedValue({ ...req, status: 'approved' });
  });

  it('approves immediately when requireDualApproval=false', async () => {
    const result = await approveRequest(10, 1);
    expect(mockTransaction).toHaveBeenCalled();
    expect(mockTxClient.approvalRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: expect.objectContaining({ status: 'approved', approverAdminId: 10 }),
      }),
    );
    expect(result.status).toBe('approved');
  });

  it('throws BAD_REQUEST when request status is not pending', async () => {
    mockApprovalFindUnique.mockResolvedValue(makeRequest({ status: 'approved' }));
    await expect(approveRequest(10, 1)).rejects.toThrow(TRPCError);
  });
});

describe('approveRequest — dual approval path', () => {
  it('first approval: status stays pending, writes approverAdminId', async () => {
    const req = makeRequest({ requireDualApproval: true, approverAdminId: null });
    mockApprovalFindUnique.mockResolvedValue(req);
    mockApprovalUpdate.mockResolvedValue({ ...req, approverAdminId: 10, status: 'pending' });

    const result = await approveRequest(10, 1);
    expect(mockApprovalUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: expect.objectContaining({ approverAdminId: 10 }),
      }),
    );
    // status should NOT change to approved on first approval
    expect(result.status).toBe('pending');
  });

  it('SHIELD: second approver === first approver → throws FORBIDDEN_SAME_APPROVER', async () => {
    const req = makeRequest({ requireDualApproval: true, approverAdminId: 10 });
    mockApprovalFindUnique.mockResolvedValue(req);

    await expect(approveRequest(10, 1)).rejects.toThrow('FORBIDDEN_SAME_APPROVER');
  });

  it('second approval: different admin → status=approved + secondApproverAdminId', async () => {
    const req = makeRequest({ requireDualApproval: true, approverAdminId: 10 });
    mockApprovalFindUnique.mockResolvedValue(req);
    mockTxClient.approvalRequest.update.mockResolvedValue({
      ...req,
      status: 'approved',
      secondApproverAdminId: 20,
    });

    const result = await approveRequest(20, 1);
    expect(mockTransaction).toHaveBeenCalled();
    expect(mockTxClient.approvalRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'approved',
          secondApproverAdminId: 20,
        }),
      }),
    );
    expect(result.status).toBe('approved');
  });
});

describe('emergencyApprove', () => {
  it('SHIELD: non-super_admin → FORBIDDEN_EMERGENCY_NOT_SUPER_ADMIN', async () => {
    await expect(
      emergencyApprove(1, 10, 'INCIDENT-001', 'admin'),
    ).rejects.toThrow('FORBIDDEN_EMERGENCY_NOT_SUPER_ADMIN');
  });

  it('emergency approve: sets emergencyMode=true + postReviewRequired=true + status=approved', async () => {
    const req = makeRequest({ status: 'pending', approverAdminId: null });
    mockApprovalFindUnique.mockResolvedValue(req);
    mockApprovalUpdate.mockResolvedValue({ ...req });
    mockTxClient.approvalRequest.update.mockResolvedValue({
      ...req,
      status: 'approved',
      emergencyMode: true,
      emergencyIncidentId: 'INCIDENT-001',
      postReviewRequired: true,
    });

    const result = await emergencyApprove(1, 99, 'INCIDENT-001', 'super_admin');

    expect(mockTransaction).toHaveBeenCalled();
    expect(result.status).toBe('approved');
    expect(result.postReviewRequired).toBe(true);
    expect(result.emergencyMode).toBe(true);
  });

  it('throws BAD_REQUEST when request not in pending status', async () => {
    mockApprovalFindUnique.mockResolvedValue(makeRequest({ status: 'approved' }));
    await expect(
      emergencyApprove(1, 99, 'INCIDENT-001', 'super_admin'),
    ).rejects.toThrow(TRPCError);
  });
});

describe('postReviewApprove', () => {
  it('SHIELD: reviewer === firstApprover → FORBIDDEN_SAME_APPROVER', async () => {
    const req = makeRequest({ approverAdminId: 10, postReviewRequired: true, postReviewedAt: null });
    mockApprovalFindUnique.mockResolvedValue(req);

    await expect(postReviewApprove(1, 10, 'confirmed')).rejects.toThrow('FORBIDDEN_SAME_APPROVER');
  });

  it('sets postReviewedAt + postReviewerAdminId + postReviewResult', async () => {
    const req = makeRequest({ approverAdminId: 10, postReviewRequired: true, postReviewedAt: null });
    mockApprovalFindUnique.mockResolvedValue(req);
    mockApprovalUpdate.mockResolvedValue({
      ...req,
      postReviewerAdminId: 20,
      postReviewResult: 'confirmed',
      postReviewedAt: new Date(),
    });

    const result = await postReviewApprove(1, 20, 'confirmed');
    expect(mockApprovalUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          postReviewerAdminId: 20,
          postReviewResult: 'confirmed',
        }),
      }),
    );
    expect(result.postReviewResult).toBe('confirmed');
  });

  it('throws BAD_REQUEST when postReviewRequired=false', async () => {
    const req = makeRequest({ postReviewRequired: false });
    mockApprovalFindUnique.mockResolvedValue(req);

    await expect(postReviewApprove(1, 20, 'confirmed')).rejects.toThrow(TRPCError);
  });

  it('throws BAD_REQUEST when already post-reviewed', async () => {
    const req = makeRequest({ approverAdminId: 10, postReviewRequired: true, postReviewedAt: new Date() });
    mockApprovalFindUnique.mockResolvedValue(req);

    await expect(postReviewApprove(1, 20, 'confirmed')).rejects.toThrow(TRPCError);
  });
});
