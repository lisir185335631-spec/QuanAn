/**
 * DeepLearning BullMQ Job — PRD-27 US-004 AC-3
 * Queue 'deep-learning' · worker.process → DeepLearnAgent.execute → 写 history row + 更新 job status
 * 继承 PRD-25 dailyTasks 模式(D-245): enqueue + status polling
 * REJ-008: job.data.accountId 显式带入 prisma 查询 (no RLS ctx in worker)
 */

import { Queue, Worker } from 'bullmq';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { deepLearnAgent } from '@/specialists/DeepLearnAgent';

export const DEEP_LEARNING_QUEUE_NAME = 'deep-learning';

export interface DeepLearningJobPayload {
  historyId: number;
  accountId: number;
  /** fix ⑥: 真实触发用户 id，由路由层带入，替代 SYSTEM_USER_ID */
  userId: number;
  samples: Array<{ text: string; source: string }>;
  traceId: string;
}

/** Status stored in history.content JSON */
export interface DeepLearningJobContent {
  status: 'queued' | 'processing' | 'completed' | 'failed';
  result?: {
    summary: string;
    dimensions: {
      tone: string;
      structure: string;
      hook: string;
      transition: string;
      closing: string;
    };
    isFallback: boolean;
    tokensUsed: number;
    modelUsed: string;
    durationMs: number;
  };
  error?: string;
}

export const deepLearningQueue = new Queue<DeepLearningJobPayload>(DEEP_LEARNING_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

async function processDeepLearningJob(payload: DeepLearningJobPayload): Promise<void> {
  const { historyId, accountId, userId, samples, traceId } = payload;

  logger.info({ historyId, accountId, userId, traceId }, 'deep_learning_job.started');

  // Mark as processing
  await prisma.history.update({
    where: { id: historyId },
    data: { content: JSON.stringify({ status: 'processing' } satisfies DeepLearningJobContent) },
  });

  try {
    const agentRes = await deepLearnAgent.execute({
      accountId,
      userId, // fix ⑥: 透传真实用户 id，不再落 SYSTEM_USER_ID 限流桶
      userInput: { samples },
      traceId,
    });

    const completedContent: DeepLearningJobContent = {
      status: 'completed',
      result: {
        summary: agentRes.result.summary,
        dimensions: agentRes.result.dimensions,
        isFallback: agentRes.isFallback,
        tokensUsed: agentRes.tokensUsed.total,
        modelUsed: agentRes.modelUsed,
        durationMs: agentRes.durationMs,
      },
    };

    await prisma.history.update({
      where: { id: historyId },
      data: {
        content: JSON.stringify(completedContent),
        tokensUsed: agentRes.tokensUsed.total,
        modelUsed: agentRes.modelUsed,
        durationMs: agentRes.durationMs,
        isFallback: agentRes.isFallback,
      },
    });

    logger.info({ historyId, accountId, traceId, modelUsed: agentRes.modelUsed }, 'deep_learning_job.completed');
  } catch (err) {
    const failedContent: DeepLearningJobContent = {
      status: 'failed',
      error: err instanceof Error ? err.message : '未知错误',
    };

    await prisma.history.update({
      where: { id: historyId },
      data: { content: JSON.stringify(failedContent) },
    }).catch((updateErr: unknown) => {
      logger.error({ err: updateErr, historyId }, 'deep_learning_job.history_update_failed');
    });

    logger.error({ err, historyId, accountId, traceId }, 'deep_learning_job.failed');
    throw err;
  }
}

export const deepLearningWorker = new Worker<DeepLearningJobPayload>(
  DEEP_LEARNING_QUEUE_NAME,
  async (job) => processDeepLearningJob(job.data),
  { connection: redis, concurrency: 3 },
);

deepLearningWorker.on('completed', (job) => {
  logger.info({ jobId: job.id, historyId: job.data.historyId }, 'deep_learning_worker.job_completed');
});

deepLearningWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, historyId: job?.data.historyId, err }, 'deep_learning_worker.job_failed');
});

deepLearningWorker.on('error', (err) => {
  logger.error({ err }, 'deep_learning_worker.dead_letter_alert');
});
