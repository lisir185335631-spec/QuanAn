/**
 * ImageGen BullMQ Worker — PRD-6 US-010 AC-3/AC-7/AC-8/AC-11
 * Worker 'image-gen' · concurrency=2 · processes jobs via DallE3ImageGenWorker
 * Dev mode: runs in-process with API server (AC-11)
 * Prod mode: run as standalone process via `pnpm worker:image-gen`
 * ★ REJ-008: job.data.accountId 必须显式带入 prisma 查询 (no RLS ctx in worker)
 */

import { Worker } from 'bullmq';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

import { DallE3ImageGenWorker } from './dall-e-3';
import { IMAGE_GEN_QUEUE_NAME } from './queue';

import type { ImageGenJobPayload } from './index';

const imageGenWorkerInstance = new DallE3ImageGenWorker();

// imageGen is the job processor — dall-e-3 handles history 反写 internally (AC-7/AC-8)
async function imageGen(payload: ImageGenJobPayload) {
  return imageGenWorkerInstance.generate(payload);
}

// concurrency=2 · 同时 2 个 job 跑 · 第 3+ 个 job 排队等空位 (AC-2/AC-3)
export const worker = new Worker<ImageGenJobPayload>(
  IMAGE_GEN_QUEUE_NAME,
  async (job) => imageGen(job.data),
  {
    connection: redis,
    concurrency: 2,
  },
);

worker.on('completed', (job) => {
  logger.info({ jobId: job.id, sceneIndex: job.data.sceneIndex }, 'image_gen.completed');
});

worker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, sceneIndex: job?.data?.sceneIndex, err }, 'image_gen.job_failed');
});

// ── Status query — AC (description item 5) ───────────────────────────────────

export interface ImageGenStatusCounts {
  pending: number;
  completed: number;
  failed: number;
}

/**
 * Count history scenes by image generation status.
 * pending  = sceneImageUrl null/undefined
 * completed = sceneImageUrl set + status !== 'failed'
 * failed   = status === 'failed'
 * REJ-008: always include accountId in where clause
 */
export async function queryImageGenStatus(
  historyId: number,
  accountId: number,
): Promise<ImageGenStatusCounts> {
  const history = await prisma.history.findFirst({
    where: { id: historyId, accountId },
    select: { content: true },
  });

  if (!history) return { pending: 0, completed: 0, failed: 0 };

  let scenes: Array<{ sceneImageUrl?: string | null; status?: string }> = [];
  try {
    const parsed = JSON.parse(history.content) as { scenes?: unknown[] };
    if (Array.isArray(parsed.scenes)) {
      scenes = parsed.scenes as typeof scenes;
    }
  } catch {
    // Non-JSON content — return zeros
  }

  return scenes.reduce<ImageGenStatusCounts>(
    (acc, s) => {
      if (s.status === 'failed') acc.failed++;
      else if (s.sceneImageUrl) acc.completed++;
      else acc.pending++;
      return acc;
    },
    { pending: 0, completed: 0, failed: 0 },
  );
}
