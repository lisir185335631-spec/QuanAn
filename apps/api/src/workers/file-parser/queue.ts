/**
 * FileParser BullMQ Queue — PRD-12 US-008
 * LD-A-5: 上传文件必须经 review queue · 不直接入 deepLearningArchive 主表
 */

import { Queue } from 'bullmq';

import { redis } from '@/lib/redis';

export const FILE_PARSER_QUEUE_NAME = 'file-parser';

export interface FileParserJobPayload {
  userId: number;
  accountId: number;
  fileName: string;
  fileMime: string;
  fileSize: number;
  /** Raw text content — isMock mode (D-077): caller pre-extracts text before enqueue */
  rawText: string;
}

export const fileParserQueue = new Queue<FileParserJobPayload>(FILE_PARSER_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});
