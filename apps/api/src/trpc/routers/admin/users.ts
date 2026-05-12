// PRD-11 US-006 · adminRouter.users — 5 procedures
// list/detail/changePlan/banUser/resetPassword
// AC-1: all procedures use publicAdminProcedure (6 gates from adminProcedure)
// AC-9: readonly_admin → procedure-level 403 + audit privilege_escalation

import { randomBytes } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { redactSensitiveFields } from '@/lib/admin/audit-helpers';
import { logAdminAction } from '@/services/admin/admin-audit-service';
import { adminProcedure } from '@/trpc/procedures/admin';
import { adminTrpcRouter } from '@/trpc/trpc-admin';

import { createHash } from 'node:crypto';

function getIp(ctx: { req: Request }): string {
  return (
    ctx.req.headers.get('x-forwarded-for') ??
    ctx.req.headers.get('x-real-ip') ??
    '0.0.0.0'
  );
}

function makePayloadHash(payload: unknown): string {
  const redacted = redactSensitiveFields(payload);
  return createHash('sha256').update(JSON.stringify(redacted)).digest('hex');
}

/** Guard: write privilege_escalation audit + throw FORBIDDEN for readonly_admin */
async function guardMutation(ctx: Parameters<Parameters<typeof adminProcedure.mutation>[0]>[0]['ctx']): Promise<void> {
  if (ctx.activeAdminUser?.role === 'readonly_admin') {
    const payload = { role: ctx.activeAdminUser.role, action: 'mutation_attempt' };
    await logAdminAction({
      actorAdminId: ctx.activeAdminUser.id,
      actorRole: ctx.activeAdminUser.role,
      eventCategory: 'security_alert',
      eventType: 'privilege_escalation',
      payload,
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
  roleFilter: z.string().optional(),
  planFilter: z.string().optional(),
  industryFilter: z.string().optional(),
  sortBy: z.enum(['createdAt', 'lastLoginAt', 'email', 'name']).default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});

// ── detail ─────────────────────────────────────────────────────────────────

const detailInput = z.object({ userId: z.number().int() });

// ── changePlan ──────────────────────────────────────────────────────────────

const changePlanInput = z.object({
  userId: z.number().int(),
  newPlan: z.string().min(1),
  reason: z.string().min(10),
});

// ── banUser ─────────────────────────────────────────────────────────────────

const banUserInput = z.object({
  userId: z.number().int(),
  reason: z.string().min(10),
});

// ── resetPassword ───────────────────────────────────────────────────────────

const resetPasswordInput = z.object({ userId: z.number().int() });

// ── Router ──────────────────────────────────────────────────────────────────

export const usersRouter = adminTrpcRouter({
  /** Paginated user list with search + multi-dimensional filters (AC-2) */
  list: adminProcedure.input(listInput).query(async ({ input, ctx }) => {
    const db = ctx.adminPrisma ?? ctx.prisma;
    const { page, pageSize, search, roleFilter, planFilter, industryFilter, sortBy, sortDir } = input;

    const where: Record<string, unknown> = {};
    if (search) {
      where['OR'] = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (roleFilter) where['role'] = roleFilter;
    if (planFilter) where['plan'] = planFilter;
    if (industryFilter) where['industry'] = industryFilter;

    const orderBy = { [sortBy]: sortDir };
    const skip = (page - 1) * pageSize;

    const [users, count] = await Promise.all([
      db.user.findMany({ where, orderBy, skip, take: pageSize }),
      db.user.count({ where }),
    ]);

    void logAdminAction({
      actorAdminId: ctx.activeAdminUser!.id,
      actorRole: ctx.activeAdminUser!.role,
      eventCategory: 'cross_account_query',
      eventType: 'list_users',
      payload: { page, pageSize, search, roleFilter, planFilter, industryFilter },
      traceId: ctx.traceId,
      ip: getIp(ctx),
      userAgent: ctx.req.headers.get('user-agent') ?? '',
      sessionId: ctx.adminSession?.id ?? '',
      success: true,
    });

    return { users, count, page, pageSize };
  }),

  /** User detail: 5-tab parallel query (AC-3) */
  detail: adminProcedure.input(detailInput).query(async ({ input, ctx }) => {
    const db = ctx.adminPrisma ?? ctx.prisma;
    const { userId } = input;

    const [userWithProfile, ipAccounts, costAggregate, auditLogs, stepData] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        include: { ipAccounts: { include: { evolutionProfile: true } } },
      }),
      db.ipAccount.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      db.costLog.aggregate({
        where: { userId },
        _sum: { totalTokens: true },
        _count: { id: true },
      }),
      db.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      db.stepData.findMany({
        where: { ipAccount: { userId } },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

    void logAdminAction({
      actorAdminId: ctx.activeAdminUser!.id,
      actorRole: ctx.activeAdminUser!.role,
      eventCategory: 'cross_account_query',
      eventType: 'view_user_detail',
      payload: { userId },
      targetUserId: userId,
      traceId: ctx.traceId,
      ip: getIp(ctx),
      userAgent: ctx.req.headers.get('user-agent') ?? '',
      sessionId: ctx.adminSession?.id ?? '',
      success: true,
    });

    return { user: userWithProfile, ipAccounts, costAggregate, auditLogs, stepData };
  }),

  /** Change user plan — super_admin auto-executes, admin creates pending approval (AC-4) */
  changePlan: adminProcedure.input(changePlanInput).mutation(async ({ input, ctx }) => {
    await guardMutation(ctx);

    const db = ctx.adminPrisma ?? ctx.prisma;
    const { userId, newPlan, reason } = input;

    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, plan: true } });
    if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'user not found' });
    if (user.plan === newPlan) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: `already on plan ${newPlan}` });
    }

    const actorRole = ctx.activeAdminUser!.role;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const actionPayload = { userId, previousPlan: user.plan, newPlan, reason };

    if (actorRole === 'super_admin') {
      const approvalRequest = await db.approvalRequest.create({
        data: {
          requesterAdminId: ctx.activeAdminUser!.id,
          requesterRole: actorRole,
          actionType: 'change_user_plan',
          actionPayload,
          riskLevel: 'medium',
          requireDualApproval: false,
          requesterReason: reason,
          status: 'auto_executed',
          expiresAt,
          approverAdminId: ctx.activeAdminUser!.id,
          executedAt: new Date(),
        },
      });
      await db.user.update({ where: { id: userId }, data: { plan: newPlan } });
      void logAdminAction({
        actorAdminId: ctx.activeAdminUser!.id,
        actorRole: actorRole,
        eventCategory: 'high_risk_action',
        eventType: 'change_user_plan',
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
      const approvalRequest = await db.approvalRequest.create({
        data: {
          requesterAdminId: ctx.activeAdminUser!.id,
          requesterRole: actorRole,
          actionType: 'change_user_plan',
          actionPayload,
          riskLevel: 'medium',
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
        payload: { actionType: 'change_user_plan', ...actionPayload },
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

  /** Ban user — riskLevel=high, super_admin single-approves (PRD-11 stub), admin creates pending (AC-5) */
  banUser: adminProcedure.input(banUserInput).mutation(async ({ input, ctx }) => {
    await guardMutation(ctx);

    const db = ctx.adminPrisma ?? ctx.prisma;
    const { userId, reason } = input;

    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, isBanned: true } });
    if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'user not found' });
    if (user.isBanned) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'already banned' });
    }

    const actorRole = ctx.activeAdminUser!.role;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const actionPayload = { userId, reason };

    if (actorRole === 'super_admin') {
      const approvalRequest = await db.approvalRequest.create({
        data: {
          requesterAdminId: ctx.activeAdminUser!.id,
          requesterRole: actorRole,
          actionType: 'ban_user',
          actionPayload,
          riskLevel: 'high',
          requireDualApproval: true,
          requesterReason: reason,
          status: 'auto_executed',
          expiresAt,
          approverAdminId: ctx.activeAdminUser!.id,
          executedAt: new Date(),
        },
      });
      await db.user.update({ where: { id: userId }, data: { isBanned: true, bannedAt: new Date() } });
      void logAdminAction({
        actorAdminId: ctx.activeAdminUser!.id,
        actorRole: actorRole,
        eventCategory: 'high_risk_action',
        eventType: 'ban_user',
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
      const approvalRequest = await db.approvalRequest.create({
        data: {
          requesterAdminId: ctx.activeAdminUser!.id,
          requesterRole: actorRole,
          actionType: 'ban_user',
          actionPayload,
          riskLevel: 'high',
          requireDualApproval: true,
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
        payload: { actionType: 'ban_user', ...actionPayload },
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

  /** Reset password — generate temp password, update passwordHash, email stub (AC-6) */
  resetPassword: adminProcedure.input(resetPasswordInput).mutation(async ({ input, ctx }) => {
    await guardMutation(ctx);

    const db = ctx.adminPrisma ?? ctx.prisma;
    const { userId } = input;

    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, email: true } });
    if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'user not found' });

    const tempPassword = randomBytes(8).toString('hex');
    const passwordHash = makePayloadHash(tempPassword);

    await db.user.update({ where: { id: userId }, data: { passwordHash } });

    // Email stub: log only (real email in future PRD)
    console.log(`[ADMIN RESET PASSWORD] user=${userId} email=${user.email} tempPassword=${tempPassword}`);

    void logAdminAction({
      actorAdminId: ctx.activeAdminUser!.id,
      actorRole: ctx.activeAdminUser!.role,
      eventCategory: 'data_mutation',
      eventType: 'reset_password',
      payload: redactSensitiveFields({ userId, email: user.email, tempPassword }) as Record<string, unknown>,
      targetUserId: userId,
      traceId: ctx.traceId,
      ip: getIp(ctx),
      userAgent: ctx.req.headers.get('user-agent') ?? '',
      sessionId: ctx.adminSession?.id ?? '',
      success: true,
    });

    return { status: 'ok' as const, tempPassword };
  }),
});
