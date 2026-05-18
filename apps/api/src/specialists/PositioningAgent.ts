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
      markdown: `# 执行计划\n\n> ⚠️ 系统繁忙，以下为通用备用执行计划，请稍后重试获取针对您 IP 定位的个性化方案。\n\n## 第一阶段：账号冷启动（第 1-30 天）\n\n**核心目标：** 完成账号基础建设，发布首批优质内容，建立初步粉丝基础。\n\n### 1. 每日任务表\n\n| 时段 | 任务 | 时长 |\n|------|------|------|\n| 早 08:00 | 刷同行热门内容 · 记录选题灵感 | 15 分钟 |\n| 午 12:00 | 回复昨日评论 · 互动维护 | 10 分钟 |\n| 晚 20:00 | 发布当日内容 · 观察数据 | 20 分钟 |\n\n- **内容生产**：每日至少准备 1 条内容素材（文案/脚本/拍摄素材）\n- **账号运营**：积极回复评论，建立早期粉丝关系\n- **竞品监测**：每日浏览 3-5 个同领域账号，记录爆款特征\n\n### 2. 每周里程碑\n\n| 周次 | 里程碑目标 | 验收标准 |\n|------|-----------|----------|\n| 第 1 周 | 账号资料 100% 完善 | 头像/简介/背景图全部就位 |\n| 第 2 周 | 首批 5 条内容发布 | 平均播放 ≥ 500 |\n| 第 3 周 | 粉丝突破 100 | 自然增粉（非买粉）|\n| 第 4 周 | 爆款内容 1 条 | 播放 ≥ 5000 |\n\n- 每周复盘数据，调整内容方向与发布策略\n- 与同领域创作者建立互推关系，扩大曝光\n\n### 3. 阶段 KPI\n\n| 指标 | 第 1 月目标 | 第 3 月目标 | 第 6 月目标 |\n|------|------------|------------|------------|\n| 粉丝数 | 500 | 5,000 | 30,000 |\n| 月均播放量 | 5 万 | 50 万 | 500 万 |\n| 爆款率 | ≥ 10% | ≥ 20% | ≥ 30% |\n| 变现收入 | 0 | 试水期 | ≥ 1 万/月 |\n\n---\n\n## 第二阶段：内容矩阵搭建（第 31-90 天）\n\n**核心目标：** 建立稳定内容输出体系，实现自然增粉。\n\n- 建立固定内容栏目（系列感增强用户黏性）\n- 开发爆款选题公式（结合热点 + 垂直领域）\n- 打造个人 IP 标签，强化用户记忆点\n\n## 第三阶段：商业化启动（第 91-180 天）\n\n**核心目标：** 粉丝达到变现门槛，启动初步商业合作。\n\n- 粉丝突破 1 万里程碑，解锁直播、橱窗等功能\n- 品牌合作：主动对接品牌方，提供数据报告\n- 私域沉淀：将粉丝引导至微信社群，建立会员体系\n\n---\n\n> 💡 以上为通用备用执行计划，实际执行计划需结合您的行业特点与个人资源定制。请稍后重试获取个性化方案。`,
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
