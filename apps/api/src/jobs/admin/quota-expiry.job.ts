// PRD-13 US-005 · quota-expiry.job — BullMQ delayed job + cleanup cron
// AC-7: per-adjustment delayed job (delay 24h · jobId dedup)
// AC-8: cleanup cron '0 30 0 * * *' 00:30 Asia/Shanghai — sweep未触发 expiry
// SHIELD: jobId: 'quota-expiry-' + adjustmentId 防重复 expiry (SHIELD 教训)
// SHIELD: tx 确保 user_quota 回滚 + revokedAt 写入原子 (SHIELD 教训)
import { randomBytes } from 'node:crypto';

import { Queue, Worker } from 'bullmq';

import { logAdminAction } from '@/services/admin/admin-audit-service';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

export const QUOTA_EXPIRY_QUEUE_NAME = 'admin-quota-expiry';

export interface QuotaExpiryJobPayload {
  adjustmentId: number;
}

export const quotaExpiryQueue = new Queue<QuotaExpiryJobPayload>(QUOTA_EXPIRY_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 100 },
  },
});

async function processExpiry(adjustmentId: number): Promise<void> {
  const adj = await prisma.quotaAdjustmentLog.findUnique({
    where: { id: adjustmentId },
    include: { userQuota: true },
  });

  if (!adj) {
    logger.warn({ adjustmentId }, 'quota_expiry.adjustment_not_found');
    return;
  }
  if (adj.isExpired) {
    logger.info({ adjustmentId }, 'quota_expiry.already_expired_skip');
    return;
  }

  await prisma.$transaction(async (tx) => {
    // rollback quota change
    if (adj.field === 'whitelist') {
      await tx.userQuota.update({
        where: { id: adj.userQuotaId },
        data: { isOnWhitelist: false, whitelistExpiresAt: null },
      });
    } else if (adj.field === 'dailyQuota' && adj.delta !== null) {
      await tx.userQuota.update({
        where: { id: adj.userQuotaId },
        data: { dailyQuota: { decrement: adj.delta } },
      });
    } else if (adj.field === 'monthlyQuota' && adj.delta !== null) {
      await tx.userQuota.update({
        where: { id: adj.userQuotaId },
        data: { monthlyQuota: { decrement: adj.delta } },
      });
    }

    await tx.quotaAdjustmentLog.update({
      where: { id: adjustmentId },
      data: { isExpired: true, expiredAt: new Date() },
    });
  });

  const traceId = randomBytes(8).toString('hex');
  await logAdminAction({
    actorAdminId: adj.adminId,
    actorRole: adj.adminMode ?? 'system',
    eventCategory: 'quota_management',
    eventType: 'quota_adjustment_expired',
    payload: { adjustmentId, userId: adj.userId, field: adj.field, delta: adj.delta },
    traceId,
    ip: 'system',
    userAgent: 'quota-expiry-worker',
    sessionId: 'system',
    success: true,
    targetUserId: adj.userId,
    approvalRequestId: adj.approvalRequestId,
  });

  logger.info({ adjustmentId, userId: adj.userId, field: adj.field }, 'quota_expiry.processed');
}

export const quotaExpiryWorker = new Worker<QuotaExpiryJobPayload>(
  QUOTA_EXPIRY_QUEUE_NAME,
  async (job) => {
    const { adjustmentId } = job.data;
    logger.info({ jobId: job.id, adjustmentId }, 'quota_expiry_worker.started');
    await processExpiry(adjustmentId);
    logger.info({ jobId: job.id, adjustmentId }, 'quota_expiry_worker.completed');
  },
  { connection: redis },
);

quotaExpiryWorker.on('failed', async (job, err) => {
  logger.error({ jobId: job?.id, err }, 'quota_expiry_worker.failed');
});

// Add a delayed job for a specific adjustment (called after each quota adjustment)
export async function scheduleQuotaExpiry(adjustmentId: number): Promise<void> {
  const delay = 24 * 60 * 60 * 1000; // 24h
  await quotaExpiryQueue.add(
    'quota-expiry',
    { adjustmentId },
    {
      delay,
      jobId: `quota-expiry-${adjustmentId}`, // dedup: same adjustment won't fire twice
    },
  );
  logger.info({ adjustmentId, delayMs: delay }, 'quota_expiry.scheduled');
}

// Cleanup cron: sweep all non-expired adjustments past their expiresAt (D-096 兜底)
export const QUOTA_CLEANUP_QUEUE_NAME = 'admin-quota-cleanup';

export const quotaCleanupQueue = new Queue(QUOTA_CLEANUP_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 50 },
  },
});

export const quotaCleanupWorker = new Worker(
  QUOTA_CLEANUP_QUEUE_NAME,
  async (job) => {
    logger.info({ jobId: job.id }, 'quota_cleanup_worker.started');
    const now = new Date();

    const overdueAdjs = await prisma.quotaAdjustmentLog.findMany({
      where: { isExpired: false, expiresAt: { lte: now } },
      select: { id: true },
      take: 500,
    });

    logger.info({ count: overdueAdjs.length }, 'quota_cleanup_worker.overdue_found');

    for (const { id } of overdueAdjs) {
      await processExpiry(id);
    }

    logger.info({ jobId: job.id, processed: overdueAdjs.length }, 'quota_cleanup_worker.completed');
  },
  { connection: redis },
);

export async function scheduleQuotaCleanup(): Promise<void> {
  await quotaCleanupQueue.add(
    'quota-cleanup-recurring',
    {},
    {
      repeat: { pattern: '0 30 0 * * *', tz: 'Asia/Shanghai' },
      jobId: 'quota-cleanup-recurring',
    },
  );
  logger.info('quota_cleanup_cron.registered');
}
