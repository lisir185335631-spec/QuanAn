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

import { piiMask } from '@/lib/compliance/pii-mask';
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

// ── monetization-plan output schema (Step4b rich advisory output) ──────────────

const MonetizationPlanProductItemSchema = z.object({
  category: z.enum(['引流品', '信任品', '利润品', '后端产品']),
  name: z.string(),
  priceRange: z.string(),
  targetCustomer: z.string(),
  monthlyTarget: z.string(),
  monthlyRevenue: z.string(),
});

const MonetizationPlanStageSchema = z.object({
  number: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  icon: z.enum(['trending', 'diamond', 'crown']),
  range: z.string(),
  title: z.string(),
  duration: z.string(),
  coreStrategy: z.string(),
  productMatrix: z.array(MonetizationPlanProductItemSchema),
  trafficStrategy: z.string().optional(),
  conversionFlow: z.array(z.string()).optional(),
  teamBuilding: z.string().optional(),
  systemBuilding: z.string().optional(),
  brandStrategy: z.string().optional(),
  matrixLayout: z.string().optional(),
  keyActions: z.array(z.string()),
  risks: z.array(z.string()),
});

export const MonetizationPlanOutputSchema = z.object({
  marketAnalysis: z.object({
    industryAnalysis: z.string().min(1),
    marketScale: z.string().min(1),
    competition: z.string().min(1),
    monetizationPotential: z.string().min(1),
  }),
  stages: z.array(MonetizationPlanStageSchema).length(3),
  revenueStructure: z.array(
    z.object({
      name: z.string(),
      percentage: z.string(),
      desc: z.string(),
      highlight: z.boolean().optional(),
    }),
  ).min(1).max(6),
  successCases: z.array(
    z.object({
      title: z.string(),
      category: z.string(),
      journey: z.string(),
      outcome: z.string(),
      insight: z.string(),
    }),
  ).min(1).max(5),
});

// Base schema (no length constraints, for responseFormat)
const MonetizationPlanBaseSchema = z.object({
  marketAnalysis: z.object({
    industryAnalysis: z.string(),
    marketScale: z.string(),
    competition: z.string(),
    monetizationPotential: z.string(),
  }),
  stages: z.array(
    z.object({
      number: z.number(),
      icon: z.string(),
      range: z.string(),
      title: z.string(),
      duration: z.string(),
      coreStrategy: z.string(),
      productMatrix: z.array(z.object({
        category: z.string(),
        name: z.string(),
        priceRange: z.string(),
        targetCustomer: z.string(),
        monthlyTarget: z.string(),
        monthlyRevenue: z.string(),
      })),
      trafficStrategy: z.string().optional(),
      conversionFlow: z.array(z.string()).optional(),
      teamBuilding: z.string().optional(),
      systemBuilding: z.string().optional(),
      brandStrategy: z.string().optional(),
      matrixLayout: z.string().optional(),
      keyActions: z.array(z.string()),
      risks: z.array(z.string()),
    }),
  ),
  revenueStructure: z.array(z.object({
    name: z.string(),
    percentage: z.string(),
    desc: z.string(),
    highlight: z.boolean().optional(),
  })),
  successCases: z.array(z.object({
    title: z.string(),
    category: z.string(),
    journey: z.string(),
    outcome: z.string(),
    insight: z.string(),
  })),
});

export type MonetizationPlanOutput = z.infer<typeof MonetizationPlanOutputSchema>;

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

export class MonetizationAgent extends BaseSpecialist<MonetizationInput, Step4bOutput | MonetizationToolOutput | MonetizationPlanOutput> {
  readonly config: SpecialistConfig = MONETIZATION_CONFIG;

  // TD-014 pattern: _mode set in invokeLLM · P3 single-user serial calls safe
  private _mode: 'default' | 'monetization-tool' | 'monetization-plan' = 'default';

  get inputSchema(): z.ZodType<MonetizationInput> {
    return MonetizationInputSchema;
  }

