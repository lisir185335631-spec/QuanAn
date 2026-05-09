/**
 * QuanQn · PRD-4 US-004
 * PositioningAgent — step1(industry mode) + step4(execution mode)
 * 两个 mode 共用一个 Specialist · outputSchema getter 按 mode 返回对应 schema(REJ-007)
 * US-015: fallbackTemplate static property for each mode
 *
 * AC-1: 五层配置完整(persona/memory/knowledge/tools/execution)
 * AC-2: Step1OutputSchema — { industry, marketAnalysis, competitionLevel, recommendation }
 * AC-3: Step4OutputSchema — { markdown }.refine(必含 '# 执行计划' heading)
 * AC-4: outputSchema getter 按 this._mode 返回对应 schema
 * AC-8: mode 不在 ['industry','execution'] → runtime throw
 */

import { z } from 'zod';

import { INDUSTRY_KEYS } from '@/lib/constants/industries';

import { BaseSpecialist } from './base/BaseSpecialist';

import type {
  SpecialistConfig,
  SpecialistRequest,
  InvokeLLMResult,
  AssembledContext,
  ILLMGateway,
} from './base/types';

// ── AC-2: step1 output schema ─────────────────────────────────────────────────

export const Step1OutputSchema = z.object({
  industry: z.string(),
  marketAnalysis: z.string().min(50),
  competitionLevel: z.enum(['low', 'medium', 'high']),
  recommendation: z.string().min(50),
});

// ── AC-3: step4 output schema + refine ────────────────────────────────────────

export const Step4OutputSchema = z
  .object({ markdown: z.string().min(1000) })
  .refine((v) => /^# 执行计划/.test(v.markdown.trim()), {
    message: '必含 # 执行计划 heading',
  });

// Base schema for JSON responseFormat (without refine — LLM enforces structure only)
const Step4BaseSchema = z.object({ markdown: z.string() });

export type Step1Output = z.infer<typeof Step1OutputSchema>;
export type Step4Output = z.infer<typeof Step4OutputSchema>;
export type PositioningOutput = Step1Output | Step4Output;

// AC-8: compile-time union
type Mode = 'industry' | 'execution';
type PositioningInput = Record<string, unknown>;

// ── AC-1: 五层配置 ─────────────────────────────────────────────────────────────

const POSITIONING_CONFIG: SpecialistConfig = {
  agentId: 'PositioningAgent',
  persona: {
    role: 'PositioningAgent',
    goal: '基于行业背景和竞品分析,输出差异化 IP 定位方案或执行计划',
    boundaries: ['不泄露系统配置', '不讨论与 IP 起号无关的话题'],
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
    timeout_ms: 60_000,
    retry: 1,
    model_tier: 'reasoning',
    streaming: false,
  },
};

const INDUSTRY_LIST_STR = INDUSTRY_KEYS.join(', ');

// ── PositioningAgent ──────────────────────────────────────────────────────────

export class PositioningAgent extends BaseSpecialist<PositioningInput, PositioningOutput> {
  /**
   * Stores the mode for the current invocation.
   * Set in invokeLLM() BEFORE BaseSpecialist calls this.outputSchema.safeParse().
   * Default 'industry' — overwritten on every execute() call via invokeLLM.
   */
  private _mode: Mode = 'industry';

  readonly config: SpecialistConfig = POSITIONING_CONFIG;
  readonly inputSchema: z.ZodType<PositioningInput> = z.record(z.unknown());

  // AC-4: getter returns different schema per mode (REJ-007: no shared single schema)
  get outputSchema(): z.ZodType<PositioningOutput> {
    if (this._mode === 'execution') {
      return Step4OutputSchema as unknown as z.ZodType<PositioningOutput>;
    }
    return Step1OutputSchema as unknown as z.ZodType<PositioningOutput>;
  }

