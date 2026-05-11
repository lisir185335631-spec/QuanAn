/**
 * QuanQn · PRD-8 US-003 AC-7
 * enqueueIfThresholdMet — 原子阈值触发器
 *
 * 用 prisma.$queryRaw 的 INSERT ON CONFLICT UPDATE RETURNING 防 read-then-write race。
 * 严格只在 feedbackCountTotal ∈ {5, 20, 50, 100} 时 enqueue。
 */

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { evolutionQueue } from '@/workers/evolution/queue';

const THRESHOLDS = new Set([5, 20, 50, 100]);

/**
 * 原子递增 feedbackCountTotal 并检查阈值。
 * 满足 count ∈ {5,20,50,100} 时写入 BullMQ evolution 队列。
 * jobId 去重: `evo:{accountId}:{count}` — 防并发重复 enqueue。
 */
export async function enqueueIfThresholdMet(
  accountId: number,
  traceId: string,
): Promise<void> {
  // AC-7: prisma update RETURNING count — 原子操作防竞态
  const rows = await prisma.$queryRaw<[{ count: bigint }]>`
    INSERT INTO evolution_profiles (account_id, feedback_count_total, created_at, updated_at)
    VALUES (${accountId}, 1, NOW(), NOW())
    ON CONFLICT (account_id) DO UPDATE
      SET feedback_count_total = evolution_profiles.feedback_count_total + 1,
          updated_at = NOW()
    RETURNING feedback_count_total AS count
  `;

  const count = Number(rows[0]?.count ?? 0);

  if (!THRESHOLDS.has(count)) return;

  const triggerType = `threshold:${count}` as const;

  // jobId 去重 — 防并发重复 enqueue (AC-7 race protection)
  await evolutionQueue.add(
    'evolve',
    { accountId, triggerType },
    {
      jobId: `evo:${accountId}:${count}`,
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
    },
  );

  logger.info(
    { accountId, count, triggerType, traceId },
    'evolution.trigger.enqueued',
  );
}

/** AC-1 debug helper · returns number of jobs waiting in the evolution queue */
export async function getEvolutionQueueCount(): Promise<number> {
  return evolutionQueue.getWaitingCount();
}
