// PRD-13 US-004 · evolutionHealth admin tRPC router — 7 procedures
// AC-6: getLDistribution · getFlywheelHealth · listAnomalies · getAccountTimeline
//        forceRebuildEvolution (dual-approval, returns approvalRequestId)
//        markAnomalyResolved · getAnomalyStats
// SHIELD: forceRebuildEvolution creates approval request only — actual rebuild in _forceRebuildEvolutionInTx
// SHIELD: adminPrisma via ctx (RLS bypass + cross-account audit auto)

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { logAdminAction } from '@/services/admin/admin-audit-service';
import { adminProcedure } from '@/trpc/procedures/admin';
import { adminTrpcRouter } from '@/trpc/trpc-admin';

import type { Prisma } from '@prisma/client';

// ── Helpers ────────────────────────────────────────────────────────────────

function getIp(ctx: { req: Request }): string {
  return (
    ctx.req.headers.get('x-forwarded-for') ??
    ctx.req.headers.get('x-real-ip') ??
    '0.0.0.0'
  );
}

// ── Input schemas ──────────────────────────────────────────────────────────

const getLDistributionInput = z.object({
  industryFilter: z.string().optional(),
});

const listAnomaliesInput = z.object({
  cursor: z.number().int().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  anomalyType: z.enum([
    'conflicting_insights',
    'frequent_style_flip',
    'avoidlist_overflow',
    'flywheel_stalled',
    'negative_feedback_dominant',
  ]).optional(),
  resolved: z.boolean().optional(),
});

const getAccountTimelineInput = z.object({
  accountId: z.number().int().positive(),
});

const forceRebuildEvolutionInput = z.object({
  accountId: z.number().int().positive(),
  reason: z.string().min(10),
});

const markAnomalyResolvedInput = z.object({
  flagId: z.number().int().positive(),
  resolution: z.enum(['admin_action', 'false_positive']),
});

// ── Router ──────────────────────────────────────────────────────────────────

