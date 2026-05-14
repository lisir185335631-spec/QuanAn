// PRD-13 US-005 · adminRouter.quota — 10 procedures
// AC-10: getQuotaOverview · listUserQuotas · getUserDetail · adjustQuota (Approval) · listAdjustmentLog · getActiveAdjustments
// PRD-13 US-009: + getUsageStats · getHourlyTrend · listAnomalousUsers · getUserHourlyTimeline
// SHIELD: readonly_admin → FORBIDDEN on mutations
// SHIELD: whitelist bypass only when whitelistExpiresAt valid (AC-9/11)
// LD-A-8: user_quota 写操作仅由 service._adjustQuotaInTx 调用 · 本 router 不直接修改
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import {
  adjustUserQuota,
  listUserQuotas,
  getUserQuotaTimeline,
  getUsageStatsByPlan,
  getHourlyTrendByPlan,
  listAnomalousUsers,
  getUserHourlyTimeline,
} from '@/services/admin/quota/quota-adjustment.service';
import { scheduleQuotaExpiry } from '@/jobs/admin/quota-expiry.job';
import { adminProcedure } from '@/trpc/procedures/admin';
import { adminTrpcRouter } from '@/trpc/trpc-admin';
import { prisma } from '@/lib/prisma';

function getIp(ctx: { req: Request }): string {
  return (
    ctx.req.headers.get('x-forwarded-for') ??
    ctx.req.headers.get('x-real-ip') ??
    '0.0.0.0'
  );
}

function guardMutation(ctx: { activeAdminUser?: { role?: string; id: number } | null }): void {
  if (ctx.activeAdminUser?.role === 'readonly_admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'privilege_escalation' });
  }
}

// ── getQuotaOverview ───────────────────────────────────────────────────────

