// PRD-29 · adminRouter.topics — 3 procedures
// list(分页 + sourceType/category/platform/accountId/dateRange 过滤) · detail(含 hook 等全字段) · kpiStats
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
  sourceType: z.string().optional(),
  category: z.string().optional(),
  platform: z.string().optional(),
  dateFrom: z.string().optional(), // ISO date string
  dateTo: z.string().optional(),   // ISO date string
});

const detailInput = z.object({
  id: z.number().int(),
});

// ── Router ─────────────────────────────────────────────────────────────────

export const topicsAdminRouter = adminTrpcRouter({
  /**
   * Paginated list of Topics across all accounts.
   * Optional filters: sourceType · category · platform · accountId · dateRange(createdAt).
   * Select: id/accountId/title/category/platform/sourceType/createdAt.
   * Ordered by createdAt desc. (Note: no hook/content in list — detail only)
   */
  list: adminProcedure
    .input(listInput)
    .query(async ({ input, ctx }) => {
      const db = ctx.adminPrisma ?? ctx.prisma;
      const { page, pageSize, accountId, sourceType, category, platform, dateFrom, dateTo } = input;

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
        ...(sourceType !== undefined ? { sourceType } : {}),
        ...(category !== undefined ? { category } : {}),
        ...(platform !== undefined ? { platform } : {}),
        ...dateFilter,
      };

      const skip = (page - 1) * pageSize;

      // SHIELD: Promise.all 并行
      const [items, total] = await Promise.all([
        db.topic.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize,
          select: {
            id: true,
            accountId: true,
            title: true,
            category: true,
            platform: true,
            sourceType: true,
            createdAt: true,
          },
        }),
        db.topic.count({ where }),
      ]);

      return { items, total, page, pageSize };
    }),

  /**
   * Full detail for a single Topic record by id.
   * Includes hook and all other fields (omitted from list for performance).
   * Throws NOT_FOUND if record does not exist.
   */
  detail: adminProcedure
    .input(detailInput)
    .query(async ({ input, ctx }) => {
      const db = ctx.adminPrisma ?? ctx.prisma;

      const record = await db.topic.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          accountId: true,
          title: true,
          hook: true,
          structure: true,
          formula: true,
          category: true,
          presentStyle: true,
          platform: true,
          difficulty: true,
          viralPotential: true,
          logicType: true,
          sourceType: true,
          sourceTrendingId: true,
          userTags: true,
          isUsed: true,
          usedAt: true,
          generatedHistoryId: true,
          traceId: true,
          createdAt: true,
        },
      });

      if (!record) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'topic_not_found' });
      }

      return record;
    }),

  /**
   * KPI stats: total / sourceType distribution / category distribution /
   * 近 7 天新增(createdAt).
   * SHIELD: Promise.all 并行
   */
  kpiStats: adminProcedure
    .query(async ({ ctx }) => {
      const db = ctx.adminPrisma ?? ctx.prisma;
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // SHIELD: Promise.all 并行
      const [total, recentCount, sourceTypeGroups, categoryGroups] = await Promise.all([
        db.topic.count(),
        db.topic.count({
          where: { createdAt: { gte: sevenDaysAgo } },
        }),
        db.topic.groupBy({
          by: ['sourceType'],
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
        }),
        db.topic.groupBy({
          by: ['category'],
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
        }),
      ]);

      // sourceType distribution map: { manual: 42, ai_generated: 18, ... }
      // sourceType is NOT NULL in schema — no null guard needed
      const sourceTypeDistribution: Record<string, number> = {};
      for (const g of sourceTypeGroups) {
        sourceTypeDistribution[g.sourceType] = g._count.id;
      }

      // category distribution map: { 美食: 30, 健身: 12, ... }
      const categoryDistribution: Record<string, number> = {};
      for (const g of categoryGroups) {
        if (g.category !== null) {
          categoryDistribution[g.category] = g._count.id;
        }
      }

      return {
        total,
        recentCount,
        sourceTypeDistribution,
        categoryDistribution,
      };
    }),
});
