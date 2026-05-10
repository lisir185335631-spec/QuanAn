/**
 * ImageGen rate limit — PRD-6 US-010 AC-5/AC-6 · US-011 AC-1/AC-2
 * Sliding window via Redis INCR · D-044 UTC date key
 * IMAGE_GEN_DAILY_LIMIT_PER_USER env default 10
 * Throws TRPCError TOO_MANY_REQUESTS on 11th call (>limit)
 */

import { TRPCError } from '@trpc/server';

import { redis } from '@/lib/redis';

const DEFAULT_DAILY_LIMIT = 10;

/** Exported for unit-test key inspection */
export function _todayKey(accountId: number): string {
  return `rate:image_gen:user:${accountId}:${new Date().toISOString().slice(0, 10)}`;
}

export function _getLimit(): number {
  return Number(process.env['IMAGE_GEN_DAILY_LIMIT_PER_USER'] ?? DEFAULT_DAILY_LIMIT);
}

export async function checkImageGenRateLimit(accountId: number): Promise<void> {
  const key = _todayKey(accountId);
  const limit = _getLimit();

  const count = await redis.incr(key);
  // Refresh TTL to 24h so stale keys auto-expire
  await redis.expire(key, 86400);

  if (count > limit) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: '今日生成已达上限 (10 次/天)',
    });
  }
}

/** Read-only usage query — no INCR side effect */
export async function getImageGenDailyUsage(accountId: number): Promise<{ count: number; limit: number }> {
  const key = _todayKey(accountId);
  const limit = _getLimit();
  const raw = await redis.get(key);
  const count = raw !== null ? parseInt(raw, 10) : 0;
  return { count, limit };
}