  get outputSchema(): z.ZodType<Step4bOutput | MonetizationToolOutput | MonetizationPlanOutput> {
    if (this._mode === 'monetization-tool') {
      return MonetizationToolOutputSchema as z.ZodType<Step4bOutput | MonetizationToolOutput | MonetizationPlanOutput>;
    }
    if (this._mode === 'monetization-plan') {
      return MonetizationPlanOutputSchema as z.ZodType<Step4bOutput | MonetizationToolOutput | MonetizationPlanOutput>;
    }
    return Step4bOutputSchema as z.ZodType<Step4bOutput | MonetizationToolOutput | MonetizationPlanOutput>;
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
    'monetization-plan': {
      marketAnalysis: {
        industryAnalysis: '（系统繁忙，以下为通用建议参考）内容创业与知识经济赛道',
        marketScale: '【建议参考】知识付费与内容变现市场处于高速增长阶段，个人IP商业化空间巨大，建议结合自身垂直领域评估实际规模。',
        competition: '【建议参考】市场竞争激烈，但具备差异化定位的垂直IP仍有蓝海空间，核心壁垒在于专业深度与受众信任度。',
        monetizationPotential: '【建议参考】个人IP变现潜力取决于垂直度、受众规模与产品矩阵完整度，从知识付费起步可快速验证商业模式。',
      },
      stages: [
        {
          number: 1 as const,
          icon: 'trending' as const,
          range: '0→建议目标 ¥5-30万',
          title: '起步阶段：建立信任与验证商业模式（建议参考）',
          duration: '建议 6-12 个月',
          coreStrategy: '【建议】聚焦一个垂直领域，持续输出高质量内容建立权威，用低客单价产品验证付费意愿，积累私域种子用户。',
          productMatrix: [
            {
              category: '引流品' as const,
              name: '免费干货内容／低价电子资料',
              priceRange: '0-99元（建议）',
              targetCustomer: '对该垂直领域感兴趣的潜在用户',
              monthlyTarget: '建议目标 100-500人',
              monthlyRevenue: '建议目标 ¥0-5000',
            },
            {
              category: '信任品' as const,
              name: '初级付费课程／训练营',
              priceRange: '299-999元（建议）',
              targetCustomer: '有明确学习需求的目标用户',
              monthlyTarget: '建议目标 10-50人',
              monthlyRevenue: '建议目标 ¥3000-5万',
            },
          ],
          keyActions: [
            '确定垂直赛道，每周稳定输出内容',
            '建立私域（社群/个人号）积累种子用户',
            '推出第一个付费产品，收集真实用户反馈',
          ],
          risks: [
            '初期流量积累缓慢，需保持耐心',
            '商业化过早可能影响内容质量与受众信任',
          ],
        },
        {
          number: 2 as const,
          icon: 'diamond' as const,
          range: '建议目标 ¥30-200万',
          title: '发展阶段：产品升级与规模扩张（建议参考）',
          duration: '建议 12-24 个月',
          coreStrategy: '【建议】在验证商业模式基础上，升级产品矩阵，引入利润品，尝试团队协作，实现关键环节标准化。',
          productMatrix: [
            {
              category: '利润品' as const,
              name: '进阶课程／私教服务',
              priceRange: '1980-9800元（建议）',
              targetCustomer: '有深度学习需求的付费用户',
              monthlyTarget: '建议目标 5-20人',
              monthlyRevenue: '建议目标 ¥1-20万',
            },
          ],
          keyActions: [
            '升级核心产品，提升客单价',
            '搭建标准化交付流程',
            '探索内容投流，扩大流量池',
          ],
          risks: [
            '产品升级需同步提升交付质量',
            '团队扩张带来管理成本',
          ],
        },
        {
          number: 3 as const,
          icon: 'crown' as const,
          range: '建议目标 ¥200万+',
          title: '规模化阶段：品牌化与生态构建（建议参考）',
          duration: '建议 24-48 个月',
          coreStrategy: '【建议】将个人IP升级为品牌，构建产品生态，通过高端定制服务与平台化实现收入天花板突破。',
          productMatrix: [
            {
              category: '后端产品' as const,
              name: '企业定制服务／高端咨询',
              priceRange: '5-50万元/项（建议）',
              targetCustomer: '企业客户与高净值个人',
              monthlyTarget: '建议目标 0.5-2单',
              monthlyRevenue: '建议目标 ¥5-100万',
            },
          ],
          keyActions: [
            '打造品牌，拓展B端市场',
            '构建分销或合伙人体系',
            '探索SaaS或平台化变现',
          ],
          risks: [
            '品牌化需要更大资源投入',
            'B端业务周期长，需储备现金流',
          ],
        },
      ],
      revenueStructure: [
        {
          name: '知识付费（课程/训练营）',
          percentage: '45%',
          desc: '【建议配比】可规模化的核心收入来源，边际成本低，建议作为主要变现方式。',
          highlight: true,
        },
        {
          name: '高端定制服务',
          percentage: '35%',
          desc: '【建议配比】客单价高，利润丰厚，随品牌影响力提升可逐步增加比例。',
        },
        {
          name: '品牌合作与其他',
          percentage: '20%',
          desc: '【建议配比】辅助收入，待粉丝基础建立后自然增长。',
        },
      ],
      successCases: [
        {
          title: '【示例】垂直内容IP成长路径',
          category: '示意性原型',
          journey: '典型成长路径（示例）：从垂直领域干货内容起步 → 积累1000核心粉丝 → 推出299元入门课验证付费 → 升级1980元系统课 → 建立私域社群复购体系。',
          outcome: '【示例参考】典型结果区间：6-18个月从0到月入1-10万，具体因赛道、执行力差异较大。',
          insight: '【核心启示】垂直度越高、内容越专业、受众越精准，变现转化率越高。先做深，再做宽。',
        },
        {
          title: '【示例】技能服务型IP路径',
          category: '示意性原型',
          journey: '典型成长路径（示例）：展示专业技能案例 → 接受低价订单积累口碑 → 涨价筛选优质客户 → 包装成标准化课程 → 建立被动收入体系。',
          outcome: '【示例参考】技能变现启动快，但规模化依赖产品化程度，建议尽早从"时间换钱"转向"内容换钱"。',
          insight: '【核心启示】服务变产品是规模化的关键一步，越早标准化，越早突破时间瓶颈。',
        },
      ],
    } satisfies MonetizationPlanOutput,
  };

