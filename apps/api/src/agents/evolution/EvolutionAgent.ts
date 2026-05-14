/**
 * QuanQn · PRD-8 US-003
 * EvolutionAgent — 真实 LLM 接入 (L5 · 反馈飞轮大脑)
 *
 * AC-1: execute() 移除 throw · 真接 LLMGateway.complete(model_tier='reasoning')
 * AC-2: invokeLLM 内 recentFeedbacks(N=count/5) + samples(DLA limit 10) + previousInsight
 * AC-3: prisma.$transaction([profile.update, insight.create]) 原子事务
 * AC-4: Rule 3 渐进更新 — preferredCatchphrases ∪ prev 去重 top 10
 * AC-5: safeParse 失败 → isFallback=true · 降级用 previousInsight · 不写 insight
 * AC-9: cost_log eventType='l5_agent' (via gateway metadata)
 */

import { EvolutionInsightContentSchema } from '@quanqn/schemas/specialist-io';
import { z } from 'zod';

import { generateSpecialistTraceId } from '@/agents/base/types';
import type { SpecialistId } from '@/agents/base/types';
import { inferLevel } from '@/lib/constants/evolution';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { getDeepLearningSamples } from '@/memory/l4-profile';
import { contextAssembler } from '@/services/context-assembler/ContextAssembler';
import { detectEvolutionAnomalies } from '@/services/admin/evolution-health/anomaly-detection.service';
import { DingtalkService } from '@/services/admin/notifications/dingtalk.service';
import { BaseSpecialist } from '@/specialists/base/BaseSpecialist';
import { SchemaValidationError, LLMTimeoutError } from '@/specialists/base/errors';
import type {
  AssembledContext,
  ILLMGateway,
  InvokeLLMResult,
  SpecialistConfig,
  SpecialistRequest,
  SpecialistResponse,
} from '@/specialists/base/types';

// AC-8: type re-export for downstream consumers
export type { EvolutionInsightContent } from '@quanqn/schemas/specialist-io';
export { EvolutionInsightContentSchema };

// ── Input schema ─────────────────────────────────────────────────────────────

const evolutionAgentInput = z.object({
  accountId: z.number().int().positive(),
  triggerType: z.string(),
});

type EvolutionAgentInput = z.infer<typeof evolutionAgentInput>;
type EvolutionOutput = z.infer<typeof EvolutionInsightContentSchema>;

// ── SpecialistConfig ─────────────────────────────────────────────────────────

const EVOLUTION_CONFIG: SpecialistConfig = {
  agentId: 'EvolutionAgent',
  persona: {
    role: 'EvolutionAgent',
    goal: '把用户所有 feedback_log + DeepLearning samples 聚合成可注入 prompt 的偏好画像',
    boundaries: [
      '不编造金句 · 必须从用户实际反馈 / 样本 / 评论里提炼',
      '不放大单条负反馈 · 需看频次(≥2 条才入选)',
      '不超过 10 条 preferredCatchphrases / avoidList · 防 prompt 过长',
      'insights 必须可解释 · 每条必带 sourceFeedbackIds[] 反查',
    ],
  },
  memory: {
    l1_readonly: ['account', 'evolution_profile'],
    l2_read: ['feedback_log', 'deep_learning_archive', 'evolution_insight'],
    l2_write: ['evolution_insight'],
  },
  knowledge: {
    constants: [],
    rag: [],
    refresh_interval_sec: 86400,
  },
  tools: [],
  execution: {
    timeout_ms: 60_000,
    retry: 1,
    model_tier: 'reasoning',
    streaming: false,
  },
};

// ── EvolutionAgent ────────────────────────────────────────────────────────────

export class EvolutionAgent extends BaseSpecialist<EvolutionAgentInput, EvolutionOutput> {
  readonly config = EVOLUTION_CONFIG;
  readonly inputSchema = evolutionAgentInput;
  readonly outputSchema = EvolutionInsightContentSchema;

  constructor(gateway?: ILLMGateway) {
    super(gateway);
  }

