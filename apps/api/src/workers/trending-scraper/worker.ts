/**
 * TrendingScraper BullMQ Worker — PRD-12 US-002
 * LD-A-5: 写 trendingReviewQueue · 禁止 trendingItem.create
 * AC-4: P2002 catch + log warn 不阻塞
 * AC-6: attempts:3 · failed event 写 system_alert 审计
 * AC-7: scraper_enqueue 写 data_mutation 审计 (system actor)
 */

import { createHash, randomBytes } from 'node:crypto';

import { Prisma, type PrismaClient } from '@prisma/client';
import { Worker } from 'bullmq';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { runAutoVerdictForContent } from '@/services/admin/content-review/trending-auto-verdict.service';
import { getSystemConfigValue } from '@/services/admin/feature-flag/feature-flag.service';

import { TRENDING_SCRAPER_QUEUE_NAME } from './queue';

import type { TrendingScraperJobPayload } from './queue';

function makePayloadHash(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

/** Write system-actor audit log · fire-and-forget errors are swallowed */
async function writeAuditLog(
  db: Pick<PrismaClient, 'adminAuditLog'>,
  opts: {
    eventCategory: string;
    eventType: string;
    payload: Record<string, unknown>;
    success: boolean;
    errorMessage?: string;
    traceId: string;
  },
): Promise<void> {
  const payloadHash = makePayloadHash(opts.payload);
  await db.adminAuditLog.create({
    data: {
      actorAdminId: 0,
      actorRole: 'system',
      eventCategory: opts.eventCategory,
      eventType: opts.eventType,
      payloadHash,
      payload: opts.payload as Prisma.InputJsonValue,
      traceId: opts.traceId,
      ip: '127.0.0.1',
      userAgent: 'trending-scraper-worker',
      sessionId: 'system',
      success: opts.success,
      errorMessage: opts.errorMessage ?? null,
    },
  });
}

/** AC-1: Process one scrape job — write to review queue, not trendingItem */
export async function processTrendingScraperJob(payload: TrendingScraperJobPayload): Promise<void> {
  const { sourcePlatform, sourceItemId, sourceUrl, rawContent } = payload;
  const traceId = `trending-scraper-${sourcePlatform}-${sourceItemId}-${randomBytes(4).toString('hex')}`;

  // PRD-14 US-012 AC-2: emergency kill switch brownfield · stop_trending_scraper 在 system_config · 5s TTL cache 防频繁查 DB
  if (await getSystemConfigValue('stop_trending_scraper')) {
    logger.warn({ sourcePlatform, sourceItemId, traceId }, 'trending_scraper.emergency_stopped');
    return;
  }

  logger.info({ sourcePlatform, sourceItemId, traceId }, 'trending_scraper_worker.started');

  // AC-3: compute autoVerdict (loads rules from DB)
  const { autoVerdict, scanResult } = await runAutoVerdictForContent(rawContent, prisma);

  try {
    // AC-1 / LD-A-5: write to review queue, NOT trendingItem.create
    await prisma.trendingReviewQueue.create({
      data: {
        sourcePlatform,
        sourceItemId,
        sourceUrl,
        rawContent: rawContent as Prisma.InputJsonValue,
        autoScanResult: scanResult as unknown as Prisma.InputJsonValue,
        autoVerdict,
        status: autoVerdict === 'auto_approved' ? 'auto_approved'
          : autoVerdict === 'auto_rejected' ? 'auto_rejected'
          : 'pending',
      },
    });

    logger.info({ sourcePlatform, sourceItemId, autoVerdict, traceId }, 'trending_scraper_worker.enqueued');

    // AC-7: 审计 data_mutation/scraper_enqueue (system actor)
    await writeAuditLog(prisma, {
      eventCategory: 'data_mutation',
      eventType: 'scraper_enqueue',
      payload: { sourcePlatform, sourceItemId, sourceUrl, autoVerdict },
      success: true,
      traceId,
    });
  } catch (err) {
    // AC-4: @@unique([sourcePlatform, sourceItemId]) P2002 → log warn, don't rethrow
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      logger.warn(
        { sourcePlatform, sourceItemId, traceId },
        'trending_scraper_worker.duplicate_skipped',
      );
      return;
    }
    throw err;
  }
}

export const trendingScraperWorker = new Worker<TrendingScraperJobPayload>(
  TRENDING_SCRAPER_QUEUE_NAME,
  async (job) => processTrendingScraperJob(job.data),
  {
    connection: redis,
    concurrency: 3,
  },
);

trendingScraperWorker.on('completed', (job) => {
  logger.info(
    { jobId: job.id, sourcePlatform: job.data.sourcePlatform, sourceItemId: job.data.sourceItemId },
    'trending_scraper_worker.job_completed',
  );
});

// AC-6: final failure → admin_audit_log system_alert/scraper_enqueue_failed
trendingScraperWorker.on('failed', async (job, error) => {
  if (!job) return;
  const maxAttempts = job.opts.attempts ?? 1;
  if (job.attemptsMade < maxAttempts) return;

  const traceId = randomBytes(8).toString('hex');
  logger.error(
    { jobId: job.id, sourcePlatform: job.data.sourcePlatform, error },
    'trending_scraper_worker.final_failure',
  );

  try {
    await writeAuditLog(prisma, {
      eventCategory: 'system_alert',
      eventType: 'scraper_enqueue_failed',
      payload: {
        jobId: job.id,
        sourcePlatform: job.data.sourcePlatform,
        sourceItemId: job.data.sourceItemId,
        errorMessage: error.message,
      },
      success: false,
      errorMessage: error.message,
      traceId,
    });
  } catch (auditErr) {
    logger.error({ auditErr }, 'trending_scraper_worker.audit_log_write_failed');
  }
});

trendingScraperWorker.on('error', (err) => {
  logger.error({ err }, 'trending_scraper_worker.dead_letter_alert');
});
