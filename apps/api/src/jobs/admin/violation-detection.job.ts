// PRD-12 US-012 · violation-detection.job
// BullMQ cron '0 4 * * *' tz 'Asia/Shanghai' jobId 'violation-detection-recurring'
// AC-1: 04:00 错峰(KPI=00:00 / cost=15分 / anomaly=05:00)
// AC-7: attempts:3 · 第3次失败 → admin_audit_log 'system_alert'/'violation_cron_failed'
// SHIELD: tz: 'Asia/Shanghai' required · jobId prevents double-fire on restart

import { createHash, randomBytes } from 'node:crypto';

import { Queue, Worker } from 'bullmq';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { detectViolationThresholds } from '@/services/admin/content-review/violation-detection.service';

export const VIOLATION_DETECTION_QUEUE_NAME = 'admin-violation-detection';

export const violationDetectionQueue = new Queue(VIOLATION_DETECTION_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

export const violationDetectionWorker = new Worker(
  VIOLATION_DETECTION_QUEUE_NAME,
  async (job) => {
    logger.info({ jobId: job.id }, 'violation_detection_worker.started');
    const result = await detectViolationThresholds();
    logger.info(
      { jobId: job.id, warned: result.warned, banRequested: result.banRequested, skipped: result.skipped },
      'violation_detection_worker.completed',
    );
  },
  { connection: redis, concurrency: 1 },
);

// AC-7: write admin_audit_log 'system_alert'/'violation_cron_failed' on final failure
violationDetectionWorker.on('failed', async (job, error) => {
  if (!job) return;
  const maxAttempts = job.opts.attempts ?? 1;
  if (job.attemptsMade < maxAttempts) return;

  const traceId = randomBytes(8).toString('hex');
  const payload = { jobName: job.name, errorMessage: error.message };
  const payloadHash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');

  logger.error({ jobId: job.id, error }, 'violation_detection_worker.final_failure');

  try {
    await prisma.adminAuditLog.create({
      data: {
        actorAdminId: 0,
        actorRole: 'system',
        eventCategory: 'system_alert',
        eventType: 'violation_cron_failed',
        payloadHash,
        payload,
        traceId,
        ip: '127.0.0.1',
        userAgent: 'violation-detection-worker',
        sessionId: 'system',
        success: false,
        errorMessage: error.message,
      },
    });
  } catch (auditErr) {
    logger.error({ auditErr }, 'violation_detection_worker.audit_log_write_failed');
  }
});

// ---------------------------------------------------------------------------
// Schedule function — jobId dedup on server restart
// AC-1: '0 4 * * *' 04:00 Asia/Shanghai · 错峰避免与 KPI/cost/anomaly 同时触发
// ---------------------------------------------------------------------------

export async function scheduleViolationDetection(): Promise<void> {
  await violationDetectionQueue.add(
    'violation-detection',
    {},
    {
      repeat: { pattern: '0 4 * * *', tz: 'Asia/Shanghai' },
      jobId: 'violation-detection-recurring',
    },
  );
  logger.info('violation_detection.scheduled');
}
