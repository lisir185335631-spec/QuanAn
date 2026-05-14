// PRD-13 US-002 · emergency-post-review.job
// AC-6: BullMQ cron '0 30 3 * * *' Asia/Shanghai 03:30 · jobId='emergency-post-review-recurring'
// AC-6: scan postReviewRequired=true && postReviewedAt=null && decidedAt < NOW()-24h → post_review_overdue audit + dingtalk
// SHIELD: tz: 'Asia/Shanghai' + jobId dedup on restart (D-096 错峰)
// SHIELD: isMock=true DingtalkService default (D-077)

import { createHash, randomBytes } from 'node:crypto';

import { Queue, Worker } from 'bullmq';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { DingtalkService } from '@/services/admin/notifications/dingtalk.service';

export const EMERGENCY_POST_REVIEW_QUEUE_NAME = 'admin-emergency-post-review';

export const emergencyPostReviewQueue = new Queue(EMERGENCY_POST_REVIEW_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

export interface PostReviewOverdueResult {
  notified: number;
  skipped: number;
}

export async function scanEmergencyPostReviewOverdue(
  dingtalk: DingtalkService = new DingtalkService(),
): Promise<PostReviewOverdueResult> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const overdueRequests = await prisma.approvalRequest.findMany({
    where: {
      postReviewRequired: true,
      postReviewedAt: null,
      decidedAt: { lt: twentyFourHoursAgo },
    },
    select: {
      id: true,
      actionType: true,
      approverAdminId: true,
      emergencyIncidentId: true,
      decidedAt: true,
    },
  });

  let notified = 0;
  let skipped = 0;

  for (const req of overdueRequests) {
    const traceId = randomBytes(8).toString('hex');
    const payload = {
      requestId: req.id,
      actionType: req.actionType,
      approverAdminId: req.approverAdminId,
      emergencyIncidentId: req.emergencyIncidentId,
      decidedAt: req.decidedAt?.toISOString(),
    };

    // dedupe: skip if already wrote post_review_overdue for this request today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const existing = await prisma.adminAuditLog.findFirst({
      where: {
        eventType: 'post_review_overdue',
        createdAt: { gte: todayStart },
        payload: { path: ['requestId'], equals: req.id },
      },
      select: { id: true },
    });

    if (existing) {
      skipped++;
      logger.debug({ requestId: req.id }, 'emergency_post_review.deduped');
      continue;
    }

    const payloadHash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');

    await prisma.adminAuditLog.create({
      data: {
        actorAdminId: 0,
        actorRole: 'system',
        eventCategory: 'security_alert',
        eventType: 'post_review_overdue',
        payload: payload as unknown as import('@prisma/client').Prisma.InputJsonValue,
        payloadHash,
        traceId,
        ip: '127.0.0.1',
        userAgent: 'emergency-post-review-worker',
        sessionId: 'system',
        success: true,
      },
    });

    await dingtalk.send(
      `[紧急通道后置复核超时] 审批请求 #${req.id} (${req.actionType}) 已超过 24 小时未复核。` +
        (req.emergencyIncidentId ? ` incident: ${req.emergencyIncidentId}` : ''),
    );

    notified++;
    logger.warn({ requestId: req.id, actionType: req.actionType }, 'emergency_post_review.overdue_notified');
  }

  return { notified, skipped };
}

export const emergencyPostReviewWorker = new Worker(
  EMERGENCY_POST_REVIEW_QUEUE_NAME,
  async (job) => {
    logger.info({ jobId: job.id }, 'emergency_post_review_worker.started');
    const result = await scanEmergencyPostReviewOverdue();
    logger.info(
      { jobId: job.id, notified: result.notified, skipped: result.skipped },
      'emergency_post_review_worker.completed',
    );
  },
  { connection: redis, concurrency: 1 },
);

emergencyPostReviewWorker.on('failed', async (job, error) => {
  if (!job) return;
  const maxAttempts = job.opts.attempts ?? 1;
  if (job.attemptsMade < maxAttempts) return;

  const traceId = randomBytes(8).toString('hex');
  const payload = { jobName: job.name, errorMessage: error.message };
  const payloadHash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');

  logger.error({ jobId: job.id, error }, 'emergency_post_review_worker.final_failure');

  try {
    await prisma.adminAuditLog.create({
      data: {
        actorAdminId: 0,
        actorRole: 'system',
        eventCategory: 'system_alert',
        eventType: 'emergency_post_review_cron_failed',
        payloadHash,
        payload: payload as unknown as import('@prisma/client').Prisma.InputJsonValue,
        traceId,
        ip: '127.0.0.1',
        userAgent: 'emergency-post-review-worker',
        sessionId: 'system',
        success: false,
        errorMessage: error.message,
      },
    });
  } catch (auditErr) {
    logger.error({ auditErr }, 'emergency_post_review_worker.audit_log_write_failed');
  }
});

// ---------------------------------------------------------------------------
// Schedule — D-096: '0 30 3 * * *' 03:30 Asia/Shanghai (6-field cron)
// ---------------------------------------------------------------------------

export async function scheduleEmergencyPostReview(): Promise<void> {
  await emergencyPostReviewQueue.add(
    'emergency-post-review',
    {},
    {
      repeat: { pattern: '0 30 3 * * *', tz: 'Asia/Shanghai' },
      jobId: 'emergency-post-review-recurring',
    },
  );
  logger.info('emergency_post_review.scheduled');
}
