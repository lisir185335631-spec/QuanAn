/**
 * QuanAn · PRD-4 BaseSpecialist 抽象类(模板方法模式)
 * US-001: execute() 4步模板 · 子类只实现 invokeLLM + 3 abstract 属性
 * US-003: LLMGateway 集成 + zod 校验 retry + cost_log 完整字段 + LLMTimeoutError
 * US-015: fallback 路径 · SchemaValidationError/LLMTimeoutError/5xx → fallbackTemplate → status='fallback'
 *
 * AC-1(US-001): invokeLLM 抽象方法 · 子类按 streaming 与否实现
 * AC-3(US-001): outputSchema.safeParse 失败 → retry 1 次 → 二次失败 throw SchemaValidationError
 * AC-5(US-001): traceId 用 generateSpecialistTraceId (不用 generateHttpTraceId)
 * AC-6(US-001): AbortError → throw LLMTimeoutError(agentId, timeout_ms)
 * AC-4/AC-8(US-001): cost_log callType='specialist_call' + target jsonb(stepKey+agentId)
 * AC-1(US-015): fallback catch → fallbackTemplate?[mode] → cost_log(model='fallback',tokens=0)
 * AC-9(US-015): no fallbackTemplate → re-throw (让用户看真错)
 * AC-11(US-015): DB write fallback flag 失败 → log only · 不影响主返回
 * AC-13(US-015): cost_log event_type='specialist_call' · tokens=0 · model='fallback'
 */

import { Decimal } from '@prisma/client/runtime/library';

import { generateSpecialistTraceId } from '@/agents/base/types';
import type { SpecialistId } from '@/agents/base/types';
import { appendDisclaimerIfSensitive, attachDisclaimerMeta } from '@/lib/compliance/disclaimer';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { contextAssembler as _contextAssembler } from '@/services/context-assembler/ContextAssembler';
import { llmGateway as _llmGateway } from '@/workers/llm-gateway';

import { runWithBudget, checkBudget, addCost, estimateCostUsd, BudgetExceededError } from '@/lib/security/cost-budget-guard';
import { checkOutput, scanObjectOutput } from '@/lib/security/output-guardrail';

import { SchemaValidationError, LLMTimeoutError } from './errors';

import type {
  SpecialistConfig,
  SpecialistRequest,
  SpecialistResponse,
  InvokeLLMResult,
  ILLMGateway,
  AssembledContext,
} from './types';
import type { z } from 'zod';

// Approximate cost per 1M tokens (USD) for real costUsd calculation
const COST_PER_M_USD: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-6': { input: 3.0, output: 15.0 },
  'claude-haiku-4-5':  { input: 0.25, output: 1.25 },
  'gpt-4o':            { input: 2.5, output: 10.0 },
  'gpt-4o-mini':       { input: 0.15, output: 0.60 },
};

function calcCostUsd(model: string, promptTokens: number, completionTokens: number): Decimal {
  if (model === 'fallback') return new Decimal('0.000000');
  const rates = COST_PER_M_USD[model] ?? { input: 1.0, output: 5.0 };
  const cost = (promptTokens * rates.input + completionTokens * rates.output) / 1_000_000;
  return new Decimal(cost.toFixed(6));
}

export abstract class BaseSpecialist<TIn, TOut> {
  /** 五层配置(AC-2) */
  abstract readonly config: SpecialistConfig;
  /** 入参 zod schema · execute() 第 1 步用 */
  abstract readonly inputSchema: z.ZodType<TIn>;
  /** 出参 zod schema · execute() 第 4 步用 */
  abstract readonly outputSchema: z.ZodType<TOut>;

  /**
   * US-015 AC-1: 子类提供各 mode 的降级模板
   * key = req.mode ?? 'default' · value = 符合 outputSchema 的占位内容
   * 未提供 → 触发 fallback 时 re-throw(AC-9)
   */
  static readonly fallbackTemplate?: Record<string, unknown>;

  /** LLMGateway(DI · 测试时注入 mock) */
  protected readonly llmGateway: ILLMGateway;

  constructor(gateway?: ILLMGateway) {
    this.llmGateway = gateway ?? (_llmGateway as unknown as ILLMGateway);
  }

