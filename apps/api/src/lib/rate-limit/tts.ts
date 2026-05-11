/**
 * TTS rate limit — PRD-8 US-010 AC-5
 * Sliding window via Redis INCR · D-044 UTC date key
 * TTS_DAILY_LIMIT_PER_USER env default 100
 * Throws TRPCError TOO_MANY_REQUESTS on (limit+1)th call
 */

import { TRPCError } from '@trpc/server';

import { TTS_DAILY_LIMIT_DEFAULT } from '@/lib/constants/ttsLimits';
import { redis } from '@/lib/redis';

/** Exported for unit-test key inspection */
export function _todayKey(accountId: number): string {
  return `rate:tts:user:${accountId}:${new Date().toISOString().slice(0, 10)}`;
}

export function _getLimit(): number {
  return Number(process.env['TTS_DAILY_LIMIT_PER_USER'] ?? TTS_DAILY_LIMIT_DEFAULT);
}

export async function checkTtsRateLimit(accountId: number): Promise<void> {
  const key = _todayKey(accountId);
  const limit = _getLimit();

  const count = await redis.incr(key);
  await redis.expire(key, 86400);

  if (count > limit) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `今日语音合成已达上限 (${limit} 次/天)`,
    });
  }
}
