/**
 * DailyTask Cron Runner — PRD-8 US-007
 * AC-3: cron.schedule('0 0 * * *') · Asia/Shanghai timezone
 *       cron.start() 由 index.ts 在 app boot 时调用
 * AC-4: runForAllActiveAccounts — prisma.ipAccount.findMany(updatedAt > 7 days)
 *       forEach enqueue 'daily-task' job
 */

import { schedule } from 'node-cron';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { dailyTaskQueue } from '@/workers/daily-task/queue';

/** 格式化日期为 YYYY-MM-DD (Asia/Shanghai 时区) */
function formatDateYMD(date: Date): string {
  // 使用 toLocaleDateString 或手动格式化
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * AC-4: 为所有活跃账号批量 enqueue 'daily-task' job
 * 活跃账号 = updatedAt > 7 天前 + isActive=true
 */
export async function runForAllActiveAccounts(scheduledDate?: string): Promise<number> {
  const taskDate = scheduledDate ?? formatDateYMD(new Date());
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const activeAccounts = await prisma.ipAccount.findMany({
    where: {
      isActive: true,
      updatedAt: { gt: sevenDaysAgo },
    },
    select: { id: true },
  });

  logger.info(
    { count: activeAccounts.length, taskDate },
    'daily_task_cron.fan_out_start',
  );

  // AC-4: forEach enqueue 'daily-task' job per account
  await Promise.all(
    activeAccounts.map((account) =>
      dailyTaskQueue.add(
        'daily-task',
        { accountId: account.id, scheduledDate: taskDate },
        { jobId: `daily-task-${account.id}-${taskDate}` }, // 幂等 job ID
      ),
    ),
  );

  logger.info(
    { enqueued: activeAccounts.length, taskDate },
    'daily_task_cron.fan_out_done',
  );

  return activeAccounts.length;
}

/**
 * AC-3: cron.schedule('0 0 * * *') — 每日 0 点触发 (Asia/Shanghai)
 * scheduled: false — 由 index.ts 调用 dailyTaskCron.start() 在 app boot 时启动
 */
export const dailyTaskCron = schedule(
  '0 0 * * *',
  async () => {
    logger.info('daily_task_cron.triggered');
    try {
      const count = await runForAllActiveAccounts();
      logger.info({ count }, 'daily_task_cron.completed');
    } catch (err) {
      logger.error({ err }, 'daily_task_cron.failed');
    }
  },
  {
    scheduled: false, // AC-3: index.ts 调 dailyTaskCron.start()
    timezone: 'Asia/Shanghai',
  },
);
