/**
 * DailyTask BullMQ Queue — PRD-8 US-002 AC-4
 * Queue 'daily-task' · Redis connection
 * Worker 不在本 story 启动 (留 US-007)
 */

import { Queue } from 'bullmq';

import { redis } from '@/lib/redis';

export const DAILY_TASK_QUEUE_NAME = 'daily-task';

export interface DailyTaskJobPayload {
  accountId: number;
  scheduledDate: string; // YYYY-MM-DD
}

export const dailyTaskQueue = new Queue<DailyTaskJobPayload>(DAILY_TASK_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});
