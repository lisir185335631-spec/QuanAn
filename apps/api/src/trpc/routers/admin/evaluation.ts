// PRD-28 US-006 · adminRouter.evaluation — 3 procedures
// AC-4: listRuns / getRun / listSamples · adminProcedure 6 闸 · role IN ['ops','admin'] enforced
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { adminProcedure } from '@/trpc/procedures/admin';
import { adminTrpcRouter } from '@/trpc/trpc-admin';

function guardOpsOrAdmin(role: string | undefined): void {
  if (role !== 'ops' && role !== 'admin' && role !== 'super_admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'ops or admin role required' });
  }
}

export const evaluationRouter = adminTrpcRouter({
  // ── listRuns ─────────────────────────────────────────────────────────────
  listRuns: adminProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
      }),
    )
    .query(async ({ input, ctx }) => {
      guardOpsOrAdmin(ctx.activeAdminUser?.role);
      const skip = (input.page - 1) * input.pageSize;

      const [items, count] = await Promise.all([
        prisma.evaluationRun.findMany({
          orderBy: { startedAt: 'desc' },
          skip,
          take: input.pageSize,
          select: {
            runId: true,
            startedAt: true,
            finishedAt: true,
            status: true,
            totalSamples: true,
            passedSamples: true,
            avgScore: true,
            totalCostUsd: true,
          },
        }),
        prisma.evaluationRun.count(),
      ]);

      return { items, count };
    }),

  // ── getRun ────────────────────────────────────────────────────────────────
  getRun: adminProcedure
    .input(z.object({ runId: z.string() }))
    .query(async ({ input, ctx }) => {
      guardOpsOrAdmin(ctx.activeAdminUser?.role);

      const run = await prisma.evaluationRun.findUnique({
        where: { runId: input.runId },
      });
      if (!run) throw new TRPCError({ code: 'NOT_FOUND', message: 'run not found' });
      return run;
    }),

  // ── listSamples ───────────────────────────────────────────────────────────
  listSamples: adminProcedure
    .input(
      z.object({
        runId: z.string(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(50),
      }),
    )
    .query(async ({ input, ctx }) => {
      guardOpsOrAdmin(ctx.activeAdminUser?.role);
      const skip = (input.page - 1) * input.pageSize;

      const [items, count] = await Promise.all([
        prisma.evaluationSample.findMany({
          where: { runId: input.runId },
          orderBy: { id: 'asc' },
          skip,
          take: input.pageSize,
          select: {
            id: true,
            goldenId: true,
            specialistId: true,
            mode: true,
            structurePass: true,
            judgeScore: true,
            judgePass: true,
            judgeReason: true,
            costUsd: true,
            durationMs: true,
          },
        }),
        prisma.evaluationSample.count({ where: { runId: input.runId } }),
      ]);

      return { items, count };
    }),
});
