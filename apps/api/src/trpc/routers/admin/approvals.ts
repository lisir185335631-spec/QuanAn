// PRD-13 US-011 · adminRouter.approvals
// Approval Gates: 待审批列表 + KPI + 详情 + 二次审批 + 紧急通道 + 历史决策 + 后置复核
// SHIELD: 第一审批人不能两次批 (client disabled + server FORBIDDEN_SAME_APPROVER)
// SHIELD: 紧急通道 incidentId 必填 (client + server 双校验)
// SHIELD: emergencyApprove → postReviewRequired=true 写 audit eventType='emergency_approval'

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { logAdminAction } from '@/services/admin/admin-audit-service';
import {
  approveRequest as approveRequestSvc,
  emergencyApprove as emergencyApproveSvc,
  postReviewApprove as postReviewApproveSvc,
} from '@/services/admin/approval/approvalGateService';
import { adminProcedure } from '@/trpc/procedures/admin';
import { adminTrpcRouter } from '@/trpc/trpc-admin';

// ── Helpers ────────────────────────────────────────────────────────────────

function guardSuperAdmin(ctx: { activeAdminUser?: { role?: string } | null }): void {
  if (ctx.activeAdminUser?.role !== 'super_admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'super_admin only' });
  }
}

function guardMutation(ctx: { activeAdminUser?: { role?: string } | null }): void {
  if (ctx.activeAdminUser?.role === 'readonly_admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'privilege_escalation' });
  }
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

/** Derive UI display status from raw DB fields */
function deriveDisplayStatus(req: {
  status: string;
  requireDualApproval: boolean;
  approverAdminId: number | null;
}): string {
  if (req.status === 'pending' && req.requireDualApproval && req.approverAdminId !== null) {
    return 'first_approved';
  }
  return req.status;
}

/** Bulk-fetch admin emails by ID list */
async function adminEmailMap(ids: (number | null | undefined)[]): Promise<Record<number, string>> {
  const uniqueIds = [...new Set(ids.filter((id): id is number => id != null))];
  if (uniqueIds.length === 0) return {};
  const admins = await prisma.adminUser.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true, email: true },
  });
  return Object.fromEntries(admins.map((a) => [a.id, a.email]));
}

/** Enrich a request record with derived fields and admin emails */
function enrichRequest(
  req: {
    id: number;
    requesterAdminId: number;
    requesterRole: string;
    actionType: string;
    actionPayload: unknown;
    riskLevel: string;
    requireDualApproval: boolean;
    emergencyMode: boolean;
    emergencyIncidentId: string | null;
    postReviewRequired: boolean;
    postReviewedAt: Date | null;
    postReviewResult: string | null;
    postReviewerAdminId: number | null;
    status: string;
    approverAdminId: number | null;
    decisionReason: string | null;
    secondApproverAdminId: number | null;
    secondApprovedAt: Date | null;
    secondDecisionReason: string | null;
    createdAt: Date;
    decidedAt: Date | null;
    expiresAt: Date;
    requesterReason: string;
  },
  emailMap: Record<number, string>,
) {
  const displayStatus = deriveDisplayStatus(req);
  return {
    ...req,
    displayStatus,
    requesterEmail: emailMap[req.requesterAdminId] ?? null,
    firstApproverEmail: req.approverAdminId != null ? (emailMap[req.approverAdminId] ?? null) : null,
    secondApproverEmail:
      req.secondApproverAdminId != null ? (emailMap[req.secondApproverAdminId] ?? null) : null,
  };
}

// ── Input schemas ──────────────────────────────────────────────────────────

