// PRD-11 US-006 · adminRouter.users — 5 procedures
// list/detail/changePlan/banUser/resetPassword
// AC-1: all procedures use publicAdminProcedure (6 gates from adminProcedure)
// AC-9: readonly_admin → procedure-level 403 + audit privilege_escalation
// PRD-11 US-008: exportCsv streaming endpoint helpers

import { randomBytes, createHash } from 'node:crypto';

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { redactSensitiveFields } from '@/lib/admin/audit-helpers';
import { luciaAdmin, validateAdminSession } from '@/lib/auth/lucia-admin';
import { logger } from '@/lib/logger';
import { prisma as defaultPrisma } from '@/lib/prisma';
import { logAdminAction } from '@/services/admin/admin-audit-service';
import { adminProcedure } from '@/trpc/procedures/admin';
import { adminTrpcRouter } from '@/trpc/trpc-admin';

import type { PrismaClient } from '@prisma/client';

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
  durationDays: z.number().int().positive().optional(),
});

// ── resetPassword ───────────────────────────────────────────────────────────

const resetPasswordInput = z.object({ userId: z.number().int() });

// ── CSV Export (US-008) ─────────────────────────────────────────────────────

export const CSV_MAX_EXPORT_ROWS = 500_000;
const CSV_CHUNK_SIZE = 1_000;
const CSV_HEADER = 'id,email,plan,industry,role,createdAt,lastLoginAt,banned\n';

type UserExportRow = {
  id: number;
  email: string;
  plan: string;
  industry: string | null;
  role: string;
  createdAt: Date;
  lastLoginAt: Date | null;
  isBanned: boolean;
};

/** Escapes a CSV field value: wraps in quotes if it contains comma, quote, or newline. */
export function escapeCsvField(value: string | number | boolean | Date | null | undefined): string {
  if (value == null) return '';
  const str = value instanceof Date ? value.toISOString() : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Formats a single user row as a CSV line (no trailing newline). */
export function formatUserCsvRow(user: UserExportRow): string {
  return [
    user.id,
    escapeCsvField(user.email),
    escapeCsvField(user.plan),
    escapeCsvField(user.industry),
    escapeCsvField(user.role),
    user.createdAt.toISOString(),
    user.lastLoginAt?.toISOString() ?? '',
    user.isBanned ? '1' : '0',
  ].join(',');
}

function buildExportWhere(params: {
  search?: string;
  roleFilter?: string;
  planFilter?: string;
  industryFilter?: string;
}): Record<string, unknown> {
  const where: Record<string, unknown> = {};
  if (params.search) {
    where['OR'] = [
      { email: { contains: params.search, mode: 'insensitive' } },
      { name: { contains: params.search, mode: 'insensitive' } },
    ];
  }
  if (params.roleFilter) where['role'] = params.roleFilter;
  if (params.planFilter) where['plan'] = params.planFilter;
  if (params.industryFilter) where['industry'] = params.industryFilter;
  return where;
}

/**
 * Streaming CSV export handler for GET /admin/export/users
 * Auth: validates admin session cookie directly (all roles allowed per AC-10).
 * Chunks DB reads in batches of 1000 to keep memory < 200 MB (AC-4).
 */
export async function handleExportUsersCSV(
  req: Request,
  db: PrismaClient = defaultPrisma,
): Promise<Response> {
  // Auth: validate admin session cookie
  const cookieHeader = req.headers.get('cookie') ?? '';
  const sessionId = luciaAdmin.readSessionCookie(cookieHeader);
  if (!sessionId) return new Response('Unauthorized', { status: 401 });

  const { session, user } = await validateAdminSession(sessionId);
  if (!session || !user) return new Response('Unauthorized', { status: 401 });

  const url = new URL(req.url);
  const params = {
    search: url.searchParams.get('search') ?? undefined,
    roleFilter: url.searchParams.get('role') ?? undefined,
    planFilter: url.searchParams.get('plan') ?? undefined,
    industryFilter: url.searchParams.get('industry') ?? undefined,
  };
  const where = buildExportWhere(params);

  // Row-count gate: reject > 500k (AC-6)
  const rowCount = await db.user.count({ where });
  if (rowCount > CSV_MAX_EXPORT_ROWS) {
    return new Response(
      `export rows > ${CSV_MAX_EXPORT_ROWS.toLocaleString()}, please narrow filters`,
      { status: 400, headers: { 'Content-Type': 'text/plain' } },
    );
  }

  // Audit (AC-5)
  const traceId = req.headers.get('x-trace-id') ?? randomBytes(8).toString('hex');
  void logAdminAction({
    actorAdminId: user.id,
    actorRole: user.role,
    eventCategory: 'export',
    eventType: 'export_users_csv',
    payload: { filterSummary: params, rowCount },
    traceId,
    ip: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? '0.0.0.0',
    userAgent: req.headers.get('user-agent') ?? '',
    sessionId: session.id,
    success: true,
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `users-export-${timestamp}.csv`;
  const enc = new TextEncoder();

  // Stream rows in chunks of 1000 (AC-4: memory < 200 MB)
  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(enc.encode(CSV_HEADER));
        let skip = 0;
        while (true) {
          const chunk = await db.user.findMany({
            where,
            orderBy: { id: 'asc' },
            skip,
            take: CSV_CHUNK_SIZE,
            select: {
              id: true,
              email: true,
              plan: true,
              industry: true,
              role: true,
              createdAt: true,
              lastLoginAt: true,
              isBanned: true,
            },
          });
          if (chunk.length === 0) break;
          const lines = chunk.map(formatUserCsvRow).join('\n') + '\n';
          controller.enqueue(enc.encode(lines));
          if (chunk.length < CSV_CHUNK_SIZE) break;
          skip += CSV_CHUNK_SIZE;
        }
        controller.close();
      } catch {
        // Client disconnect or DB error — close stream cleanly (AC-8)
        controller.close();
      }
    },
    cancel() {
      // Client disconnected mid-stream; no locks held (AC-8)
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache, no-store',
    },
  });
}

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
    const { userId, reason, durationDays } = input;

    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, isBanned: true } });
    if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'user not found' });
    if (user.isBanned) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'already banned' });
    }

    const actorRole = ctx.activeAdminUser!.role;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const actionPayload = durationDays !== undefined
      ? { userId, reason, durationDays }
      : { userId, reason };

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
    // TD-050 fix: 不 log 明文密码 · 只 log hash 前 8 chars(便于追溯但不能复原)
    logger.warn(
      {
        userId,
        email: user.email,
        tempPasswordHashPrefix: createHash('sha256').update(tempPassword).digest('hex').slice(0, 8),
      },
      '[ADMIN RESET PASSWORD] temp password issued',
    );

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