  /**
   * 模板方法 — 子类不覆写此方法
   * 4 步: inputSchema.parse → contextAssembler.assemble → invokeLLM(retry 1次) → writeCostLog
   * US-015: 外层 try-catch · SchemaValidationError/LLMTimeoutError/5xx → fallback path
   */
  async execute(req: SpecialistRequest<TIn>): Promise<SpecialistResponse<TOut>> {
    // AC-5: 用 generateSpecialistTraceId，不用 generateHttpTraceId
    const traceId = req.traceId ?? generateSpecialistTraceId(
      req.accountId,
      this.config.agentId as SpecialistId,
    );
    const startedAt = Date.now();

    // G78: wrap entire execute body in runWithBudget so addCost/checkBudget share scope
    return runWithBudget(async () => {
    try {
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

      // F-6 fix: conservative constants for pre-call budget estimate (hoisted so both try blocks share them)
      // Use most expensive known model + ceiling completion tokens so checkBudget can fire on large contexts.
      const CONSERVATIVE_MODEL = 'claude-sonnet-4-6'; // most expensive in rate table
      const CONSERVATIVE_COMPLETION_TOKENS = 4096;

      // Step 3: 子类实现的单次 LLM 调用 + AC-3 retry
      let raw: InvokeLLMResult;
      try {
        // F-6 fix: pre-call budget estimate uses real assembled context size + conservative model rate.
        // Old: estimateCostUsd(model_tier, 2000, 500) — model_tier string falls back to unknown rate
        //      AND fixed 2000 tokens never reflects actual prompt size → checkBudget always ~$0.0045 → never fires.
        // New: use ctx.metadata?.contextTokens (real assembled token count) as prompt estimate;
        //      fallback 2000 if metadata absent (test mocks / edge cases);
        //      conservative 4096 completion ceiling; estimate against most expensive known model
        //      so that long-context calls on any tier correctly trigger the pre-call guard.
        const preEstimate = estimateCostUsd(
          CONSERVATIVE_MODEL,
          ctx.metadata?.contextTokens ?? 2000,
          CONSERVATIVE_COMPLETION_TOKENS,
        );
        checkBudget(preEstimate);

        raw = await this.invokeLLM(ctx, { ...req, traceId });

        // G78: record actual cost after successful invokeLLM
        addCost(estimateCostUsd(raw.model, raw.tokens.prompt, raw.tokens.completion));
      } catch (err) {
        // AC-6: AbortError (timeout) → LLMTimeoutError
        if (err instanceof Error && err.name === 'AbortError') {
          throw new LLMTimeoutError(this.config.agentId, this.config.execution.timeout_ms);
        }
        throw err;
      }

      // Step 4: 出参校验(AC-3: retry 1 次)
      let parsed = this.outputSchema.safeParse(raw.content);
      if (!parsed.success) {
        logger.warn(
          { agentId: this.config.agentId, traceId, issues: parsed.error.message },
          'specialist.schema_validation.retry',
        );
        try {
          // F-6 fix: retry also uses real context tokens (same ctx, same size); fallback 2000 if absent
          const retryEstimate = estimateCostUsd(
            CONSERVATIVE_MODEL,
            ctx.metadata?.contextTokens ?? 2000,
            CONSERVATIVE_COMPLETION_TOKENS,
          );
          checkBudget(retryEstimate);

          raw = await this.invokeLLM(ctx, { ...req, traceId });

          // G78: record actual cost after successful retry
          addCost(estimateCostUsd(raw.model, raw.tokens.prompt, raw.tokens.completion));
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') {
            throw new LLMTimeoutError(this.config.agentId, this.config.execution.timeout_ms);
          }
          throw err;
        }
        parsed = this.outputSchema.safeParse(raw.content);
        if (!parsed.success) {
          throw new SchemaValidationError(parsed.error, raw.content);
        }
      }

      const durationMs = Date.now() - startedAt;

      // Step 5: writeCostLog(AC-4/AC-8 完整字段)
      // G12 系统性修: success 基于 invokeLLM 返回的 isFallback — 内层 fallback(如 VideoAgent)
      // 出错时返回 isFallback:true 而不 throw，若此处写 success:true 则 canary 漏计失败。
      await this._writeCostLog({
        agentId: this.config.agentId,
        accountId: req.accountId,
        stepKey: req.stepKey,
        agentMode: req.mode,
        traceId,
        modelUsed: raw.model,
        modelTier: this.config.execution.model_tier,
        promptTokens: raw.tokens.prompt,
        completionTokens: raw.tokens.completion,
        totalTokens: raw.tokens.total,
        durationMs,
        isFallback: raw.isFallback ?? false,
        success: !(raw.isFallback ?? false),
      });

      // G77: output compliance scan on parsed result
      const guardedData = this._applyOutputGuardrail(parsed.data, traceId);

      // LD-018 R-14 (TD-016 修): 输出 disclaimer (按 input.industry · 敏感行业医疗/法律/金融)
      const finalResult = this._applyDisclaimer(guardedData, req.userInput);

      return {
        result: finalResult,
        isFallback: raw.isFallback ?? false,
        durationMs,
        tokensUsed: raw.tokens,
        modelUsed: raw.model,
        traceId,
      };
    } catch (err) {
      // US-015 AC-1: fallback path — default fallbackable for all LLM/network/schema
      // errors; only re-throw genuine programming errors (ZodError from input validation
      // is caught at procedure layer, not here — those are non-recoverable by design).
      //
      // DEAD CODE FIX: the old heuristic `err.message?.includes('5xx')` and
      // `err.message?.includes('API_KEY missing')` never matched real gateway errors
      // like "401 {…}", "429 rate_limit_error", "529 overloaded", timeout/network
      // failures, or SchemaValidationError — so isFallbackable was always false for
      // real API errors → execute() threw → frontend showed "生成失败".
      //
      // New policy: ALL errors that escape invokeLLM() or outputSchema.safeParse()
      // are fallbackable EXCEPT the rare programming/config bugs we explicitly list.
      // Specifically, do NOT fall back for:
      //   1. TypeError / ReferenceError — indicates a code bug, not a transient failure.
      //   2. Errors thrown by _validateMode() (invalid mode string) — programming error.
      // Everything else (HTTP 4xx/5xx, rate-limit, overload, abort, schema mismatch,
      // network reset, JSON parse, BudgetExceededError, etc.) → fallback gracefully.
      const isNonRecoverableProgrammingError =
        (err instanceof TypeError || err instanceof ReferenceError) &&
        !(err instanceof SchemaValidationError) &&
        !(err instanceof LLMTimeoutError) &&
        !(err instanceof BudgetExceededError);

      const isFallbackable = !isNonRecoverableProgrammingError;

      if (!isFallbackable) throw err;

      // AC-9: no fallbackTemplate → re-throw (让用户看真错 · 不静默)
      const ctor = this.constructor as { fallbackTemplate?: Record<string, unknown> };
      const fallback = ctor.fallbackTemplate?.[req.mode ?? 'default'];
      if (fallback === undefined) throw err;

      const durationMs = Date.now() - startedAt;

      logger.warn(
        { agentId: this.config.agentId, traceId, err: err instanceof Error ? err.message : String(err) },
        'specialist.fallback_triggered',
      );

      // AC-13: cost_log with model='fallback', tokens=0
      // G12 fix: success=false 让 canary 错误率统计能感知到真实失败
      await this._writeCostLog({
        agentId: this.config.agentId,
        accountId: req.accountId,
        stepKey: req.stepKey,
        agentMode: req.mode,
        traceId,
        modelUsed: 'fallback',
        modelTier: this.config.execution.model_tier,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        durationMs,
        isFallback: true,
        success: false,
      });

      return {
        result: fallback as TOut,
        isFallback: true,
        durationMs,
        tokensUsed: { prompt: 0, completion: 0, total: 0 },
        modelUsed: 'fallback',
        traceId,
      };
    }
    }); // end runWithBudget
  }

  /**
   * LD-018 R-14: 输出 disclaimer 自动注入 (TD-016 修)
   * - markdown 字段 (CopywritingAgent free/step7 mode): 末尾追加免责
   * - 其他 JSON 结构 (boom candidates / analysis JSON): 加 _disclaimer 元数据
   * - input 没 industry / 非敏感行业 → 原样返回
   */
  private _applyDisclaimer(result: TOut, userInput: TIn): TOut {
    const industryRaw = (userInput as { industry?: unknown } | null | undefined)?.industry;
    const industry = typeof industryRaw === 'string' ? industryRaw : '';
    if (!industry || !result || typeof result !== 'object') return result;

    const obj = result as Record<string, unknown>;
    if (typeof obj.markdown === 'string') {
      return { ...obj, markdown: appendDisclaimerIfSensitive(obj.markdown, industry) } as TOut;
    }
    return attachDisclaimerMeta(obj, industry) as TOut;
  }

  /**
   * G77 / F-2 fix: output compliance guardrail — scans parsed output for PII and over-promise violations.
   * If string: runs checkOutput directly and re-parses sanitized text.
   *   - re-parse success → return re-parsed (schema-valid sanitized)
   *   - re-parse failure → return sanitized cast to TOut (safe > schema-min; violations MUST NOT leak back)
   * If object: recursively scans string fields via scanObjectOutput.
   *   - re-parse success → return re-parsed
   *   - re-parse failure → return scanned.sanitized cast (never return original data with violations)
   */
  protected _applyOutputGuardrail(data: TOut, traceId: string): TOut {
    if (typeof data === 'string') {
      const { sanitized, violations } = checkOutput(data);
      if (violations.length > 0) {
        logger.warn(
          { agentId: this.config.agentId, traceId, violations },
          'output_compliance_violation',
        );
      }
      const reparsed = this.outputSchema.safeParse(sanitized);
      if (reparsed.success) return reparsed.data;
      // F-2 fix: re-parse failed → return sanitized (never the original with violations)
      logger.warn(
        { agentId: this.config.agentId, traceId },
        'output_guardrail.reparse_failed_using_sanitized',
      );
      return sanitized as unknown as TOut;
    }
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const scanned = scanObjectOutput(data as Record<string, unknown>);
      if (scanned.violations.length > 0) {
        logger.warn(
          { agentId: this.config.agentId, traceId, violations: scanned.violations },
          'output_compliance_violation',
        );
      }
      const reparsed = this.outputSchema.safeParse(scanned.sanitized);
      if (reparsed.success) return reparsed.data;
      // F-2 fix: re-parse failed → return scanned.sanitized (never the original data with violations)
      logger.warn(
        { agentId: this.config.agentId, traceId },
        'output_guardrail.reparse_failed_using_sanitized',
      );
      return scanned.sanitized as unknown as TOut;
    }
    return data;
  }

  /**
   * 子类实现的 LLM 调用钩子(AC-1)
   * 子类必须:
   *   1. 通过 this.llmGateway.complete() 调用(不直接 import SDK · AC-5)
   *   2. 传 responseFormat: { type: 'json_schema', schema: this.outputSchema } 强制 JSON(AC-2)
   *   3. 传 timeout_ms: this.config.execution.timeout_ms(anti-pattern REJ-006)
   *   4. 通过 this.config.execution.model_tier 传 model(不硬编码 · AC-6)
   *   5. 单次调用(不循环 · AC-4)
   */
  protected abstract invokeLLM(
    ctx: AssembledContext,
    req: SpecialistRequest<TIn>,
  ): Promise<InvokeLLMResult>;

  /** AC-4/AC-8: 写 cost_log 完整字段 · callType='specialist_call' · target jsonb */
  private async _writeCostLog(data: {
    agentId: string;
    accountId: number;
    stepKey?: string;
    agentMode?: string;
    traceId: string;
    modelUsed: string;
    modelTier: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    durationMs: number;
    isFallback: boolean;
    /** G12 fix: 真实 LLM 失败(fallback 触发)写 false，正常完成写 true。改为 required 避免 optional 在 TS compile 时被优化掉 */
    success: boolean;
  }): Promise<void> {
    // fallback model has no provider prefix — use 'none' to avoid false detection
    const provider = data.modelUsed.startsWith('claude-')
      ? 'anthropic'
      : data.modelUsed.startsWith('gpt-')
        ? 'openai'
        : 'none';

    try {
      await prisma.costLog.create({
        data: {
          agentId: data.agentId,
          accountId: data.accountId,
          traceId: data.traceId,
          modelUsed: data.modelUsed,
          modelTier: data.modelTier,
          provider,
          callType: 'specialist_call',
          agentMode: data.agentMode ?? null,
          promptTokens: data.promptTokens,
          completionTokens: data.completionTokens,
          totalTokens: data.totalTokens,
          costUsd: calcCostUsd(data.modelUsed, data.promptTokens, data.completionTokens),
          durationMs: data.durationMs,
          // G12 fix: success=false 在 fallback path 显式传入(required field，不再 optional)
          success: data.success,
          isFallback: data.isFallback,
          // AC-4: target jsonb = { stepKey, agentId }
          target: { stepKey: data.stepKey ?? null, agentId: data.agentId },
        },
      });
    } catch (err) {
      // AC-8/AC-11: cost_log 失败不 crash 业务
      logger.error({ err, traceId: data.traceId }, 'specialist.cost_log.write_failed');
    }
  }
}
