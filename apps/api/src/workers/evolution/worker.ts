/**
 * QuanQn · PRD-8 US-003 AC-6
 * Evolution BullMQ Worker
 *
 * concurrency: 1 per accountId — 通过 trigger.ts 的 jobId=`evo:{accountId}:{count}` 去重实现
 * 全局 concurrency=5 — 不同 account 可并发
 * failure retry 3 (继承 queue defaultJobOptions.attempts=3)
 * dead-letter alert stub — job.failed 时 attemptsMade >= 3 → 告警日志
 */

import { Worker } from 'bullmq';

import { logger } from '@/lib/logger';
import { redis } from '@/lib/redis';
import { evolutionAgent } from '@/agents/evolution/EvolutionAgent';

import { EVOLUTION_QUEUE_NAME } from './queue';

import type { EvolutionJobPayload } from './queue';

async function processEvolutionJob(payload: EvolutionJobPayload): Promise<void> {
  const { accountId, triggerType } = payload;

  logger.info({ accountId, triggerType }, 'evolution.worker.start');

  // EvolutionAgent.execute() 内部处理 LLM 调用 + 原子事务
  await evolutionAgent.execute({
    accountId,
    userInput: { accountId, triggerType },
    traceId: `evo-worker-${accountId}-${Date.now()}`,
  });

  logger.info({ accountId, triggerType }, 'evolution.worker.complete');
}

export const evolutionWorker = new Worker<EvolutionJobPayload>(
  EVOLUTION_QUEUE_NAME,
  async (job) => processEvolutionJob(job.data),
  {
    connection: redis,
    concurrency: 5, // 不同 account 可并发；同 account 靠 jobId 去重已保证串行
  },
);

evolutionWorker.on('completed', (job) => {
  logger.info(
    { jobId: job.id, accountId: job.data.accountId },
    'evolution.job.completed',
  );
});

evolutionWorker.on('failed', (job, err) => {
  const attemptsMade = job?.attemptsMade ?? 0;
  logger.error(
    { jobId: job?.id, accountId: job?.data?.accountId, attemptsMade, err },
    'evolution.job.failed',
  );

  // AC-6 dead-letter alert stub — cumulate ≥3 失败时触发告警
  if (attemptsMade >= 3) {
    logger.error(
      { jobId: job?.id, accountId: job?.data?.accountId },
      'evolution.job.dead_letter_alert: job exhausted all retries — manual intervention needed',
    );
    // TODO P3: integrate with PagerDuty / Sentry alert
  }
});
