// PRD-29 · adminRouter.stepData — 3 procedures
// list(分页 + stepKey/accountId/status 过滤) · detail(含 inputs/result) · kpiStats
// SHIELD: ctx.adminPrisma ?? ctx.prisma (跨账号 RLS-bypass)
// SHIELD: Promise.all 并行 · 不允许串行 await A; await B

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { adminProcedure } from '@/trpc/procedures/admin';
import { adminTrpcRouter } from '@/trpc/trpc-admin';

// ── Input schemas ──────────────────────────────────────────────────────────

const listInput = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  accountId: z.number().int().optional(),
  stepKey: z.string().optional(),
  status: z.string().optional(),
});

const detailInput = z.object({
  id: z.number().int(),
});

// ── Router ─────────────────────────────────────────────────────────────────

export const stepDataRouter = adminTrpcRouter({
  /**
   * Paginated list of StepData across all accounts.
   * Optional filters: stepKey · accountId · status.
   * Select: id/accountId/stepKey/status/agentId/isFallback/modelUsed/tokensUsed/durationMs/updatedAt.
   * Ordered by updatedAt desc.
   */
  list: adminProcedure
    .input(listInput)
    .query(async ({ input, ctx }) => {
      const db = ctx.adminPrisma ?? ctx.prisma;
      const { page, pageSize, accountId, stepKey, status } = input;

      const where = {
        ...(accountId !== undefined ? { accountId } : {}),
        ...(stepKey !== undefined ? { stepKey } : {}),
        ...(status !== undefined ? { status } : {}),
      };

      const skip = (page - 1) * pageSize;

      // SHIELD: Promise.all 并行
      const [items, total] = await Promise.all([
        db.stepData.findMany({
          where,
          orderBy: { updatedAt: 'desc' },
          skip,
          take: pageSize,
          select: {
            id: true,
            accountId: true,
            stepKey: true,
            status: true,
            agentId: true,
            isFallback: true,
            modelUsed: true,
            tokensUsed: true,
            durationMs: true,
            updatedAt: true,
          },
        }),
        db.stepData.count({ where }),
      ]);

      return { items, total, page, pageSize };
    }),

  /**
   * Full detail for a single StepData record by id.
   * Includes inputs / result JSON fields.
   */
  detail: adminProcedure
    .input(detailInput)
    .query(async ({ input, ctx }) => {
      const db = ctx.adminPrisma ?? ctx.prisma;

      const record = await db.stepData.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          accountId: true,
          stepKey: true,
          status: true,
          agentId: true,
          isFallback: true,
          modelUsed: true,
          tokensUsed: true,
          durationMs: true,
          traceId: true,
          inputs: true,
          result: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!record) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'step_data_not_found' });
      }

      return {
        ...record,
        inputs: record.inputs as Record<string, unknown>,
        result: record.result as Record<string, unknown> | null,
      };
    }),

  /**
   * KPI stats: total records / stepKey distribution / 7-day new / fallback rate / avg tokens.
   * SHIELD: Promise.all 并行
   */
  kpiStats: adminProcedure
    .query(async ({ ctx }) => {
      const db = ctx.adminPrisma ?? ctx.prisma;
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // SHIELD: Promise.all 并行
      const [total, recentCount, fallbackCount, aggResult, stepKeyGroups] = await Promise.all([
        db.stepData.count(),
        db.stepData.count({
          where: { updatedAt: { gte: sevenDaysAgo } },
        }),
        db.stepData.count({ where: { isFallback: true } }),
        db.stepData.aggregate({
          _avg: { tokensUsed: true },
        }),
        db.stepData.groupBy({
          by: ['stepKey'],
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
        }),
      ]);

      const avgTokens = aggResult._avg.tokensUsed ?? 0;
      const fallbackRate = total > 0 ? fallbackCount / total : 0;

      // stepKey distribution map: { step1: 42, step3b: 18, ... }
      const stepKeyDistribution: Record<string, number> = {};
      for (const g of stepKeyGroups) {
        stepKeyDistribution[g.stepKey] = g._count.id;
      }

      return {
        total,
        recentCount,
        // fallbackRate: 百分比数值，1 位小数。例如 12.3 表示 12.3%，不是 0.123。
        fallbackRate: Math.round(fallbackRate * 1000) / 10,
        avgTokens: Math.round(avgTokens),
        stepKeyDistribution,
      };
    }),
});
