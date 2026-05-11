/**
 * Evolution BullMQ Queue — PRD-8 US-002 AC-4
 * Queue 'evolution' · Redis connection
 * Worker 不在本 story 启动 (留 US-003)
 */

import { Queue } from 'bullmq';

import { redis } from '@/lib/redis';

export const EVOLUTION_QUEUE_NAME = 'evolution';

export interface EvolutionJobPayload {
  accountId: number;
  triggerType: string;
}

export const evolutionQueue = new Queue<EvolutionJobPayload>(EVOLUTION_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});
