// PRD-14 US-007 · constant-embed-rebuild.job.ts
// AC-3: BullMQ delayed job · per-event embed rebuild after constant version publish
// SHIELD: jobId: 'constant-embed-' + versionId 防重 (SHIELD TD-058 教训)
// AC-4: +5s delay · async embed · 不阻塞 approval flow

import { Queue, Worker } from 'bullmq';

import { logger } from '@/lib/logger';
import { redis } from '@/lib/redis';
import { rebuildConstantVectorIndex } from '@/services/admin/constant-version/constant-embed.service';

export const CONSTANT_EMBED_QUEUE_NAME = 'admin-constant-embed-rebuild';

export interface ConstantEmbedJobPayload {
  versionId: number;
  constantType: string;
  constantKey: string;
  content: string;
}

export const constantEmbedQueue = new Queue<ConstantEmbedJobPayload>(CONSTANT_EMBED_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

export const constantEmbedWorker = new Worker<ConstantEmbedJobPayload>(
  CONSTANT_EMBED_QUEUE_NAME,
  async (job) => {
    const { versionId, constantType, constantKey, content } = job.data;
    logger.info({ versionId, constantType, constantKey }, 'constant_embed_job.start');
    await rebuildConstantVectorIndex(constantType, constantKey, content, versionId);
    logger.info({ versionId }, 'constant_embed_job.complete');
  },
  { connection: redis },
);

constantEmbedWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'constant_embed_job.failed');
});

// AC-4: schedule +5s delayed job after _publishConstantVersionInTx succeeds
export async function scheduleConstantEmbedRebuild(
  versionId: number,
  constantType: string,
  constantKey: string,
  content: string,
): Promise<void> {
  await constantEmbedQueue.add(
    'rebuild',
    { versionId, constantType, constantKey, content },
    {
      jobId: `constant-embed-${versionId}`, // SHIELD: dedup by versionId
      delay: 5000,                           // +5s delay (AC-4)
    },
  );
  logger.info({ versionId, constantType, constantKey }, 'constant_embed_job.scheduled');
}
