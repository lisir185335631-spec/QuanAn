// PRD-12 US-009 · reviewDeepLearnRouter unit tests — ≥ 30 tests
// list / detail / approve / reject / banUploader / userViolations / auth gates

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ──────────────────────────────────────────────────────────

const mockLogAdminAction = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

const mockQueueFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockQueueCount = vi.hoisted(() => vi.fn().mockResolvedValue(0));
const mockQueueFindUnique = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockQueueUpdate = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const mockDeepLearningArchiveCreate = vi.hoisted(() => vi.fn().mockResolvedValue({ id: 77 }));
const mockViolationLogFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockViolationLogFindFirst = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockViolationLogUpsert = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ id: 1, userId: 10, violationType: 'banned_content', count: 1 }),
);
const mockViolationLogUpdateMany = vi.hoisted(() => vi.fn().mockResolvedValue({ count: 1 }));
const mockApprovalRequestCreate = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ id: 99, status: 'auto_executed' }),
);
const mockExecuteRawUnsafe = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock('@/services/admin/admin-audit-service', () => ({
  logAdminAction: mockLogAdminAction,
}));

vi.mock('@/lib/prisma', () => {
  const buildTx = () => ({
    $executeRawUnsafe: mockExecuteRawUnsafe,
    deepLearnReviewQueue: {
      findMany: mockQueueFindMany,
      count: mockQueueCount,
      findUnique: mockQueueFindUnique,
      update: mockQueueUpdate,
    },
    deepLearningArchive: { create: mockDeepLearningArchiveCreate },
    userViolationLog: {
      findMany: mockViolationLogFindMany,
      findFirst: mockViolationLogFindFirst,
      upsert: mockViolationLogUpsert,
      updateMany: mockViolationLogUpdateMany,
    },
    approvalRequest: { create: mockApprovalRequestCreate },
  });

  return {
    prisma: {
      $transaction: vi.fn().mockImplementation((cb: (tx: unknown) => unknown) => cb(buildTx())),
      deepLearnReviewQueue: {
        findMany: mockQueueFindMany,
        count: mockQueueCount,
        findUnique: mockQueueFindUnique,
        update: mockQueueUpdate,
      },
      deepLearningArchive: { create: mockDeepLearningArchiveCreate },
      userViolationLog: {
        findMany: mockViolationLogFindMany,
        findFirst: mockViolationLogFindFirst,
        upsert: mockViolationLogUpsert,
        updateMany: mockViolationLogUpdateMany,
      },
      approvalRequest: { create: mockApprovalRequestCreate },
    },
  };
});

// ── Imports ────────────────────────────────────────────────────────────────

