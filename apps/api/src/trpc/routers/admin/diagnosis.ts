// PRD-29 · adminRouter.diagnosis — 3 procedures
// list(分页 + accountId/score 过滤) · detail(含 dimensions/answers/recommendedSteps) · kpiStats
// SHIELD: ctx.adminPrisma ?? ctx.prisma (跨账号 RLS-bypass)
// SHIELD: Promise.all 并行 · 不允许串行 await A; await B

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { adminProcedure } from '@/trpc/procedures/admin';
import { adminTrpcRouter } from '@/trpc/trpc-admin';

import type { DiagnosisAnswer } from '@quanan/schemas/specialist-io';

// answers/dimensions 是 Json 列,形状确定(同 app/diagnosis):收窄回域类型对齐前端。
type DiagnosisDimensions = Record<string, { score: number; issues: string[]; suggestions: string[] }>;

// ── Input schemas ──────────────────────────────────────────────────────────

const listInput = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  accountId: z.number().int().optional(),
  minScore: z.number().int().min(0).max(100).optional(),
  maxScore: z.number().int().min(0).max(100).optional(),
});

const detailInput = z.object({
  id: z.number().int(),
});

// ── Router ─────────────────────────────────────────────────────────────────

export const diagnosisRouter = adminTrpcRouter({
  /**
   * Paginated list of DiagnosisReport across all accounts.
   * Optional filters: accountId · minScore · maxScore.
   * Select: id/accountId/overallScore/inferredStage/topPriority/agentId/isFallback/modelUsed/tokensUsed/createdAt.
   * Ordered by createdAt desc.
   */
  list: adminProcedure
    .input(listInput)
    .query(async ({ input, ctx }) => {
      const db = ctx.adminPrisma ?? ctx.prisma;
      const { page, pageSize, accountId, minScore, maxScore } = input;

      const where = {
        ...(accountId !== undefined ? { accountId } : {}),
        ...((minScore !== undefined || maxScore !== undefined)
          ? {
              overallScore: {
                ...(minScore !== undefined ? { gte: minScore } : {}),
                ...(maxScore !== undefined ? { lte: maxScore } : {}),
              },
            }
          : {}),
      };

      const skip = (page - 1) * pageSize;

      // SHIELD: Promise.all 并行
      const [items, total] = await Promise.all([
        db.diagnosisReport.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize,
          select: {
            id: true,
            accountId: true,
            overallScore: true,
            inferredStage: true,
            topPriority: true,
            agentId: true,
            isFallback: true,
            modelUsed: true,
            tokensUsed: true,
            createdAt: true,
          },
        }),
        db.diagnosisReport.count({ where }),
      ]);

      return { items, total, page, pageSize };
    }),

  /**
   * Full detail for a single DiagnosisReport by id.
   * Includes dimensions / answers / recommendedSteps.
   */
  detail: adminProcedure
    .input(detailInput)
    .query(async ({ input, ctx }) => {
      const db = ctx.adminPrisma ?? ctx.prisma;

      const report = await db.diagnosisReport.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          accountId: true,
          overallScore: true,
          inferredStage: true,
          topPriority: true,
          recommendedSteps: true,
          agentId: true,
          isFallback: true,
          modelUsed: true,
          tokensUsed: true,
          durationMs: true,
          traceId: true,
          createdAt: true,
          dimensions: true,
          answers: true,
        },
      });

      if (!report) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'diagnosis_report_not_found' });
      }

      return {
        ...report,
        answers: report.answers as DiagnosisAnswer[],
        dimensions: report.dimensions as DiagnosisDimensions,
      };
    }),

  /**
   * KPI stats: total reports / 7-day new / avg score / fallback rate.
   * SHIELD: Promise.all 并行
   */
  kpiStats: adminProcedure
    .query(async ({ ctx }) => {
      const db = ctx.adminPrisma ?? ctx.prisma;
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // SHIELD: Promise.all 并行
      const [total, recentCount, aggResult, fallbackCount] = await Promise.all([
        db.diagnosisReport.count(),
        db.diagnosisReport.count({
          where: { createdAt: { gte: sevenDaysAgo } },
        }),
        db.diagnosisReport.aggregate({
          _avg: { overallScore: true },
        }),
        db.diagnosisReport.count({ where: { isFallback: true } }),
      ]);

      const avgScore = aggResult._avg.overallScore ?? 0;
      const fallbackRate = total > 0 ? fallbackCount / total : 0;

      return {
        total,
        recentCount,
        avgScore: Math.round(avgScore * 10) / 10,
        // fallbackRate: 百分比数值，1 位小数。例如 12.3 表示 12.3%，不是 0.123。
        fallbackRate: Math.round(fallbackRate * 1000) / 10,
      };
    }),
});
