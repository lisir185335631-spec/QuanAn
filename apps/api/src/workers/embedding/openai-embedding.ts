/**
 * OpenAI text-embedding-3-small Worker — PRD-9 US-001
 * ★ D-038: OpenAI embeddings API 仅限本文件 import · 不走 LLMGateway
 * ★ R-001: API key 不暴露给前端 · 仅 worker 层使用
 * ★ AC-5: cost_log eventType='embedding_call' 第 7 类
 */

import { Decimal } from '@prisma/client/runtime/library';
import { TRPCError } from '@trpc/server';
// eslint-disable-next-line import/no-named-as-default
import OpenAI from 'openai';

import {
  EMBEDDING_MAX_TOKENS,
  EMBEDDING_TIMEOUT_MS,
  EMBEDDING_COST_USD_PER_1K_TOKENS,
  EMBEDDING_DIMENSIONS,
} from '@/lib/constants/embeddingLimits';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { checkEmbeddingRateLimit } from '@/lib/rate-limit/embedding';

import type { IEmbeddingWorker, EmbedPayload, EmbedResult } from './index';

export class OpenAIEmbeddingWorker implements IEmbeddingWorker {
  private readonly timeoutMs: number;
  private readonly maxRetries: number;

  constructor(options?: { timeoutMs?: number; maxRetries?: number }) {
    this.timeoutMs = options?.timeoutMs ?? EMBEDDING_TIMEOUT_MS;
    this.maxRetries = options?.maxRetries ?? 0;
  }

  async embed(payload: EmbedPayload): Promise<EmbedResult> {
    const { text, accountId, traceId } = payload;

    // AC-7: rate limit check before OpenAI API call
    await checkEmbeddingRateLimit(accountId);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'OPENAI_API_KEY not configured',
      });
    }

    const client = new OpenAI({ apiKey, timeout: this.timeoutMs, maxRetries: this.maxRetries });
    const startMs = Date.now();

    let embedding: number[];
    let tokens: number;
    try {
      const response = await client.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        // SDK v4.70+ defaults to base64 for performance; we need float[] for pgvector
        encoding_format: 'float',
      });

      const usage = response.usage;
      tokens = usage.prompt_tokens;

      // AC-4: oversize check — API errors on > 8192 tokens but we pre-validate too
      if (tokens > EMBEDDING_MAX_TOKENS) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `输入超过 ${EMBEDDING_MAX_TOKENS} tokens 限制 (${tokens} tokens)`,
        });
      }

      const vec = response.data[0]?.embedding;
      if (!vec || vec.length !== EMBEDDING_DIMENSIONS) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Embedding 维度异常: expected ${EMBEDDING_DIMENSIONS}, got ${vec?.length ?? 0}`,
        });
      }
      embedding = vec;
    } catch (err) {
      if (err instanceof TRPCError) throw err;
      logger.error({ err, traceId }, 'embedding.openai_call_failed');
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Embedding 生成失败，请稍后重试',
        cause: err,
      });
    }

    const durationMs = Date.now() - startMs;
    // AC-5: costUsd = ceil(tokens / 1000) * 0.00002
    const costUsd = Math.ceil(tokens / 1000) * EMBEDDING_COST_USD_PER_1K_TOKENS;

    // AC-5: cost_log eventType='embedding_call'
    try {
      await prisma.costLog.create({
        data: {
          accountId,
          agentId: 'EmbeddingWorker',
          eventType: 'embedding_call',
          callType: 'embedding_call',
          modelTier: 'embedding',
          modelUsed: 'text-embedding-3-small',
          provider: 'openai',
          promptTokens: tokens,
          completionTokens: 0,
          totalTokens: tokens,
          audioSeconds: null,
          charactersIn: text.length,
          costUsd: new Decimal(costUsd.toFixed(6)),
          durationMs,
          traceId,
        },
      });
    } catch (err) {
      logger.error({ err, traceId }, 'embedding.cost_log_failed');
    }

    return { embedding, tokens, costUsd };
  }
}
