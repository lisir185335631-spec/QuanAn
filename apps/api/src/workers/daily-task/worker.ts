/**
 * DailyTask BullMQ Worker — PRD-8 US-007
 * AC-5: prisma.dailyTask.upsert — 幂等保证 · @@unique([accountId, taskDate])
 * AC-6: concurrency=5 · failure retry 3 (queue.ts defaultJobOptions) · dead-letter stub
 * ★ REJ-008: job.data.accountId 显式带入 prisma 查询 (no RLS ctx in worker)
 */

import { Worker } from 'bullmq';

import { dailyTaskAgent } from '@/agents/specialists/DailyTaskAgent';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

import { DAILY_TASK_QUEUE_NAME } from './queue';

import type { DailyTaskJobPayload } from './queue';

/** AC-5: 处理单个 daily-task job · upsert 保证幂等 */
async function processDailyTaskJob(payload: DailyTaskJobPayload): Promise<void> {
  const { accountId, scheduledDate } = payload;
  const traceId = `daily-task-${accountId}-${scheduledDate}`;

  logger.info({ accountId, scheduledDate, traceId }, 'daily_task_worker.started');

  // 调 DailyTaskAgent 生成今日任务
  const result = await dailyTaskAgent.execute({
    accountId,
    userInput: { accountId, taskDate: scheduledDate },
    traceId,
  });

  const tasks = result.result.tasks;
  const taskDate = new Date(`${scheduledDate}T00:00:00`);

  // AC-5: upsert — 同日重复 job 不重复建行 · @@unique([accountId, taskDate])
  await prisma.dailyTask.upsert({
    where: {
      accountId_taskDate: { accountId, taskDate },
    },
    create: {
      accountId,
      taskDate,
      tasks: tasks as unknown as Parameters<typeof prisma.dailyTask.create>[0]['data']['tasks'],
      totalCount: tasks.length,
      completedCount: 0,
      agentId: 'DailyTaskAgent',
      modelUsed: result.modelUsed,
      isFallback: result.isFallback,
      traceId,
    },
    update: {
      tasks: tasks as unknown as Parameters<typeof prisma.dailyTask.update>[0]['data']['tasks'],
      totalCount: tasks.length,
      modelUsed: result.modelUsed,
      isFallback: result.isFallback,
      updatedAt: new Date(),
    },
  });

  logger.info(
    { accountId, scheduledDate, taskCount: tasks.length, modelUsed: result.modelUsed },
    'daily_task_worker.completed',
  );
}

// AC-6: concurrency=5 · Worker 同时处理 5 个 account 的任务生成
export const dailyTaskWorker = new Worker<DailyTaskJobPayload>(
  DAILY_TASK_QUEUE_NAME,
  async (job) => processDailyTaskJob(job.data),
  {
    connection: redis,
    concurrency: 5, // AC-6
  },
);

dailyTaskWorker.on('completed', (job) => {
  logger.info(
    { jobId: job.id, accountId: job.data.accountId, scheduledDate: job.data.scheduledDate },
    'daily_task_worker.job_completed',
  );
});

dailyTaskWorker.on('failed', (job, err) => {
  logger.error(
    { jobId: job?.id, accountId: job?.data.accountId, err },
    'daily_task_worker.job_failed',
  );
});

// AC-6: dead-letter 告警 stub — P2 接入真实告警 (Sentry/OTel)
dailyTaskWorker.on('error', (err) => {
  logger.error({ err }, 'daily_task_worker.dead_letter_alert');
});
