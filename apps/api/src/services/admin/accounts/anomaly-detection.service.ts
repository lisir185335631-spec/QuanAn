// PRD-11 US-009 · anomaly-detection.service
// detectAccountAnomalies(): 4 anomaly types + dedupe + skip resolved
// SHIELD: SET LOCAL (not SET) to prevent global role leakage

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export async function detectAccountAnomalies(): Promise<{ detected: number }> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  let detected = 0;

  await prisma.$transaction(async (tx) => {
    // SHIELD: SET LOCAL prevents leakage across connections
    await tx.$executeRawUnsafe("SET LOCAL app.role = 'admin'");

    // ----------------------------------------------------------------
    // Type 1: inactive_no_feedback
    // Accounts with history activity in last 7d but 0 feedback
    // ----------------------------------------------------------------
    const activeAccounts = await tx.$queryRaw<{ accountId: number }[]>`
      SELECT DISTINCT account_id AS "accountId"
      FROM histories
      WHERE created_at >= ${sevenDaysAgo}
    `;

    const feedbackAccounts = await tx.$queryRaw<{ accountId: number }[]>`
      SELECT DISTINCT account_id AS "accountId"
      FROM feedback_logs
      WHERE created_at >= ${sevenDaysAgo}
    `;
    const feedbackSet = new Set(feedbackAccounts.map((r) => r.accountId));

    for (const { accountId } of activeAccounts) {
      if (!feedbackSet.has(accountId)) {
        // AC-13: WHERE resolvedAt IS NULL · AC-12: same-day dedupe
        const existing = await tx.ipAccountAnomalyFlag.findFirst({
          where: {
            accountId,
            anomalyType: 'inactive_no_feedback',
            detectedAt: { gte: todayStart },
            resolvedAt: null,
          },
        });
        if (!existing) {
          await tx.ipAccountAnomalyFlag.create({
            data: {
              accountId,
              anomalyType: 'inactive_no_feedback',
              severity: 'low',
              evidence: { feedbackCount: 0, since: sevenDaysAgo.toISOString() },
            },
          });
          detected++;
        }
      }
    }

    // ----------------------------------------------------------------
    // Type 2: evolution_stalled
    // Accounts with evolution profile but no new insight in last 7d
    // ----------------------------------------------------------------
    const evolvedAccounts = await tx.$queryRaw<{ accountId: number }[]>`
      SELECT account_id AS "accountId" FROM evolution_profiles
    `;

    const recentInsightAccounts = await tx.$queryRaw<{ accountId: number }[]>`
      SELECT DISTINCT account_id AS "accountId"
      FROM evolution_insights
      WHERE created_at >= ${sevenDaysAgo}
    `;
    const recentInsightSet = new Set(recentInsightAccounts.map((r) => r.accountId));

    for (const { accountId } of evolvedAccounts) {
      if (!recentInsightSet.has(accountId)) {
        const existing = await tx.ipAccountAnomalyFlag.findFirst({
          where: {
            accountId,
            anomalyType: 'evolution_stalled',
            detectedAt: { gte: todayStart },
            resolvedAt: null,
          },
        });
        if (!existing) {
          await tx.ipAccountAnomalyFlag.create({
            data: {
              accountId,
              anomalyType: 'evolution_stalled',
              severity: 'medium',
              evidence: { daysSinceLastInsight: 7, since: sevenDaysAgo.toISOString() },
            },
          });
          detected++;
        }
      }
    }

    // ----------------------------------------------------------------
    // Type 3: frequent_account_switch
    // Users active on 3+ distinct accounts in last 7d — flag each account
    // ----------------------------------------------------------------
    const switchCandidates = await tx.$queryRaw<{ userId: number; accountIds: number[] }[]>`
      SELECT
        ia.user_id            AS "userId",
        ARRAY_AGG(DISTINCT h.account_id) AS "accountIds"
      FROM histories h
      JOIN ip_accounts ia ON h.account_id = ia.id
      WHERE h.created_at >= ${sevenDaysAgo}
      GROUP BY ia.user_id
      HAVING COUNT(DISTINCT h.account_id) >= 3
    `;

    for (const { userId, accountIds } of switchCandidates) {
      for (const accountId of accountIds) {
        const existing = await tx.ipAccountAnomalyFlag.findFirst({
          where: {
            accountId,
            anomalyType: 'frequent_account_switch',
            detectedAt: { gte: todayStart },
            resolvedAt: null,
          },
        });
        if (!existing) {
          await tx.ipAccountAnomalyFlag.create({
            data: {
              accountId,
              anomalyType: 'frequent_account_switch',
              severity: 'medium',
              evidence: { userId, activeAccountCount: accountIds.length, accountIds },
            },
          });
          detected++;
        }
      }
    }

    // ----------------------------------------------------------------
    // Type 4: cost_spike
    // Account last-24h cost > 3x avg daily (from last 30d window)
    // ----------------------------------------------------------------
    const costSpikes = await tx.$queryRaw<{
      accountId: number;
      recentCost: string;
      avgDailyCost: string;
    }[]>`
      SELECT
        recent.account_id           AS "accountId",
        recent.cost::text           AS "recentCost",
        COALESCE(baseline.avg_daily::text, '0') AS "avgDailyCost"
      FROM (
        SELECT account_id, SUM(cost_usd) AS cost
        FROM cost_log
        WHERE created_at >= ${oneDayAgo}
        GROUP BY account_id
      ) AS recent
      LEFT JOIN (
        SELECT account_id, SUM(cost_usd) / 29.0 AS avg_daily
        FROM cost_log
        WHERE created_at >= ${thirtyDaysAgo} AND created_at < ${oneDayAgo}
        GROUP BY account_id
      ) AS baseline ON recent.account_id = baseline.account_id
      WHERE recent.cost > 0.1
        AND recent.cost > 3.0 * COALESCE(baseline.avg_daily, 0.001)
    `;

    for (const { accountId, recentCost, avgDailyCost } of costSpikes) {
      const existing = await tx.ipAccountAnomalyFlag.findFirst({
        where: {
          accountId,
          anomalyType: 'cost_spike',
          detectedAt: { gte: todayStart },
          resolvedAt: null,
        },
      });
      if (!existing) {
        const avgVal = parseFloat(avgDailyCost);
        const recentVal = parseFloat(recentCost);
        await tx.ipAccountAnomalyFlag.create({
          data: {
            accountId,
            anomalyType: 'cost_spike',
            severity: 'high',
            evidence: {
              recentCostUsd: recentVal,
              avgDailyCostUsd: avgVal,
              spikeRatio: avgVal > 0 ? recentVal / avgVal : null,
            },
          },
        });
        detected++;
      }
    }
  });

  logger.info({ detected }, 'anomaly_detection.complete');
  return { detected };
}
