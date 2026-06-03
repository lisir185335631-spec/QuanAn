// PRD-28 US-006 · adminRouter.evaluation — 3 procedures
// AC-4: listRuns / getRun / listSamples · adminProcedure 6 闸 · role IN ['ops','admin'] enforced
// PRD-28 US-007 · +listInterRaterSubset / submitHumanScore / computeAgreement (D-270 字面锁)
import fs from 'node:fs';
import path from 'node:path';

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import {
  cohenKappa,
  interpretKappa,
  listInterRaterSubset,
  pearsonCorrelation,
} from '@/lib/evaluation/inter-rater';
import { prisma } from '@/lib/prisma';
import { adminProcedure } from '@/trpc/procedures/admin';
import { adminTrpcRouter } from '@/trpc/trpc-admin';

function guardOpsOrAdmin(role: string | undefined): void {
  if (role !== 'ops' && role !== 'admin' && role !== 'super_admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'ops or admin role required' });
  }
}

// ── Golden criteria cache (loaded once, kept in-process memory) ───────────────
const _goldenCache = new Map<string, string[]>();

function getGoldenCriteria(goldenId: string): string[] {
  if (_goldenCache.has(goldenId)) return _goldenCache.get(goldenId)!;

  const prefix = goldenId.startsWith('sally') ? 'sally-30' : 'custom-70';
  const filePath = path.join(process.cwd(), 'tests/fixtures/judge-goldens', `${prefix}.json`);

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw) as Array<{ id: string; criteria: string[] }>;
    for (const s of data) {
      _goldenCache.set(s.id, s.criteria ?? []);
    }
  } catch {
    // golden files unavailable in this env — return empty
  }

  return _goldenCache.get(goldenId) ?? [];
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
      return { ...run, metadata: run.metadata as Record<string, unknown> | null };
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

  // ── listInterRaterSubset ──────────────────────────────────────────────────
  // AC-5: seeded by runId hash · mulberry32 · same runId always returns same 30
  listInterRaterSubset: adminProcedure
    .input(z.object({ runId: z.string() }))
    .query(async ({ input, ctx }) => {
      guardOpsOrAdmin(ctx.activeAdminUser?.role);

      // Get all sample IDs for this run (ordered for determinism before seeded shuffle)
      const allRows = await prisma.evaluationSample.findMany({
        where: { runId: input.runId },
        orderBy: { id: 'asc' },
        select: { id: true },
      });

      if (allRows.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'no samples for this run' });
      }

      const allIds = allRows.map((r) => r.id);
      const subsetIds = listInterRaterSubset(allIds, input.runId);

      // Fetch full data for the selected subset
      const rows = await prisma.evaluationSample.findMany({
        where: { id: { in: subsetIds } },
        select: {
          id: true,
          goldenId: true,
          specialistId: true,
          mode: true,
          input: true,
          actualOutput: true,
          judgeScore: true,
          judgeReason: true,
          humanScore: true,
          humanScoredAt: true,
        },
      });

      // Preserve seeded order
      const rowMap = new Map(rows.map((r) => [r.id, r]));
      const ordered = subsetIds
        .map((id) => rowMap.get(id))
        .filter((r): r is NonNullable<typeof r> => r !== undefined);

      const samples = ordered.map((r) => ({
        ...r,
        input: r.input as Record<string, unknown>,
        actualOutput: r.actualOutput as Record<string, unknown>,
        criteria: getGoldenCriteria(r.goldenId),
      }));

      const totalRated = samples.filter((s) => s.humanScore !== null).length;

      return { samples, totalSubset: samples.length, totalRated };
    }),

  // ── submitHumanScore ──────────────────────────────────────────────────────
  // AC-2: writes humanScore + humanScoreBy + humanScoredAt
  submitHumanScore: adminProcedure
    .input(
      z.object({
        sampleId: z.number().int(),
        humanScore: z.number().int().min(0).max(10),
        humanComment: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      guardOpsOrAdmin(ctx.activeAdminUser?.role);

      const sample = await prisma.evaluationSample.findUnique({
        where: { id: input.sampleId },
        select: { id: true },
      });
      if (!sample) throw new TRPCError({ code: 'NOT_FOUND', message: 'sample not found' });

      await prisma.evaluationSample.update({
        where: { id: input.sampleId },
        data: {
          humanScore: input.humanScore,
          humanScoreBy: ctx.activeAdminUser?.email ?? 'unknown',
          humanScoredAt: new Date(),
        },
      });

      return { ok: true };
    }),

  // ── computeAgreement ─────────────────────────────────────────────────────
  // AC-3: Cohen's kappa + Pearson for samples where humanScore is set
  computeAgreement: adminProcedure
    .input(z.object({ runId: z.string() }))
    .query(async ({ input, ctx }) => {
      guardOpsOrAdmin(ctx.activeAdminUser?.role);

      const allRows = await prisma.evaluationSample.findMany({
        where: { runId: input.runId },
        orderBy: { id: 'asc' },
        select: { id: true },
      });

      const allIds = allRows.map((r) => r.id);
      const subsetIds = listInterRaterSubset(allIds, input.runId);

      const rated = await prisma.evaluationSample.findMany({
        where: {
          id: { in: subsetIds },
          humanScore: { not: null },
        },
        select: { judgeScore: true, humanScore: true },
      });

      const llmScores = rated.map((r) => r.judgeScore);
      const humanScores = rated.map((r) => r.humanScore as number);

      const kappa = cohenKappa(llmScores, humanScores);
      const pearson = pearsonCorrelation(llmScores, humanScores);
      const interpretation = interpretKappa(kappa);

      return {
        kappa: Math.round(kappa * 1000) / 1000,
        pearson: Math.round(pearson * 1000) / 1000,
        interpretation,
        ratedCount: rated.length,
        totalSubset: subsetIds.length,
      };
    }),
});
