// PRD-11 US-015 · cost-anomaly.job — BullMQ cron 每小时检测单用户日 > $5
// AC-1: cron pattern '15 * * * *' tz 'Asia/Shanghai' jobId 'cost-anomaly-recurring' (15分错峰)
// AC-8: attempts:3 · 第3次失败 → admin_audit_log 'system_alert'/'cron_failed'
// SHIELD: tz: 'Asia/Shanghai' required · jobId prevents double-fire on restart

import { createHash, randomBytes } from 'node:crypto';

import { Queue, Worker } from 'bullmq';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { detectCostAnomalies } from '@/services/admin/cost/detect-anomalies.service';

export const COST_ANOMALY_QUEUE_NAME = 'admin-cost-anomaly';

export const costAnomalyQueue = new Queue(COST_ANOMALY_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

export const costAnomalyWorker = new Worker(
  COST_ANOMALY_QUEUE_NAME,
  async (job) => {
    logger.info({ jobId: job.id }, 'cost_anomaly_worker.started');
    const result = await detectCostAnomalies();
    logger.info({ jobId: job.id, detected: result.detected, skipped: result.skipped }, 'cost_anomaly_worker.completed');
  },
  { connection: redis, concurrency: 1 },
);

// AC-8: write admin_audit_log 'system_alert'/'cron_failed' on final failure
costAnomalyWorker.on('failed', async (job, error) => {
  if (!job) return;
  const maxAttempts = job.opts.attempts ?? 1;
  if (job.attemptsMade < maxAttempts) return;

  const traceId = randomBytes(8).toString('hex');
  const payload = { jobName: job.name, errorMessage: error.message };
  const payloadHash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');

  logger.error({ jobId: job.id, error }, 'cost_anomaly_worker.final_failure');

  try {
    await prisma.adminAuditLog.create({
      data: {
        actorAdminId: 0,
        actorRole: 'system',
        eventCategory: 'system_alert',
        eventType: 'cron_failed',
        payloadHash,
        payload,
        traceId,
        ip: '127.0.0.1',
        userAgent: 'cost-anomaly-worker',
        sessionId: 'system',
        success: false,
        errorMessage: error.message,
      },
    });
  } catch (auditErr) {
    logger.error({ auditErr }, 'cost_anomaly_worker.audit_log_write_failed');
  }
});

// ---------------------------------------------------------------------------
// Schedule function — jobId dedup on server restart
// SHIELD: tz: 'Asia/Shanghai' required · 15分错峰防 thundering herd
// ---------------------------------------------------------------------------

export async function scheduleCostAnomalyDetection(): Promise<void> {
  await costAnomalyQueue.add(
    'cost-anomaly',
    {},
    {
      repeat: { pattern: '15 * * * *', tz: 'Asia/Shanghai' },
      jobId: 'cost-anomaly-recurring',
    },
  );
  logger.info('[bullmq] admin:cost-anomaly worker started');
}
