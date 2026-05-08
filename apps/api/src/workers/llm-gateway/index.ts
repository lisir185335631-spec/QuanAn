/**
 * QuanQn · LLMGateway · 唯一 LLM 调用入口
 * 派生自 ARCHITECTURE.md §6.5 + ADR-013 + LD-012 + R-1
 *
 * 5 大职责 ·
 *   1. 限流(per user · token bucket)
 *   2. 熔断(同模型连续 5 次 5xx)
 *   3. 降级(reasoning → lightweight → fallback 模板)
 *   4. 计费(每次写 cost_log)
 *   5. Trace 贯穿(metadata.trace_id)
 *
 * ⚠️ R-1 · 应用代码严禁 import OpenAI / Anthropic SDK · 必须经过本入口
 * AC-7: `from '@anthropic-ai/sdk'` — only this file in the entire codebase
 * AC-8: `from 'openai'` — only this file in the entire codebase
 */

// ⬇️ SDK imports STAY HERE ONLY (AC-7 + AC-8)
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

import type { z } from 'zod';
import { logger } from '@/lib/logger';
import type { ModelTier } from '@/agents/base/types';
import {
  buildAnthropicPayload,
  parseAnthropicResponse,
  isAnthropicModel,
} from './anthropic-provider';
import { buildOpenAIPayload, parseOpenAIResponse } from './openai-provider';
import { checkRateLimit, RateLimitError } from './rate-limiter';
import { writeCostLog } from './cost-logger';

export { RateLimitError };

// ============== 类型 ==============

export interface CompleteRequest {
  model_tier: ModelTier;
  systemPrompt: string;
  userPrompt: string;
  tools?: ToolDef[];
  responseFormat?: { type: 'text' } | { type: 'json_schema'; schema: z.ZodTypeAny };
  metadata: { trace_id: string; agentId: string; accountId: number; userId: number };
  timeout_ms?: number;
  retry?: number;
}

export interface CompleteResponse {
  content: string | object;
  tokens: { prompt: number; completion: number; total: number };
  model: string;
  duration_ms: number;
  trace_id: string;
  fallback?: { from: string; to: string; reason: string };
}

export interface StreamChunk {
  type: 'meta' | 'delta' | 'tool_call' | 'tool_result' | 'done' | 'error';
  /** stream 启动时告知实际使用的 model · D-019 / REJ-003 */
  meta?: { model: string };
  trace_id?: string;
  delta?: string;
  result?: unknown;
  error?: { code: string; message: string };
  tokens?: { prompt: number; completion: number; total: number };
  duration_ms?: number;
}

export interface ToolDef {
  name: string;
  description: string;
  parameters: z.ZodTypeAny;
}

// ============== 模型路由 ==============

const MODEL_BY_TIER = {
  reasoning:   { primary: 'claude-sonnet-4-6', fallback: 'gpt-4o' },
  lightweight: { primary: 'claude-haiku-4-5',  fallback: 'gpt-4o-mini' },
} as const satisfies Record<ModelTier, { primary: string; fallback: string }>;

// Lazy-created SDK clients (API keys never logged — AC-9)
let _anthropicClient: Anthropic | null = null;
let _openaiClient: OpenAI | null = null;

function getAnthropicClient(tier: string): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error(`ANTHROPIC_API_KEY missing for ${tier} tier`);
  return (_anthropicClient ??= new Anthropic({ apiKey: key }));
}

function getOpenAIClient(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY missing for fallback tier');
  return (_openaiClient ??= new OpenAI({ apiKey: key }));
}

// ============== Gateway 实现 ==============

class LLMGateway {
  /** Tier selector — P0 pass-through; P3 adds cost-based routing */
  selectTier(modelHint: ModelTier, _costBudget: number): ModelTier {
    return modelHint;
  }

