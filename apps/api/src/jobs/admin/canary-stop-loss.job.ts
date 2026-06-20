// PRD-13 US-003 · canary-stop-loss.job.ts
// G12: canary 自动止损 BullMQ 周期 job
//
// AC-1: BullMQ cron '0 0 * * * *' hourly Asia/Shanghai · jobId='canary-stop-loss-recurring'
// AC-2: runCanaryStopLoss() — 检测 + 自动回滚
// AC-3: worker.on('failed') 最终失败写 system_alert 审计日志
// 模式: follow ab-stop-loss.job.ts

import { createHash, randomBytes } from 'node:crypto';

import { Queue, Worker } from 'bullmq';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { runCanaryStopLoss } from '@/services/admin/prompt-version/canary-stop-loss.service';
import { DingtalkService } from '@/services/admin/notifications/dingtalk.service';

export const CANARY_STOP_LOSS_QUEUE_NAME = 'admin-canary-stop-loss';

export const canaryStopLossQueue = new Queue(CANARY_STOP_LOSS_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

export const canaryStopLossWorker = new Worker(
  CANARY_STOP_LOSS_QUEUE_NAME,
  async (job) => {
    logger.info({ jobId: job.id }, 'canary_stop_loss_worker.started');
    const result = await runCanaryStopLoss(new DingtalkService());
    logger.info(
      { jobId: job.id, rolledBack: result.rolledBack, skipped: result.skipped },
      'canary_stop_loss_worker.completed',
    );
  },
  { connection: redis, concurrency: 1 },
);

// Failed handler — final failure writes system_alert audit log
canaryStopLossWorker.on('failed', async (job, error) => {
  if (!job) return;
  const maxAttempts = job.opts.attempts ?? 1;
  if (job.attemptsMade < maxAttempts) return;

  const traceId = randomBytes(8).toString('hex');
  const payload = { jobName: job.name, errorMessage: error.message };
  const payloadHash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');

  logger.error({ jobId: job.id, error }, 'canary_stop_loss_worker.final_failure');

  try {
    await prisma.adminAuditLog.create({
      data: {
        actorAdminId: 0,
        actorRole: 'system',
        eventCategory: 'system_alert',
        eventType: 'canary_stop_loss_cron_failed',
        payloadHash,
        payload: payload as unknown as import('@prisma/client').Prisma.InputJsonValue,
        traceId,
        ip: '127.0.0.1',
        userAgent: 'canary-stop-loss-worker',
        sessionId: 'system',
        success: false,
        errorMessage: error.message,
      },
    });
  } catch (auditErr) {
    logger.error({ auditErr }, 'canary_stop_loss_worker.audit_log_write_failed');
  }
});

// ---------------------------------------------------------------------------
// Schedule — hourly · 整点 Asia/Shanghai
// ---------------------------------------------------------------------------

export async function scheduleCanaryStopLoss(): Promise<void> {
  await canaryStopLossQueue.add(
    'canary-stop-loss',
    {},
    {
      repeat: { pattern: '0 0 * * * *', tz: 'Asia/Shanghai' },
      jobId: 'canary-stop-loss-recurring',
    },
  );
  logger.info('canary_stop_loss.scheduled');
}
