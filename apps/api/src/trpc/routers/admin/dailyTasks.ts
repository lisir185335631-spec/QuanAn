// PRD-29 · adminRouter.dailyTasks — 3 procedures
// list(分页 + accountId/agentId/isFallback/dateRange 过滤) · detail(含 tasks JSON) · kpiStats
// SHIELD: ctx.adminPrisma ?? ctx.prisma (跨账号 RLS-bypass)
// SHIELD: Promise.all 并行 · 不允许串行 await A; await B

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { adminProcedure } from '@/trpc/procedures/admin';
import { adminTrpcRouter } from '@/trpc/trpc-admin';

import type { TaskItem } from '@quanan/schemas/specialist-io';

// ── Input schemas ──────────────────────────────────────────────────────────

const listInput = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  accountId: z.number().int().optional(),
  agentId: z.string().optional(),
  isFallback: z.boolean().optional(),
  dateFrom: z.string().optional(), // ISO date string — filters taskDate
  dateTo: z.string().optional(),   // ISO date string — filters taskDate
});

const detailInput = z.object({
  id: z.number().int(),
});

// ── Router ─────────────────────────────────────────────────────────────────

export const dailyTasksAdminRouter = adminTrpcRouter({
  /**
   * Paginated list of DailyTasks across all accounts.
   * Optional filters: accountId · agentId · isFallback · dateRange(taskDate).
   * Select: id/accountId/taskDate/completedCount/totalCount/agentId/modelUsed/isFallback/createdAt.
   * (tasks JSON 不在列表中 — detail 才带)
   * Ordered by taskDate desc.
   */
  list: adminProcedure
    .input(listInput)
    .query(async ({ input, ctx }) => {
      const db = ctx.adminPrisma ?? ctx.prisma;
      const { page, pageSize, accountId, agentId, isFallback, dateFrom, dateTo } = input;

      // taskDate 是 @db.Date 列 — 直接传 date 字符串构造的 Date 即可，勿追加时分秒
      // (加 T23:59:59 在非 UTC 环境会折算到次日，多捞一天)
      const dateFilter =
        dateFrom || dateTo
          ? {
              taskDate: {
                ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
                ...(dateTo ? { lte: new Date(dateTo) } : {}),
              },
            }
          : {};

      const where = {
        ...(accountId !== undefined ? { accountId } : {}),
        ...(agentId !== undefined ? { agentId } : {}),
        ...(isFallback !== undefined ? { isFallback } : {}),
        ...dateFilter,
      };

      const skip = (page - 1) * pageSize;

      // SHIELD: Promise.all 并行
      const [items, total] = await Promise.all([
        db.dailyTask.findMany({
          where,
          orderBy: { taskDate: 'desc' },
          skip,
          take: pageSize,
          select: {
            id: true,
            accountId: true,
            taskDate: true,
            completedCount: true,
            totalCount: true,
            agentId: true,
            modelUsed: true,
            isFallback: true,
            createdAt: true,
          },
        }),
        db.dailyTask.count({ where }),
      ]);

      return { items, total, page, pageSize };
    }),

  /**
   * Full detail for a single DailyTask record by id.
   * Includes tasks JSON (omitted from list for performance).
   * Throws NOT_FOUND if record does not exist.
   */
  detail: adminProcedure
    .input(detailInput)
    .query(async ({ input, ctx }) => {
      const db = ctx.adminPrisma ?? ctx.prisma;

      const record = await db.dailyTask.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          accountId: true,
          taskDate: true,
          tasks: true,
          completedCount: true,
          totalCount: true,
          agentId: true,
          modelUsed: true,
          isFallback: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!record) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'daily_task_not_found' });
      }

      return { ...record, tasks: record.tasks as TaskItem[] };
    }),

  /**
   * KPI stats: 总记录数 / 近 7 天新增(createdAt) / fallback 占比 / 平均完成率 /
   * 各 agentId 分布.
   * SHIELD: Promise.all 并行 · 分母 0 不除零
   */
  kpiStats: adminProcedure
    .query(async ({ ctx }) => {
      const db = ctx.adminPrisma ?? ctx.prisma;
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // SHIELD: Promise.all 并行
      const [total, recentCount, fallbackCount, completionAgg, agentIdGroups] = await Promise.all([
        db.dailyTask.count(),
        // recentCount 口径: 近 7 天 createdAt (记录写入时间，与 topics/history 一致；非 taskDate)
        db.dailyTask.count({
          where: { createdAt: { gte: sevenDaysAgo } },
        }),
        db.dailyTask.count({
          where: { isFallback: true },
        }),
        db.dailyTask.aggregate({
          _sum: {
            completedCount: true,
            totalCount: true,
          },
        }),
        db.dailyTask.groupBy({
          by: ['agentId'],
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
        }),
      ]);

      // fallback 占比 (分母 0 不除零)
      const fallbackRate = total > 0 ? fallbackCount / total : 0;

      // 平均完成率: ΣcompletedCount / ΣtotalCount (分母 0 不除零)
      const sumCompleted = completionAgg._sum.completedCount ?? 0;
      const sumTotal = completionAgg._sum.totalCount ?? 0;
      const avgCompletionRate = sumTotal > 0 ? sumCompleted / sumTotal : 0;

      // agentId distribution map — null 防卫(与 topics category 惯例一致)
      const agentIdDistribution: Record<string, number> = {};
      for (const g of agentIdGroups) {
        if (g.agentId !== null) {
          agentIdDistribution[g.agentId] = g._count.id;
        }
      }

      return {
        total,
        recentCount,
        fallbackRate,
        avgCompletionRate,
        agentIdDistribution,
      };
    }),
});
