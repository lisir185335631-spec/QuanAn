// PRD-11 US-002 · kpi-snapshot.job — BullMQ cron 1h 聚合
// AC-1: Queue('admin:kpi-snapshot') + Worker · 调 computeSnapshot
// AC-6: attempts:3 · 第 3 次失败 → admin_audit_log eventCategory='system_alert'
// AC-7: jobId 唯一约束防 double-fire

import { createHash, randomBytes } from 'node:crypto';

import { Queue, Worker } from 'bullmq';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { computeSnapshot } from '@/services/admin/nsm/kpi-snapshot.service';

export const KPI_SNAPSHOT_QUEUE_NAME = 'admin:kpi-snapshot';

export interface KpiSnapshotJobPayload {
  granularity: 'day' | 'week' | 'month';
}

export const kpiSnapshotQueue = new Queue<KpiSnapshotJobPayload>(KPI_SNAPSHOT_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

// Worker: process each fired job by calling computeSnapshot with current time
export const kpiSnapshotWorker = new Worker<KpiSnapshotJobPayload>(
  KPI_SNAPSHOT_QUEUE_NAME,
  async (job) => {
    const { granularity } = job.data;
    const snapshotDate = new Date();
    logger.info({ jobId: job.id, granularity }, 'kpi_snapshot_worker.started');
    await computeSnapshot(snapshotDate, granularity);
    logger.info({ jobId: job.id, granularity }, 'kpi_snapshot_worker.completed');
  },
  { connection: redis, concurrency: 1 },
);

// AC-6: write admin_audit_log on final failure (all attempts exhausted)
kpiSnapshotWorker.on('failed', async (job, error) => {
  if (!job) return;
  const maxAttempts = job.opts.attempts ?? 1;
  if (job.attemptsMade < maxAttempts) return; // not yet final failure

  const traceId = randomBytes(8).toString('hex');
  const payload = { jobName: job.name, granularity: job.data.granularity, errorMessage: error.message };
  const payloadHash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');

  logger.error({ jobId: job.id, granularity: job.data.granularity, error }, 'kpi_snapshot_worker.final_failure');

  try {
    await prisma.adminAuditLog.create({
      data: {
        actorAdminId: 0,
        actorRole: 'system',
        eventCategory: 'system_alert',
        eventType: 'kpi_snapshot_failed',
        payloadHash,
        payload,
        traceId,
        ip: '127.0.0.1',
        userAgent: 'kpi-snapshot-worker',
        sessionId: 'system',
        success: false,
        errorMessage: error.message,
      },
    });
  } catch (auditErr) {
    logger.error({ auditErr }, 'kpi_snapshot_worker.audit_log_write_failed');
  }
});

// ---------------------------------------------------------------------------
// Schedule functions — each uses jobId for dedup on server restart (AC-7)
// SHIELD: tz: 'Asia/Shanghai' required; jobId prevents double-fire
// ---------------------------------------------------------------------------

export async function scheduleDailySnapshot(): Promise<void> {
  await kpiSnapshotQueue.add(
    'daily-snapshot',
    { granularity: 'day' },
    {
      repeat: { pattern: '0 * * * *', tz: 'Asia/Shanghai' },
      jobId: 'daily-snapshot-recurring',
    },
  );
  logger.info('kpi_snapshot.daily_scheduled');
}

export async function scheduleWeeklySnapshot(): Promise<void> {
  await kpiSnapshotQueue.add(
    'weekly-snapshot',
    { granularity: 'week' },
    {
      repeat: { pattern: '0 4 * * 1', tz: 'Asia/Shanghai' },
      jobId: 'weekly-snapshot-recurring',
    },
  );
  logger.info('kpi_snapshot.weekly_scheduled');
}

export async function scheduleMonthlySnapshot(): Promise<void> {
  await kpiSnapshotQueue.add(
    'monthly-snapshot',
    { granularity: 'month' },
    {
      repeat: { pattern: '0 4 1 * *', tz: 'Asia/Shanghai' },
      jobId: 'monthly-snapshot-recurring',
    },
  );
  logger.info('kpi_snapshot.monthly_scheduled');
}