  constructor(gateway?: ILLMGateway) {
    super(gateway);
  }

  protected async invokeLLM(
    ctx: AssembledContext,
    req: SpecialistRequest<MonetizationInput>,
  ): Promise<InvokeLLMResult> {
    this._mode = req.mode === 'monetization-tool' ? 'monetization-tool'
      : req.mode === 'monetization-plan' ? 'monetization-plan'
      : 'default';

    if (this._mode === 'monetization-tool') {
      return this._invokeLLMToolMode(ctx, req);
    }

    if (this._mode === 'monetization-plan') {
      return this._invokeLLMPlanMode(ctx, req);
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
        userId: req.userId,
      },
      timeout_ms: this.config.execution.timeout_ms,
      retry: this.config.execution.retry,
    });
  }

  private _invokeLLMToolMode(ctx: AssembledContext, req: SpecialistRequest<MonetizationInput>): Promise<InvokeLLMResult> {
    const input = req.userInput as Record<string, unknown>;
    // R-11/LD-007: tool 模式专属 persona 保留为前缀 · 但拼接 ContextAssembler 的 ctx.systemPrompt(进化档案/step/画像)· 不再纯自拼
    const systemPrompt = `${this._buildToolSystemPrompt()}\n\n${ctx.systemPrompt}`;
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
        userId: req.userId,
      },
      timeout_ms: 30_000,
      retry: 1,
    });
  }

  private _invokeLLMPlanMode(ctx: AssembledContext, req: SpecialistRequest<MonetizationInput>): Promise<InvokeLLMResult> {
    const input = req.userInput as Record<string, unknown>;
    const planPersona = [
      '你是专业的变现路径顾问，为内容创作者和 IP 博主提供系统性的变现规划建议。',
      '',
      '重要原则：',
      '- 你提供的是「建议性」内容，不是对未来营收的承诺或保证',
      '- marketAnalysis 提供真实的行业定性分析（可有意义生成，不伪造统计数据）',
      '- stages 中的 priceRange/monthlyTarget/monthlyRevenue 均为「建议目标区间」，措辞用「建议目标 ¥X-Y」',
      '- revenueStructure 的比例是「推荐配比」，desc 需说明这是建议',
      '- successCases 必须是「示意性原型路径」——通用典型路径，格式：「典型成长路径（示例）：...」',
      '  禁止编造具体真实姓名、真实公司名、虚构精确数字的假案例',
      '  每个 successCases 的 title 必须包含「【示例】」前缀，outcome 包含「【示例参考】」，insight 包含「【核心启示】」',
    ].join('\n');

    const userPrompt = this._buildPlanUserPrompt(input, ctx);

    return this.llmGateway.complete({
      model_tier: 'balanced',
      systemPrompt: `${planPersona}\n\n${ctx.systemPrompt}`,
      userPrompt,
      responseFormat: { type: 'json_schema' as const, schema: MonetizationPlanBaseSchema },
      metadata: {
        trace_id: req.traceId ?? '',
        agentId: this.config.agentId,
        accountId: req.accountId,
        userId: req.userId,
      },
      timeout_ms: 45_000,
      retry: 1,
    });
  }

  private _buildPlanUserPrompt(input: Record<string, unknown>, ctx: AssembledContext): string {
    // R-14 fix: 自由文本字段(非枚举/数值)调 piiMask 脱敏后再拼 prompt
    const productService = piiMask(String(input.productService ?? input.productDescription ?? '未填写产品/服务描述'));
    const targetAudience = piiMask(String(input.targetAudience ?? input.audienceProfile ?? '未指定目标受众'));
    const ipPositioning = piiMask(String(input.ipPositioning ?? '未指定 IP 定位'));
    const currentIncome = String(input.currentIncome ?? input.currentRevenue ?? '未填写'); // 数值字段不 mask
    const industry = String(input.industry ?? '内容创业'); // 枚举字段不 mask

    return [
      ctx.userPrompt,
      '',
      '[变现路径规划任务 · 富结构输出]',
      `行业: ${industry}`,
      `产品/服务描述: ${productService}`,
      `目标受众: ${targetAudience}`,
      `IP定位: ${ipPositioning}`,
      `当前收入水平: ${currentIncome}`,
      '',
      '请输出完整的变现路径规划 JSON，严格遵循以下要求：',
      '',
      '1. marketAnalysis:',
      '   - industryAnalysis: 行业背景定性分析（50-100字）',
      '   - marketScale: 市场规模与增长趋势判断（50-150字，可有意义生成，不伪造精确统计数字）',
      '   - competition: 竞争格局分析（50-100字）',
      '   - monetizationPotential: 该定位的变现潜力评估（50-100字）',
      '',
      '2. stages: 必须正好 3 个阶段，number 分别为 1/2/3，icon 分别为 trending/diamond/crown',
      '   每个阶段包含:',
      '   - range: 收入目标区间，格式「建议目标 ¥X-Y万」',
      '   - title: 阶段标题（包含「建议参考」提示）',
      '   - duration: 建议时间范围',
      '   - coreStrategy: 核心策略（开头加「【建议】」）',
      '   - productMatrix: 2-3个产品/服务，priceRange/monthlyTarget/monthlyRevenue 均加「建议」前缀',
      '     category 只能是: 引流品/信任品/利润品/后端产品',
      '   - keyActions: 3-5个关键行动',
      '   - risks: 2-3个风险提示',
      '   - 阶段1可选: trafficStrategy(流量策略), conversionFlow(转化流程 string[])',
      '   - 阶段2可选: teamBuilding(团队建设), systemBuilding(体系化建设)',
      '   - 阶段3可选: brandStrategy(品牌化策略), matrixLayout(矩阵化布局)',
      '',
      '3. revenueStructure: 2-4个收入结构项',
      '   - percentage: 推荐配比百分比（如「45%」）',
      '   - desc: 必须包含「【建议配比】」说明',
      '   - 第一项设 highlight: true',
      '',
      '4. successCases: 必须正好 2 个，每个必须是通用示意性原型路径：',
      '   - title: 包含「【示例】」前缀',
      '   - category: 「示意性原型」',
      '   - journey: 格式「典型成长路径（示例）：...」',
      '   - outcome: 包含「【示例参考】」前缀',
      '   - insight: 包含「【核心启示】」前缀',
      '   禁止：编造具体真实人名、真实公司、虚构精确营收数字',
      '',
      '⚠️ 严格约束: stages 必须正好 3 个 · successCases 必须正好 2 个',
    ].join('\n');
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
    // R-14 fix: 自由文本字段脱敏
    const industry = String(input.industryContext ?? input.industry ?? '未指定行业'); // 枚举字段不 mask
    const productDescription = piiMask(String(input.productDescription ?? '未填写产品描述'));
    const audience = piiMask(String(input.audienceProfile ?? input.audience ?? '未指定受众'));
    const ipPositioning = piiMask(String(input.ipPositioning ?? '未指定 IP 定位'));

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
    // R-14 fix: piiMask 逐字段 mask 自由文本后再 stringify，避免原文泄漏
    const maskedInput = {
      ...userInput,
      ...(userInput.currentRevenue !== undefined ? { currentRevenue: userInput.currentRevenue } : {}),
    };
    // mask 所有 string 字段（piiMask 对非 string 类型安全透传）
    const inputStr = JSON.stringify(piiMask(maskedInput));

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
