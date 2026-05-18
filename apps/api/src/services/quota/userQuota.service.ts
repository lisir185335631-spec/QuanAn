/**
 * QuanQn · UserQuota atomic deduction service
 * money-critical: uses single-SQL UPDATE...WHERE to prevent race conditions
 *
 * AC-1(US-002): checkAndDeductQuota — atomic updateMany WITH WHERE lte guard
 */

import type { PrismaClient } from '@prisma/client';

const FREE_PLAN_DAILY_QUOTA = 100_000;
const FREE_PLAN_MONTHLY_QUOTA = 3_000_000;

export type QuotaCheckResult =
  | { ok: true; remaining: number }
  | { ok: false; reason: 'QUOTA_EXCEEDED'; current: number; quota: number };

/**
 * Atomically check and deduct daily token quota.
 *
 * Uses a single SQL UPDATE...WHERE to prevent over-deduction under concurrent load:
 *   UPDATE user_quota SET daily_used = daily_used + $tokens
 *   WHERE user_id = $userId AND daily_used + $tokens <= daily_quota
 *
 * Returns QUOTA_EXCEEDED if the update touches 0 rows and the user exists.
 * Auto-creates a free-plan row if the user has no quota record yet.
 *
 * tokens=0: skip (no deduct), return { ok: true, remaining: 0 }.
 */
export async function checkAndDeductQuota(
  prismaClient: PrismaClient,
  userId: number,
  tokens: number,
): Promise<QuotaCheckResult> {
  if (tokens === 0) {
    return { ok: true, remaining: 0 };
  }

  // Atomic single-statement UPDATE — prevents race-condition over-deduction
  const rowsUpdated: number = await prismaClient.$executeRaw`
    UPDATE user_quota
    SET daily_used = daily_used + ${tokens}
    WHERE user_id = ${userId} AND daily_used + ${tokens} <= daily_quota
  `;

  if (rowsUpdated > 0) {
    const row = await prismaClient.userQuota.findUnique({ where: { userId } });
    return { ok: true, remaining: (row?.dailyQuota ?? 0) - (row?.dailyUsed ?? 0) };
  }

  // 0 rows updated — either user missing or quota exceeded
  const row = await prismaClient.userQuota.findUnique({ where: { userId } });

  if (!row) {
    // Auto-create free plan row for new user
    const now = new Date();
    await prismaClient.userQuota.create({
      data: {
        userId,
        plan: 'free',
        dailyQuota: FREE_PLAN_DAILY_QUOTA,
        monthlyQuota: FREE_PLAN_MONTHLY_QUOTA,
        dailyResetAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
        monthlyResetAt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      },
    });

    // Retry after create
    const retryUpdated: number = await prismaClient.$executeRaw`
      UPDATE user_quota
      SET daily_used = daily_used + ${tokens}
      WHERE user_id = ${userId} AND daily_used + ${tokens} <= daily_quota
    `;

    if (retryUpdated > 0) {
      return { ok: true, remaining: FREE_PLAN_DAILY_QUOTA - tokens };
    }
    return { ok: false, reason: 'QUOTA_EXCEEDED', current: 0, quota: FREE_PLAN_DAILY_QUOTA };
  }

  return {
    ok: false,
    reason: 'QUOTA_EXCEEDED',
    current: row.dailyUsed,
    quota: row.dailyQuota,
  };
}