  /**
   * AC-1/AC-3/AC-4/AC-5: 完整执行流 · 覆写 BaseSpecialist.execute()
   * 增加: 原子事务写入 + 累积式 insight 合并 + previousInsight fallback
   */
  override async execute(
    req: SpecialistRequest<EvolutionAgentInput>,
  ): Promise<SpecialistResponse<EvolutionOutput>> {
    const traceId =
      req.traceId ??
      generateSpecialistTraceId(req.accountId, this.config.agentId as SpecialistId);
    const startedAt = Date.now();

    // Step 1: 入参校验
    this.inputSchema.parse(req.userInput);

    // Step 2: ContextAssembler — 同时获取 previousInsight (L4 第 5 路)
    const ctx = (await contextAssembler.assemble({
      agentId: this.config.agentId as SpecialistId,
      accountId: req.accountId,
      mode: req.mode,
      userInput: req.userInput,
      needRag: this.config.knowledge.rag,
    })) as AssembledContext;

    // previousInsight 来自 ContextAssembler L4 层 (AC-2)
    const previousInsight: EvolutionOutput | null =
      (ctx as unknown as { evolutionInsight?: EvolutionOutput | null }).evolutionInsight ?? null;

    // Step 3: invokeLLM (含 recentFeedbacks + samples · 内部 retry 1 次)
    let raw: InvokeLLMResult;
    try {
      raw = await this.invokeLLM(ctx, { ...req, traceId });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // AC-5: timeout → 降级用 previousInsight
        if (previousInsight) {
          logger.warn({ accountId: req.accountId, traceId }, 'evolution.execute.timeout_fallback');
          return this._buildFallbackResponse(previousInsight, traceId, startedAt);
        }
        throw new LLMTimeoutError(this.config.agentId, this.config.execution.timeout_ms);
      }
      throw err;
    }

    // Step 4: schema 校验 + retry 1 次
    let parsed = this.outputSchema.safeParse(raw.content);
    if (!parsed.success) {
      logger.warn(
        { agentId: this.config.agentId, traceId, issues: parsed.error.message },
        'evolution.schema_validation.retry',
      );
      try {
        raw = await this.invokeLLM(ctx, { ...req, traceId });
      } catch (retryErr) {
        if (retryErr instanceof Error && retryErr.name === 'AbortError') {
          throw new LLMTimeoutError(this.config.agentId, this.config.execution.timeout_ms);
        }
        throw retryErr;
      }
      parsed = this.outputSchema.safeParse(raw.content);
      if (!parsed.success) {
        // AC-5: schema 二次失败 → previousInsight fallback
        if (previousInsight) {
          logger.warn({ accountId: req.accountId, traceId }, 'evolution.execute.schema_fallback');
          return this._buildFallbackResponse(previousInsight, traceId, startedAt);
        }
        throw new SchemaValidationError(parsed.error, raw.content);
      }
    }

    // Step 5: AC-4 累积式 insight 合并 (Rule 3)
    const mergedResult = this._mergeInsight(parsed.data, previousInsight);

    // Step 6: AC-3 原子事务 (profile.update + insight.create)
    await this._writeEvolutionTransaction({
      accountId: req.accountId,
      content: mergedResult,
      triggerType: req.userInput.triggerType,
      traceId,
      model: raw.model,
      tokensTotal: raw.tokens.total,
      durationMs: Date.now() - startedAt,
      previousLevel: null, // fetched inside transaction
    });

    // AC-4: 成功写 evolution_insight 后跑异常检测 · try/catch 防冒泡(不影响主流程)
    try {
      const anomalyFlags = await detectEvolutionAnomalies(req.accountId);
      if (anomalyFlags.length > 0) {
        const dingtalk = new DingtalkService();
        await dingtalk.send(
          `[EvolutionAgent] 飞轮异常 · accountId=${req.accountId} · ${anomalyFlags.length} 条 · types=${anomalyFlags.map((f) => f.anomalyType).join(',')}`,
        );
        logger.info(
          { accountId: req.accountId, traceId, flagCount: anomalyFlags.length },
          'evolution.anomaly_detection.flags_created',
        );
      }
    } catch (anomalyErr) {
      logger.error(
        { accountId: req.accountId, traceId, err: anomalyErr },
        'evolution.anomaly_detection.error',
      );
    }

