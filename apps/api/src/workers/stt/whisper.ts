/**
 * Whisper-1 STTWorker — PRD-8 US-009
 * ★ D-038: OpenAI audio API 仅限本文件 import · 不走 LLMGateway
 * ★ R-001: API key 不暴露给前端 · 仅 worker 层使用
 */

import { Decimal } from '@prisma/client/runtime/library';
// eslint-disable-next-line import/no-named-as-default
import OpenAI, { toFile } from 'openai';
import { TRPCError } from '@trpc/server';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import {
  STT_MAX_SIZE_BYTES,
  STT_MAX_DURATION_SEC,
  STT_COST_USD_PER_MIN,
  STT_TIMEOUT_MS,
} from '@/lib/constants/sttLimits';

import type { ISttWorker, SttTranscribePayload, SttTranscribeResult } from './index';

// Parse WAV header to get duration in seconds (PCM WAV only)
function parseWavDurationSec(buf: Buffer): number | null {
  if (buf.length < 44) return null;
  if (buf.toString('ascii', 0, 4) !== 'RIFF') return null;
  if (buf.toString('ascii', 8, 12) !== 'WAVE') return null;
  if (buf.toString('ascii', 12, 16) !== 'fmt ') return null;

  const sampleRate = buf.readUInt32LE(24);
  const numChannels = buf.readUInt16LE(22);
  const bitsPerSample = buf.readUInt16LE(34);
  const dataSize = buf.readUInt32LE(40);

  const bytesPerSec = sampleRate * numChannels * (bitsPerSample / 8);
  if (bytesPerSec === 0) return null;
  return dataSize / bytesPerSec;
}

export class WhisperSttWorker implements ISttWorker {
  private readonly timeoutMs: number;
  private readonly maxRetries: number;

  constructor(options?: { timeoutMs?: number; maxRetries?: number }) {
    this.timeoutMs = options?.timeoutMs ?? STT_TIMEOUT_MS;
    this.maxRetries = options?.maxRetries ?? 2; // OpenAI SDK default
  }

  async transcribe(payload: SttTranscribePayload): Promise<SttTranscribeResult> {
    const { audioBuffer, mimeType, accountId, traceId } = payload;

    // AC-2: 25MB size check
    if (audioBuffer.length > STT_MAX_SIZE_BYTES) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `音频文件超过 25MB 限制 (${(audioBuffer.length / 1024 / 1024).toFixed(1)}MB)`,
      });
    }

    // AC-2: 30s duration check for WAV; skip for other formats (no metadata library)
    const parsedDurationSec = parseWavDurationSec(audioBuffer);
    if (parsedDurationSec !== null && parsedDurationSec > STT_MAX_DURATION_SEC) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `音频时长超过 ${STT_MAX_DURATION_SEC}s 限制 (${parsedDurationSec.toFixed(1)}s)`,
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'OPENAI_API_KEY not configured',
      });
    }

    const client = new OpenAI({ apiKey, timeout: this.timeoutMs, maxRetries: this.maxRetries });
    const startMs = Date.now();

    const ext = mimeType.split('/')[1] ?? 'wav';
    const file = await toFile(audioBuffer, `audio.${ext}`, { type: mimeType });

    let transcript: string;
    try {
      // AC-1: model='whisper-1' · response_format='text' · language='zh'
      transcript = await client.audio.transcriptions.create({
        file,
        model: 'whisper-1',
        response_format: 'text',
        language: 'zh',
      });
    } catch (err) {
      logger.error({ err, traceId }, 'stt.whisper_call_failed');
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'STT 转写失败，请稍后重试',
        cause: err,
      });
    }

    const elapsedMs = Date.now() - startMs;
    // Use parsed WAV duration for cost; fall back to elapsed time for non-WAV
    const audioDurationSec = parsedDurationSec ?? elapsedMs / 1000;
    const costUsd = (audioDurationSec / 60) * STT_COST_USD_PER_MIN;

    // AC-3: cost_log eventType='stt_call'
    try {
      await prisma.costLog.create({
        data: {
          accountId,
          agentId: 'SttWorker',
          eventType: 'stt_call',
          callType: 'stt_call',
          modelTier: 'audio',
          modelUsed: 'whisper-1',
          provider: 'openai',
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          audioSeconds: Math.round(audioDurationSec),
          costUsd: new Decimal(costUsd.toFixed(6)),
          durationMs: elapsedMs,
          traceId,
        },
      });
    } catch (err) {
      logger.error({ err, traceId }, 'stt.cost_log_failed');
    }

    return { transcript, durationSec: audioDurationSec, costUsd };
  }
}
