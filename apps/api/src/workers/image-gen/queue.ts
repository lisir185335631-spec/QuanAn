/**
 * ImageGen BullMQ Queue — PRD-6 US-010 AC-1/AC-2
 * Queue 'image-gen' · concurrency=2 · attempts=3 · exponential backoff 5s
 * Uses shared redis singleton from @/lib/redis (AC-4 复用)
 */

import { Queue } from 'bullmq';

import { redis } from '@/lib/redis';

import type { ImageGenJobPayload } from './index';

export const IMAGE_GEN_QUEUE_NAME = 'image-gen';

export const imageGenQueue = new Queue<ImageGenJobPayload>(IMAGE_GEN_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});
