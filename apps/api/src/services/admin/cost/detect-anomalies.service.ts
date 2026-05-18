// PRD-11 US-015 · detectCostAnomalies — 单用户日 > $5 异常检测
// AC-2: $transaction + SET LOCAL · 查 cost_log 24h sum > $5
// AC-7: dedupe per user per day via adminAuditLog.findFirst
// AC-9: audit write 'security_alert'/'cost_anomaly_detected' + payloadHash SHA-256 (D-073)
// money-critical: Decimal 全程 · 不允许 .toNumber() 精度丢失

import { createHash, randomBytes } from 'node:crypto';

import { Prisma } from '@prisma/client';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { DingtalkService } from '@/services/admin/notifications/dingtalk.service';

const DAILY_THRESHOLD = new Prisma.Decimal('5'); // $5/24h per user · money-critical

export interface AnomalyRecord {
  userId: number;
  email: string;
  dailySpent: Prisma.Decimal;
}

export interface DetectCostAnomaliesResult {
  detected: number;
  skipped: number;
}

export async function detectCostAnomalies(
  dingtalk: DingtalkService = new DingtalkService(),
): Promise<DetectCostAnomaliesResult> {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let detected = 0;
  let skipped = 0;

  await prisma.$transaction(async (tx) => {
    // SHIELD: SET LOCAL prevents leakage across connections
    await tx.$executeRawUnsafe("SET LOCAL app.role = 'admin'");

    // Aggregate cost_log per userId for last 24h · money-critical: Decimal
    const rows = await tx.$queryRaw<{ userId: number; total: string }[]>`
      SELECT user_id AS "userId", SUM(cost_usd)::text AS "total"
      FROM cost_log
      WHERE created_at >= ${oneDayAgo}
        AND user_id IS NOT NULL
      GROUP BY user_id
      HAVING SUM(cost_usd) > ${DAILY_THRESHOLD}
    `;

    for (const row of rows) {
      const dailySpent = new Prisma.Decimal(row.total);
      const userId = row.userId;

      // AC-7: dedupe — skip if already alerted today for this user
      const existing = await tx.adminAuditLog.findFirst({
        where: {
          eventType: 'cost_anomaly_detected',
          targetUserId: userId,
          createdAt: { gte: todayStart },
        },
        select: { id: true },
      });

      if (existing) {
        skipped++;
        logger.debug({ userId }, 'cost_anomaly_detect.deduped');
        continue;
      }

      // Fetch user email for notification payload
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      const email = user?.email ?? 'unknown';

      // AC-9: audit write · payloadHash SHA-256 (D-073)
      const payload = {
        userId,
        dailySpent: dailySpent.toString(),
        threshold: DAILY_THRESHOLD.toString(),
        email,
      };
      const payloadHash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
      const traceId = randomBytes(8).toString('hex');

      await tx.adminAuditLog.create({
        data: {
          actorAdminId: 0,
          actorRole: 'system',
          eventCategory: 'security_alert',
          eventType: 'cost_anomaly_detected',
          targetUserId: userId,
          payload: payload as unknown as Prisma.InputJsonValue,
          payloadHash,
          traceId,
          ip: '127.0.0.1',
          userAgent: 'cost-anomaly-worker',
          sessionId: 'system',
          success: true,
        },
      });

      detected++;
      logger.warn({ userId, dailySpent: dailySpent.toString(), threshold: DAILY_THRESHOLD.toString() }, 'cost_anomaly_detect.alert');

      // Send DingTalk notification (stub: isMock=true by default)
      const msg = `[QuanQn 成本告警] 用户 #${userId} (${email}) 24h 消费 $${dailySpent.toFixed(4)} 超过阈值 $${DAILY_THRESHOLD}`;
      await dingtalk.send(msg).catch((err: unknown) => {
        logger.error({ err, userId }, 'cost_anomaly_detect.dingtalk_send_failed');
      });
    }
  });

  logger.info({ detected, skipped }, 'cost_anomaly_detect.completed');
  return { detected, skipped };
}