    const durationMs = Date.now() - startedAt;
    return {
      result: mergedResult,
      isFallback: false,
      durationMs,
      tokensUsed: raw.tokens,
      modelUsed: raw.model,
      traceId,
    };
  }

  /**
   * AC-1/AC-2: invokeLLM — 调 LLMGateway.complete(reasoning)
   * 内部 fetch recentFeedbacks(N=count/5) + samples(DLA limit 10) + previousInsight(ctx)
   * AC-9: metadata.eventType='l5_agent' → gateway 自动写 cost_log
   */
  protected async invokeLLM(
    ctx: AssembledContext,
    req: SpecialistRequest<EvolutionAgentInput>,
  ): Promise<InvokeLLMResult> {
    const triggerCount = this._parseTriggerCount(req.userInput.triggerType);
    const feedbackN = Math.max(1, Math.floor(triggerCount / 5));

    // AC-2: recentFeedbacks + samples 并发 fetch
    const [recentFeedbacks, samples] = await Promise.all([
      prisma.feedbackLog.findMany({
        where: { accountId: req.accountId },
        orderBy: { createdAt: 'desc' },
        take: feedbackN,
        select: {
          id: true,
          rating: true,
          agentId: true,
          comment: true,
          createdAt: true,
        },
      }),
      getDeepLearningSamples(req.accountId, 10),
    ]);

    // AC-2: previousInsight 来自 ctx (L4 层已注入)
    const previousInsight: EvolutionOutput | null =
      (ctx as unknown as { evolutionInsight?: EvolutionOutput | null }).evolutionInsight ?? null;

    const userPrompt = this._buildEvolutionUserPrompt(
      req.userInput,
      recentFeedbacks,
      samples,
      previousInsight,
    );

    // AC-9: eventType='l5_agent' — gateway cost_log 写第 4 类
    const result = await this.llmGateway.complete({
      model_tier: this.config.execution.model_tier,
      systemPrompt: ctx.systemPrompt,
      userPrompt,
      responseFormat: { type: 'json_schema', schema: this.outputSchema },
      metadata: {
        trace_id: req.traceId ?? '',
        agentId: this.config.agentId,
        accountId: req.accountId,
        userId: 0, // worker 上下文 · Upstash 未配置时 rate-limit no-op (local dev)
        eventType: 'l5_agent', // AC-9: D-040 扩展第 4 类
      },
      timeout_ms: this.config.execution.timeout_ms,
    });

    return {
      content: result.content,
      tokens: result.tokens,
      model: result.model,
    };
  }

  // ── 私有辅助 ─────────────────────────────────────────────────────────────────

  /** AC-4 Rule 3: 累积式 insight 合并 · preferredCatchphrases ∪ prev 去重 top 10 */
  private _mergeInsight(
    fresh: EvolutionOutput,
    prev: EvolutionOutput | null,
  ): EvolutionOutput {
    if (!prev) return fresh;

    // new = (fresh ∪ prev) 去重 top 10 (fresh 优先占位)
    const mergedPreferred = [
      ...fresh.insights.preferredCatchphrases,
      ...prev.insights.preferredCatchphrases,
    ]
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .slice(0, 10);

    const mergedAvoid = [
      ...fresh.insights.avoidList,
      ...prev.insights.avoidList,
    ]
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .slice(0, 10);

    return {
      direction: fresh.direction,
      insights: {
        ...fresh.insights,
        preferredCatchphrases: mergedPreferred,
        avoidList: mergedAvoid,
      },
    };
  }

  /** AC-3: 原子事务 — profile.update + insight.create */
  private async _writeEvolutionTransaction(params: {
    accountId: number;
    content: EvolutionOutput;
    triggerType: string;
    traceId: string;
    model: string;
    tokensTotal: number;
    durationMs: number;
    previousLevel: string | null;
  }): Promise<void> {
    const { accountId, content, triggerType, traceId, model, tokensTotal, durationMs } = params;

    // 读当前 profile (获取 level + satisfactionRate · 用于 levelBefore)
    const profile = await prisma.evolutionProfile.findUnique({
      where: { accountId },
      select: {
        level: true,
        feedbackCountGood: true,
        feedbackCountBad: true,
        feedbackCountTotal: true,
      },
    });

    const levelBefore = profile?.level ?? 'L1';
    const total = profile?.feedbackCountTotal ?? 0;
    const levelAfter = inferLevel(total);

    // satisfactionRate = good / (good + bad)
    const good = profile?.feedbackCountGood ?? 0;
    const bad = profile?.feedbackCountBad ?? 0;
    const satisfactionRate = good + bad > 0 ? good / (good + bad) : null;

    // AC-3: grep '$transaction' 命中 1+
    await prisma.$transaction([
      prisma.evolutionProfile.update({
        where: { accountId },
        data: {
          level: levelAfter,
          satisfactionRate,
          latestInsight: content as unknown as Parameters<typeof prisma.evolutionProfile.update>[0]['data']['latestInsight'],
          lastEvolvedAt: new Date(),
        },
      }),
      prisma.evolutionInsight.create({
        data: {
          accountId,
          triggerType,
          direction: content.direction,
          content: content as unknown as Parameters<typeof prisma.evolutionInsight.create>[0]['data']['content'],
          agentId: 'EvolutionAgent',
          modelUsed: model,
          tokensUsed: tokensTotal,
          durationMs,
          isFallback: false,
          levelBefore,
          levelAfter,
          traceId,
        },
      }),
    ]);

    logger.info(
      { accountId, levelBefore, levelAfter, traceId },
      'evolution.transaction.committed',
    );
  }

  /** AC-5: fallback 响应构建 · 用 previousInsight · 不写 insight */
  private _buildFallbackResponse(
    previousInsight: EvolutionOutput,
    traceId: string,
    startedAt: number,
  ): SpecialistResponse<EvolutionOutput> {
    return {
      result: previousInsight,
      isFallback: true,
      durationMs: Date.now() - startedAt,
      tokensUsed: { prompt: 0, completion: 0, total: 0 },
      modelUsed: 'fallback',
      traceId,
    };
  }

  /** triggerType → count 解析 (e.g. 'threshold:20' → 20) */
  private _parseTriggerCount(triggerType: string): number {
    const n = parseInt(triggerType.split(':')[1] ?? '5', 10);
    return isNaN(n) ? 5 : n;
  }

  /** Evolution 用户 prompt 构建 (AC-2) */
  private _buildEvolutionUserPrompt(
    input: EvolutionAgentInput,
    recentFeedbacks: Array<{
      id: number;
      rating: string;
      agentId: string;
      comment: string | null;
      createdAt: Date;
    }>,
    samples: Array<{ id: number; sample: string; summary: string | null; tags: string[] }>,
    previousInsight: EvolutionOutput | null,
  ): string {
    const parts: string[] = [
      `<trigger>触发类型: ${input.triggerType} · accountId: ${input.accountId}</trigger>`,
    ];

    if (recentFeedbacks.length > 0) {
      const fbLines = recentFeedbacks
        .map(
          (f) =>
            `- [${f.rating}] ${f.agentId} · ${f.comment ?? '(无评论)'} · id=${f.id}`,
        )
        .join('\n');
      parts.push(`<recent_feedbacks>\n${fbLines}\n</recent_feedbacks>`);
    } else {
      parts.push('<recent_feedbacks>[暂无反馈记录]</recent_feedbacks>');
    }

    if (samples.length > 0) {
      const sampleLines = samples
        .map((s) => `- id=${s.id} tags=[${s.tags.join(',')}] ${s.summary ?? s.sample.slice(0, 80)}`)
        .join('\n');
      parts.push(`<deep_learning_samples>\n${sampleLines}\n</deep_learning_samples>`);
    } else {
      parts.push('<deep_learning_samples>[暂无深度学习样本]</deep_learning_samples>');
    }

    if (previousInsight) {
      parts.push(
        `<previous_insight direction="${previousInsight.direction}">` +
          `\npreferredCatchphrases: [${previousInsight.insights.preferredCatchphrases.join(' / ')}]` +
          `\navoidList: [${previousInsight.insights.avoidList.join(' / ')}]` +
          `\nstyleTone: ${previousInsight.insights.styleTone}` +
          `\n</previous_insight>`,
      );
    } else {
      parts.push('<previous_insight>[新用户 · 无历史 insight · 请从零生成]</previous_insight>');
    }

    return parts.join('\n\n');
  }
}

export const evolutionAgent = new EvolutionAgent();
