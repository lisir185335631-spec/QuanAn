// PRD-14 US-004 · adminRouter.abExperiments — A/B 实验管理
// US-005: +4 procedures: getDetailByKey / getVariantMetrics / getCumulativeTimeline / promoteWinner
// SHIELD: trafficAllocation sum=100 客户端 + 服务端双校验 (anti_pattern: 客户端 max=100 但服务端不校验)
// SHIELD: super_admin only stop — {role === 'super_admin' && <Button>} + guardSuperAdmin (anti_pattern: 不藏不守)
// SHIELD: LD-A9 · ab_experiments 状态仅由 _startAbExperimentInTx / _stopAbExperimentInTx 单点修改
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { stopAbExperimentManual } from '@/jobs/admin/ab-stop-loss.job';
import { prisma } from '@/lib/prisma';
import {
  createAbExperiment,
  startAbExperiment,
} from '@/services/admin/ab-experiment/ab-experiment.service';
import { computeExperimentSignificance } from '@/services/admin/ab-experiment/significance.service';
import { requestApproval } from '@/services/admin/approval/approvalGateService';
import { adminProcedure } from '@/trpc/procedures/admin';
import { adminTrpcRouter } from '@/trpc/trpc-admin';

// Wilson score 95% CI for binomial proportion
function wilsonCI(n: number, k: number): { low: number; high: number } {
  if (n === 0) return { low: 0, high: 0 };
  const z = 1.96;
  const p = k / n;
  const denom = 1 + (z * z) / n;
  const center = (p + z * z / (2 * n)) / denom;
  const margin = (z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))) / denom;
  return { low: Math.max(0, center - margin), high: Math.min(1, center + margin) };
}

function guardSuperAdmin(ctx: { activeAdminUser?: { role?: string } | null }): void {
  if (ctx.activeAdminUser?.role !== 'super_admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'super_admin only' });
  }
}

// ── getKpiStats ────────────────────────────────────────────────────────────

