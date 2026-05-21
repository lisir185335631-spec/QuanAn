/**
 * QuanAn · PRD-4 US-006 + PRD-27 US-001
 * MonetizationAgent — step4b(变现路径 · 单 mode · 8KB) + monetization-tool(工具 page · D-259)
 *
 * AC-1(PRD-4): 五层配置完整 · model_tier='reasoning' timeout_ms=45000
 * AC-2(PRD-4): outputSchema — { currentAnalysis, ladder[3], revenueStructure, successCases[2] }
 * AC-5(PRD-4): currentRevenue 字段可选 · 缺失时 prompt 注入 '用户未填当前营收 · 按零基础推断'
 * AC-6(PRD-4): cold start(无 step1/step3) → prompt 注入 '[首次接触变现 · 暂无 IP 定位上下文]'
 * AC-2(PRD-27): monetization-tool mode · spec §8.2.1 4 字段 → 3 字段 schema · model_tier='balanced' 30s
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

// ── step4b output schema ───────────────────────────────────────────────────────

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

// ── monetization-tool output schema (PRD-27 US-001 · spec §8.2.1) ─────────────

export const MonetizationToolOutputSchema = z.object({
  productMatrix: z.array(z.string()),
  pricingStrategy: z.string(),
  conversionFunnel: z.array(z.string()),
});

const MonetizationToolBaseSchema = z.object({
  productMatrix: z.array(z.string()),
  pricingStrategy: z.string(),
  conversionFunnel: z.array(z.string()),
});

export type MonetizationToolOutput = z.infer<typeof MonetizationToolOutputSchema>;

// ── input schemas ──────────────────────────────────────────────────────────────

// step4b input (AC-5: currentRevenue optional)
const MonetizationInputSchema = z
  .object({
    currentRevenue: z.string().optional(),
  })
  .passthrough();

type MonetizationInput = z.infer<typeof MonetizationInputSchema>;

// ── 五层配置 ─────────────────────────────────────────────────────────────────

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

export class MonetizationAgent extends BaseSpecialist<MonetizationInput, Step4bOutput | MonetizationToolOutput> {
  readonly config: SpecialistConfig = MONETIZATION_CONFIG;

  // TD-014 pattern: _mode set in invokeLLM · P3 single-user serial calls safe
  private _mode: 'default' | 'monetization-tool' = 'default';

  get inputSchema(): z.ZodType<MonetizationInput> {
    return MonetizationInputSchema;
  }

  get outputSchema(): z.ZodType<Step4bOutput | MonetizationToolOutput> {
    if (this._mode === 'monetization-tool') {
      return MonetizationToolOutputSchema as z.ZodType<Step4bOutput | MonetizationToolOutput>;
    }
    return Step4bOutputSchema as z.ZodType<Step4bOutput | MonetizationToolOutput>;
  }

  // US-015 AC-2: fallback template per mode
  static override readonly fallbackTemplate: Record<string, unknown> = {
    default: {
      currentAnalysis:
        '系统繁忙，暂时无法完成当前变现阶段分析。建议稍后重试以获取针对您 IP 定位的精准变现路径规划。',
      ladder: [
        {
          stage: '阶段一：信任建立期',
          revenue: '0-3k 元/月',
          action: '持续输出高质量内容，积累基础粉丝群体，建立行业权威形象',
        },
        {
          stage: '阶段二：初步变现期',
          revenue: '3k-2w 元/月',
          action: '推出知识付费产品（课程/专栏），开启品牌合作，尝试直播带货',
        },
        {
          stage: '阶段三：规模化变现期',
          revenue: '2w+ 元/月',
          action: '建立私域社群，拓展高客单价服务，发展代理分销体系',
        },
      ],
      revenueStructure: {
        primary: '知识付费（课程、咨询、社群会员）',
        secondary: ['品牌合作与软广收入', '直播带货佣金'],
      },
      successCases: [
        {
          title: '内容创作者变现案例',
          summary:
            '从 0 粉丝起步，通过持续输出垂直领域干货，6 个月积累 5 万粉丝，知识付费月收入突破 3 万元。',
        },
        {
          title: '行业专家 IP 商业化',
          summary:
            '深耕细分赛道，建立专业权威形象，以高客单价咨询服务为主要收入，年营收超过 100 万元。',
        },
      ],
    } satisfies Step4bOutput,
    'monetization-tool': {
      productMatrix: [
        '知识付费课程（系统化体系课 · 199-599 元）',
        '私域社群会员（高价值社区 · 999-2999 元/年）',
        '1 对 1 咨询服务（高客单价 · 3000-9800 元/次）',
      ],
      pricingStrategy:
        '采用价格锚点策略：入门课 99 元引流 → 进阶课 599 元主销 → VIP 社群 2999 元/年高客单，阶梯递进提升客单价。系统暂时繁忙，以上为通用备用方案，请稍后重试获取个性化定价建议。',
      conversionFunnel: [
        '免费内容 · 公域引流建立认知',
        '低价产品 · 筛选意向用户进私域',
        '高价产品 · 服务精准付费客户',
        '售后跟进 · 促进复购与转介绍',
      ],
    } satisfies MonetizationToolOutput,
  };

  constructor(gateway?: ILLMGateway) {
    super(gateway);
  }

  protected async invokeLLM(
    ctx: AssembledContext,
    req: SpecialistRequest<MonetizationInput>,
  ): Promise<InvokeLLMResult> {
    this._mode = req.mode === 'monetization-tool' ? 'monetization-tool' : 'default';

    if (this._mode === 'monetization-tool') {
      return this._invokeLLMToolMode(req);
    }

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
        userId: 0,
      },
      timeout_ms: this.config.execution.timeout_ms,
      retry: this.config.execution.retry,
    });
  }

  private _invokeLLMToolMode(req: SpecialistRequest<MonetizationInput>): Promise<InvokeLLMResult> {
    const input = req.userInput as Record<string, unknown>;
    const systemPrompt = this._buildToolSystemPrompt();
    const userPrompt = this._buildToolUserPrompt(input);

    return this.llmGateway.complete({
      model_tier: 'balanced',
      systemPrompt,
      userPrompt,
      responseFormat: { type: 'json_schema' as const, schema: MonetizationToolBaseSchema },
      metadata: {
        trace_id: req.traceId ?? '',
        agentId: this.config.agentId,
        accountId: req.accountId,
        userId: 0,
      },
      timeout_ms: 30_000,
      retry: 1,
    });
  }

  private _buildToolSystemPrompt(): string {
    return [
      '你是专业的商业变现顾问，擅长为 IP 博主和内容创作者设计变现模型。',
      '',
      '根据用户提供的行业背景(industry)、产品描述(productDescription)、目标受众(audience)和 IP 定位(ipPositioning)，',
      '输出一套完整的变现方案，包含：',
      '- productMatrix: 产品矩阵（3-5 个具体产品/服务，每条 20-60 字）',
      '- pricingStrategy: 定价策略（100-200 字，说明价格带、锚点策略、阶梯定价逻辑）',
      '- conversionFunnel: 转化漏斗（3-5 个步骤，每步 15-40 字）',
      '',
      '请以 JSON 格式返回，严格遵循以下 schema：',
      '{"productMatrix": ["产品1", "产品2", ...], "pricingStrategy": "定价策略说明...", "conversionFunnel": ["步骤1", "步骤2", ...]}',
    ].join('\n');
  }

  private _buildToolUserPrompt(input: Record<string, unknown>): string {
    const industry = String(input.industryContext ?? input.industry ?? '未指定行业');
    const productDescription = String(input.productDescription ?? '未填写产品描述');
    const audience = String(input.audienceProfile ?? input.audience ?? '未指定受众');
    const ipPositioning = String(input.ipPositioning ?? '未指定 IP 定位');

    return [
      '请根据以下信息设计变现模型：',
      `行业(industry): ${industry}`,
      `产品描述(productDescription): ${productDescription}`,
      `目标受众(audience): ${audience}`,
      `IP 定位(ipPositioning): ${ipPositioning}`,
      '',
      '请以 JSON 格式返回变现方案 {productMatrix, pricingStrategy, conversionFunnel}',
    ].join('\n');
  }

  private _buildUserPrompt(userInput: MonetizationInput, ctx: AssembledContext): string {
    const inputStr = JSON.stringify(userInput);

    const revenueNote =
      !userInput.currentRevenue
        ? '注意: 用户未填当前营收 · 按零基础推断变现起点'
        : `当前营收: ${userInput.currentRevenue}`;

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

// REJ-004: 单例 export
export const monetizationAgent = new MonetizationAgent();
