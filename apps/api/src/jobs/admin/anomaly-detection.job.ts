// PRD-11 US-009 · anomaly-detection.job
// BullMQ cron '0 5 * * *' tz Asia/Shanghai · jobId 'anomaly-detection-recurring'
// SHIELD: tz: 'Asia/Shanghai' required · jobId prevents double-fire on restart

import { Queue, Worker } from 'bullmq';

import { logger } from '@/lib/logger';
import { redis } from '@/lib/redis';
import { detectAccountAnomalies } from '@/services/admin/accounts/anomaly-detection.service';

export const ANOMALY_DETECTION_QUEUE_NAME = 'admin-anomaly-detection';

export const anomalyDetectionQueue = new Queue(ANOMALY_DETECTION_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

export const anomalyDetectionWorker = new Worker(
  ANOMALY_DETECTION_QUEUE_NAME,
  async (job) => {
    logger.info({ jobId: job.id }, 'anomaly_detection_worker.started');
    const result = await detectAccountAnomalies();
    logger.info({ jobId: job.id, detected: result.detected }, 'anomaly_detection_worker.completed');
  },
  { connection: redis, concurrency: 1 },
);

export async function scheduleAnomalyDetection(): Promise<void> {
  await anomalyDetectionQueue.add(
    'anomaly-detection',
    {},
    {
      repeat: { pattern: '0 5 * * *', tz: 'Asia/Shanghai' },
      jobId: 'anomaly-detection-recurring',
    },
  );
  logger.info('anomaly_detection.scheduled');
}
