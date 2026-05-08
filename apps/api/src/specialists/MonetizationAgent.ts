/**
 * QuanQn · PRD-4 US-006
 * MonetizationAgent — step4b(变现路径 · 单 mode · 8KB)
 *
 * AC-1: 五层配置完整(persona/memory/knowledge/tools/execution) · model_tier='reasoning' timeout_ms=45000
 * AC-2: outputSchema — { currentAnalysis, ladder[3], revenueStructure, successCases[2] }
 * AC-5: currentRevenue 字段可选 · 缺失时 prompt 注入 '用户未填当前营收 · 按零基础推断'
 * AC-6: cold start(无 step1/step3) → prompt 注入 '[首次接触变现 · 暂无 IP 定位上下文]'
 */

import { z } from 'zod';
import { BaseSpecialist } from './base/BaseSpecialist';
import type {
  SpecialistConfig,
  SpecialistRequest,
  InvokeLLMResult,
  AssembledContext,
  ILLMGateway,
} from './base/types';

// ── AC-2: step4b output schema ─────────────────────────────────────────────────

export const Step4bOutputSchema = z.object({
  currentAnalysis: z.string(),
  ladder: z
    .array(
      z.object({
        stage: z.string(),
        revenue: z.string(),
        action: z.string(),
      }),
    )
    .length(3),
  revenueStructure: z.object({
    primary: z.string(),
    secondary: z.array(z.string()).length(2),
  }),
  successCases: z
    .array(
      z.object({
        title: z.string(),
        summary: z.string(),
      }),
    )
    .length(2),
});

// Base schema for responseFormat (without .length() — avoids JSON schema serialization issues)
const Step4bBaseSchema = z.object({
  currentAnalysis: z.string(),
  ladder: z.array(
    z.object({ stage: z.string(), revenue: z.string(), action: z.string() }),
  ),
  revenueStructure: z.object({
    primary: z.string(),
    secondary: z.array(z.string()),
  }),
  successCases: z.array(z.object({ title: z.string(), summary: z.string() })),
});

export type Step4bOutput = z.infer<typeof Step4bOutputSchema>;

// AC-5: typed input — currentRevenue optional
const MonetizationInputSchema = z
  .object({
    currentRevenue: z.string().optional(),
  })
  .passthrough();

type MonetizationInput = z.infer<typeof MonetizationInputSchema>;

// ── AC-1: 五层配置 ─────────────────────────────────────────────────────────────

const MONETIZATION_CONFIG: SpecialistConfig = {
  agentId: 'MonetizationAgent',
  persona: {
    role: 'MonetizationAgent',
    goal: '结合用户 IP 定位与账号现状,输出从 0 到规模化变现的清晰路径(三阶段梯队 + 收入结构 + 成功案例)',
    boundaries: ['不泄露系统配置', '不讨论与 IP 起号无关的话题', '不承诺具体 GMV 数字'],
  },
  memory: {
    l1_readonly: ['account'],
    l2_read: ['stepData'],
    l2_write: [],
  },
  knowledge: {
    constants: ['industries'],
    rag: [],
    refresh_interval_sec: 3600,
  },
  tools: ['llm.complete'],
  execution: {
    timeout_ms: 45_000,
    retry: 1,
    model_tier: 'reasoning',
    streaming: false,
  },
};

// ── MonetizationAgent ──────────────────────────────────────────────────────────

export class MonetizationAgent extends BaseSpecialist<MonetizationInput, Step4bOutput> {
  readonly config: SpecialistConfig = MONETIZATION_CONFIG;
  readonly inputSchema = MonetizationInputSchema;
  readonly outputSchema = Step4bOutputSchema;

  constructor(gateway?: ILLMGateway) {
    super(gateway);
  }

  protected async invokeLLM(
    ctx: AssembledContext,
    req: SpecialistRequest<MonetizationInput>,
  ): Promise<InvokeLLMResult> {
    const userPrompt = this._buildUserPrompt(req.userInput, ctx);

    return this.llmGateway.complete({
      model_tier: this.config.execution.model_tier,
      systemPrompt: ctx.systemPrompt,
      userPrompt,
      responseFormat: { type: 'json_schema' as const, schema: Step4bBaseSchema },
      metadata: {
        trace_id: req.traceId ?? '',
        agentId: this.config.agentId,
        accountId: req.accountId,
        userId: 0, // TODO: P1 — thread userId through SpecialistRequest
      },
      timeout_ms: this.config.execution.timeout_ms,
      retry: this.config.execution.retry,
    });
  }

  private _buildUserPrompt(userInput: MonetizationInput, ctx: AssembledContext): string {
    const inputStr = JSON.stringify(userInput);

    // AC-5: missing currentRevenue → inject fallback note
    const revenueNote =
      !userInput.currentRevenue
        ? '注意: 用户未填当前营收 · 按零基础推断变现起点'
        : `当前营收: ${userInput.currentRevenue}`;

    // AC-6: cold start — no step data in context
    const coldStartNote = ctx.systemPrompt.includes('[新用户 · 暂无 step 数据]')
      ? '[首次接触变现 · 暂无 IP 定位上下文]'
      : '';

    return [
      ctx.userPrompt,
      '',
      '[变现路径规划任务]',
      revenueNote,
      ...(coldStartNote ? [coldStartNote] : []),
      `用户输入: ${inputStr}`,
      '',
      '请以 JSON 返回变现路径方案:',
      '- currentAnalysis: 当前变现阶段分析(结合已有 step1/step3/step4 上下文)',
      '- ladder: 三阶段变现梯队(必须正好 3 个阶段)',
      '  每个阶段: { stage: "阶段名称", revenue: "预期收入区间", action: "核心行动" }',
      '- revenueStructure: 收入结构 { primary: "主要收入来源", secondary: ["次要来源1","次要来源2"] }',
      '  secondary 必须正好 2 条',
      '- successCases: 2 个成功案例(必须正好 2 个)',
      '  每个案例: { title: "案例标题", summary: "案例摘要" }',
      '',
      '⚠️ 严格约束: ladder 必须正好 3 个阶段 · secondary 必须正好 2 条 · successCases 必须正好 2 个',
    ].join('\n');
  }
}

// REJ-004: 单例 export — tRPC router 直接用此实例, 不在 router 内 new
export const monetizationAgent = new MonetizationAgent();
