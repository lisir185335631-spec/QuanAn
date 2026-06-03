// PRD-29 · adminRouter.history — 3 procedures
// list(分页 + agentId/scriptType/sourceType/accountId/isFallback/dateRange 过滤) · detail(含 content) · kpiStats
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
  agentId: z.string().optional(),
  scriptType: z.string().optional(),
  sourceType: z.string().optional(),
  isFallback: z.boolean().optional(),
  dateFrom: z.string().optional(), // ISO date string
  dateTo: z.string().optional(),   // ISO date string
});

const detailInput = z.object({
  id: z.number().int(),
});

// ── Router ─────────────────────────────────────────────────────────────────

export const historyAdminRouter = adminTrpcRouter({
  /**
   * Paginated list of History across all accounts.
   * Optional filters: agentId · scriptType · sourceType · accountId · isFallback · dateRange(createdAt).
   * Select: id/accountId/agentId/agentMode/sourceType/inputSummary/contentType/scriptType/elements/isFallback/traceId/createdAt.
   * Ordered by createdAt desc. (Note: no content in list — detail only)
   */
  list: adminProcedure
    .input(listInput)
    .query(async ({ input, ctx }) => {
      const db = ctx.adminPrisma ?? ctx.prisma;
      const { page, pageSize, accountId, agentId, scriptType, sourceType, isFallback, dateFrom, dateTo } = input;

      const dateFilter =
        dateFrom || dateTo
          ? {
              createdAt: {
                ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
                ...(dateTo ? { lte: new Date(dateTo + 'T23:59:59.999Z') } : {}),
              },
            }
          : {};

      const where = {
        ...(accountId !== undefined ? { accountId } : {}),
        ...(agentId !== undefined ? { agentId } : {}),
        ...(scriptType !== undefined ? { scriptType } : {}),
        ...(sourceType !== undefined ? { sourceType } : {}),
        ...(isFallback !== undefined ? { isFallback } : {}),
        ...dateFilter,
      };

      const skip = (page - 1) * pageSize;

      // SHIELD: Promise.all 并行
      const [items, total] = await Promise.all([
        db.history.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize,
          select: {
            id: true,
            accountId: true,
            agentId: true,
            agentMode: true,
            sourceType: true,
            inputSummary: true,
            contentType: true,
            scriptType: true,
            elements: true,
            isFallback: true,
            traceId: true,
            createdAt: true,
          },
        }),
        db.history.count({ where }),
      ]);

      return { items, total, page, pageSize };
    }),

  /**
   * Full detail for a single History record by id.
   * Includes content field (omitted from list for performance).
   * Throws NOT_FOUND if record does not exist.
   */
  detail: adminProcedure
    .input(detailInput)
    .query(async ({ input, ctx }) => {
      const db = ctx.adminPrisma ?? ctx.prisma;

      const record = await db.history.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          accountId: true,
          agentId: true,
          agentMode: true,
          sourceType: true,
          inputSummary: true,
          content: true,
          contentType: true,
          scriptType: true,
          elements: true,
          isFallback: true,
          traceId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!record) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'history_not_found' });
      }

      return record;
    }),

  /**
   * KPI stats: total records / agentId distribution (top) / scriptType distribution /
   * fallback rate / 近 7 天新增(createdAt).
   * SHIELD: Promise.all 并行
   */
  kpiStats: adminProcedure
    .query(async ({ ctx }) => {
      const db = ctx.adminPrisma ?? ctx.prisma;
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // SHIELD: Promise.all 并行
      const [total, recentCount, fallbackCount, agentIdGroups, scriptTypeGroups] = await Promise.all([
        db.history.count(),
        db.history.count({
          where: { createdAt: { gte: sevenDaysAgo } },
        }),
        db.history.count({ where: { isFallback: true } }),
        db.history.groupBy({
          by: ['agentId'],
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 10,
        }),
        db.history.groupBy({
          by: ['scriptType'],
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
        }),
      ]);

      const fallbackRate = total > 0 ? fallbackCount / total : 0;

      // agentId distribution map: { CopywritingAgent: 42, VideoAgent: 18, ... }
      // null guard: schema marks agentId as required, but groupBy may surface null in edge cases
      const agentIdDistribution: Record<string, number> = {};
      for (const g of agentIdGroups) {
        if (g.agentId !== null) {
          agentIdDistribution[g.agentId] = g._count.id;
        }
      }

      // scriptType distribution map: { short_video: 30, long_article: 12, ... }
      const scriptTypeDistribution: Record<string, number> = {};
      for (const g of scriptTypeGroups) {
        if (g.scriptType !== null) {
          scriptTypeDistribution[g.scriptType] = g._count.id;
        }
      }

      return {
        total,
        recentCount,
        // fallbackRate: 百分比数值，1 位小数。例如 12.3 表示 12.3%，不是 0.123。
        fallbackRate: Math.round(fallbackRate * 1000) / 10,
        agentIdDistribution,
        scriptTypeDistribution,
      };
    }),
});
