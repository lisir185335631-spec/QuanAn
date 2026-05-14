// PRD-14 US-004 · adminRouter.abExperiments — A/B 实验管理
// AC-11: 6 procedure · CRUD + start + stop + getMultiMetric · adminProcedure 7 闸链
// SHIELD: trafficAllocation sum=100 客户端 + 服务端双校验 (anti_pattern: 客户端 max=100 但服务端不校验)
// SHIELD: super_admin only stop — {role === 'super_admin' && <Button>} + guardSuperAdmin (anti_pattern: 不藏不守)
// SHIELD: LD-A9 · ab_experiments 状态仅由 _startAbExperimentInTx / _stopAbExperimentInTx 单点修改
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import {
  createAbExperiment,
  startAbExperiment,
} from '@/services/admin/ab-experiment/ab-experiment.service';
import { stopAbExperimentManual } from '@/jobs/admin/ab-stop-loss.job';
import { computeExperimentSignificance } from '@/services/admin/ab-experiment/significance.service';
import { adminProcedure } from '@/trpc/procedures/admin';
import { adminTrpcRouter } from '@/trpc/trpc-admin';
import { prisma } from '@/lib/prisma';

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
});
