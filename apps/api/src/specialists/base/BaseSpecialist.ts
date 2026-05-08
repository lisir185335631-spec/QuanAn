/**
 * QuanQn · PRD-4 BaseSpecialist 抽象类(模板方法模式)
 * AC-1: execute() 模板方法 · 4 步 · 子类只实现 invokeLLM + 提供 3 个 abstract 属性
 * AC-4: execute() 内单次 invokeLLM 调用 · 不循环
 * AC-5: 子类不直接 import @anthropic-ai/sdk / openai
 * AC-6: 子类不硬编码 model 名 · 通过 config.execution.model_tier 间接
 *
 * 7 Specialist(US-004~010)继承此类
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { contextAssembler as _contextAssembler } from '@/services/context-assembler/ContextAssembler';
import { llmGateway as _llmGateway } from '@/workers/llm-gateway';
import type { SpecialistId } from '@/agents/base/types';
import type {
  SpecialistConfig,
  SpecialistRequest,
  SpecialistResponse,
  InvokeLLMResult,
  ILLMGateway,
  AssembledContext,
} from './types';
import { SchemaValidationError } from './errors';

export abstract class BaseSpecialist<TIn, TOut> {
  /** 五层配置(AC-2) */
  abstract readonly config: SpecialistConfig;
  /** 入参 zod schema · execute() 第 1 步用 */
  abstract readonly inputSchema: z.ZodType<TIn>;
  /** 出参 zod schema · execute() 第 4 步用 */
  abstract readonly outputSchema: z.ZodType<TOut>;

  /** LLMGateway(DI · 测试时注入 mock) */
  protected readonly llmGateway: ILLMGateway;

  constructor(gateway?: ILLMGateway) {
    // 默认使用真实 gateway；单元测试注入 mock 替换
    this.llmGateway = gateway ?? (_llmGateway as unknown as ILLMGateway);
  }

  /**
   * 模板方法 — 子类不覆写此方法
   * 4 步: inputSchema.parse → contextAssembler.assemble → invokeLLM → outputSchema.safeParse → writeCostLog
   */
  async execute(req: SpecialistRequest<TIn>): Promise<SpecialistResponse<TOut>> {
    const traceId = req.traceId ?? this._generateTraceId(req.accountId);
    const startedAt = Date.now();

    // Step 1: 入参校验(throws ZodError on failure)
    this.inputSchema.parse(req.userInput);

    // Step 2: ContextAssembler 注入上下文
    const ctx = await _contextAssembler.assemble({
      agentId: this.config.agentId as SpecialistId,
      accountId: req.accountId,
      mode: req.mode,
      userInput: req.userInput,
      needRag: this.config.knowledge.rag,
    }) as AssembledContext;

    // Step 3: 子类实现的单次 LLM 调用(AC-4 不允许循环)
    const raw = await this.invokeLLM(ctx, { ...req, traceId });

    // Step 4: 出参校验(throws SchemaValidationError on failure)
    const parsed = this.outputSchema.safeParse(raw.content);
    if (!parsed.success) {
      throw new SchemaValidationError(parsed.error.message);
    }

    const durationMs = Date.now() - startedAt;

    // Step 5: writeCostLog(AC-7 · 7 个必填字段全写)
    await this._writeCostLog({
      agentId: this.config.agentId,
      accountId: req.accountId,
      traceId,
      modelUsed: raw.model,
      modelTier: this.config.execution.model_tier,
      promptTokens: raw.tokens.prompt,
      completionTokens: raw.tokens.completion,
      totalTokens: raw.tokens.total,
      durationMs,
      isFallback: raw.isFallback ?? false,
    });

    return {
      result: parsed.data,
      isFallback: raw.isFallback ?? false,
      durationMs,
      tokensUsed: raw.tokens,
      modelUsed: raw.model,
      traceId,
    };
  }

  /**
   * 子类实现的 LLM 调用钩子 · 必须:
   *   1. 通过 this.llmGateway.complete() 调用(不直接 import SDK · AC-5)
   *   2. 通过 this.config.execution.model_tier 传 model(不硬编码 · AC-6)
   *   3. 单次调用(不循环 · AC-4)
   */
  protected abstract invokeLLM(
    ctx: AssembledContext,
    req: SpecialistRequest<TIn>,
  ): Promise<InvokeLLMResult>;

  private _generateTraceId(accountId: number): string {
    const ts = Date.now();
    const rand = Math.random().toString(36).slice(2, 6);
    return `tr_${accountId}_${this.config.agentId}_${ts}_${rand}`;
  }

  /** AC-7: writeCostLog · prompt_tokens/completion_tokens/duration_ms/model_used/agent_id/trace_id/account_id 全填 */
  private async _writeCostLog(data: {
    agentId: string;
    accountId: number;
    traceId: string;
    modelUsed: string;
    modelTier: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    durationMs: number;
    isFallback: boolean;
  }): Promise<void> {
    const provider = data.modelUsed.startsWith('claude-') ? 'anthropic' : 'openai';

    try {
      await prisma.costLog.create({
        data: {
          agentId: data.agentId,
          accountId: data.accountId,
          traceId: data.traceId,
          modelUsed: data.modelUsed,
          modelTier: data.modelTier,
          provider,
          callType: 'specialist',
          promptTokens: data.promptTokens,
          completionTokens: data.completionTokens,
          totalTokens: data.totalTokens,
          costUsd: new Decimal('0.000000'),
          durationMs: data.durationMs,
          success: true,
          isFallback: data.isFallback,
        },
      });
    } catch (err) {
      // cost_log 失败不 crash 业务(同 gateway cost-logger 设计)
      logger.error({ err, traceId: data.traceId }, 'specialist.cost_log.write_failed');
    }
  }
}
