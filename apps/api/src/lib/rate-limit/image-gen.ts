/**
 * ImageGen rate limit — PRD-6 US-010 AC-5/AC-6
 * Sliding window via Redis INCR · D-044 UTC date key
 * IMAGE_GEN_DAILY_LIMIT_PER_USER env default 10
 * Throws TRPCError TOO_MANY_REQUESTS on 11th call (>limit)
 */

import { TRPCError } from '@trpc/server';

import { redis } from '@/lib/redis';

const DEFAULT_DAILY_LIMIT = 10;

export async function checkImageGenRateLimit(accountId: number): Promise<void> {
  // D-044: UTC date — not local timezone
  const today = new Date().toISOString().slice(0, 10);
  const key = `rate:image_gen:user:${accountId}:${today}`;
  const limit = Number(process.env['IMAGE_GEN_DAILY_LIMIT_PER_USER'] ?? DEFAULT_DAILY_LIMIT);

  const count = await redis.incr(key);
  // Set/refresh TTL to 24h so stale keys auto-expire
  await redis.expire(key, 86400);

  if (count > limit) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: '今日图片生成次数已达上限，请明日再试',
    });
  }
}
