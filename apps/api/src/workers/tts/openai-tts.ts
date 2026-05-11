/**
 * OpenAI TTS-1 Worker — PRD-8 US-010
 * ★ D-038: OpenAI audio API 仅限本文件 import · 不走 LLMGateway
 * ★ R-001: API key 不暴露给前端 · 仅 worker 层使用
 * ★ AC-9: publicUrl = placeholder · S3 signed URL 留 PRR 评估
 */

import { Decimal } from '@prisma/client/runtime/library';
// eslint-disable-next-line import/no-named-as-default
import OpenAI from 'openai';
import { TRPCError } from '@trpc/server';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import {
  TTS_MAX_CHARS,
  TTS_TIMEOUT_MS,
  TTS_COST_USD_PER_1K_CHARS,
} from '@/lib/constants/ttsLimits';

import type { ITtsWorker, TtsSynthesizePayload, TtsSynthesizeResult } from './index';

// AC-9: placeholder URL until S3 signed URL is configured (留 PRR)
const PLACEHOLDER_URL = '/static/placeholder-audio.mp3';

export class OpenAITtsWorker implements ITtsWorker {
  private readonly timeoutMs: number;
  private readonly maxRetries: number;

  constructor(options?: { timeoutMs?: number; maxRetries?: number }) {
    this.timeoutMs = options?.timeoutMs ?? TTS_TIMEOUT_MS;
    this.maxRetries = options?.maxRetries ?? 2;
  }

  async synthesize(payload: TtsSynthesizePayload): Promise<TtsSynthesizeResult> {
    const { text, voice = 'nova', accountId, traceId } = payload;

    // AC-2: 4000 chars max
    if (text.length > TTS_MAX_CHARS) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `文本超过 ${TTS_MAX_CHARS} 字符限制 (${text.length} 字符)`,
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

    let mp3Buffer: Buffer;
    try {
      // AC-1: model='tts-1' · voice='nova' default · response_format='mp3'
      const response = await client.audio.speech.create({
        model: 'tts-1',
        voice: voice as Parameters<typeof client.audio.speech.create>[0]['voice'],
        input: text,
        response_format: 'mp3',
      });
      mp3Buffer = Buffer.from(await response.arrayBuffer());
    } catch (err) {
      logger.error({ err, traceId }, 'tts.openai_call_failed');
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'TTS 合成失败，请稍后重试',
        cause: err,
      });
    }

    const durationMs = Date.now() - startMs;
    // AC-4: costUsd = ceil(text.length / 1000) * 0.015
    const costUsd = Math.ceil(text.length / 1000) * TTS_COST_USD_PER_1K_CHARS;

    // AC-3: write Asset record · accountId 双层防护 · publicUrl = placeholder (PRR: S3)
    try {
      await prisma.asset.create({
        data: {
          accountId,
          assetType: 'tts_audio',
          fileName: `tts-${traceId}.mp3`,
          mimeType: 'audio/mpeg',
          sizeBytes: mp3Buffer.length,
          storageProvider: 'placeholder',
          storageKey: `tts/${traceId}.mp3`,
          publicUrl: PLACEHOLDER_URL,
          generationModel: 'tts-1',
          traceId,
        },
      });
    } catch (err) {
      logger.error({ err, traceId }, 'tts.asset_write_failed');
    }

    // AC-4: cost_log eventType='tts_call'
    try {
      await prisma.costLog.create({
        data: {
          accountId,
          agentId: 'TtsWorker',
          eventType: 'tts_call',
          callType: 'tts_call',
          modelTier: 'audio',
          modelUsed: 'tts-1',
          provider: 'openai',
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          charactersIn: text.length,
          costUsd: new Decimal(costUsd.toFixed(6)),
          durationMs,
          traceId,
        },
      });
    } catch (err) {
      logger.error({ err, traceId }, 'tts.cost_log_failed');
    }

    return { publicUrl: PLACEHOLDER_URL, sizeBytes: mp3Buffer.length, costUsd };
  }
}
