/**
 * Unit tests — PRD-6 US-011 AC-7
 * checkImageGenRateLimit + getImageGenDailyUsage: 5 unit tests
 * (1) 1st call OK count=1
 * (2) 10th call OK count=10
 * (3) 11th call throw TOO_MANY_REQUESTS
 * (4) cross-account: accountId=1 count=10 不影响 accountId=2 count=0
 * (5) day rollover (mock new Date 跨 UTC date) reset count=0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── vi.hoisted — shared Redis state ──────────────────────────────────────────

const mockRedisState = vi.hoisted(() => ({
  // key → count (simulates Redis INCR per key)
  counters: new Map<string, number>(),
  // key → string value (simulates Redis GET)
  values: new Map<string, string>(),
}));

const mockIncr = vi.hoisted(() =>
  vi.fn().mockImplementation(async (key: string) => {
    const cur = (mockRedisState.counters.get(key) ?? 0) + 1;
    mockRedisState.counters.set(key, cur);
    mockRedisState.values.set(key, String(cur));
    return cur;
  }),
);

const mockExpire = vi.hoisted(() => vi.fn().mockResolvedValue(1));

const mockGet = vi.hoisted(() =>
  vi.fn().mockImplementation(async (key: string) => {
    return mockRedisState.values.get(key) ?? null;
  }),
);

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock('@/lib/redis', () => ({
  redis: {
    incr: mockIncr,
    expire: mockExpire,
    get: mockGet,
  },
}));

// ── Imports (after mocks) ──────────────────────────────────────────────────────

import { checkImageGenRateLimit, getImageGenDailyUsage, _todayKey } from '@/lib/rate-limit/image-gen';

// ── Setup ──────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockRedisState.counters.clear();
  mockRedisState.values.clear();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

// ── (1) 1st call OK count=1 ───────────────────────────────────────────────────

describe('checkImageGenRateLimit — 1st call', () => {
  it('count=1 → no throw (AC-7.1)', async () => {
    vi.stubEnv('IMAGE_GEN_DAILY_LIMIT_PER_USER', '10');
    // Redis INCR returns 1 (first call)
    mockIncr.mockResolvedValueOnce(1);

    await expect(checkImageGenRateLimit(1)).resolves.toBeUndefined();
    expect(mockIncr).toHaveBeenCalledOnce();
    expect(mockExpire).toHaveBeenCalledOnce();
    // Key format per SHIELD REJ-008: rate:image_gen:user:{accountId}:{date}
    const [key] = mockIncr.mock.calls[0] as [string];
    expect(key).toMatch(/^rate:image_gen:user:1:\d{4}-\d{2}-\d{2}$/);
  });
});

// ── (2) 10th call OK count=10 ─────────────────────────────────────────────────

describe('checkImageGenRateLimit — 10th call (boundary OK)', () => {
  it('count=10 → no throw (AC-7.2 boundary)', async () => {
    vi.stubEnv('IMAGE_GEN_DAILY_LIMIT_PER_USER', '10');
    mockIncr.mockResolvedValueOnce(10);

    await expect(checkImageGenRateLimit(1)).resolves.toBeUndefined();
  });
});

// ── (3) 11th call throws TOO_MANY_REQUESTS ────────────────────────────────────

describe('checkImageGenRateLimit — 11th call', () => {
  it('count=11 → TOO_MANY_REQUESTS with correct message (AC-7.3 · AC-2)', async () => {
    vi.stubEnv('IMAGE_GEN_DAILY_LIMIT_PER_USER', '10');
    mockIncr.mockResolvedValueOnce(11);

    await expect(checkImageGenRateLimit(1)).rejects.toMatchObject({
      code: 'TOO_MANY_REQUESTS',
      message: '今日生成已达上限 (10 次/天)',
    });
  });

  it('boundary: count=10 passes, count=11 rejects (AC-8)', async () => {
    vi.stubEnv('IMAGE_GEN_DAILY_LIMIT_PER_USER', '10');

    // 10th call OK
    mockIncr.mockResolvedValueOnce(10);
    await expect(checkImageGenRateLimit(1)).resolves.toBeUndefined();

    // 11th call rejected
    mockIncr.mockResolvedValueOnce(11);
    await expect(checkImageGenRateLimit(1)).rejects.toMatchObject({ code: 'TOO_MANY_REQUESTS' });
  });
});

// ── (4) cross-account isolation ───────────────────────────────────────────────

describe('checkImageGenRateLimit — cross-account isolation', () => {
  it('accountId=1 count=10 不影响 accountId=2 count=0 (AC-7.4 · SHIELD REJ-008)', async () => {
    vi.stubEnv('IMAGE_GEN_DAILY_LIMIT_PER_USER', '10');

    // accountId=1: exhaust limit (11th call rejected)
    mockIncr.mockImplementation(async (key: string) => {
      if (key.includes(':1:')) return 11; // account 1 → over limit
      return 1;                            // account 2 → first call
    });

    await expect(checkImageGenRateLimit(1)).rejects.toMatchObject({ code: 'TOO_MANY_REQUESTS' });

    // accountId=2: independent key, count=1 → passes
    await expect(checkImageGenRateLimit(2)).resolves.toBeUndefined();

    // Verify keys are distinct
    const calls = mockIncr.mock.calls as [string][];
    const key1 = calls[0]![0];
    const key2 = calls[1]![0];
    expect(key1).toContain(':1:');
    expect(key2).toContain(':2:');
    expect(key1).not.toBe(key2);
  });

  it('1000 accounts each have independent keys (AC-10 performance)', async () => {
    vi.stubEnv('IMAGE_GEN_DAILY_LIMIT_PER_USER', '10');

    // Stateful mock: each key independently incremented
    const counters = new Map<string, number>();
    mockIncr.mockImplementation(async (key: string) => {
      const cur = (counters.get(key) ?? 0) + 1;
      counters.set(key, cur);
      return cur;
    });

    const start = Date.now();
    // 1000 parallel calls for 1000 different accounts
    await Promise.all(Array.from({ length: 1000 }, (_, i) => checkImageGenRateLimit(i + 1)));
    const elapsed = Date.now() - start;

    // AC-10: < 100ms for 1000 keys (mocked Redis — should be << 100ms)
    expect(elapsed).toBeLessThan(100);

    // Every account has count=1 (independent)
    expect(counters.size).toBe(1000);
    for (const count of counters.values()) {
      expect(count).toBe(1);
    }
  });
});

// ── (5) day rollover ──────────────────────────────────────────────────────────

describe('checkImageGenRateLimit — day rollover', () => {
  it('UTC date change resets count to 0 for new day (AC-7.5)', async () => {
    vi.stubEnv('IMAGE_GEN_DAILY_LIMIT_PER_USER', '10');

    // Day 1: simulate count=10 (last call of the day)
    vi.setSystemTime(new Date('2026-05-10T23:59:59.000Z'));
    const keyDay1 = _todayKey(1);
    mockRedisState.counters.set(keyDay1, 10);
    mockIncr.mockImplementation(async (key: string) => {
      const cur = (mockRedisState.counters.get(key) ?? 0) + 1;
      mockRedisState.counters.set(key, cur);
      return cur;
    });

    // 11th call on day 1 → rejected
    await expect(checkImageGenRateLimit(1)).rejects.toMatchObject({ code: 'TOO_MANY_REQUESTS' });
    expect(mockRedisState.counters.get(keyDay1)).toBe(11);

    // Day 2: system time advances to next UTC day
    vi.setSystemTime(new Date('2026-05-11T00:00:00.000Z'));
    const keyDay2 = _todayKey(1);
    expect(keyDay2).not.toBe(keyDay1); // new key = new day

    // 1st call on day 2 → passes (counter starts at 0 for new key)
    await expect(checkImageGenRateLimit(1)).resolves.toBeUndefined();
    expect(mockRedisState.counters.get(keyDay2)).toBe(1);

    vi.useRealTimers();
  });
});

// ── getImageGenDailyUsage ─────────────────────────────────────────────────────

describe('getImageGenDailyUsage — read-only count', () => {
  it('returns count=0 when key not set (AC-4)', async () => {
    vi.stubEnv('IMAGE_GEN_DAILY_LIMIT_PER_USER', '10');
    mockGet.mockResolvedValueOnce(null);

    const result = await getImageGenDailyUsage(1);
    expect(result).toEqual({ count: 0, limit: 10 });
    expect(mockIncr).not.toHaveBeenCalled(); // no side effect
  });

  it('returns current count from Redis (AC-4)', async () => {
    vi.stubEnv('IMAGE_GEN_DAILY_LIMIT_PER_USER', '10');
    mockGet.mockResolvedValueOnce('7');

    const result = await getImageGenDailyUsage(1);
    expect(result).toEqual({ count: 7, limit: 10 });
    expect(mockIncr).not.toHaveBeenCalled(); // no side effect
  });
});
