/**
 * US-002 AC-2: unit tests for checkAndDeductQuota
 * (a) sufficient quota → deduct + remaining correct
 * (b) full quota → QUOTA_EXCEEDED
 * (c) new user row missing → auto-create plan='free' dailyQuota=100000
 * (d) tokens=0 → skip (no deduct)
 * (e) concurrent 100 calls → Σ tokens === dailyUsed, no over-deduction
 */

import { describe, expect, it, vi } from 'vitest';

import type { PrismaClient } from '@prisma/client';

import { checkAndDeductQuota } from '../userQuota.service';

function makeQuotaRow(overrides: {
  userId?: number;
  dailyUsed?: number;
  dailyQuota?: number;
} = {}) {
  return {
    id: 1,
    userId: overrides.userId ?? 1,
    plan: 'free',
    dailyQuota: overrides.dailyQuota ?? 100_000,
    dailyUsed: overrides.dailyUsed ?? 0,
    monthlyQuota: 3_000_000,
    monthlyUsed: 0,
    imageDailyQuota: 0,
    imageDailyUsed: 0,
    dailyResetAt: new Date(),
    monthlyResetAt: new Date(),
    isOnWhitelist: false,
    whitelistExpiresAt: null,
    updatedAt: new Date(),
  };
}

describe('checkAndDeductQuota', () => {
  it('(a) sufficient quota → deducts and returns correct remaining', async () => {
    const mockPrisma = {
      $executeRaw: vi.fn().mockResolvedValue(1),
      userQuota: {
        findUnique: vi.fn().mockResolvedValue(makeQuotaRow({ dailyUsed: 600, dailyQuota: 100_000 })),
        create: vi.fn(),
      },
    };

    const result = await checkAndDeductQuota(mockPrisma as unknown as PrismaClient, 1, 500);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.remaining).toBe(100_000 - 600); // post-update state from findUnique
    }
    expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(1);
    expect(mockPrisma.userQuota.create).not.toHaveBeenCalled();
  });

  it('(b) full quota → returns QUOTA_EXCEEDED', async () => {
    const mockPrisma = {
      $executeRaw: vi.fn().mockResolvedValue(0),
      userQuota: {
        findUnique: vi.fn().mockResolvedValue(makeQuotaRow({ dailyUsed: 100_000, dailyQuota: 100_000 })),
        create: vi.fn(),
      },
    };

    const result = await checkAndDeductQuota(mockPrisma as unknown as PrismaClient, 1, 500);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('QUOTA_EXCEEDED');
      expect(result.current).toBe(100_000);
      expect(result.quota).toBe(100_000);
    }
  });

  it('(c) new user row missing → auto-creates free plan then deducts', async () => {
    const mockPrisma = {
      $executeRaw: vi.fn()
        .mockResolvedValueOnce(0)  // first attempt: no row yet
        .mockResolvedValueOnce(1), // retry after create: succeeds
      userQuota: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(makeQuotaRow({ userId: 999, dailyUsed: 0, dailyQuota: 100_000 })),
      },
    };

    const result = await checkAndDeductQuota(mockPrisma as unknown as PrismaClient, 999, 200);

    expect(result.ok).toBe(true);
    expect(mockPrisma.userQuota.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 999,
          plan: 'free',
          dailyQuota: 100_000,
        }),
      }),
    );
    if (result.ok) {
      expect(result.remaining).toBe(100_000 - 200);
    }
  });

  it('(d) tokens=0 → skips deduction, returns ok:true', async () => {
    const mockPrisma = {
      $executeRaw: vi.fn(),
      userQuota: { findUnique: vi.fn(), create: vi.fn() },
    };

    const result = await checkAndDeductQuota(mockPrisma as unknown as PrismaClient, 1, 0);

    expect(result.ok).toBe(true);
    expect(mockPrisma.$executeRaw).not.toHaveBeenCalled();
    expect(mockPrisma.userQuota.findUnique).not.toHaveBeenCalled();
  });

  it('(e) concurrent 100 calls → final dailyUsed === Σ tokens, no over-deduction', async () => {
    const TOKEN_PER_CALL = 100;
    const CALLS = 100;
    const dailyQuota = TOKEN_PER_CALL * CALLS; // exactly full after all succeed

    let dailyUsed = 0;

    const mockPrisma = {
      // Simulate atomic UPDATE: increment if capacity allows
      $executeRaw: vi.fn().mockImplementation(async () => {
        if (dailyUsed + TOKEN_PER_CALL <= dailyQuota) {
          dailyUsed += TOKEN_PER_CALL;
          return 1;
        }
        return 0;
      }),
      userQuota: {
        findUnique: vi.fn().mockImplementation(async () =>
          makeQuotaRow({ dailyUsed, dailyQuota }),
        ),
        create: vi.fn(),
      },
    };

    const results = await Promise.all(
      Array.from({ length: CALLS }, () =>
        checkAndDeductQuota(mockPrisma as unknown as PrismaClient, 1, TOKEN_PER_CALL),
      ),
    );

    const succeeded = results.filter(r => r.ok).length;
    expect(succeeded).toBe(CALLS); // all 100 succeed (quota exactly fits)
    expect(dailyUsed).toBe(TOKEN_PER_CALL * CALLS); // Σ tokens, no over-deduction
  });
});
