/**
 * rate-limiter userId isolation test — US-001
 * Verifies that two different userIds have independent rate-limit buckets.
 * Mocks Upstash Redis + Ratelimit so no real network calls are made.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks (vi.mock is hoisted; vars must be declared via vi.hoisted) ──

const { limitCallKeys, mockLimitFn, MockRatelimit } = vi.hoisted(() => {
  const limitCallKeys: string[] = [];

  const mockLimitFn = vi.fn(async (identifier: string) => {
    limitCallKeys.push(identifier);
    // userA (id=1) is exhausted; userB (id=2) still has tokens
    if (identifier === 'user:1') {
      return { success: false, reset: BigInt(Date.now() + 60_000), remaining: 0 };
    }
    return { success: true, reset: BigInt(Date.now() + 60_000), remaining: 10 };
  });

  const MockRatelimit = vi.fn().mockImplementation(() => ({
    limit: mockLimitFn,
  }));
  // Static method required by _buildLimiter
  (MockRatelimit as unknown as { tokenBucket: ReturnType<typeof vi.fn> }).tokenBucket =
    vi.fn().mockReturnValue('mock-limiter-config');

  return { limitCallKeys, mockLimitFn, MockRatelimit };
});

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: MockRatelimit,
}));

vi.mock('@upstash/redis', () => ({
  Redis: vi.fn().mockImplementation(() => ({})),
}));

// Mock prisma — getUserQuota returns 'free' plan, no whitelist
vi.mock('@/lib/prisma', () => ({
  prisma: {
    userQuota: {
      findUnique: vi.fn().mockResolvedValue({
        plan: 'free',
        whitelistExpiresAt: null,
        isOnWhitelist: false,
      }),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), info: vi.fn() },
}));

// Set env so Upstash path executes (not the no-op dev path)
process.env.UPSTASH_REDIS_REST_URL = 'https://mock.upstash.io';
process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-token';

// ── Import after mocks are registered ────────────────────────────────────────

import { checkRateLimit, RateLimitError } from '../rate-limiter';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('checkRateLimit — userId isolation', () => {
  beforeEach(() => {
    limitCallKeys.length = 0;
    mockLimitFn.mockClear();
  });

  it('userA exhausted throws RateLimitError; userB passes independently', async () => {
    const userAId = 1;
    const userBId = 2;

    // userA is over limit → should throw
    await expect(checkRateLimit(userAId)).rejects.toThrow(RateLimitError);

    // userB should pass despite userA being exhausted
    await expect(checkRateLimit(userBId)).resolves.toBeUndefined();
  });

  it('limit() is called with separate per-user keys', async () => {
    const userAId = 1;
    const userBId = 2;

    await checkRateLimit(userAId).catch(() => {});
    await checkRateLimit(userBId).catch(() => {});

    // Keys must be distinct and per-user
    expect(limitCallKeys).toContain('user:1');
    expect(limitCallKeys).toContain('user:2');
    expect(new Set(limitCallKeys).size).toBe(2);
  });

  it('RateLimitError carries the correct userId', async () => {
    const userAId = 1;
    let caught: unknown;
    try {
      await checkRateLimit(userAId);
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(RateLimitError);
    expect((caught as RateLimitError).userId).toBe(userAId);
  });
});
