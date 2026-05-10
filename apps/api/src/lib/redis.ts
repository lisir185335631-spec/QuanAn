/**
 * Shared ioredis singleton — PRD-6 US-010
 * BullMQ Queue/Worker 复用 · rate limit 复用 (AC-4)
 * maxRetriesPerRequest: null required by BullMQ (blocks on BRPOPLPUSH)
 */

import IORedis from 'ioredis';

export const redis = new IORedis(process.env['REDIS_URL'] ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});
