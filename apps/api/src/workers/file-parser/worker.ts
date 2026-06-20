/**
 * FileParser BullMQ Worker — PRD-12 US-008
 * LD-A-5: 写 deepLearnReviewQueue · 禁止 deepLearningArchive.create
 * AC-4: fileSize > 20MB → reject + log warn · 不入 queue
 * AC-5: fileMime 不在白名单 → reject
 * AC-6: autoScanResult 存 redacted text preview · 防原 PII 持久化 (LD-A-3 + GDPR)
 * AC-7: S3 stub · fileUrl = 'mock-s3://bucket/<fileName>' (D-077 isMock 模式)
 * AC-8: 成功写 data_mutation/file_parser_enqueue 审计 (system actor)
 * AC-9: final failure → admin_audit_log system_alert/file_parser_failed
 */

import { createHash, randomBytes } from 'node:crypto';

import { type PrismaClient } from '@prisma/client';
import { Worker } from 'bullmq';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { computeDeepLearnAutoVerdict } from '@/services/admin/content-review/deep-learn-auto-verdict.service';

import { FILE_PARSER_QUEUE_NAME } from './queue';
import { parseFileBuffer } from './parse-engine';

import type { FileParserJobPayload } from './queue';
import type { Prisma} from '@prisma/client';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

// AC-5: whitelist — PDF / Word / CSV / MD / TXT / Excel (.xlsx)
// PRD-37 US-P07: added xlsx MIME types (file:worker.ts:30)
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/csv',
  'text/markdown',
  'text/x-markdown',
  'text/plain',
  // Excel — added for PRD-37 US-P07
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
]);

function makePayloadHash(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

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
      userAgent: 'file-parser-worker',
      sessionId: 'system',
      success: opts.success,
      errorMessage: opts.errorMessage ?? null,
    },
  });
}

/** AC-1: process one file upload — validate → parse → scan → write review queue + Asset */
export async function processFileParserJob(payload: FileParserJobPayload): Promise<void> {
  const { userId, accountId, fileName, fileMime, fileSize, rawText, assetId, fileBuffer } = payload;
  const traceId = `file-parser-${userId}-${randomBytes(4).toString('hex')}`;

  logger.info({ userId, accountId, fileName, fileMime, fileSize, traceId }, 'file_parser_worker.started');

  // AC-4: fileSize > 20MB → reject
  if (fileSize > MAX_FILE_SIZE) {
    logger.warn({ userId, fileName, fileSize, traceId }, 'file_parser_worker.size_exceeded');
    return;
  }

  // AC-5: mime not in whitelist → reject
  if (!ALLOWED_MIME_TYPES.has(fileMime)) {
    logger.warn({ userId, fileName, fileMime, traceId }, 'file_parser_worker.mime_rejected');
    return;
  }

  // AC-7: S3 stub (D-077 isMock mode)
  // S3 status: TRUE S3 upload awaiting credentials; currently mock/local only.
  const fileUrl = `mock-s3://bucket/${fileName}`;

  // PRD-37 US-P07: Asset parse flow (file:worker.ts)
  // When fileBuffer (base64) is provided, use the real parse engine.
  // Otherwise fall back to rawText pre-injected by caller (isMock / legacy path).
  let extractedText = rawText ?? '';
  let assetParseFailed = false;

  if (fileBuffer !== undefined && fileBuffer !== '') {
    try {
      const buf = Buffer.from(fileBuffer, 'base64');
      extractedText = await parseFileBuffer(buf, fileMime, fileName);
      if (!extractedText || extractedText.trim() === '') {
        assetParseFailed = true;
        logger.warn({ userId, fileName, traceId }, 'file_parser_worker.engine_empty_result');
      }
    } catch (parseErr) {
      assetParseFailed = true;
      logger.warn({ userId, fileName, traceId, parseErr }, 'file_parser_worker.engine_error');
    }
  }

  // Write Asset.parsedText + parsingStatus after engine run (PRD-37 US-P07)
  // file:worker.ts — Asset解析流 写入点
  if (assetId !== undefined) {
    await prisma.asset.update({
      where: { id: assetId },
      data: {
        parsedText: assetParseFailed ? null : extractedText,
        parsingStatus: assetParseFailed ? 'failed' : 'completed',
        parsingError: assetParseFailed ? 'parse_engine_failed' : null,
      },
    });
    logger.info(
      { userId, assetId, parsingStatus: assetParseFailed ? 'failed' : 'completed', traceId },
      'file_parser_worker.asset_updated',
    );
  }

  // Detect parse failure (empty content) for deepLearn verdict
  const parseFailed = !extractedText || extractedText.trim() === '';
  if (parseFailed) {
    logger.warn({ userId, fileName, traceId }, 'file_parser_worker.parse_failed');
  }

  const { autoVerdict, scanResult, redactedText } = await computeDeepLearnAutoVerdict(
    extractedText,
    { parseFailed },
  );

  // AC-6: store redacted scan result — no raw PII in DB
  const autoScanResultToStore = {
    ...scanResult,
    // preview of redacted text (≤200 chars) for reviewer context
    redactedTextPreview: redactedText.slice(0, 200),
  };

  // AC-1 / LD-A-5: write to review queue, NOT deepLearningArchive.create
  await prisma.deepLearnReviewQueue.create({
    data: {
      userId,
      accountId,
      fileName,
      fileMime,
      fileSize,
      fileUrl,
      autoScanResult: autoScanResultToStore as unknown as Prisma.InputJsonValue,
      autoVerdict,
      status:
        autoVerdict === 'auto_approved'
          ? 'auto_approved'
          : autoVerdict === 'auto_rejected'
            ? 'auto_rejected'
            : 'pending',
    },
  });

  logger.info({ userId, accountId, fileName, autoVerdict, traceId }, 'file_parser_worker.enqueued');

  // AC-8: audit data_mutation/file_parser_enqueue (system actor)
  await writeAuditLog(prisma, {
    eventCategory: 'data_mutation',
    eventType: 'file_parser_enqueue',
    payload: { userId, accountId, fileName, fileMime, fileSize, autoVerdict },
    success: true,
    traceId,
  });
}

export const fileParserWorker = new Worker<FileParserJobPayload>(
  FILE_PARSER_QUEUE_NAME,
  async (job) => processFileParserJob(job.data),
  {
    connection: redis,
    concurrency: 3,
  },
);

fileParserWorker.on('completed', (job) => {
  logger.info({ jobId: job.id, fileName: job.data.fileName }, 'file_parser_worker.job_completed');
});

// AC-9: final failure → system_alert/file_parser_failed
fileParserWorker.on('failed', async (job, error) => {
  if (!job) return;
  const maxAttempts = job.opts.attempts ?? 1;
  if (job.attemptsMade < maxAttempts) return;

  const traceId = randomBytes(8).toString('hex');
  logger.error({ jobId: job.id, fileName: job.data.fileName, error }, 'file_parser_worker.final_failure');

  try {
    await writeAuditLog(prisma, {
      eventCategory: 'system_alert',
      eventType: 'file_parser_failed',
      payload: {
        jobId: job.id,
        userId: job.data.userId,
        fileName: job.data.fileName,
        errorMessage: error.message,
      },
      success: false,
      errorMessage: error.message,
      traceId,
    });
  } catch (auditErr) {
    logger.error({ auditErr }, 'file_parser_worker.audit_log_write_failed');
  }
});

fileParserWorker.on('error', (err) => {
  logger.error({ err }, 'file_parser_worker.dead_letter_alert');
});
