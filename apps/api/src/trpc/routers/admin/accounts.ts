// PRD-11 US-010 · adminRouter.accounts — 6 procedures
// list/detail/flag/unflag/addNote/forceFreeze
// SHIELD: SET LOCAL via adminRLS middleware (ctx.adminPrisma)
// SHIELD: super_admin→approval_requests({status:auto_executed}) · admin→{status:pending}
// SHIELD: Promise.all for multi-table reads (not serial awaits)

import { TRPCError } from '@trpc/server';
import { z } from 'zod';


import { logAdminAction } from '@/services/admin/admin-audit-service';
import { adminProcedure } from '@/trpc/procedures/admin';
import { adminTrpcRouter } from '@/trpc/trpc-admin';

import type { Prisma } from '@prisma/client';

function getIp(ctx: { req: Request }): string {
  return (
    ctx.req.headers.get('x-forwarded-for') ??
    ctx.req.headers.get('x-real-ip') ??
    '0.0.0.0'
  );
}

async function guardMutation(ctx: Parameters<Parameters<typeof adminProcedure.mutation>[0]>[0]['ctx']): Promise<void> {
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

// ── list ───────────────────────────────────────────────────────────────────

const listInput = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  industryFilter: z.string().optional(),
  platformFilter: z.string().optional(),
  levelFilter: z.string().optional(),
  stageFilter: z.string().optional(),
  anomalyOnly: z.boolean().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name']).default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});

// ── detail ─────────────────────────────────────────────────────────────────

const detailInput = z.object({ accountId: z.number().int() });

// ── flag ───────────────────────────────────────────────────────────────────

const flagInput = z.object({
  accountId: z.number().int(),
  anomalyType: z.string().min(1),
  severity: z.enum(['low', 'medium', 'high']),
  evidence: z.record(z.unknown()),
});

// ── unflag ─────────────────────────────────────────────────────────────────

const unflagInput = z.object({
  flagId: z.number().int(),
  resolution: z.enum(['false_positive', 'admin_action', 'auto_resolved']),
});

// ── addNote ────────────────────────────────────────────────────────────────

const addNoteInput = z.object({
  accountId: z.number().int(),
  note: z.string().min(1),
  visibleToOtherAdmin: z.boolean().default(true),
});

// ── forceFreeze ────────────────────────────────────────────────────────────

const forceFreezeInput = z.object({
  accountId: z.number().int(),
  freezeReason: z.string().min(1),
});

// ── Router ──────────────────────────────────────────────────────────────────

export const accountsRouter = adminTrpcRouter({
  /** Cross-account list with search + multi-dimensional filters (AC-2) */
  list: adminProcedure.input(listInput).query(async ({ input, ctx }) => {
    const db = ctx.adminPrisma ?? ctx.prisma;
    const {
      page, pageSize, search, industryFilter, platformFilter,
      levelFilter, stageFilter, anomalyOnly, sortBy, sortDir,
    } = input;

    const where: Record<string, unknown> = {};
    if (search) {
      where['OR'] = [
        { name: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (industryFilter) where['industry'] = industryFilter;
    if (platformFilter) where['platform'] = platformFilter;
    if (stageFilter) where['stage'] = stageFilter;
    if (levelFilter) where['evolutionProfile'] = { level: levelFilter };
    if (anomalyOnly) where['anomalyFlags'] = { some: { resolvedAt: null } };

    const orderBy = { [sortBy]: sortDir };
    const skip = (page - 1) * pageSize;

    const [accounts, count] = await Promise.all([
      db.ipAccount.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          evolutionProfile: true,
          user: true,
          _count: { select: { anomalyFlags: true } },
        },
      }),
      db.ipAccount.count({ where }),
    ]);

    void logAdminAction({
      actorAdminId: ctx.activeAdminUser!.id,
      actorRole: ctx.activeAdminUser!.role,
      eventCategory: 'cross_account_query',
      eventType: 'list_ip_accounts',
      payload: { page, pageSize, search, industryFilter, platformFilter, levelFilter, stageFilter, anomalyOnly },
      traceId: ctx.traceId,
      ip: getIp(ctx),
      userAgent: ctx.req.headers.get('user-agent') ?? '',
      sessionId: ctx.adminSession?.id ?? '',
      success: true,
    });

    return { accounts, count, page, pageSize };
  }),

  /** Account detail: 6-table parallel query (AC-3) */
  detail: adminProcedure.input(detailInput).query(async ({ input, ctx }) => {
    const db = ctx.adminPrisma ?? ctx.prisma;
    const { accountId } = input;

    const [
      accountWithUser,
      stepData,
      [evolutionProfile, insights],
      histories,
      adminNotes,
      anomalyFlags,
    ] = await Promise.all([
      db.ipAccount.findUnique({ where: { id: accountId }, include: { user: true } }),
      db.stepData.findMany({ where: { accountId }, orderBy: { createdAt: 'desc' }, take: 50 }),
      Promise.all([
        db.evolutionProfile.findUnique({ where: { accountId } }),
        db.evolutionInsight.findMany({ where: { accountId }, orderBy: { createdAt: 'desc' }, take: 10 }),
      ]),
      db.history.findMany({ where: { accountId }, orderBy: { createdAt: 'desc' }, take: 50 }),
      db.ipAccountAdminNote.findMany({ where: { accountId }, orderBy: { createdAt: 'desc' } }),
      db.ipAccountAnomalyFlag.findMany({ where: { accountId, resolvedAt: null } }),
    ]);

    void logAdminAction({
      actorAdminId: ctx.activeAdminUser!.id,
      actorRole: ctx.activeAdminUser!.role,
      eventCategory: 'cross_account_query',
      eventType: 'view_account_detail',
      payload: { accountId },
      targetAccountId: accountId,
      traceId: ctx.traceId,
      ip: getIp(ctx),
      userAgent: ctx.req.headers.get('user-agent') ?? '',
      sessionId: ctx.adminSession?.id ?? '',
      success: true,
    });

    return { account: accountWithUser, stepData, evolutionProfile, insights, histories, adminNotes, anomalyFlags };
  }),

  /** Flag anomaly account — medium risk, no Approval (AC-4) */
  flag: adminProcedure.input(flagInput).mutation(async ({ input, ctx }) => {
    await guardMutation(ctx);

    const db = ctx.adminPrisma ?? ctx.prisma;
    const { accountId, anomalyType, severity, evidence } = input;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const existing = await db.ipAccountAnomalyFlag.findFirst({
      where: { accountId, anomalyType, detectedAt: { gte: todayStart }, resolvedAt: null },
    });
    if (existing) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'already flagged today' });
    }

    const flag = await db.ipAccountAnomalyFlag.create({
      data: { accountId, anomalyType, severity, evidence: evidence as Prisma.InputJsonValue },
    });

    void logAdminAction({
      actorAdminId: ctx.activeAdminUser!.id,
      actorRole: ctx.activeAdminUser!.role,
      eventCategory: 'data_mutation',
      eventType: 'flag_account_anomaly',
      payload: { accountId, anomalyType, severity },
      targetAccountId: accountId,
      traceId: ctx.traceId,
      ip: getIp(ctx),
      userAgent: ctx.req.headers.get('user-agent') ?? '',
      sessionId: ctx.adminSession?.id ?? '',
      success: true,
    });

    return { flagId: flag.id };
  }),

  /** Unflag anomaly — medium risk, updates resolvedAt (AC-5) */
  unflag: adminProcedure.input(unflagInput).mutation(async ({ input, ctx }) => {
    await guardMutation(ctx);

    const db = ctx.adminPrisma ?? ctx.prisma;
    const { flagId, resolution } = input;

    const flag = await db.ipAccountAnomalyFlag.findUnique({ where: { id: flagId } });
    if (!flag) throw new TRPCError({ code: 'NOT_FOUND', message: 'anomaly flag not found' });
    if (flag.resolvedAt !== null) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'already resolved' });
    }

    await db.ipAccountAnomalyFlag.update({
      where: { id: flagId },
      data: {
        resolvedAt: new Date(),
        resolvedByAdminId: ctx.activeAdminUser!.id,
        resolution,
      },
    });

    void logAdminAction({
      actorAdminId: ctx.activeAdminUser!.id,
      actorRole: ctx.activeAdminUser!.role,
      eventCategory: 'data_mutation',
      eventType: 'unflag_account_anomaly',
      payload: { flagId, resolution, accountId: flag.accountId },
      targetAccountId: flag.accountId,
      traceId: ctx.traceId,
      ip: getIp(ctx),
      userAgent: ctx.req.headers.get('user-agent') ?? '',
      sessionId: ctx.adminSession?.id ?? '',
      success: true,
    });

    return { status: 'ok' as const };
  }),

  /** Add internal admin note to account (AC-6) */
  addNote: adminProcedure.input(addNoteInput).mutation(async ({ input, ctx }) => {
    await guardMutation(ctx);

    const db = ctx.adminPrisma ?? ctx.prisma;
    const { accountId, note, visibleToOtherAdmin } = input;

    const created = await db.ipAccountAdminNote.create({
      data: {
        accountId,
        adminId: ctx.activeAdminUser!.id,
        note,
        visibleToOtherAdmin,
      },
    });

    void logAdminAction({
      actorAdminId: ctx.activeAdminUser!.id,
      actorRole: ctx.activeAdminUser!.role,
      eventCategory: 'data_mutation',
      eventType: 'add_account_note',
      payload: { accountId, visibleToOtherAdmin },
      targetAccountId: accountId,
      traceId: ctx.traceId,
      ip: getIp(ctx),
      userAgent: ctx.req.headers.get('user-agent') ?? '',
      sessionId: ctx.adminSession?.id ?? '',
      success: true,
    });

    return { noteId: created.id };
  }),

  /** Force-freeze account — high risk, Approval Gates stub (AC-7~10) */
  forceFreeze: adminProcedure.input(forceFreezeInput).mutation(async ({ input, ctx }) => {
    await guardMutation(ctx);

    const db = ctx.adminPrisma ?? ctx.prisma;
    const { accountId, freezeReason } = input;

    const account = await db.ipAccount.findUnique({
      where: { id: accountId },
      select: { id: true, frozenAt: true },
    });
    if (!account) throw new TRPCError({ code: 'NOT_FOUND', message: 'account not found' });
    if (account.frozenAt !== null) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'account already frozen' });
    }

    const actorRole = ctx.activeAdminUser!.role;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const actionPayload = { accountId, freezeReason };

    if (actorRole === 'super_admin') {
      const approvalRequest = await db.approvalRequest.create({
        data: {
          requesterAdminId: ctx.activeAdminUser!.id,
          requesterRole: actorRole,
          actionType: 'force_freeze_account',
          actionPayload,
          riskLevel: 'high',
          requireDualApproval: false,
          requesterReason: freezeReason,
          status: 'auto_executed',
          expiresAt,
          approverAdminId: ctx.activeAdminUser!.id,
          executedAt: new Date(),
        },
      });

      await db.ipAccount.update({
        where: { id: accountId },
        data: {
          frozenAt: new Date(),
          frozenByAdminId: ctx.activeAdminUser!.id,
          freezeReason,
        },
      });

      void logAdminAction({
        actorAdminId: ctx.activeAdminUser!.id,
        actorRole,
        eventCategory: 'high_risk_action',
        eventType: 'force_freeze_account',
        payload: actionPayload,
        targetAccountId: accountId,
        approvalRequestId: approvalRequest.id,
        traceId: ctx.traceId,
        ip: getIp(ctx),
        userAgent: ctx.req.headers.get('user-agent') ?? '',
        sessionId: ctx.adminSession?.id ?? '',
        success: true,
      });

      return { status: 'auto_executed' as const, approvalRequestId: approvalRequest.id };
    } else {
      const approvalRequest = await db.approvalRequest.create({
        data: {
          requesterAdminId: ctx.activeAdminUser!.id,
          requesterRole: actorRole,
          actionType: 'force_freeze_account',
          actionPayload,
          riskLevel: 'high',
          requireDualApproval: false,
          requesterReason: freezeReason,
          status: 'pending',
          expiresAt,
        },
      });

      void logAdminAction({
        actorAdminId: ctx.activeAdminUser!.id,
        actorRole,
        eventCategory: 'high_risk_action',
        eventType: 'approval_request_create',
        payload: { actionType: 'force_freeze_account', ...actionPayload },
        targetAccountId: accountId,
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
});
