/**
 * DailyTasks router — PRD-8 US-007
 * AC-7: regenerateToday — 用户主动触发今日任务重新生成
 *       若当日已有记录 → upsert 更新(幂等) · 无强制上限
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { logger } from '@/lib/logger';
import { protectedProcedure } from '@/trpc/middleware/account-isolation';
import { router } from '@/trpc/trpc';
import { dailyTaskQueue } from '@/workers/daily-task/queue';

import type { Prisma } from '@prisma/client';

const DAILY_TASK_SELECT = {
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
} satisfies Prisma.DailyTaskSelect;

/** 格式化日期为 YYYY-MM-DD */
function formatDateYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const dailyTasksRouter = router({
  /** 获取今日任务列表 */
  getToday: protectedProcedure.query(async ({ ctx }) => {
    const { prisma: db, activeAccountId } = ctx;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const record = await db.dailyTask.findFirst({
      where: {
        accountId: activeAccountId!,
        taskDate: today,
      },
      select: DAILY_TASK_SELECT,
    });

    return record ?? null;
  }),

  /** 获取历史任务记录 */
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(30).default(7),
        offset: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { prisma: db, activeAccountId } = ctx;
      return db.dailyTask.findMany({
        where: { accountId: activeAccountId! },
        select: DAILY_TASK_SELECT,
        orderBy: { taskDate: 'desc' },
        take: input.limit,
        skip: input.offset,
      });
    }),

  /**
   * AC-7: 用户主动触发重新生成今日任务
   * 向 BullMQ 推送 daily-task job · Worker 处理后 upsert 写入 DailyTask 表
   */
  regenerateToday: protectedProcedure.mutation(async ({ ctx }) => {
    const { activeAccountId, traceId } = ctx;
    const scheduledDate = formatDateYMD(new Date());

    logger.info(
      { accountId: activeAccountId, scheduledDate, traceId },
      'daily_tasks.regenerate_today.triggered',
    );

    const jobId = `daily-task-${activeAccountId!}-${scheduledDate}-regen`;

    try {
      await dailyTaskQueue.add(
        'daily-task',
        { accountId: activeAccountId!, scheduledDate },
        { jobId, priority: 1 }, // priority=1 优先处理用户主动触发
      );
    } catch (err) {
      logger.error({ err, accountId: activeAccountId }, 'daily_tasks.regenerate_today.enqueue_failed');
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: '任务重新生成失败，请稍后再试',
      });
    }

    return { ok: true, scheduledDate, jobId };
  }),

  /** 标记任务完成 */
  completeTask: protectedProcedure
    .input(
      z.object({
        dailyTaskId: z.number().int().positive(),
        taskId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma: db, activeAccountId } = ctx;

      const record = await db.dailyTask.findFirst({
        where: { id: input.dailyTaskId, accountId: activeAccountId! },
        select: { id: true, tasks: true, completedCount: true, totalCount: true },
      });

      if (!record) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '任务记录不存在' });
      }

      const tasks = record.tasks as Array<{ id: string; completed: boolean }>;
      const updatedTasks = tasks.map((t) =>
        t.id === input.taskId ? { ...t, completed: true } : t,
      );
      const completedCount = updatedTasks.filter((t) => t.completed).length;

      await db.dailyTask.update({
        where: { id: record.id },
        data: {
          tasks: updatedTasks as unknown as Prisma.InputJsonValue,
          completedCount,
        },
      });

      return { ok: true, completedCount, totalCount: record.totalCount };
    }),

  /** 查询今日任务队列状态(调试用) */
  debugQueueStatus: protectedProcedure.query(async () => {
    if (process.env['NODE_ENV'] === 'production') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'debug endpoint disabled in production' });
    }
    const [waiting, active, completed, failed] = await Promise.all([
      dailyTaskQueue.getWaitingCount(),
      dailyTaskQueue.getActiveCount(),
      dailyTaskQueue.getCompletedCount(),
      dailyTaskQueue.getFailedCount(),
    ]);
    return { waiting, active, completed, failed };
  }),
});

/** AC-7: 供 cron/手动调用的直接队列入口 */
export async function enqueueDailyTaskForAccount(
  accountId: number,
  scheduledDate: string,
): Promise<void> {
  await dailyTaskQueue.add(
    'daily-task',
    { accountId, scheduledDate },
    { jobId: `daily-task-${accountId}-${scheduledDate}` },
  );
}