export const evolutionHealthRouter = adminTrpcRouter({
  /**
   * AC-6-1: getLDistribution — L1~L5 user counts + optional industryFilter
   * Returns {L1:N, L2:N, L3:N, L4:N, L5:N}
   */
  getLDistribution: adminProcedure.input(getLDistributionInput).query(async ({ input, ctx }) => {
    const db = ctx.adminPrisma ?? ctx.prisma;

    // Filter by industry if provided (join through ip_accounts → industry)
    const profiles = await db.evolutionProfile.findMany({
      select: { level: true, accountId: true },
      ...(input.industryFilter
        ? {
            where: {
              ipAccount: {
                industry: { contains: input.industryFilter, mode: 'insensitive' as const },
              },
            },
          }
        : {}),
    });

    const distribution: Record<string, number> = { L1: 0, L2: 0, L3: 0, L4: 0, L5: 0 };
    for (const profile of profiles) {
      const level = profile.level ?? 'L1';
      if (level in distribution) distribution[level]!++;
      else distribution['L1']!++;
    }

    return distribution as { L1: number; L2: number; L3: number; L4: number; L5: number };
  }),

  /**
   * AC-6-2: getFlywheelHealth — stalled + conflict + healthy counts + traffic-light status
   * Returns {stalledCount, conflictCount, healthyCount, status:'green'|'yellow'|'red'}
   */
  getFlywheelHealth: adminProcedure.query(async ({ ctx }) => {
    const db = ctx.adminPrisma ?? ctx.prisma;

    const stalledCount = await db.evolutionAnomalyFlag.count({
      where: { anomalyType: 'flywheel_stalled', resolvedAt: null },
    });

    const conflictCount = await db.evolutionAnomalyFlag.count({
      where: { anomalyType: 'conflicting_insights', resolvedAt: null },
    });

    const totalAccounts = await db.evolutionProfile.count();
    const healthyCount = Math.max(0, totalAccounts - stalledCount - conflictCount);

    let status: 'green' | 'yellow' | 'red';
    const unhealthyRatio = totalAccounts > 0 ? (stalledCount + conflictCount) / totalAccounts : 0;

    if (unhealthyRatio >= 0.2 || stalledCount >= 10) status = 'red';
    else if (unhealthyRatio >= 0.1 || stalledCount >= 5) status = 'yellow';
    else status = 'green';

    return { stalledCount, conflictCount, healthyCount, status };
  }),

  /**
   * AC-6-3: listAnomalies — cursor-based pagination of anomaly flags
   */
  listAnomalies: adminProcedure.input(listAnomaliesInput).query(async ({ input, ctx }) => {
    const db = ctx.adminPrisma ?? ctx.prisma;

    const items = await db.evolutionAnomalyFlag.findMany({
      where: {
        ...(input.cursor ? { id: { lt: input.cursor } } : {}),
        ...(input.anomalyType ? { anomalyType: input.anomalyType } : {}),
        ...(input.resolved === true
          ? { resolvedAt: { not: null } }
          : input.resolved === false
            ? { resolvedAt: null }
            : {}),
      },
      orderBy: { id: 'desc' },
      take: input.limit + 1,
      select: {
        id: true,
        accountId: true,
        anomalyType: true,
        severity: true,
        evidence: true,
        detectedAt: true,
        resolvedAt: true,
        resolution: true,
        resolvedByAdminId: true,
      },
    });

    const hasMore = items.length > input.limit;
    const results = hasMore ? items.slice(0, input.limit) : items;
    const nextCursor = hasMore ? results[results.length - 1]?.id : undefined;

    return { items: results, nextCursor };
  }),

  /**
   * AC-6-4: getAccountTimeline — evolution insights + anomaly flags for one account
   */
  getAccountTimeline: adminProcedure
    .input(getAccountTimelineInput)
    .query(async ({ input, ctx }) => {
      const db = ctx.adminPrisma ?? ctx.prisma;

      const [insights, anomalyFlags, profile] = await Promise.all([
        db.evolutionInsight.findMany({
          where: { accountId: input.accountId },
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: {
            id: true,
            triggerType: true,
            direction: true,
            levelBefore: true,
            levelAfter: true,
            isFallback: true,
            createdAt: true,
          },
        }),
        db.evolutionAnomalyFlag.findMany({
          where: { accountId: input.accountId },
          orderBy: { detectedAt: 'desc' },
          take: 20,
          select: {
            id: true,
            anomalyType: true,
            severity: true,
            evidence: true,
            detectedAt: true,
            resolvedAt: true,
            resolution: true,
          },
        }),
        db.evolutionProfile.findUnique({
          where: { accountId: input.accountId },
          select: {
            level: true,
            satisfactionRate: true,
            feedbackCountTotal: true,
            lastEvolvedAt: true,
            autoEvolutionEnabled: true,
          },
        }),
      ]);

      return { profile, insights, anomalyFlags };
    }),

  /**
   * AC-6-5: forceRebuildEvolution — creates dual-approval request
   * SHIELD: does NOT execute rebuild — actual rebuild in _forceRebuildEvolutionInTx
   * Returns {approvalRequestId}
   */
  forceRebuildEvolution: adminProcedure
    .input(forceRebuildEvolutionInput)
    .mutation(async ({ input, ctx }) => {
      const db = ctx.adminPrisma ?? ctx.prisma;
      const { accountId, reason } = input;

      const actorId = ctx.activeAdminUser!.id;
      const actorRole = ctx.activeAdminUser!.role;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Verify account exists
      const profile = await db.evolutionProfile.findUnique({
        where: { accountId },
        select: { accountId: true },
      });

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `evolution_profile not found for accountId=${accountId}`,
        });
      }

      // Create dual-approval request for force_rebuild_evolution
      const approvalRequest = await db.approvalRequest.create({
        data: {
          requesterAdminId: actorId,
          requesterRole: actorRole,
          actionType: 'force_rebuild_evolution',
          actionPayload: { accountId, reason } as unknown as Prisma.InputJsonValue,
          riskLevel: 'high',
          requireDualApproval: true,
          requesterReason: reason,
          status: 'pending',
          expiresAt,
        },
      });

      void logAdminAction({
        actorAdminId: actorId,
        actorRole,
        eventCategory: 'high_risk_action',
        eventType: 'approval_request_create',
        payload: { actionType: 'force_rebuild_evolution', accountId, reason },
        targetAccountId: accountId,
        approvalRequestId: approvalRequest.id,
        traceId: ctx.traceId,
        ip: getIp(ctx),
        userAgent: ctx.req.headers.get('user-agent') ?? '',
        sessionId: ctx.adminSession?.id ?? '',
        success: true,
      });

      return { approvalRequestId: approvalRequest.id };
    }),

  /**
   * AC-6-6: markAnomalyResolved — resolve an anomaly flag
   */
  markAnomalyResolved: adminProcedure
    .input(markAnomalyResolvedInput)
    .mutation(async ({ input, ctx }) => {
      const db = ctx.adminPrisma ?? ctx.prisma;
      const { flagId, resolution } = input;

      const flag = await db.evolutionAnomalyFlag.findUnique({
        where: { id: flagId },
        select: { id: true, accountId: true, resolvedAt: true },
      });

      if (!flag) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `anomaly_flag not found id=${flagId}` });
      }

      if (flag.resolvedAt) {
        throw new TRPCError({ code: 'CONFLICT', message: 'anomaly_flag already resolved' });
      }

      const updated = await db.evolutionAnomalyFlag.update({
        where: { id: flagId },
        data: {
          resolvedAt: new Date(),
          resolution,
          resolvedByAdminId: ctx.activeAdminUser!.id,
        },
      });

      void logAdminAction({
        actorAdminId: ctx.activeAdminUser!.id,
        actorRole: ctx.activeAdminUser!.role,
        eventCategory: 'evolution_health',
        eventType: 'evolution_anomaly_resolve',
        payload: { flagId, resolution },
        targetAccountId: flag.accountId,
        traceId: ctx.traceId,
        ip: getIp(ctx),
        userAgent: ctx.req.headers.get('user-agent') ?? '',
        sessionId: ctx.adminSession?.id ?? '',
        success: true,
      });

      return updated;
    }),

  /**
   * AC-6-7: getAnomalyStats — aggregate counts by type/severity + recent activity
   */
  getAnomalyStats: adminProcedure.query(async ({ ctx }) => {
    const db = ctx.adminPrisma ?? ctx.prisma;

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const allFlags = await db.evolutionAnomalyFlag.findMany({
      select: {
        anomalyType: true,
        severity: true,
        detectedAt: true,
        resolvedAt: true,
      },
    });

    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    let last24h = 0;
    let last7d = 0;

    for (const flag of allFlags) {
      byType[flag.anomalyType] = (byType[flag.anomalyType] ?? 0) + 1;
      bySeverity[flag.severity] = (bySeverity[flag.severity] ?? 0) + 1;
      if (flag.detectedAt >= oneDayAgo) last24h++;
      if (flag.detectedAt >= sevenDaysAgo) last7d++;
    }

    return { byType, bySeverity, last24h, last7d };
  }),
});
