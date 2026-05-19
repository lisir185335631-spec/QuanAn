// PRD-12 US-012 · violation-detection.service
// detectViolationThresholds: count >= 3 → warning · count >= 5 → banUploader approval request
// SHIELD: dedupe per userId per day · adminAuditLog.findFirst({eventType:'user_violation_warning',targetUserId,createdAt:{gte:todayStart}})
// SHIELD: suspendedAt=null filter → skip already suspended (AC-9)
// SHIELD: isMock=true DingtalkService default (D-077)

import { createHash, randomBytes } from 'node:crypto';

import { Prisma } from '@prisma/client';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { DingtalkService } from '@/services/admin/notifications/dingtalk.service';

export interface ViolationDetectionResult {
  warned: number;
  banRequested: number;
  skipped: number;
}

export async function detectViolationThresholds(
  dingtalk: DingtalkService = new DingtalkService(),
): Promise<ViolationDetectionResult> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let warned = 0;
  let banRequested = 0;
  let skipped = 0;

  await prisma.$transaction(async (tx) => {
    // SHIELD: SET LOCAL prevents leakage across connections
    await tx.$executeRawUnsafe("SET LOCAL app.role = 'admin'");

    // Query violations: count >= 3, not yet suspended (AC-9: suspendedAt=null)
    const violations = await (tx as typeof prisma).userViolationLog.findMany({
      where: {
        count: { gte: 3 },
        suspendedAt: null,
      },
      select: {
        userId: true,
        violationType: true,
        count: true,
      },
    });

    for (const { userId, violationType, count } of violations) {
      // AC-6: dedupe per userId per day — skip if already warned today
      const existing = await (tx as typeof prisma).adminAuditLog.findFirst({
        where: {
          eventType: 'user_violation_warning',
          targetUserId: userId,
          createdAt: { gte: todayStart },
        },
        select: { id: true },
      });

      if (existing) {
        skipped++;
        logger.debug({ userId, violationType }, 'violation_detect.deduped');
        continue;
      }

      const traceId = randomBytes(8).toString('hex');
      const payload = { userId, violationType, count };
      const payloadHash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');

      // AC-2: write security_alert/user_violation_warning
      await (tx as typeof prisma).adminAuditLog.create({
        data: {
          actorAdminId: 0,
          actorRole: 'system',
          eventCategory: 'security_alert',
          eventType: 'user_violation_warning',
          targetUserId: userId,
          payload: payload as unknown as Prisma.InputJsonValue,
          payloadHash,
          traceId,
          ip: '127.0.0.1',
          userAgent: 'violation-detection-worker',
          sessionId: 'system',
          success: true,
        },
      });
      warned++;
      logger.warn({ userId, violationType, count }, 'violation_detect.warning');

      // AC-3: count >= 5 → auto trigger banUploader approval request (pending · system actor)
      if (count >= 5) {
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const actionPayload = {
          userId,
          reason: `Auto-ban: violation type '${violationType}' count=${count} exceeded threshold (5)`,
        };
        const banTraceId = randomBytes(8).toString('hex');
        const banPayloadHash = createHash('sha256')
          .update(JSON.stringify(actionPayload))
          .digest('hex');

        const approvalRequest = await (tx as typeof prisma).approvalRequest.create({
          data: {
            requesterAdminId: 0,
            requesterRole: 'system',
            actionType: 'ban_uploader',
            actionPayload: actionPayload as unknown as Prisma.InputJsonValue,
            riskLevel: 'high',
            requireDualApproval: false,
            requesterReason: `Auto: violation '${violationType}' count=${count} >= 5`,
            status: 'pending',
            expiresAt,
          },
        });

        await (tx as typeof prisma).adminAuditLog.create({
          data: {
            actorAdminId: 0,
            actorRole: 'system',
            eventCategory: 'high_risk_action',
            eventType: 'approval_request_create',
            targetUserId: userId,
            payload: { actionType: 'ban_uploader', ...actionPayload } as unknown as Prisma.InputJsonValue,
            payloadHash: banPayloadHash,
            traceId: banTraceId,
            ip: '127.0.0.1',
            userAgent: 'violation-detection-worker',
            sessionId: 'system',
            approvalRequestId: approvalRequest.id,
            success: true,
          },
        });
        banRequested++;
        logger.warn(
          { userId, violationType, count, approvalRequestId: approvalRequest.id },
          'violation_detect.ban_requested',
        );

        // DingTalk notification — isMock=true by default (D-077 · real启 PRR)
        const msg = `[QuanAn 违规告警] 用户 #${userId} 违规类型「${violationType}」次数=${count}，已触发封禁申请 #${approvalRequest.id}`;
        await dingtalk.send(msg).catch((err: unknown) => {
          logger.error({ err, userId }, 'violation_detect.dingtalk_send_failed');
        });
      }
    }
  });

  logger.info({ warned, banRequested, skipped }, 'violation_detect.completed');
  return { warned, banRequested, skipped };
}
