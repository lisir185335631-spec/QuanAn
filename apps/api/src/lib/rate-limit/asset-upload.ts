/**
 * Asset upload rate limit — PRD-37 US-P08 · R-14 (P2)
 * Sliding window via Redis INCR · UTC date key (同 image-gen 模式)
 * ASSET_UPLOAD_DAILY_LIMIT_PER_ACCOUNT env default 50
 * Throws TRPCError TOO_MANY_REQUESTS when count exceeds daily limit
 * 防高频上传堆 BullMQ file-parser job
 */

import { TRPCError } from '@trpc/server';

import { redis } from '@/lib/redis';

const DEFAULT_DAILY_LIMIT = 50;

/** Exported for unit-test key inspection */
export function _assetUploadTodayKey(accountId: number): string {
  return `rate:asset_upload:account:${accountId}:${new Date().toISOString().slice(0, 10)}`;
}

export function _getAssetUploadLimit(): number {
  return Number(process.env['ASSET_UPLOAD_DAILY_LIMIT_PER_ACCOUNT'] ?? DEFAULT_DAILY_LIMIT);
}

export async function checkAssetUploadRateLimit(accountId: number): Promise<void> {
  const key = _assetUploadTodayKey(accountId);
  const limit = _getAssetUploadLimit();

  const count = await redis.incr(key);
  // Refresh TTL to 24h so stale keys auto-expire
  await redis.expire(key, 86400);

  if (count > limit) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `今日上传已达上限 (${limit} 次/天)`,
    });
  }
}
