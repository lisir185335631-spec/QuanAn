// PRD-12 US-009 · adminRouter.reviewDeepLearn — 6 procedures
// list/detail/approve/reject/banUploader/userViolations
// SHIELD: approve は ONLY deepLearningArchive.create 点 (LD-A-5)
// SHIELD: reject → userViolationLog.upsert count+1 · count >= 3 → security_alert
// SHIELD: banUploader → Approval Gates stub · super_admin auto_executed / admin pending
// SHIELD: SET LOCAL app.role (via adminRLS middleware)

import { createHash } from 'node:crypto';

import { TRPCError } from '@trpc/server';
import { z } from 'zod';


import { logAdminAction } from '@/services/admin/admin-audit-service';
import { adminProcedure } from '@/trpc/procedures/admin';
import { adminTrpcRouter } from '@/trpc/trpc-admin';

import type { PrismaClient } from '@prisma/client';

// ── Types ──────────────────────────────────────────────────────────────────

type AdminCtx = Parameters<Parameters<typeof adminProcedure.mutation>[0]>[0]['ctx'];
type TxClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

// ── Helpers ────────────────────────────────────────────────────────────────

function getIp(ctx: { req: Request }): string {
  return (
    ctx.req.headers.get('x-forwarded-for') ??
    ctx.req.headers.get('x-real-ip') ??
    '0.0.0.0'
  );
}

async function guardMutation(ctx: AdminCtx): Promise<void> {
  if (ctx.activeAdminUser?.role === 'readonly_admin') {
    void logAdminAction({
      actorAdminId: ctx.activeAdminUser.id,
      actorRole: ctx.activeAdminUser.role,
      eventCategory: 'security_alert',
      eventType: 'privilege_escalation',
      payload: { role: ctx.activeAdminUser.role, action: 'mutation_attempt' },
      traceId: ctx.traceId,
      ip: getIp(ctx),
      userAgent: ctx.req.headers.get('user-agent') ?? '',
      sessionId: ctx.adminSession?.id ?? '',
      success: false,
      errorCode: 'FORBIDDEN',
    });
    throw new TRPCError({ code: 'FORBIDDEN', message: 'privilege_escalation' });
  }
}

/**
 * ★ LD-A-5 单点: ONLY 允许 deepLearningArchive.create 的函数
 * 在 approve $transaction 内调用 — grep verify 全项目仅 1 命中
 */
async function _createDeepLearningArchiveInTx(
  tx: TxClient,
  queueId: number,
  accountId: number,
  fileUrl: string,
): Promise<number> {
  const sampleHash = createHash('sha256')
    .update(`${accountId}:${fileUrl}:${queueId}`)
    .digest('hex');
  const archive = await tx.deepLearningArchive.create({
    data: {
      accountId,
      sourceType: 'file',
      sourceAssetId: queueId,
      sample: fileUrl,
      sampleHash,
      learningStatus: 'pending',
      agentId: 'DeepLearnAgent',
    },
  });
  return archive.id;
}

// ── Input schemas ──────────────────────────────────────────────────────────

const listInput = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  statusFilter: z
    .enum(['pending', 'approved', 'rejected', 'auto_approved', 'auto_rejected'])
    .optional(),
  userIdFilter: z.number().int().optional(),
  dateRange: z
    .object({
      from: z.coerce.date().optional(),
      to: z.coerce.date().optional(),
    })
    .optional(),
  autoVerdictFilter: z.enum(['auto_approved', 'auto_rejected', 'needs_review']).optional(),
});

const detailInput = z.object({
  queueId: z.number().int(),
});

const approveInput = z.object({
  queueId: z.number().int(),
});

const rejectInput = z.object({
  queueId: z.number().int(),
  rejectReason: z.string().min(5),
});

const banUploaderInput = z.object({
  userId: z.number().int(),
  reason: z.string().min(10),
});

const userViolationsInput = z.object({
  userId: z.number().int().optional(),
});

// ── Router ─────────────────────────────────────────────────────────────────

