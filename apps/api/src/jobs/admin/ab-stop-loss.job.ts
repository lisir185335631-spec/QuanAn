// PRD-14 US-003 · ab-stop-loss.job
// AC-1: BullMQ cron '0 0 * * * *' hourly Asia/Shanghai · jobId='ab-stop-loss-recurring' · attempts=3
// AC-2: scanAbExperimentsForStopLoss · all status='running' · computeExperimentSignificance
// AC-3: trigger condition: recommendation='stop_loser' AND effect < -30%
// AC-4: _stopAbExperimentInTx(tx, {stopReason:'auto_stop_loss'}) single-point
// AC-5: admin_audit_log eventType='ab_experiment_auto_stop_loss' eventCategory='security_alert'
// AC-6: DingtalkService isMock=true default (D-077)
// AC-7: dedupe per experimentId per day via adminAuditLog.findFirst
// AC-8: stopAbExperimentManual → _stopAbExperimentInTx(stopReason='manual') single-point
// SHIELD: effect threshold -0.3 (30%) · dual condition stop_loser AND effect < -0.3
// SHIELD: adminId=0 for system actor
// SHIELD: dedupe uses payload.experimentId JSON path query

import { createHash, randomBytes } from 'node:crypto';

import { Queue, Worker } from 'bullmq';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { _stopAbExperimentInTx } from '@/services/admin/ab-experiment/ab-experiment.service';
import { computeExperimentSignificance } from '@/services/admin/ab-experiment/significance.service';
import { DingtalkService } from '@/services/admin/notifications/dingtalk.service';

export const AB_STOP_LOSS_QUEUE_NAME = 'admin-ab-stop-loss';

export interface StopLossResult {
  stopped: number;
  skipped: number;
}

export const abStopLossQueue = new Queue(AB_STOP_LOSS_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

// ---------------------------------------------------------------------------
// scanAbExperimentsForStopLoss — AC-2~7
// ---------------------------------------------------------------------------

export async function scanAbExperimentsForStopLoss(
  dingtalk: DingtalkService = new DingtalkService(),
): Promise<StopLossResult> {
  const runningExperiments = await prisma.abExperiment.findMany({
    where: { status: 'running' },
    select: { id: true, experimentKey: true },
  });

  let stopped = 0;
  let skipped = 0;

  for (const experiment of runningExperiments) {
    // AC-2: run significance check (3 standard metrics)
    const results = await computeExperimentSignificance(experiment.id);

    // AC-3: dual condition — stop_loser AND effect < -30%
    const triggeringMetric = results.find(
      (r) => r.recommendation === 'stop_loser' && r.effect !== null && r.effect < -0.3,
    );

    if (!triggeringMetric) {
      skipped++;
      continue;
    }

    // AC-7: dedupe per experimentId per day
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await prisma.adminAuditLog.findFirst({
      where: {
        eventType: 'ab_experiment_auto_stop_loss',
        createdAt: { gte: oneDayAgo },
        payload: { path: ['experimentId'], equals: experiment.id },
      },
      select: { id: true },
    });

    if (existing) {
      skipped++;
      logger.debug({ experimentId: experiment.id }, 'ab_stop_loss.deduped');
      continue;
    }

    // AC-4: call single-point stop inside $transaction
    const resultSummary = {
      triggeringMetric: triggeringMetric.metric,
      pValue: triggeringMetric.pValue,
      effect: triggeringMetric.effect,
      stopReason: 'auto_stop_loss',
    };

    await prisma.$transaction(async (tx) => {
      await _stopAbExperimentInTx(tx, {
        experimentId: experiment.id,
        adminId: 0,
        stopReason: 'auto_stop_loss',
        resultSummary,
      });
    });

    // AC-5: security_alert audit log with reasoning (metric / pValue / effect)
    const traceId = randomBytes(8).toString('hex');
    const reasoning = {
      experimentId: experiment.id,
      experimentKey: experiment.experimentKey,
      metric: triggeringMetric.metric,
      pValue: triggeringMetric.pValue,
      effect: triggeringMetric.effect,
      stopReason: 'auto_stop_loss',
    };
    const payloadHash = createHash('sha256').update(JSON.stringify(reasoning)).digest('hex');

    await prisma.adminAuditLog.create({
      data: {
        actorAdminId: 0,
        actorRole: 'system',
        eventCategory: 'security_alert',
        eventType: 'ab_experiment_auto_stop_loss',
        payload: reasoning as unknown as import('@prisma/client').Prisma.InputJsonValue,
        payloadHash,
        traceId,
        ip: '127.0.0.1',
        userAgent: 'ab-stop-loss-worker',
        sessionId: 'system',
        success: true,
      },
    });

    // AC-6: dingtalk notify (isMock=true by default)
    await dingtalk.send(
      `[A/B 实验自动停损] 实验 ${experiment.experimentKey}(id=${experiment.id}) B 组指标恶化已触发自动停止。` +
        `指标: ${triggeringMetric.metric} · pValue: ${triggeringMetric.pValue?.toFixed(4) ?? 'N/A'}` +
        ` · effect: ${triggeringMetric.effect !== null ? (triggeringMetric.effect * 100).toFixed(1) : 'N/A'}%`,
    );

    stopped++;
    logger.warn(
      { experimentId: experiment.id, metric: triggeringMetric.metric, effect: triggeringMetric.effect },
      'ab_stop_loss.triggered',
    );
  }

  return { stopped, skipped };
}

// ---------------------------------------------------------------------------
// stopAbExperimentManual — AC-8: super_admin manual stop via single-point
// ---------------------------------------------------------------------------

export interface StopAbExperimentManualParams {
  experimentId: number;
  adminId: number;
  resultSummary?: Record<string, unknown>;
}

export async function stopAbExperimentManual(
  params: StopAbExperimentManualParams,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await _stopAbExperimentInTx(tx, {
      experimentId: params.experimentId,
      adminId: params.adminId,
      stopReason: 'manual',
      resultSummary: params.resultSummary,
    });
  });
}

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