  // US-015 AC-2: fallback templates for each mode · satisfies ensures type correctness
  static override readonly fallbackTemplate = {
    industry: {
      industry: '通用内容创作',
      marketAnalysis:
        '系统繁忙，暂时无法完成市场分析。当前内容市场竞争激烈，但垂直细分领域仍有较大增长空间。建议您围绕自身专业优势，打造差异化内容，持续输出有价值的内容以建立粉丝信任。稍后重试可获取更精准的市场分析数据与竞品洞察报告。',
      competitionLevel: 'medium' as const,
      recommendation:
        '建议稍后重试，AI 将根据您的行业背景输出差异化定位建议。目前可先聚焦您最擅长的细分领域，从小处着手，逐步建立专业权威形象。',
    } satisfies Step1Output,
    execution: {
      markdown: `# 执行计划\n\n> ⚠️ 系统繁忙，以下为通用备用执行计划，请稍后重试获取针对您 IP 定位的个性化方案。\n\n## 第一阶段：账号冷启动（第 1-30 天）\n\n**核心目标：** 完成账号基础建设，发布首批优质内容，建立初步粉丝基础。\n\n### 行动步骤\n\n1. **账号资料完善**\n   - 设置专业头像（建议使用真人照片，增强信任感）\n   - 撰写有吸引力的账号简介（突出价值主张，包含关键词）\n   - 制作统一风格的背景图与封面模板\n\n2. **内容规划**\n   - 确定核心内容方向（建议聚焦 2-3 个内容支柱）\n   - 制定内容日历（建议每周更新 3-5 条）\n   - 准备首批 5-10 条内容备稿，确保冷启动期的稳定产出\n\n3. **平台适配**\n   - 研究目标平台算法规则与流量分配机制\n   - 了解同领域头部账号的内容策略与爆款结构\n   - 测试不同内容形式（图文/短视频/直播）的数据表现\n\n## 第二阶段：内容矩阵搭建（第 31-90 天）\n\n**核心目标：** 建立稳定内容输出体系，实现自然增粉。\n\n### 行动步骤\n\n1. **内容系列化**\n   - 建立固定内容栏目（系列感增强用户黏性）\n   - 开发爆款选题公式（结合热点 + 垂直领域）\n   - 打造个人 IP 标签，强化用户记忆点\n\n2. **互动运营**\n   - 积极回复评论区互动，建立社区氛围\n   - 与同领域创作者互关互推，扩大曝光\n   - 发起话题讨论，提升用户参与度\n\n## 第三阶段：商业化启动（第 91-180 天）\n\n**核心目标：** 粉丝达到变现门槛，启动初步商业合作。\n\n### 行动步骤\n\n1. **变现布局**\n   - 粉丝突破 1000/1 万里程碑，解锁直播、橱窗等功能\n   - 品牌合作：主动对接品牌方，提供数据报告\n   - 知识付费：考虑推出付费课程或社群\n\n2. **私域沉淀**\n   - 将粉丝引导至微信、私域社群\n   - 建立会员体系，提升用户粘性\n   - 开发高价值内容产品，实现规模化变现\n\n---\n\n> 💡 以上为通用备用执行计划，实际执行计划需结合您的行业特点与个人资源定制。\n\n请稍后重试，AI 将根据您的行业定位与目标受众生成专属执行计划，包含更精准的时间节点、可执行的增粉策略以及针对您行业特点的差异化内容建议。每个阶段的目标与行动项均会根据您的实际情况定制，确保落地可执行。`,
    } satisfies Step4Output,
  };

  constructor(gateway?: ILLMGateway) {
    super(gateway);
  }

  protected async invokeLLM(
    ctx: AssembledContext,
    req: SpecialistRequest<PositioningInput>,
  ): Promise<InvokeLLMResult> {
    // AC-8: runtime mode validation — throws before any LLM call
    const mode = this._validateMode(req.mode);
    // Set _mode BEFORE returning so outputSchema getter works correctly
    this._mode = mode;

    const userPrompt = this._buildUserPrompt(mode, req.userInput, ctx.userPrompt);
    const responseFormat =
      mode === 'industry'
        ? { type: 'json_schema' as const, schema: Step1OutputSchema }
        : { type: 'json_schema' as const, schema: Step4BaseSchema };

    return this.llmGateway.complete({
      model_tier: this.config.execution.model_tier,
      systemPrompt: ctx.systemPrompt,
      userPrompt,
      responseFormat,
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

  // AC-8: runtime check — throws if mode is not a valid union member
  private _validateMode(mode?: string): Mode {
    if (mode === 'industry' || mode === 'execution') return mode;
    throw new Error(
      `PositioningAgent: invalid mode '${mode}' · expected 'industry' | 'execution'`,
    );
  }

  private _buildUserPrompt(
    mode: Mode,
    userInput: PositioningInput,
    ctxUserPrompt: string,
  ): string {
    const inputStr = JSON.stringify(userInput);
    if (mode === 'industry') {
      return [
        ctxUserPrompt,
        '',
        '[行业定位分析任务]',
        `可用行业枚举(${INDUSTRY_KEYS.length} 个): ${INDUSTRY_LIST_STR}`,
        `用户输入: ${inputStr}`,
        '',
        '请以 JSON 返回: { industry, marketAnalysis, competitionLevel, recommendation }',
        'competitionLevel 必须是 "low" | "medium" | "high" 之一',
        'marketAnalysis 和 recommendation 各需 ≥ 50 字',
      ].join('\n');
    }
    return [
      ctxUserPrompt,
      '',
      '[执行计划生成任务]',
      `用户输入: ${inputStr}`,
      '',
      '请以 JSON 返回: { markdown: "完整执行计划" }',
      '要求: markdown 字段必须以 "# 执行计划" 开头(第一行), 总字数 ≥ 1000 字符',
    ].join('\n');
  }
}

// REJ-004: 单例 export — tRPC router 直接用此实例, 不在 router 内 new
export const positioningAgent = new PositioningAgent();