export const reviewDeepLearnRouter = adminTrpcRouter({
  /**
   * Paginated deep learn review queue list with filters.
   * AC-2: cross_account_query audit
   */
  list: adminProcedure.input(listInput).query(async ({ input, ctx }) => {
    const { page, pageSize, statusFilter, userIdFilter, dateRange, autoVerdictFilter } = input;
    const db = ctx.adminPrisma ?? ctx.prisma;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (statusFilter) where['status'] = statusFilter;
    if (userIdFilter !== undefined) where['userId'] = userIdFilter;
    if (autoVerdictFilter) where['autoVerdict'] = autoVerdictFilter;
    if (dateRange?.from || dateRange?.to) {
      const rangeFilter: Record<string, Date> = {};
      if (dateRange.from) rangeFilter['gte'] = dateRange.from;
      if (dateRange.to) rangeFilter['lte'] = dateRange.to;
      where['uploadedAt'] = rangeFilter;
    }

    const [items, count] = await Promise.all([
      db.deepLearnReviewQueue.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { uploadedAt: 'desc' },
        select: {
          id: true,
          userId: true,
          accountId: true,
          fileName: true,
          fileMime: true,
          fileSize: true,
          autoVerdict: true,
          status: true,
          reviewerAdminId: true,
          reviewedAt: true,
          rejectReason: true,
          archiveId: true,
          uploadedAt: true,
        },
      }),
      db.deepLearnReviewQueue.count({ where }),
    ]);

    void logAdminAction({
      actorAdminId: ctx.activeAdminUser!.id,
      actorRole: ctx.activeAdminUser!.role,
      eventCategory: 'cross_account_query',
      eventType: 'list_deep_learn_review_queue',
      payload: { page, pageSize, statusFilter, userIdFilter, autoVerdictFilter },
      traceId: ctx.traceId,
      ip: getIp(ctx),
      userAgent: ctx.req.headers.get('user-agent') ?? '',
      sessionId: ctx.adminSession?.id ?? '',
      success: true,
    });

    return { items, count, page, pageSize };
  }),

  /**
   * Full detail: autoScanResult + metadata + text preview (redacted) + user violation count.
   * AC-3
   */
  detail: adminProcedure.input(detailInput).query(async ({ input, ctx }) => {
    const db = ctx.adminPrisma ?? ctx.prisma;
    const item = await db.deepLearnReviewQueue.findUnique({ where: { id: input.queueId } });
    if (!item) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'deep_learn_review_queue_not_found' });
    }

    const violations = await db.userViolationLog.findMany({
      where: { userId: item.userId },
      select: { violationType: true, count: true, lastViolationAt: true, suspendedAt: true },
    });

    const totalViolationCount = violations.reduce((sum, v) => sum + v.count, 0);

    // Text preview: fileName (already redacted in worker — no raw PII persisted)
    const textPreview = item.fileName.length > 200
      ? item.fileName.slice(0, 200) + '...[truncated]'
      : item.fileName;

    return {
      ...item,
      textPreview,
      userViolationCount: totalViolationCount,
      userViolations: violations,
    };
  }),

  /**
   * Approve a queue item — atomic $transaction.
   * AC-4/AC-5. LD-A-5: single deepLearningArchive.create via _createDeepLearningArchiveInTx.
   * Audit: data_mutation/deep_learn_review_approve.
   */
  approve: adminProcedure.input(approveInput).mutation(async ({ input, ctx }) => {
    await guardMutation(ctx);
    const { queueId } = input;

    const result = await ctx.prisma.$transaction(async (tx) => {
      const queue = await tx.deepLearnReviewQueue.findUnique({ where: { id: queueId } });

      if (!queue) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'deep_learn_review_queue_not_found' });
      }
      if (queue.status === 'approved' || queue.archiveId !== null) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'already_processed' });
      }

      await tx.deepLearnReviewQueue.update({
        where: { id: queueId },
        data: {
          status: 'approved',
          reviewerAdminId: ctx.activeAdminUser!.id,
          reviewedAt: new Date(),
        },
      });

      // ★ LD-A-5 single point — ONLY deepLearningArchive.create in entire codebase
      const archiveId = await _createDeepLearningArchiveInTx(
        tx as unknown as TxClient,
        queueId,
        queue.accountId,
        queue.fileUrl,
      );

      await tx.deepLearnReviewQueue.update({
        where: { id: queueId },
        data: { archiveId },
      });

      return { queueId, archiveId };
    });

    void logAdminAction({
      actorAdminId: ctx.activeAdminUser!.id,
      actorRole: ctx.activeAdminUser!.role,
      eventCategory: 'data_mutation',
      eventType: 'deep_learn_review_approve',
      payload: { queueId, archiveId: result.archiveId },
      traceId: ctx.traceId,
      ip: getIp(ctx),
      userAgent: ctx.req.headers.get('user-agent') ?? '',
      sessionId: ctx.adminSession?.id ?? '',
      success: true,
    });

    return result;
  }),

  /**
   * Reject a queue item + cumulate userViolationLog.
   * AC-6: reject → userViolationLog.upsert count+1 · if count >= 3 → security_alert.
   * AC-9: already rejected → ValidationError.
   * Audit: data_mutation/deep_learn_review_reject.
   */
  reject: adminProcedure.input(rejectInput).mutation(async ({ input, ctx }) => {
    await guardMutation(ctx);
    const db = ctx.adminPrisma ?? ctx.prisma;
    const { queueId, rejectReason } = input;

    const queue = await db.deepLearnReviewQueue.findUnique({
      where: { id: queueId },
      select: { id: true, status: true, userId: true },
    });

    if (!queue) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'deep_learn_review_queue_not_found' });
    }
    if (queue.status === 'rejected') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'already_rejected' });
    }
    if (queue.status === 'approved') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'already_processed' });
    }

    await db.deepLearnReviewQueue.update({
      where: { id: queueId },
      data: {
        status: 'rejected',
        reviewerAdminId: ctx.activeAdminUser!.id,
        reviewedAt: new Date(),
        rejectReason,
      },
    });

    // Cumulate violation log — upsert count+1
    const violation = await db.userViolationLog.upsert({
      where: { userId_violationType: { userId: queue.userId, violationType: 'banned_content' } },
      update: {
        count: { increment: 1 },
        lastViolationAt: new Date(),
        lastReviewItemId: queueId,
      },
      create: {
        userId: queue.userId,
        violationType: 'banned_content',
        count: 1,
        lastViolationAt: new Date(),
        lastReviewItemId: queueId,
      },
    });

    void logAdminAction({
      actorAdminId: ctx.activeAdminUser!.id,
      actorRole: ctx.activeAdminUser!.role,
      eventCategory: 'data_mutation',
      eventType: 'deep_learn_review_reject',
      payload: { queueId, rejectReason, violationCount: violation.count },
      traceId: ctx.traceId,
      ip: getIp(ctx),
      userAgent: ctx.req.headers.get('user-agent') ?? '',
      sessionId: ctx.adminSession?.id ?? '',
      success: true,
    });

    // Auto alert if cumulative violation count >= 3
    if (violation.count >= 3) {
      void logAdminAction({
        actorAdminId: ctx.activeAdminUser!.id,
        actorRole: ctx.activeAdminUser!.role,
        eventCategory: 'security_alert',
        eventType: 'user_violation_warning',
        payload: { userId: queue.userId, violationCount: violation.count, violationType: 'banned_content' },
        targetUserId: queue.userId,
        traceId: ctx.traceId,
        ip: getIp(ctx),
        userAgent: ctx.req.headers.get('user-agent') ?? '',
        sessionId: ctx.adminSession?.id ?? '',
        success: true,
      });
    }

    return { queueId, status: 'rejected' as const, violationCount: violation.count };
  }),

  /**
   * Ban an uploader — high risk, Approval Gates stub.
   * AC-7: super_admin auto_executed / admin creates pending approval.
   * AC-9: already suspended → ValidationError.
   * Audit: high_risk_action/ban_uploader + approvalRequestId.
   */
  banUploader: adminProcedure.input(banUploaderInput).mutation(async ({ input, ctx }) => {
    await guardMutation(ctx);

    const db = ctx.adminPrisma ?? ctx.prisma;
    const { userId, reason } = input;

    // Check if already suspended (any violation type)
    const existingSuspension = await db.userViolationLog.findFirst({
      where: { userId, suspendedAt: { not: null } },
      select: { id: true, suspendedAt: true },
    });

    if (existingSuspension) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'uploader_already_suspended' });
    }

    const actorRole = ctx.activeAdminUser!.role;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const actionPayload = { userId, reason };

    if (actorRole === 'super_admin') {
      // super_admin: auto_executed — create approvalRequest + execute suspension
      const approvalRequest = await db.approvalRequest.create({
        data: {
          requesterAdminId: ctx.activeAdminUser!.id,
          requesterRole: actorRole,
          actionType: 'ban_uploader',
          actionPayload,
          riskLevel: 'high',
          requireDualApproval: false,
          requesterReason: reason,
          status: 'auto_executed',
          expiresAt,
          approverAdminId: ctx.activeAdminUser!.id,
          executedAt: new Date(),
        },
      });

      // Execute: mark user's violations as suspended
      await db.userViolationLog.updateMany({
        where: { userId },
        data: {
          suspendedAt: new Date(),
          suspendedByAdminId: ctx.activeAdminUser!.id,
          suspendedReason: reason,
        },
      });

      void logAdminAction({
        actorAdminId: ctx.activeAdminUser!.id,
        actorRole: actorRole,
        eventCategory: 'high_risk_action',
        eventType: 'ban_uploader',
        payload: actionPayload,
        targetUserId: userId,
        approvalRequestId: approvalRequest.id,
        traceId: ctx.traceId,
        ip: getIp(ctx),
        userAgent: ctx.req.headers.get('user-agent') ?? '',
        sessionId: ctx.adminSession?.id ?? '',
        success: true,
      });

      return { status: 'auto_executed' as const, approvalRequestId: approvalRequest.id };
    } else {
      // admin: create pending approval request (super_admin must approve)
      const approvalRequest = await db.approvalRequest.create({
        data: {
          requesterAdminId: ctx.activeAdminUser!.id,
          requesterRole: actorRole,
          actionType: 'ban_uploader',
          actionPayload,
          riskLevel: 'high',
          requireDualApproval: false,
          requesterReason: reason,
          status: 'pending',
          expiresAt,
        },
      });

      void logAdminAction({
        actorAdminId: ctx.activeAdminUser!.id,
        actorRole: actorRole,
        eventCategory: 'high_risk_action',
        eventType: 'approval_request_create',
        payload: { actionType: 'ban_uploader', ...actionPayload },
        targetUserId: userId,
        approvalRequestId: approvalRequest.id,
        traceId: ctx.traceId,
        ip: getIp(ctx),
        userAgent: ctx.req.headers.get('user-agent') ?? '',
        sessionId: ctx.adminSession?.id ?? '',
        success: true,
      });

      return { status: 'pending' as const, approvalRequestId: approvalRequest.id };
    }
  }),

  /**
   * List user violations — userId or null to list all with count >= 3.
   * AC-8: cross_account_query audit. Sorted desc count.
   */
  userViolations: adminProcedure.input(userViolationsInput).query(async ({ input, ctx }) => {
    const db = ctx.adminPrisma ?? ctx.prisma;
    const { userId } = input;

    const where = userId !== undefined
      ? { userId }
      : { count: { gte: 3 } };

    const violations = await db.userViolationLog.findMany({
      where,
      orderBy: { count: 'desc' },
      select: {
        id: true,
        userId: true,
        violationType: true,
        count: true,
        lastViolationAt: true,
        lastReviewItemId: true,
        warningCount: true,
        suspendedAt: true,
        suspendedByAdminId: true,
        suspendedReason: true,
      },
    });

    void logAdminAction({
      actorAdminId: ctx.activeAdminUser!.id,
      actorRole: ctx.activeAdminUser!.role,
      eventCategory: 'cross_account_query',
      eventType: 'list_user_violations',
      payload: { userId, resultCount: violations.length },
      traceId: ctx.traceId,
      ip: getIp(ctx),
      userAgent: ctx.req.headers.get('user-agent') ?? '',
      sessionId: ctx.adminSession?.id ?? '',
      success: true,
    });

    return { violations, total: violations.length };
  }),
});
