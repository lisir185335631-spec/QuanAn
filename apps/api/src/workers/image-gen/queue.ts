/**
 * ImageGen BullMQ Queue 定义 — PRD-6 US-001
 * 真接: US-010 · 本期 stub · Queue 对象占位
 *
 * 使用 BullMQ v5 + ioredis
 * Redis 连接: process.env.REDIS_URL (fallback: localhost:6379)
 */

import { Queue } from 'bullmq';
import IORedis from 'ioredis';

import type { ImageGenJobPayload } from './index';

export const IMAGE_GEN_QUEUE_NAME = 'image-gen';

const redisConnection = new IORedis(process.env['REDIS_URL'] ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const imageGenQueue = new Queue<ImageGenJobPayload>(IMAGE_GEN_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

// ── Boot (US-010 真接) ────────────────────────────────────────────────────────

export function startImageGenWorker(): never {
  throw new Error('PRD-6 US-010 真接');
}