export const quotaRouter = adminTrpcRouter({
  getQuotaOverview: adminProcedure.query(async () => {
    const [free, pro, enterprise, whitelist] = await Promise.all([
      prisma.userQuota.count({ where: { plan: 'free' } }),
      prisma.userQuota.count({ where: { plan: 'pro' } }),
      prisma.userQuota.count({ where: { plan: 'enterprise' } }),
      prisma.userQuota.count({
        where: { isOnWhitelist: true, whitelistExpiresAt: { gt: new Date() } },
      }),
    ]);

    return { free, pro, enterprise, activeWhitelist: whitelist, total: free + pro + enterprise };
  }),

  // ── getUsageStats (US-009) ─────────────────────────────────────────────
  // Returns avg daily usage % per plan + anomalous user count (>= 80% quota used)

  getUsageStats: adminProcedure
    .input(
      z.object({
        anomalyThreshold: z.number().int().min(1).max(100).default(80),
      }),
    )
    .query(async ({ input }) => {
      return getUsageStatsByPlan(input.anomalyThreshold);
    }),

  // ── getHourlyTrend (US-009) ────────────────────────────────────────────
  // 24h × plan grouped by hour for UsageLineChart

  getHourlyTrend: adminProcedure.query(async () => {
    return getHourlyTrendByPlan();
  }),

  // ── listAnomalousUsers (US-009) ────────────────────────────────────────
  // Users with dailyUsed/dailyQuota >= threshold · filtered by plan + status

  listAnomalousUsers: adminProcedure
    .input(
      z.object({
        cursor: z.number().int().optional(),
        limit: z.number().int().min(1).max(100).default(20),
        plan: z.enum(['free', 'pro', 'enterprise']).optional(),
        usageThreshold: z.number().int().min(1).max(100).default(80),
        status: z.enum(['all', 'whitelisted', 'normal']).default('all'),
      }),
    )
    .query(async ({ input }) => {
      return listAnomalousUsers(input);
    }),

  // ── getUserHourlyTimeline (US-009) ────────────────────────────────────
  // 24h hourly call breakdown for a specific user (drawer timeline)

  getUserHourlyTimeline: adminProcedure
    .input(
      z.object({
        userId: z.number().int(),
      }),
    )
    .query(async ({ input }) => {
      return getUserHourlyTimeline(input.userId);
    }),

  // ── listUserQuotas ─────────────────────────────────────────────────────

  listUserQuotas: adminProcedure
    .input(
      z.object({
        cursor: z.number().int().optional(),
        limit: z.number().int().min(1).max(100).default(20),
        plan: z.enum(['free', 'pro', 'enterprise']).optional(),
        search: z.string().max(100).optional(),
      }),
    )
    .query(async ({ input }) => {
      return listUserQuotas(input);
    }),

  // ── getUserDetail ──────────────────────────────────────────────────────

  getUserDetail: adminProcedure
    .input(
      z.object({
        userId: z.number().int(),
        timelineDays: z.number().int().min(1).max(30).default(7),
      }),
    )
    .query(async ({ input }) => {
      const [quota, timeline] = await Promise.all([
        prisma.userQuota.findUnique({
          where: { userId: input.userId },
          include: {
            adjustments: {
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
          },
        }),
        getUserQuotaTimeline(input.userId, input.timelineDays),
      ]);

      if (!quota) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `quota not found for user ${input.userId}` });
      }

      return { quota, timeline };
    }),

  // ── adjustQuota ────────────────────────────────────────────────────────

  adjustQuota: adminProcedure
    .input(
      z.object({
        userId: z.number().int(),
        adjustmentType: z.enum(['increase_daily', 'increase_monthly', 'whitelist_add']),
        delta: z.number().int().min(0).max(100000),
        reason: z.string().min(1).max(1000),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      guardMutation(ctx);

      const result = await adjustUserQuota({
        userId: input.userId,
        adminId: ctx.activeAdminUser!.id,
        adminRole: (ctx.activeAdminUser?.role as 'admin' | 'super_admin') ?? 'admin',
        adjustmentType: input.adjustmentType,
        delta: input.delta,
        reason: input.reason,
        ip: getIp(ctx),
        userAgent: ctx.req.headers.get('user-agent') ?? '',
        sessionId: ctx.adminSession?.id ?? '',
      });

      // If immediate execution (non-dual), schedule expiry job
      if (!result.needsApproval && result.adjustmentLogId) {
        await scheduleQuotaExpiry(result.adjustmentLogId).catch((err) => {
          // Non-fatal: log and continue
          void err;
        });
      }

      return result;
    }),

  // ── getExpiredAdjustments (US-009 AC-5) ───────────────────────────────
  // Historical (expired) adjustments for a user — AC-5 历史 adjustments 列表

  getExpiredAdjustments: adminProcedure
    .input(
      z.object({
        userId: z.number().int().optional(),
      }),
    )
    .query(async ({ input }) => {
      const now = new Date();
      return prisma.quotaAdjustmentLog.findMany({
        where: {
          OR: [{ isExpired: true }, { expiresAt: { lte: now } }],
          ...(input.userId ? { userId: input.userId } : {}),
        },
        orderBy: { expiresAt: 'desc' },
        take: 20,
      });
    }),

  // ── listAdjustmentLog ──────────────────────────────────────────────────

  listAdjustmentLog: adminProcedure
    .input(
      z.object({
        userId: z.number().int().optional(),
        adminId: z.number().int().optional(),
        cursor: z.number().int().optional(),
        limit: z.number().int().min(1).max(100).default(20),
      }),
    )
    .query(async ({ input }) => {
      const where = {
        ...(input.userId ? { userId: input.userId } : {}),
        ...(input.adminId ? { adminId: input.adminId } : {}),
        ...(input.cursor ? { id: { gt: input.cursor } } : {}),
      };

      const items = await prisma.quotaAdjustmentLog.findMany({
        where,
        take: input.limit + 1,
        orderBy: { id: 'asc' },
      });

      const hasMore = items.length > input.limit;
      const data = hasMore ? items.slice(0, input.limit) : items;

      return {
        items: data,
        nextCursor: hasMore ? data[data.length - 1]?.id : undefined,
      };
    }),

  // ── getActiveAdjustments ───────────────────────────────────────────────

  getActiveAdjustments: adminProcedure
    .input(
      z.object({
        userId: z.number().int().optional(),
      }),
    )
    .query(async ({ input }) => {
      const now = new Date();
      const where = {
        isExpired: false,
        expiresAt: { gt: now },
        ...(input.userId ? { userId: input.userId } : {}),
      };

      return prisma.quotaAdjustmentLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    }),
});
