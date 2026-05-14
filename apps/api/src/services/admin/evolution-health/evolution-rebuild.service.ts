// PRD-13 US-004 · evolution-rebuild.service — _forceRebuildEvolutionInTx
// AC-7: single-point function for clearing evolution_profile + marking insights resolved
// SHIELD: _forceRebuildEvolutionInTx is the ONLY path to clear evolution_profile / resolve insights (LD-A-7)
// SHIELD: always writes admin_audit_log eventType='evolution_force_rebuild'
// SHIELD: always dispatches BullMQ delayed EvolutionAgent batch re-run (5s delay)

import { createHash } from 'node:crypto';

import { Prisma } from '@prisma/client';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export interface ForceRebuildEvolutionParams {
  accountId: number;
  adminId: number;
  adminRole: string;
  approvalRequestId: number;
  reason: string;
  ip?: string;
  sessionId?: string;
}

/**
 * AC-7: _forceRebuildEvolutionInTx — single-point transactional force-rebuild
 * Must be called inside an existing Prisma transaction (tx).
 *
 * Operations:
 * 1. Clear evolution_profile.latestInsight + latestInsightId (but keep the profile row)
 * 2. Mark all evolution_insights as resolved (isFallback=true + levelAfter='rebuild')
 * 3. Write admin_audit_log eventType='evolution_force_rebuild'
 * 4. Caller is responsible for enqueue BullMQ job after transaction commits
 */
export async function _forceRebuildEvolutionInTx(
  tx: Prisma.TransactionClient,
  params: ForceRebuildEvolutionParams,
): Promise<void> {
  const { accountId, adminId, adminRole, approvalRequestId, reason, ip = '0.0.0.0', sessionId = '' } = params;

  const db = tx as typeof prisma;

  // Step 1: Clear evolution_profile latestInsight (LD-A-7 single-point)
  await db.evolutionProfile.update({
    where: { accountId },
    data: {
      latestInsight: Prisma.JsonNull,
      latestInsightId: null,
      lastEvolvedAt: null,
    },
  });

  // Step 2: Mark all evolution_insights as resolved (LD-A-7 single-point)
  await db.evolutionInsight.updateMany({
    where: { accountId },
    data: {
      isFallback: true,
      levelAfter: 'rebuild',
    },
  });

  // Step 3: Write admin_audit_log eventType='evolution_force_rebuild'
  const payload = {
    approvalRequestId,
    reason,
    rebuiltAt: new Date().toISOString(),
  };
  const payloadHash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');

  await db.adminAuditLog.create({
    data: {
      actorAdminId: adminId,
      actorRole: adminRole,
      eventCategory: 'high_risk_action',
      eventType: 'evolution_force_rebuild',
      targetAccountId: accountId,
      payload: payload as unknown as Prisma.InputJsonValue,
      payloadHash,
      approvalRequestId,
      traceId: `rebuild-${accountId}-${approvalRequestId}`,
      ip,
      userAgent: 'admin-trpc',
      sessionId,
      success: true,
    },
  });

  logger.info(
    { accountId, adminId, approvalRequestId },
    'evolution.force_rebuild.transaction.committed',
  );
}

/**
 * Post-transaction: enqueue EvolutionAgent batch re-run (BullMQ delayed 5s).
 * Called by tRPC router AFTER the transaction commits.
 */
export async function enqueueEvolutionRebuildJob(accountId: number): Promise<void> {
  try {
    const { Queue } = await import('bullmq');
    const { redis } = await import('@/lib/redis');

    const queue = new Queue('evolution-rebuild', { connection: redis });
    await queue.add(
      'rebuild-account',
      { accountId, triggerType: 'force_rebuild:admin' },
      { delay: 5000, attempts: 3, jobId: `rebuild-${accountId}-${Date.now()}` },
    );

    logger.info({ accountId }, 'evolution.force_rebuild.job.enqueued');
  } catch (err) {
    // Non-fatal: BullMQ may not be available in all envs
    logger.error({ accountId, err }, 'evolution.force_rebuild.job.enqueue_failed');
  }
}