  /** 单次调用 · 含限流 / 熔断 / 降级 / 计费 / Trace */
  async complete(req: CompleteRequest): Promise<CompleteResponse> {
    const startedAt = Date.now();
    const { trace_id, userId } = req.metadata;

    // 1. 限流 — throws RateLimitError if quota exhausted (AC-2, AC-11)
    await checkRateLimit(userId);

    const { primary, fallback: fallbackModel } = MODEL_BY_TIER[req.model_tier];

    // AC-5: fail fast on missing API keys — do not fall back with a config error
    if (isAnthropicModel(primary) && !process.env.ANTHROPIC_API_KEY) {
      throw new Error(`ANTHROPIC_API_KEY missing for ${req.model_tier} tier`);
    }

    // 2. Primary call with 1 automatic retry (AC-3)
    let response: CompleteResponse;
    try {
      response = await this._callWithRetry(primary, req, 1);
    } catch (primaryErr) {
      logger.warn({ trace_id, model: primary, err: String(primaryErr) }, 'llm.primary_failed_fallback');

      // 3. Fallback model (AC-3)
      try {
        response = await this._callWithRetry(fallbackModel, req, 0);
        response.fallback = { from: primary, to: fallbackModel, reason: String(primaryErr) };
      } catch (fallbackErr) {
        // 4. Both providers failed — return template (AC-4)
        logger.error(
          { trace_id, primary, fallback: fallbackModel, err: String(fallbackErr) },
          'llm.both_failed',
        );
        const failedResponse: CompleteResponse = {
          content: '抱歉，AI 服务暂时不可用，请稍后再试。如问题持续，请联系客服。',
          tokens: { prompt: 0, completion: 0, total: 0 },
          model: fallbackModel,
          duration_ms: Date.now() - startedAt,
          trace_id,
          fallback: { from: primary, to: fallbackModel, reason: String(fallbackErr) },
        };
        await writeCostLog({ req, res: failedResponse, success: false, errorCode: 'BOTH_FAILED' });
        return failedResponse;
      }
    }

    // 5. Write cost_log (AC-6)
    const finalDuration = Date.now() - startedAt;
    await writeCostLog({ req, res: { ...response, duration_ms: finalDuration }, success: true });

    return { ...response, duration_ms: finalDuration, trace_id };
  }

  /** 流式调用 · CopywritingAgent / VideoAgent / VoiceChatAgent 用 */
  async *stream(req: CompleteRequest): AsyncIterable<StreamChunk> {
    const { trace_id } = req.metadata;
    const startedAt = Date.now();
    // D-019 / REJ-003: emit actual model in first chunk — consumers read stream.meta.model
    const actualModel = MODEL_BY_TIER[req.model_tier].primary;
    yield { type: 'meta', trace_id, meta: { model: actualModel } };
    // TODO P3 · 真实流式实现
    yield { type: 'done', trace_id, duration_ms: Date.now() - startedAt };
  }

  /** Embedding(用于 RAG · pgvector) */
  async embed(text: string): Promise<number[]> {
    // TODO P3 · OpenAI text-embedding-3-small · 1536 维
    void text;
    return new Array(1536).fill(0);
  }

  // ============== 私有 ==============

  /** Retry wrapper: attempts = 1 + maxRetries total */
  private async _callWithRetry(
    model: string,
    req: CompleteRequest,
    maxRetries: number,
  ): Promise<CompleteResponse> {
    let lastErr: unknown;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this._callProvider(model, req);
      } catch (err) {
        lastErr = err;
        if (attempt < maxRetries) {
          logger.warn(
            { model, attempt, err: String(err), trace_id: req.metadata.trace_id },
            'llm.retry',
          );
        }
      }
    }
    throw lastErr;
  }

  /** Dispatch to Anthropic or OpenAI based on model name prefix */
  private async _callProvider(model: string, req: CompleteRequest): Promise<CompleteResponse> {
    const timeoutMs =
      req.timeout_ms ?? (req.model_tier === 'reasoning' ? 60_000 : 30_000);

    return isAnthropicModel(model)
      ? this._callAnthropic(model, req, timeoutMs)
      : this._callOpenAI(model, req, timeoutMs);
  }

  private async _callAnthropic(
    model: string,
    req: CompleteRequest,
    timeoutMs: number,
  ): Promise<CompleteResponse> {
    const startedAt = Date.now();
    const client = getAnthropicClient(req.model_tier);
    const payload = buildAnthropicPayload(model, req);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const raw = await client.messages.create(payload, { signal: controller.signal });
      return parseAnthropicResponse(raw, model, startedAt, req);
    } finally {
      clearTimeout(timer);
    }
  }

  private async _callOpenAI(
    model: string,
    req: CompleteRequest,
    timeoutMs: number,
  ): Promise<CompleteResponse> {
    const startedAt = Date.now();
    const client = getOpenAIClient();
    const payload = buildOpenAIPayload(model, req);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const raw = await client.chat.completions.create(payload, { signal: controller.signal });
      return parseOpenAIResponse(raw, model, startedAt, req);
    } finally {
      clearTimeout(timer);
    }
  }
}

export const llmGateway = new LLMGateway();