export const abStopLossWorker = new Worker(
  AB_STOP_LOSS_QUEUE_NAME,
  async (job) => {
    logger.info({ jobId: job.id }, 'ab_stop_loss_worker.started');
    const result = await scanAbExperimentsForStopLoss();
    logger.info(
      { jobId: job.id, stopped: result.stopped, skipped: result.skipped },
      'ab_stop_loss_worker.completed',
    );
  },
  { connection: redis, concurrency: 1 },
);

// Failed handler — final failure writes system_alert audit log
abStopLossWorker.on('failed', async (job, error) => {
  if (!job) return;
  const maxAttempts = job.opts.attempts ?? 1;
  if (job.attemptsMade < maxAttempts) return;

  const traceId = randomBytes(8).toString('hex');
  const payload = { jobName: job.name, errorMessage: error.message };
  const payloadHash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');

  logger.error({ jobId: job.id, error }, 'ab_stop_loss_worker.final_failure');

  try {
    await prisma.adminAuditLog.create({
      data: {
        actorAdminId: 0,
        actorRole: 'system',
        eventCategory: 'system_alert',
        eventType: 'ab_stop_loss_cron_failed',
        payloadHash,
        payload: payload as unknown as import('@prisma/client').Prisma.InputJsonValue,
        traceId,
        ip: '127.0.0.1',
        userAgent: 'ab-stop-loss-worker',
        sessionId: 'system',
        success: false,
        errorMessage: error.message,
      },
    });
  } catch (auditErr) {
    logger.error({ auditErr }, 'ab_stop_loss_worker.audit_log_write_failed');
  }
});

// ---------------------------------------------------------------------------
// Schedule — AC-1: '0 0 * * * *' hourly Asia/Shanghai · D-096 整点错峰
// ---------------------------------------------------------------------------

export async function scheduleAbStopLoss(): Promise<void> {
  await abStopLossQueue.add(
    'ab-stop-loss',
    {},
    {
      repeat: { pattern: '0 0 * * * *', tz: 'Asia/Shanghai' },
      jobId: 'ab-stop-loss-recurring',
    },
  );
  logger.info('ab_stop_loss.scheduled');
}