import { reviewDeepLearnRouter } from '@/trpc/routers/admin/review-deep-learn';
import type { AdminTRPCContext } from '@/server/context-admin';
import type { AdminLuciaSession, AdminLuciaUser } from '@/lib/auth/lucia-admin';
import type { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// ── Fixtures ───────────────────────────────────────────────────────────────

const SUPER_ADMIN: AdminLuciaUser = {
  id: 1,
  email: 'super@quanqn.com',
  role: 'super_admin',
  isMock: true,
  isActive: true,
};

const ADMIN_USER: AdminLuciaUser = {
  id: 2,
  email: 'admin@quanqn.com',
  role: 'admin',
  isMock: true,
  isActive: true,
};

const READONLY_ADMIN: AdminLuciaUser = {
  id: 3,
  email: 'ro@quanqn.com',
  role: 'readonly_admin',
  isMock: true,
  isActive: true,
};

const SESSION: AdminLuciaSession = {
  id: 'sess-us009',
  expiresAt: new Date(Date.now() + 3600_000),
  fresh: false,
};

function makeCtx(user: AdminLuciaUser): AdminTRPCContext {
  return {
    req: new Request('http://localhost', {
      headers: { 'x-forwarded-for': '10.0.0.1', 'user-agent': 'test-agent' },
    }),
    resHeaders: new Headers(),
    prisma: prisma as unknown as PrismaClient,
    adminPrisma: prisma as unknown as PrismaClient,
    activeAdminUser: user,
    adminSession: SESSION,
    traceId: 'trace-us009',
  };
}

function makeCaller(user: AdminLuciaUser) {
  return reviewDeepLearnRouter.createCaller(makeCtx(user));
}

const QUEUE_ITEM = {
  id: 1,
  userId: 10,
  accountId: 20,
  fileName: 'test-file.pdf',
  fileMime: 'application/pdf',
  fileSize: 1024,
  fileUrl: 'mock-s3://bucket/test-file.pdf',
  uploadedAt: new Date(),
  autoScanResult: { piiDetected: false, bannedWords: [] },
  autoVerdict: 'needs_review',
  status: 'pending',
  reviewerAdminId: null,
  reviewedAt: null,
  rejectReason: null,
  archiveId: null,
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe('reviewDeepLearnRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset defaults
    mockQueueFindMany.mockResolvedValue([]);
    mockQueueCount.mockResolvedValue(0);
    mockQueueFindUnique.mockResolvedValue(null);
    mockQueueUpdate.mockResolvedValue({});
    mockDeepLearningArchiveCreate.mockResolvedValue({ id: 77 });
    mockViolationLogFindMany.mockResolvedValue([]);
    mockViolationLogFindFirst.mockResolvedValue(null);
    mockViolationLogUpsert.mockResolvedValue({
      id: 1,
      userId: 10,
      violationType: 'banned_content',
      count: 1,
    });
    mockViolationLogUpdateMany.mockResolvedValue({ count: 1 });
    mockApprovalRequestCreate.mockResolvedValue({ id: 99, status: 'auto_executed' });

    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      (cb: (tx: unknown) => unknown) => {
        const tx = {
          $executeRawUnsafe: mockExecuteRawUnsafe,
          deepLearnReviewQueue: {
            findMany: mockQueueFindMany,
            count: mockQueueCount,
            findUnique: mockQueueFindUnique,
            update: mockQueueUpdate,
          },
          deepLearningArchive: { create: mockDeepLearningArchiveCreate },
          userViolationLog: {
            findMany: mockViolationLogFindMany,
            findFirst: mockViolationLogFindFirst,
            upsert: mockViolationLogUpsert,
            updateMany: mockViolationLogUpdateMany,
          },
          approvalRequest: { create: mockApprovalRequestCreate },
        };
        return cb(tx);
      },
    );
  });

  // ── list ──────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('returns paginated items and count', async () => {
      mockQueueFindMany.mockResolvedValue([QUEUE_ITEM]);
      mockQueueCount.mockResolvedValue(1);

      const result = await makeCaller(SUPER_ADMIN).list({});
      expect(result.items).toHaveLength(1);
      expect(result.count).toBe(1);
      expect(result.page).toBe(1);
    });

    it('filters by statusFilter', async () => {
      await makeCaller(ADMIN_USER).list({ statusFilter: 'pending' });
      const whereArg = (mockQueueFindMany.mock.calls[0] as [{ where: Record<string, unknown> }])[0].where;
      expect(whereArg['status']).toBe('pending');
    });

    it('filters by userIdFilter', async () => {
      await makeCaller(SUPER_ADMIN).list({ userIdFilter: 10 });
      const whereArg = (mockQueueFindMany.mock.calls[0] as [{ where: Record<string, unknown> }])[0].where;
      expect(whereArg['userId']).toBe(10);
    });

    it('filters by autoVerdictFilter', async () => {
      await makeCaller(SUPER_ADMIN).list({ autoVerdictFilter: 'needs_review' });
      const whereArg = (mockQueueFindMany.mock.calls[0] as [{ where: Record<string, unknown> }])[0].where;
      expect(whereArg['autoVerdict']).toBe('needs_review');
    });

    it('applies dateRange filter', async () => {
      const from = new Date('2026-01-01');
      const to = new Date('2026-12-31');
      await makeCaller(SUPER_ADMIN).list({ dateRange: { from, to } });
      const whereArg = (mockQueueFindMany.mock.calls[0] as [{ where: Record<string, unknown> }])[0].where;
      expect(whereArg['uploadedAt']).toMatchObject({ gte: from, lte: to });
    });

    it('writes cross_account_query audit log', async () => {
      await makeCaller(SUPER_ADMIN).list({});
      expect(mockLogAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'list_deep_learn_review_queue',
          eventCategory: 'cross_account_query',
        }),
      );
    });

    it('readonly_admin can call list', async () => {
      await expect(makeCaller(READONLY_ADMIN).list({})).resolves.toBeDefined();
    });

    it('handles empty results', async () => {
      const result = await makeCaller(SUPER_ADMIN).list({ page: 2, pageSize: 10 });
      expect(result.items).toHaveLength(0);
      expect(result.count).toBe(0);
    });
  });

  // ── detail ────────────────────────────────────────────────────────────────

  describe('detail', () => {
    it('returns full item with autoScanResult and metadata', async () => {
      mockQueueFindUnique.mockResolvedValue(QUEUE_ITEM);

      const result = await makeCaller(SUPER_ADMIN).detail({ queueId: 1 });
      expect(result.id).toBe(1);
      expect(result.autoScanResult).toBeDefined();
      expect(result.fileName).toBe('test-file.pdf');
    });

    it('returns userViolationCount from userViolationLog', async () => {
      mockQueueFindUnique.mockResolvedValue(QUEUE_ITEM);
      mockViolationLogFindMany.mockResolvedValue([
        { violationType: 'banned_content', count: 2, lastViolationAt: new Date(), suspendedAt: null },
        { violationType: 'pii_upload', count: 1, lastViolationAt: new Date(), suspendedAt: null },
      ]);

      const result = await makeCaller(SUPER_ADMIN).detail({ queueId: 1 });
      expect(result.userViolationCount).toBe(3);
    });

    it('returns archiveId when approved', async () => {
      mockQueueFindUnique.mockResolvedValue({ ...QUEUE_ITEM, status: 'approved', archiveId: 77 });
      const result = await makeCaller(SUPER_ADMIN).detail({ queueId: 1 });
      expect(result.archiveId).toBe(77);
    });

    it('returns textPreview from fileName', async () => {
      mockQueueFindUnique.mockResolvedValue(QUEUE_ITEM);
      const result = await makeCaller(SUPER_ADMIN).detail({ queueId: 1 });
      expect(result.textPreview).toBe('test-file.pdf');
    });

    it('truncates textPreview for very long filenames', async () => {
      const longName = 'a'.repeat(300);
      mockQueueFindUnique.mockResolvedValue({ ...QUEUE_ITEM, fileName: longName });
      const result = await makeCaller(SUPER_ADMIN).detail({ queueId: 1 });
      expect(result.textPreview).toContain('[truncated]');
      expect(result.textPreview.length).toBeLessThan(250);
    });

    it('throws NOT_FOUND when item missing', async () => {
      mockQueueFindUnique.mockResolvedValue(null);
      await expect(makeCaller(SUPER_ADMIN).detail({ queueId: 999 })).rejects.toThrow(
        'deep_learn_review_queue_not_found',
      );
    });

    it('readonly_admin can call detail', async () => {
      mockQueueFindUnique.mockResolvedValue(QUEUE_ITEM);
      await expect(makeCaller(READONLY_ADMIN).detail({ queueId: 1 })).resolves.toBeDefined();
    });
  });

  // ── approve ───────────────────────────────────────────────────────────────

  describe('approve', () => {
    it('approves a pending item and creates deepLearningArchive', async () => {
      mockQueueFindUnique.mockResolvedValue({ ...QUEUE_ITEM, status: 'pending' });
      mockDeepLearningArchiveCreate.mockResolvedValue({ id: 77 });

      const result = await makeCaller(SUPER_ADMIN).approve({ queueId: 1 });
      expect(result.archiveId).toBe(77);
      expect(result.queueId).toBe(1);
    });

    it('calls queue update twice: status + archiveId (atomic)', async () => {
      mockQueueFindUnique.mockResolvedValue({ ...QUEUE_ITEM, status: 'pending' });

      await makeCaller(SUPER_ADMIN).approve({ queueId: 1 });
      expect(mockQueueUpdate).toHaveBeenCalledTimes(2);
    });

    it('deepLearningArchive.create called exactly once (LD-A-5)', async () => {
      mockQueueFindUnique.mockResolvedValue({ ...QUEUE_ITEM, status: 'pending' });

      await makeCaller(SUPER_ADMIN).approve({ queueId: 1 });
      expect(mockDeepLearningArchiveCreate).toHaveBeenCalledTimes(1);
    });

    it('writes data_mutation/deep_learn_review_approve audit', async () => {
      mockQueueFindUnique.mockResolvedValue({ ...QUEUE_ITEM, status: 'pending' });
      await makeCaller(SUPER_ADMIN).approve({ queueId: 1 });
      expect(mockLogAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'deep_learn_review_approve',
          eventCategory: 'data_mutation',
        }),
      );
    });

    it('throws already_processed when status is approved', async () => {
      mockQueueFindUnique.mockResolvedValue({ ...QUEUE_ITEM, status: 'approved' });
      await expect(makeCaller(SUPER_ADMIN).approve({ queueId: 1 })).rejects.toThrow('already_processed');
    });

    it('throws already_processed when archiveId is set', async () => {
      mockQueueFindUnique.mockResolvedValue({ ...QUEUE_ITEM, archiveId: 77 });
      await expect(makeCaller(SUPER_ADMIN).approve({ queueId: 1 })).rejects.toThrow('already_processed');
    });

    it('throws NOT_FOUND when queue missing', async () => {
      mockQueueFindUnique.mockResolvedValue(null);
      await expect(makeCaller(SUPER_ADMIN).approve({ queueId: 999 })).rejects.toThrow(
        'deep_learn_review_queue_not_found',
      );
    });

    it('readonly_admin approve → FORBIDDEN', async () => {
      const err = await makeCaller(READONLY_ADMIN).approve({ queueId: 1 }).catch((e) => e);
      expect(err.message).toBe('privilege_escalation');
    });
  });

  // ── reject ────────────────────────────────────────────────────────────────

  describe('reject', () => {
    it('rejects item and upserts userViolationLog count+1', async () => {
      mockQueueFindUnique.mockResolvedValue({ ...QUEUE_ITEM, status: 'pending' });
      mockViolationLogUpsert.mockResolvedValue({
        id: 1, userId: 10, violationType: 'banned_content', count: 2,
      });

      const result = await makeCaller(SUPER_ADMIN).reject({ queueId: 1, rejectReason: 'contains PII data' });
      expect(result.status).toBe('rejected');
      expect(result.violationCount).toBe(2);
    });

    it('writes data_mutation/deep_learn_review_reject audit', async () => {
      mockQueueFindUnique.mockResolvedValue({ ...QUEUE_ITEM, status: 'pending' });
      await makeCaller(ADMIN_USER).reject({ queueId: 1, rejectReason: 'banned content found' });
      expect(mockLogAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'deep_learn_review_reject',
          eventCategory: 'data_mutation',
        }),
      );
    });

    it('triggers security_alert when violation count >= 3', async () => {
      mockQueueFindUnique.mockResolvedValue({ ...QUEUE_ITEM, status: 'pending' });
      mockViolationLogUpsert.mockResolvedValue({
        id: 1, userId: 10, violationType: 'banned_content', count: 3,
      });

      await makeCaller(SUPER_ADMIN).reject({ queueId: 1, rejectReason: 'multiple violations found' });

      const auditCalls = mockLogAdminAction.mock.calls as Array<[Record<string, unknown>]>;
      const alertCall = auditCalls.find(
        ([args]) => args['eventType'] === 'user_violation_warning',
      );
      expect(alertCall).toBeDefined();
      expect(alertCall?.[0]).toMatchObject({
        eventCategory: 'security_alert',
        eventType: 'user_violation_warning',
      });
    });

    it('does NOT trigger alert when violation count < 3', async () => {
      mockQueueFindUnique.mockResolvedValue({ ...QUEUE_ITEM, status: 'pending' });
      mockViolationLogUpsert.mockResolvedValue({
        id: 1, userId: 10, violationType: 'banned_content', count: 2,
      });

      await makeCaller(SUPER_ADMIN).reject({ queueId: 1, rejectReason: 'contains banned words' });

      const auditCalls = mockLogAdminAction.mock.calls as Array<[Record<string, unknown>]>;
      const alertCall = auditCalls.find(([args]) => args['eventType'] === 'user_violation_warning');
      expect(alertCall).toBeUndefined();
    });

    it('throws already_rejected when status is rejected', async () => {
      mockQueueFindUnique.mockResolvedValue({ ...QUEUE_ITEM, status: 'rejected' });
      await expect(
        makeCaller(SUPER_ADMIN).reject({ queueId: 1, rejectReason: 'already rejected item' }),
      ).rejects.toThrow('already_rejected');
    });

    it('throws NOT_FOUND when queue missing', async () => {
      mockQueueFindUnique.mockResolvedValue(null);
      await expect(
        makeCaller(SUPER_ADMIN).reject({ queueId: 999, rejectReason: 'banned content found' }),
      ).rejects.toThrow('deep_learn_review_queue_not_found');
    });

    it('readonly_admin reject → FORBIDDEN', async () => {
      mockQueueFindUnique.mockResolvedValue(QUEUE_ITEM);
      const err = await makeCaller(READONLY_ADMIN)
        .reject({ queueId: 1, rejectReason: 'some violation here' })
        .catch((e) => e);
      expect(err.message).toBe('privilege_escalation');
    });
  });

  // ── banUploader ───────────────────────────────────────────────────────────

  describe('banUploader', () => {
    it('super_admin: auto_executed + creates approvalRequest + suspends via updateMany', async () => {
      const result = await makeCaller(SUPER_ADMIN).banUploader({
        userId: 10,
        reason: 'repeated policy violations banned',
      });
      expect(result.status).toBe('auto_executed');
      expect(result.approvalRequestId).toBe(99);
      expect(mockViolationLogUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 10 } }),
      );
    });

    it('admin: pending + creates approvalRequest + no suspension', async () => {
      const result = await makeCaller(ADMIN_USER).banUploader({
        userId: 10,
        reason: 'repeated violation of content policy',
      });
      expect(result.status).toBe('pending');
      expect(result.approvalRequestId).toBeDefined();
      expect(mockViolationLogUpdateMany).not.toHaveBeenCalled();
    });

    it('super_admin writes high_risk_action/ban_uploader audit', async () => {
      await makeCaller(SUPER_ADMIN).banUploader({ userId: 10, reason: 'severe repeated violations' });
      expect(mockLogAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'ban_uploader',
          eventCategory: 'high_risk_action',
          approvalRequestId: 99,
        }),
      );
    });

    it('admin writes high_risk_action/approval_request_create audit', async () => {
      await makeCaller(ADMIN_USER).banUploader({ userId: 10, reason: 'multiple content violations' });
      expect(mockLogAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'approval_request_create',
          eventCategory: 'high_risk_action',
        }),
      );
    });

    it('throws uploader_already_suspended when suspendedAt is set', async () => {
      mockViolationLogFindFirst.mockResolvedValue({
        id: 1,
        suspendedAt: new Date(),
      });
      await expect(
        makeCaller(SUPER_ADMIN).banUploader({ userId: 10, reason: 'repeated content violations' }),
      ).rejects.toThrow('uploader_already_suspended');
    });

    it('readonly_admin banUploader → FORBIDDEN', async () => {
      const err = await makeCaller(READONLY_ADMIN)
        .banUploader({ userId: 10, reason: 'content policy violation' })
        .catch((e) => e);
      expect(err.message).toBe('privilege_escalation');
    });

    it('approvalRequest created with correct riskLevel=high', async () => {
      await makeCaller(SUPER_ADMIN).banUploader({ userId: 10, reason: 'repeated policy violations' });
      expect(mockApprovalRequestCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ riskLevel: 'high', actionType: 'ban_uploader' }),
        }),
      );
    });
  });

  // ── userViolations ────────────────────────────────────────────────────────

  describe('userViolations', () => {
    it('returns violations for a specific userId', async () => {
      mockViolationLogFindMany.mockResolvedValue([
        { id: 1, userId: 10, violationType: 'banned_content', count: 3, lastViolationAt: new Date(),
          lastReviewItemId: 1, warningCount: 0, suspendedAt: null, suspendedByAdminId: null, suspendedReason: null },
      ]);

      const result = await makeCaller(SUPER_ADMIN).userViolations({ userId: 10 });
      expect(result.violations).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('returns all high-count violations when userId is undefined', async () => {
      mockViolationLogFindMany.mockResolvedValue([
        { id: 1, userId: 10, violationType: 'banned_content', count: 5, lastViolationAt: new Date(),
          lastReviewItemId: 1, warningCount: 1, suspendedAt: null, suspendedByAdminId: null, suspendedReason: null },
        { id: 2, userId: 20, violationType: 'pii_upload', count: 3, lastViolationAt: new Date(),
          lastReviewItemId: 2, warningCount: 0, suspendedAt: null, suspendedByAdminId: null, suspendedReason: null },
      ]);

      const result = await makeCaller(SUPER_ADMIN).userViolations({});
      expect(result.violations).toHaveLength(2);
      // Verify count >= 3 filter applied (where arg)
      const whereArg = (mockViolationLogFindMany.mock.calls[0] as [{ where: Record<string, unknown> }])[0].where;
      expect(whereArg).toMatchObject({ count: { gte: 3 } });
    });

    it('writes cross_account_query audit log', async () => {
      await makeCaller(SUPER_ADMIN).userViolations({ userId: 10 });
      expect(mockLogAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'list_user_violations',
          eventCategory: 'cross_account_query',
        }),
      );
    });

    it('readonly_admin can call userViolations', async () => {
      await expect(makeCaller(READONLY_ADMIN).userViolations({ userId: 10 })).resolves.toBeDefined();
    });

    it('returns empty when no violations found', async () => {
      const result = await makeCaller(SUPER_ADMIN).userViolations({ userId: 999 });
      expect(result.violations).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });
});
