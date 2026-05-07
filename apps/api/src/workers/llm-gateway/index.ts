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
 */

import type { z } from 'zod';
import { logger } from '@/lib/logger';
import type { ModelTier } from '@/agents/base/types';

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
  reasoning:   { primary: 'claude-sonnet-4-6',  fallback: 'gpt-4o' },
  lightweight: { primary: 'claude-haiku-4-5',   fallback: 'gpt-4o-mini' },
} as const satisfies Record<ModelTier, { primary: string; fallback: string }>;

// ============== Gateway 实现 ==============

class LLMGateway {
  /** 单次调用 · 含限流 / 熔断 / 降级 / 计费 / Trace */
  async complete(req: CompleteRequest): Promise<CompleteResponse> {
    const startedAt = Date.now();
    const { trace_id } = req.metadata;

    // 1. 限流(P3 实现 · Upstash Ratelimit)
    await this.checkRateLimit(req.metadata.userId);

    // 2. 熔断检查 + 选模型
    const { primary } = MODEL_BY_TIER[req.model_tier];
    const model = primary; // P3 加熔断逻辑

    // 3. 主调用(带 retry)
    let response: CompleteResponse;
    try {
      response = await this.callProvider(model, req);
    } catch (err) {
      logger.warn({ trace_id, err, model }, 'llm.primary_failed_fallback');
      // 4. 降级到 fallback 模型
      const fallbackModel = MODEL_BY_TIER[req.model_tier].fallback;
      response = await this.callProvider(fallbackModel, req);
      response.fallback = { from: model, to: fallbackModel, reason: String(err) };
    }

    // 5. 写 cost_log
    await this.writeCostLog({
      ...req.metadata,
      model: response.model,
      tokens: response.tokens,
      durationMs: Date.now() - startedAt,
      success: true,
      isFallback: !!response.fallback,
    });

    return { ...response, duration_ms: Date.now() - startedAt, trace_id };
  }

  /** 流式调用 · CopywritingAgent / VideoAgent / VoiceChatAgent 用 */
  async *stream(req: CompleteRequest): AsyncIterable<StreamChunk> {
    const { trace_id } = req.metadata;
    const startedAt = Date.now();

    yield { type: 'meta', trace_id };

    // TODO P3 · 真实流式实现 · SDK 流式接口 + 句子边界切片
    // 此 stub 仅证明类型签名

    yield { type: 'done', trace_id, duration_ms: Date.now() - startedAt };
  }

  /** Embedding(用于 RAG · pgvector) */
  async embed(text: string): Promise<number[]> {
    // TODO P3 · OpenAI text-embedding-3-small · 1536 维
    void text;
    return new Array(1536).fill(0);
  }

  // ============== 私有 ==============

  private async checkRateLimit(_userId: number): Promise<void> {
    // TODO P3 · token bucket(Free 50/日 · Pro 500/日 · Enterprise 5000/日)
  }

  private async callProvider(model: string, _req: CompleteRequest): Promise<CompleteResponse> {
    // TODO P3 · 根据 model 路由到 Anthropic SDK / OpenAI SDK
    return {
      content: '[LLMGateway stub · P3 fills real call]',
      tokens: { prompt: 0, completion: 0, total: 0 },
      model,
      duration_ms: 0,
      trace_id: '',
    };
  }

  private async writeCostLog(_data: unknown): Promise<void> {
    // TODO P3 · prisma.costLog.create
  }
}

export const llmGateway = new LLMGateway();
