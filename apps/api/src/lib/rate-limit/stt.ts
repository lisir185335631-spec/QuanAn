/**
 * STT rate limit — PRD-8 US-009 AC-4
 * Sliding window via Redis INCR · D-044 UTC date key
 * STT_DAILY_LIMIT_PER_USER env default 50
 * Throws TRPCError TOO_MANY_REQUESTS on (limit+1)th call
 */

import { TRPCError } from '@trpc/server';

import { redis } from '@/lib/redis';
import { STT_DAILY_LIMIT_DEFAULT } from '@/lib/constants/sttLimits';

/** Exported for unit-test key inspection */
export function _todayKey(accountId: number): string {
  return `rate:stt:user:${accountId}:${new Date().toISOString().slice(0, 10)}`;
}

export function _getLimit(): number {
  return Number(process.env['STT_DAILY_LIMIT_PER_USER'] ?? STT_DAILY_LIMIT_DEFAULT);
}

export async function checkSttRateLimit(accountId: number): Promise<void> {
  const key = _todayKey(accountId);
  const limit = _getLimit();

  const count = await redis.incr(key);
  await redis.expire(key, 86400);

  if (count > limit) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `今日语音转文字已达上限 (${limit} 次/天)`,
    });
  }
}