const CursorInput = z.object({
  cursor: z.number().int().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

// ── Router ─────────────────────────────────────────────────────────────────

export const approvalsRouter = adminTrpcRouter({
  /**
   * 4 KPI 数字:
   * 1. 我可审批的待审批数 (pending + not my request + not my first approval)
   * 2. 平均审批时长(近 30 天)
   * 3. 拒绝率(近 30 天)
   * 4. 紧急 SLA 达成率 (emergencyMode + decided < 1h)
   */
  getKpiStats: adminProcedure.query(async ({ ctx }) => {
    const adminId = ctx.activeAdminUser!.id;
    const thirtyDaysAgo = daysAgo(30);

    const [pendingCount, avgTimeRows, rateRows, slaRows] = await Promise.all([
      // Pending I can approve
      prisma.approvalRequest.count({
        where: {
          status: 'pending',
          NOT: { requesterAdminId: adminId },
          OR: [{ approverAdminId: null }, { NOT: { approverAdminId: adminId } }],
        },
      }),
      // Avg decision time (hours) - last 30d
      prisma.$queryRaw<Array<{ avg_hours: number | null }>>`
        SELECT AVG(EXTRACT(EPOCH FROM ("decidedAt" - "createdAt")) / 3600)::float AS avg_hours
        FROM "approval_requests"
        WHERE "decidedAt" IS NOT NULL
          AND "createdAt" >= ${thirtyDaysAgo}
      `,
      // Rejection rate - last 30d
      prisma.$queryRaw<Array<{ total: bigint; rejected: bigint }>>`
        SELECT
          COUNT(*)::bigint AS total,
          COUNT(*) FILTER (WHERE status = 'rejected')::bigint AS rejected
        FROM "approval_requests"
        WHERE status IN ('approved', 'rejected')
          AND "createdAt" >= ${thirtyDaysAgo}
      `,
      // Emergency SLA (<1h) - last 30d
      prisma.$queryRaw<Array<{ total: bigint; sla_met: bigint }>>`
        SELECT
          COUNT(*)::bigint AS total,
          COUNT(*) FILTER (
            WHERE "decidedAt" IS NOT NULL
              AND "decidedAt" - "createdAt" <= INTERVAL '1 hour'
          )::bigint AS sla_met
        FROM "approval_requests"
        WHERE "emergencyMode" = true
          AND "createdAt" >= ${thirtyDaysAgo}
      `,
    ]);

    const avgHours = avgTimeRows[0]?.avg_hours ?? null;
    const rateRow = rateRows[0] ?? { total: BigInt(0), rejected: BigInt(0) };
    const slaRow = slaRows[0] ?? { total: BigInt(0), sla_met: BigInt(0) };
    const total = Number(rateRow.total);
    const rejected = Number(rateRow.rejected);
    const slaTotal = Number(slaRow.total);
    const slaMet = Number(slaRow.sla_met);

    return {
      pendingCount,
      avgDecisionTimeHours: avgHours != null ? Math.round(avgHours * 10) / 10 : null,
      rejectionRate: total > 0 ? Math.round((rejected / total) * 1000) / 10 : 0,
      emergencySlaRate: slaTotal > 0 ? Math.round((slaMet / slaTotal) * 1000) / 10 : 100,
    };
  }),

  /**
   * 待审批列表 — pending requests sorted by riskLevel desc
   */
  listPending: adminProcedure.input(CursorInput).query(async ({ input }) => {
    const riskOrder = { high: 0, medium: 1, low: 2, critical: 0 } as Record<string, number>;

    const rows = await prisma.approvalRequest.findMany({
      where: { status: 'pending' },
      orderBy: [{ riskLevel: 'asc' }, { createdAt: 'asc' }],
      take: input.limit + 1,
      cursor: input.cursor ? { id: input.cursor } : undefined,
      skip: input.cursor ? 1 : 0,
    });

    const hasMore = rows.length > input.limit;
    const items = rows.slice(0, input.limit);
    const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

    // Sort by risk priority client-side after pagination
    items.sort((a, b) => (riskOrder[a.riskLevel] ?? 1) - (riskOrder[b.riskLevel] ?? 1));

    const emailMap = await adminEmailMap(
      items.flatMap((r) => [r.requesterAdminId, r.approverAdminId, r.secondApproverAdminId]),
    );

    return {
      items: items.map((r) => enrichRequest(r as Parameters<typeof enrichRequest>[0], emailMap)),
      nextCursor,
    };
  }),

  /**
   * 历史决策列表 — approved / rejected / expired
   */
  listDecided: adminProcedure.input(CursorInput).query(async ({ input }) => {
    const rows = await prisma.approvalRequest.findMany({
      where: { status: { in: ['approved', 'rejected', 'expired'] } },
      orderBy: { decidedAt: 'desc' },
      take: input.limit + 1,
      cursor: input.cursor ? { id: input.cursor } : undefined,
      skip: input.cursor ? 1 : 0,
    });

    const hasMore = rows.length > input.limit;
    const items = rows.slice(0, input.limit);
    const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

    const emailMap = await adminEmailMap(
      items.flatMap((r) => [r.requesterAdminId, r.approverAdminId, r.secondApproverAdminId]),
    );

    return {
      items: items.map((r) => enrichRequest(r as Parameters<typeof enrichRequest>[0], emailMap)),
      nextCursor,
    };
  }),

  /**
   * 后置复核列表 — super_admin only
   * 列出 postReviewRequired=true 且未复核 + decidedAt > 6h ago
   */
  listPostReview: adminProcedure.query(async ({ ctx }) => {
    guardSuperAdmin(ctx);
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

    const rows = await prisma.approvalRequest.findMany({
      where: {
        postReviewRequired: true,
        postReviewedAt: null,
        decidedAt: { lte: sixHoursAgo },
      },
      orderBy: { decidedAt: 'asc' },
      take: 50,
    });

    const emailMap = await adminEmailMap(
      rows.flatMap((r) => [r.requesterAdminId, r.approverAdminId]),
    );

    return rows.map((r) => enrichRequest(r as Parameters<typeof enrichRequest>[0], emailMap));
  }),

  /**
   * 同类 actionType 近 10 条历史决策(供详情 Drawer 参考)
   */
  getHistoricalDecisions: adminProcedure
    .input(z.object({ actionType: z.string(), excludeId: z.number().int().optional() }))
    .query(async ({ input }) => {
      const rows = await prisma.approvalRequest.findMany({
        where: {
          actionType: input.actionType,
          status: { in: ['approved', 'rejected'] },
          ...(input.excludeId ? { NOT: { id: input.excludeId } } : {}),
        },
        orderBy: { decidedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          status: true,
          decisionReason: true,
          decidedAt: true,
          approverAdminId: true,
          riskLevel: true,
        },
      });

      const emailMap = await adminEmailMap(rows.map((r) => r.approverAdminId));

      return rows.map((r) => ({
        ...r,
        approverEmail: r.approverAdminId != null ? (emailMap[r.approverAdminId] ?? null) : null,
      }));
    }),

  /**
   * 批准申请 — 调用 service 处理单人 / dual 逻辑
   * SHIELD: 第一审批人不能两次批 (service throws FORBIDDEN_SAME_APPROVER)
   */
  approveRequest: adminProcedure
    .input(
      z.object({
        requestId: z.number().int(),
        decisionReason: z.string().min(10, '决策理由至少 10 个字'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      guardMutation(ctx);
      const adminId = ctx.activeAdminUser!.id;

      // Service handles dual-approval logic + same-approver check
      const result = await approveRequestSvc(adminId, input.requestId);

      // Persist decision reason (separate update — service doesn't carry it)
      await prisma.approvalRequest.update({
        where: { id: input.requestId },
        data: result.requireDualApproval && result.secondApproverAdminId === null
          // First approval in dual mode: save in decisionReason
          ? { decisionReason: input.decisionReason }
          // Single or second approval: save in secondDecisionReason if dual, else decisionReason
          : result.requireDualApproval
            ? { secondDecisionReason: input.decisionReason }
            : { decisionReason: input.decisionReason },
      }).catch(() => {});

      // Stub notification: logger.info (AC-11 · 真启留 PRR)
      logger.info(`[STUB] Notify requester ${result.requesterAdminId}: request ${input.requestId} approved`);

      return { ok: true, displayStatus: deriveDisplayStatus(result) };
    }),

  /**
   * 拒绝申请 — 直接写 DB (service 无 reject)
   */
  rejectRequest: adminProcedure
    .input(
      z.object({
        requestId: z.number().int(),
        decisionReason: z.string().min(10, '拒绝理由至少 10 个字'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      guardMutation(ctx);
      const adminId = ctx.activeAdminUser!.id;

      const req = await prisma.approvalRequest.findUniqueOrThrow({
        where: { id: input.requestId },
      });

      if (req.status !== 'pending') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `approval_request ${input.requestId} status is '${req.status}', expected 'pending'`,
        });
      }

      await prisma.approvalRequest.update({
        where: { id: input.requestId },
        data: {
          status: 'rejected',
          approverAdminId: adminId,
          decisionReason: input.decisionReason,
          decidedAt: new Date(),
        },
      });

      // Stub notification: logger.info (AC-11 · 真启留 PRR)
      logger.info(`[STUB] Notify requester ${req.requesterAdminId}: request ${req.id} rejected`);

      await logAdminAction({
        actorAdminId: adminId,
        actorRole: ctx.activeAdminUser!.role,
        eventCategory: 'approval',
        eventType: 'request_rejected',
        payload: { requestId: req.id, actionType: req.actionType, reason: input.decisionReason },
        traceId: ctx.traceId,
        ip: ctx.req.headers.get('x-forwarded-for') ?? '0.0.0.0',
        userAgent: ctx.req.headers.get('user-agent') ?? '',
        sessionId: ctx.adminSession?.id ?? 'system',
        success: true,
      }).catch(() => {});

      return { ok: true };
    }),

  /**
   * 紧急批准 — super_admin only · incidentId 必填
   * SHIELD: emergencyApprove 要求 incidentId (D-095)
   * 写 admin_audit_log eventType='emergency_approval'
   * 设 postReviewRequired=true (24h 后置复核)
   */
  emergencyApprove: adminProcedure
    .input(
      z.object({
        requestId: z.number().int(),
        incidentId: z.string().min(1, 'incidentId 必填'),
        decisionReason: z.string().min(10, '决策理由至少 10 个字'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      guardSuperAdmin(ctx);
      const adminId = ctx.activeAdminUser!.id;

      const result = await emergencyApproveSvc(
        input.requestId,
        adminId,
        input.incidentId,
        'super_admin',
        ctx.traceId,
      );

      // Persist reason
      await prisma.approvalRequest.update({
        where: { id: input.requestId },
        data: { decisionReason: input.decisionReason },
      }).catch(() => {});

      // Stub notification
      logger.info(`[STUB] Emergency approval ${result.id} notified (isMock=true · D-077)`);

      return { ok: true, id: result.id };
    }),

  /**
   * 后置复核 — super_admin only · reviewer ≠ firstApprover
   */
  postReviewApprove: adminProcedure
    .input(
      z.object({
        requestId: z.number().int(),
        result: z.enum(['confirmed', 'overturned', 'partial']),
        reviewNote: z.string().min(10).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      guardSuperAdmin(ctx);
      const adminId = ctx.activeAdminUser!.id;

      await postReviewApproveSvc(input.requestId, adminId, input.result, ctx.traceId);

      return { ok: true };
    }),
});