export const abExperimentsRouter = adminTrpcRouter({
  /**
   * 4 KPI: 运行中实验数 + 7天新启 + 平均 sample size + 自动停损率近30天
   */
  getKpiStats: adminProcedure.query(async () => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [runningCount, recentStarted, runningExperiments, stoppedLast30] = await Promise.all([
      prisma.abExperiment.count({ where: { status: 'running' } }),
      prisma.abExperiment.count({
        where: { startedAt: { gte: sevenDaysAgo } },
      }),
      prisma.abExperiment.findMany({
        where: { status: 'running' },
        select: { id: true },
      }),
      prisma.abExperiment.count({
        where: { status: 'stopped', stoppedAt: { gte: thirtyDaysAgo } },
      }),
    ]);

    // Average sample size per running experiment
    let avgSampleSize = 0;
    if (runningExperiments.length > 0) {
      const counts = await Promise.all(
        runningExperiments.map((e) =>
          prisma.abAssignment.count({ where: { experimentId: e.id } }),
        ),
      );
      avgSampleSize = Math.round(
        counts.reduce((s, c) => s + c, 0) / runningExperiments.length,
      );
    }

    // auto stop loss rate: auto_stop_loss events / total stopped in 30d
    const autoStopCount = await prisma.adminAuditLog.count({
      where: {
        eventType: 'ab_experiment_auto_stop_loss',
        createdAt: { gte: thirtyDaysAgo },
      },
    });
    const autoStopRate =
      stoppedLast30 > 0 ? Math.round((autoStopCount / stoppedLast30) * 100) : 0;

    return { runningCount, recentStarted, avgSampleSize, autoStopRate };
  }),

  // ── list ─────────────────────────────────────────────────────────────────

  list: adminProcedure
    .input(
      z.object({
        cursor: z.number().int().optional(),
        status: z.enum(['draft', 'running', 'stopped', 'completed']).optional(),
        createdByAdminId: z.number().int().optional(),
        startDateFrom: z.coerce.date().optional(),
        startDateTo: z.coerce.date().optional(),
      }),
    )
    .query(async ({ input }) => {
      const LIMIT = 20;
      const { cursor, status, createdByAdminId, startDateFrom, startDateTo } = input;

      const startedAtFilter =
        startDateFrom || startDateTo
          ? {
              startedAt: {
                ...(startDateFrom ? { gte: startDateFrom } : {}),
                ...(startDateTo ? { lte: startDateTo } : {}),
              },
            }
          : {};

      const rows = await prisma.abExperiment.findMany({
        where: {
          ...(cursor ? { id: { lt: cursor } } : {}),
          ...(status ? { status } : {}),
          ...(createdByAdminId ? { createdByAdminId } : {}),
          ...startedAtFilter,
        },
        orderBy: { startedAt: 'desc' },
        take: LIMIT + 1,
      });

      const hasMore = rows.length > LIMIT;
      const slice = hasMore ? rows.slice(0, LIMIT) : rows;
      const nextCursor = hasMore ? slice[slice.length - 1]?.id : undefined;

      // Fetch sample sizes in parallel (no Prisma relation — AbAssignment has no @relation back)
      const sampleSizes = await Promise.all(
        slice.map((e) => prisma.abAssignment.count({ where: { experimentId: e.id } })),
      );

      return {
        items: slice.map((e, idx) => {
          const alloc = e.trafficAllocation as Record<string, number> | null;
          const variantCount = alloc ? Object.keys(alloc).length : 0;
          const rs = e.resultSummary as { pValue?: number } | null;
          return {
            id: e.id,
            experimentKey: e.experimentKey,
            name: e.name,
            status: e.status,
            variantCount,
            sampleSize: sampleSizes[idx] ?? 0,
            startedAt: e.startedAt,
            stoppedAt: e.stoppedAt,
            createdAt: e.createdAt,
            trafficAllocation: alloc,
            currentPValue: rs?.pValue ?? null,
          };
        }),
        nextCursor,
      };
    }),

  // ── getDetail ─────────────────────────────────────────────────────────────

  getDetail: adminProcedure
    .input(z.object({ experimentId: z.number().int() }))
    .query(async ({ input }) => {
      const experiment = await prisma.abExperiment.findUniqueOrThrow({
        where: { id: input.experimentId },
      });
      const sampleSize = await prisma.abAssignment.count({
        where: { experimentId: input.experimentId },
      });

      // Timeline: assignments grouped by day — max 30 data points (SHIELD: no full fetch)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const timeline = await prisma.$queryRaw<{ day: Date; count: bigint }[]>`
        SELECT
          DATE_TRUNC('day', assigned_at) AS day,
          COUNT(*) AS count
        FROM ab_assignments
        WHERE experiment_id = ${input.experimentId}
          AND assigned_at >= ${thirtyDaysAgo}
        GROUP BY DATE_TRUNC('day', assigned_at)
        ORDER BY day ASC
      `;

      return {
        id: experiment.id,
        experimentKey: experiment.experimentKey,
        name: experiment.name,
        description: experiment.description,
        status: experiment.status,
        variantConfig: experiment.variantConfig,
        trafficAllocation: experiment.trafficAllocation,
        startedAt: experiment.startedAt,
        stoppedAt: experiment.stoppedAt,
        resultSummary: experiment.resultSummary,
        createdAt: experiment.createdAt,
        sampleSize,
        timeline: timeline.map((t) => ({ day: t.day, count: Number(t.count) })),
      };
    }),

  // ── create ────────────────────────────────────────────────────────────────

  create: adminProcedure
    .input(
      z.object({
        experimentKey: z.string().min(1).max(64),
        name: z.string().min(1).max(256),
        description: z.string().optional(),
        variantConfig: z.record(z.unknown()),
        trafficAllocation: z.object({
          control: z.number().int().min(0).max(100),
          variant_a: z.number().int().min(0).max(100),
          variant_b: z.number().int().min(0).max(100),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // SHIELD: server-side sum=100 validation (anti_pattern: client max=100 only)
      const sum =
        input.trafficAllocation.control +
        input.trafficAllocation.variant_a +
        input.trafficAllocation.variant_b;
      if (sum !== 100) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `trafficAllocation must sum to 100, got ${sum}`,
        });
      }

      const experiment = await createAbExperiment({
        ...input,
        description: input.description,
        createdByAdminId: ctx.activeAdminUser!.id,
      });

      return { id: experiment.id, experimentKey: experiment.experimentKey };
    }),

  // ── start — always dual approval ──────────────────────────────────────────

  start: adminProcedure
    .input(
      z.object({
        experimentId: z.number().int(),
        reason: z.string().default(''),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await startAbExperiment({
        experimentId: input.experimentId,
        requesterAdminId: ctx.activeAdminUser!.id,
        requesterRole: ctx.activeAdminUser!.role as 'admin' | 'super_admin',
        requesterReason: input.reason,
      });

      return {
        approvalRequestId: result.approvalRequestId,
        needsApproval: result.needsApproval,
      };
    }),

  // ── stop — super_admin only · no approval (emergency) ────────────────────

  stop: adminProcedure
    .input(
      z.object({
        experimentId: z.number().int(),
        stopReason: z.string().min(20, '停损理由至少 20 个字'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // SHIELD: super_admin only — server-side guard (client also hides button)
      guardSuperAdmin(ctx);

      await stopAbExperimentManual({
        experimentId: input.experimentId,
        adminId: ctx.activeAdminUser!.id,
      });

      return { ok: true };
    }),

  // ── getMultiMetric — 3 metric × significance ─────────────────────────────

  getMultiMetric: adminProcedure
    .input(z.object({ experimentId: z.number().int() }))
    .query(async ({ input }) => {
      const results = await computeExperimentSignificance(input.experimentId);
      return { results };
    }),

  // ── getDetailByKey — fetch experiment by experimentKey (for URL route) ────

  getDetailByKey: adminProcedure
    .input(z.object({ experimentKey: z.string().min(1) }))
    .query(async ({ input }) => {
      const experiment = await prisma.abExperiment.findUniqueOrThrow({
        where: { experimentKey: input.experimentKey },
      });
      const sampleSize = await prisma.abAssignment.count({
        where: { experimentId: experiment.id },
      });
      return {
        id: experiment.id,
        experimentKey: experiment.experimentKey,
        name: experiment.name,
        description: experiment.description,
        status: experiment.status,
        variantConfig: experiment.variantConfig,
        trafficAllocation: experiment.trafficAllocation,
        startedAt: experiment.startedAt,
        stoppedAt: experiment.stoppedAt,
        resultSummary: experiment.resultSummary,
        createdAt: experiment.createdAt,
        sampleSize,
      };
    }),

  // ── getVariantMetrics — per-variant conversion/retention/cost ─────────────

  getVariantMetrics: adminProcedure
    .input(z.object({ experimentId: z.number().int() }))
    .query(async ({ input }) => {
      const { experimentId } = input;

      const [convRows, retRows, costRows] = await Promise.all([
        // Conversion: per-variant conversion rate (≥7 completed steps)
        prisma.$queryRaw<{ variant: string; total: bigint; conversions: bigint }[]>`
          SELECT
            a.variant,
            COUNT(DISTINCT a.user_id) AS total,
            COUNT(DISTINCT CASE WHEN sub.cnt >= 7 THEN a.user_id END) AS conversions
          FROM ab_assignments a
          LEFT JOIN (
            SELECT ia.user_id, COUNT(DISTINCT sd.step_key) AS cnt
            FROM ip_accounts ia
            JOIN step_data sd ON sd.account_id = ia.id
            WHERE sd.status = 'completed'
            GROUP BY ia.user_id
          ) sub ON sub.user_id = a.user_id
          WHERE a.experiment_id = ${experimentId}
          GROUP BY a.variant
        `,
        // 7-day retention: per-variant, count users retained ≥ N days after assignment
        prisma.$queryRaw<{
          variant: string; total: bigint;
          d1: bigint; d2: bigint; d3: bigint; d4: bigint; d5: bigint; d6: bigint; d7: bigint;
        }[]>`
          SELECT
            a.variant,
            COUNT(*) AS total,
            SUM(CASE WHEN u.last_login_at >= a.assigned_at + INTERVAL '1 day' THEN 1 ELSE 0 END) AS d1,
            SUM(CASE WHEN u.last_login_at >= a.assigned_at + INTERVAL '2 days' THEN 1 ELSE 0 END) AS d2,
            SUM(CASE WHEN u.last_login_at >= a.assigned_at + INTERVAL '3 days' THEN 1 ELSE 0 END) AS d3,
            SUM(CASE WHEN u.last_login_at >= a.assigned_at + INTERVAL '4 days' THEN 1 ELSE 0 END) AS d4,
            SUM(CASE WHEN u.last_login_at >= a.assigned_at + INTERVAL '5 days' THEN 1 ELSE 0 END) AS d5,
            SUM(CASE WHEN u.last_login_at >= a.assigned_at + INTERVAL '6 days' THEN 1 ELSE 0 END) AS d6,
            SUM(CASE WHEN u.last_login_at >= a.assigned_at + INTERVAL '7 days' THEN 1 ELSE 0 END) AS d7
          FROM ab_assignments a
          JOIN users u ON u.id = a.user_id
          WHERE a.experiment_id = ${experimentId}
          GROUP BY a.variant
        `,
        // Cost: per-variant average cost
        prisma.$queryRaw<{ variant: string; total: bigint; avgCost: number }[]>`
          SELECT
            a.variant,
            COUNT(DISTINCT a.user_id) AS total,
            COALESCE(AVG(uc.total_cost), 0)::float8 AS "avgCost"
          FROM ab_assignments a
          LEFT JOIN (
            SELECT user_id, SUM(cost_usd) AS total_cost
            FROM cost_log
            GROUP BY user_id
          ) uc ON uc.user_id = a.user_id
          WHERE a.experiment_id = ${experimentId}
          GROUP BY a.variant
        `,
      ]);

      const VARIANTS = ['control', 'variant_a', 'variant_b'] as const;
      const result: Record<string, {
        sampleSize: number;
        conversion: { rate: number; ciLow: number; ciHigh: number };
        retention: Array<{ day: number; rate: number }>;
        avgCost: number;
      }> = {};

      for (const variant of VARIANTS) {
        const conv = convRows.find((r) => r.variant === variant);
        const ret = retRows.find((r) => r.variant === variant);
        const cost = costRows.find((r) => r.variant === variant);

        const n = Number(conv?.total ?? 0);
        const k = Number(conv?.conversions ?? 0);
        const rate = n > 0 ? k / n : 0;
        const ci = wilsonCI(n, k);

        const retTotal = Number(ret?.total ?? 0);
        const dValues = [ret?.d1, ret?.d2, ret?.d3, ret?.d4, ret?.d5, ret?.d6, ret?.d7];
        const retention = dValues.map((dv, idx) => ({
          day: idx + 1,
          rate: retTotal > 0 ? Number(dv ?? 0) / retTotal : 0,
        }));

        result[variant] = {
          sampleSize: n,
          conversion: { rate, ciLow: ci.low, ciHigh: ci.high },
          retention,
          avgCost: Number(cost?.avgCost ?? 0),
        };
      }

      return { variants: result };
    }),

  // ── getCumulativeTimeline — cumulative assignments per day per variant ─────

  getCumulativeTimeline: adminProcedure
    .input(z.object({ experimentId: z.number().int() }))
    .query(async ({ input }) => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const rows = await prisma.$queryRaw<{ day: Date; variant: string; count: bigint }[]>`
        SELECT
          DATE_TRUNC('day', assigned_at) AS day,
          variant,
          COUNT(*) AS count
        FROM ab_assignments
        WHERE experiment_id = ${input.experimentId}
          AND assigned_at >= ${thirtyDaysAgo}
        GROUP BY DATE_TRUNC('day', assigned_at), variant
        ORDER BY day, variant
      `;

      // Group by day
      const dayMap = new Map<string, Record<string, number>>();
      for (const row of rows) {
        const dayKey = row.day.toISOString().slice(0, 10);
        if (!dayMap.has(dayKey)) dayMap.set(dayKey, {});
        dayMap.get(dayKey)![row.variant] = Number(row.count);
      }

      // Accumulate cumulative totals
      let cumControl = 0, cumVariantA = 0, cumVariantB = 0;
      const timeline = Array.from(dayMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([day, counts]) => {
          cumControl += counts['control'] ?? 0;
          cumVariantA += counts['variant_a'] ?? 0;
          cumVariantB += counts['variant_b'] ?? 0;
          return { day, control: cumControl, variant_a: cumVariantA, variant_b: cumVariantB };
        });

      return { timeline };
    }),

  // ── promoteWinner — dual approval to promote winner variant to 100% ────────

  promoteWinner: adminProcedure
    .input(
      z.object({
        experimentId: z.number().int(),
        winnerVariant: z.enum(['control', 'variant_a', 'variant_b']),
        reason: z.string().default(''),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const experiment = await prisma.abExperiment.findUniqueOrThrow({
        where: { id: input.experimentId },
      });

      if (experiment.status !== 'running') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: '实验未在运行中，无法升级' });
      }

      const approval = await requestApproval({
        actionType: 'promote_ab_experiment_winner',
        requesterAdminId: ctx.activeAdminUser!.id,
        requesterRole: ctx.activeAdminUser!.role as 'admin' | 'super_admin',
        actionPayload: {
          experimentId: input.experimentId,
          experimentKey: experiment.experimentKey,
          winnerVariant: input.winnerVariant,
        },
        riskLevel: 'high',
        requireDualApproval: true,
        requesterReason: input.reason,
      });

      return { approvalRequestId: approval.id, needsApproval: true };
    }),
});
