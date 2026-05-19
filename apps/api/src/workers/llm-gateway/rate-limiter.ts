/**
 * QuanAn · LLMGateway rate limiter
 * AC-2: @upstash/ratelimit token bucket (Free 50/日 · Pro 500/日 · Enterprise 5000/日)
 * When UPSTASH_REDIS_REST_URL is not set (local dev), passes through with a warning.
 * PRD-13 US-005 AC-9: whitelist bypass — if whitelistExpiresAt valid, skip token bucket
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export class RateLimitError extends Error {
  readonly code = 'RATE_LIMIT_EXCEEDED' as const;
  constructor(
    public readonly userId: number,
    public readonly resetAfterMs?: number,
  ) {
    super(`Rate limit exceeded for user ${userId}`);
    this.name = 'RateLimitError';
  }
}

// Plan → daily token bucket capacity
const PLAN_LIMITS = {
  free: 50,
  pro: 500,
  enterprise: 5000,
} as const satisfies Record<string, number>;

type UserPlan = keyof typeof PLAN_LIMITS;

// Cached Ratelimit instances keyed by plan
const _limiters = new Map<UserPlan, Ratelimit>();

function _buildLimiter(plan: UserPlan): Ratelimit {
  const restUrl = process.env.UPSTASH_REDIS_REST_URL;
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!restUrl || !restToken) {
    throw new Error('Upstash not configured');
  }
  const redis = new Redis({ url: restUrl, token: restToken });
  const limit = PLAN_LIMITS[plan];
  return new Ratelimit({
    redis,
    limiter: Ratelimit.tokenBucket(limit, '1 d', limit),
    prefix: `quanan:rl:${plan}`,
  });
}

function getLimiter(plan: UserPlan): Ratelimit {
  if (!_limiters.has(plan)) {
    _limiters.set(plan, _buildLimiter(plan));
  }
  return _limiters.get(plan)!;
}

/** Look up user quota row; returns null on error */
async function getUserQuota(
  userId: number,
): Promise<{ plan: string; whitelistExpiresAt: Date | null; isOnWhitelist: boolean } | null> {
  try {
    return await prisma.userQuota.findUnique({
      where: { userId },
      select: { plan: true, whitelistExpiresAt: true, isOnWhitelist: true },
    });
  } catch {
    return null;
  }
}

/**
 * Check rate limit for userId.
 * PRD-13 US-005 AC-9: whitelist bypass checked FIRST — if whitelistExpiresAt valid, return immediately.
 * Throws RateLimitError if the daily quota is exhausted.
 * No-ops (with warning) when Upstash env vars are absent (local dev).
 * SHIELD: whitelist check is pre-condition bypass, does NOT replace original Redis token bucket logic.
 */
export async function checkRateLimit(userId: number): Promise<void> {
  const restUrl = process.env.UPSTASH_REDIS_REST_URL;
  if (!restUrl) {
    logger.warn({ userId }, 'rate_limit.upstash_not_configured_skipping');
    return;
  }

  // AC-9: whitelist bypass — check before Redis token bucket
  const quota = await getUserQuota(userId);
  if (quota?.isOnWhitelist && quota.whitelistExpiresAt && quota.whitelistExpiresAt > new Date()) {
    logger.info({ userId }, 'rate_limit.whitelisted_bypass');
    return;
  }

  const plan = quota?.plan ?? 'free';
  const safePlan = (plan in PLAN_LIMITS ? plan : 'free') as UserPlan;
  const limiter = getLimiter(safePlan);
  const { success, reset } = await limiter.limit(`user:${userId}`);

  if (!success) {
    const resetAfterMs = reset ? Number(reset) - Date.now() : undefined;
    logger.warn({ userId, plan: safePlan, resetAfterMs }, 'rate_limit.exceeded');
    throw new RateLimitError(userId, resetAfterMs);
  }
}
