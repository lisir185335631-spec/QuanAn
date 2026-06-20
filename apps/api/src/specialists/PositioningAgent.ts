/**
 * QuanAn · PRD-4 US-004 + PRD-25 US-007
 * PositioningAgent — step1(industry mode) + step4(execution mode) + recommend mode
 * 三个 mode 共用一个 Specialist · outputSchema getter 按 mode 返回对应 schema(REJ-007)
 * US-015: fallbackTemplate static property for each mode
 * US-007 AC-6: recommend mode → {platform, followersRange, ipPositioning, rationale}
 *              model_tier='lightweight' · timeout 15s · outputSchema getter per mode
 *
 * AC-1: 五层配置完整(persona/memory/knowledge/tools/execution)
 * AC-2: Step1OutputSchema — { industry, marketAnalysis, competitionLevel, recommendation }
 * AC-3: Step4OutputSchema — { markdown }.refine(必含 '# 执行计划' heading)
 * AC-4: outputSchema getter 按 this._mode 返回对应 schema
 * AC-8: mode 不在 ['industry','execution','recommend'] → runtime throw
 */

import { z } from 'zod';

import { INDUSTRY_KEYS } from '@/lib/constants/industries';
import { piiMask } from '@/lib/compliance/pii-mask';

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

// ── US-007 AC-6: recommend output schema ─────────────────────────────────────
// SHIELD(ANTI-PATTERN → AC-5/AC-6 字段名): {platform, followersRange, ipPositioning, rationale}

export const RecommendOutputSchema = z.object({
  platform: z.enum(['douyin', 'xiaohongshu', 'kuaishou']),
  followersRange: z.enum(['0-1k', '1k-10k', '10k+']),
  ipPositioning: z.string().min(10),
  rationale: z.string().min(50),
});

const RecommendBaseSchema = z.object({
  platform: z.string(),
  followersRange: z.string(),
  ipPositioning: z.string(),
  rationale: z.string(),
});

export type Step1Output = z.infer<typeof Step1OutputSchema>;
export type Step4Output = z.infer<typeof Step4OutputSchema>;
export type RecommendOutput = z.infer<typeof RecommendOutputSchema>;
export type PositioningOutput = Step1Output | Step4Output | RecommendOutput;

// AC-8: compile-time union (US-007: added 'recommend')
type Mode = 'industry' | 'execution' | 'recommend';
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
    if (this._mode === 'recommend') {
      return RecommendOutputSchema as unknown as z.ZodType<PositioningOutput>;
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
      markdown: `# 执行计划\n\n> ⚠️ 系统繁忙，以下为通用备用执行计划，请稍后重试获取针对您 IP 定位的个性化方案。\n\n## 第一阶段：账号冷启动（第 1-30 天）\n\n**核心目标：** 完成账号基础建设，发布首批优质内容，建立初步粉丝基础。\n\n### 1. 每日运营计划\n\n| 时段 | 任务 | 时长 |\n|------|------|------|\n| 早 08:00 | 刷同行热门内容 · 记录选题灵感 | 15 分钟 |\n| 午 12:00 | 回复昨日评论 · 互动维护 | 10 分钟 |\n| 晚 20:00 | 发布当日内容 · 观察数据 | 20 分钟 |\n\n- **内容生产**：每日至少准备 1 条内容素材（文案/脚本/拍摄素材）\n- **账号运营**：积极回复评论，建立早期粉丝关系\n- **竞品监测**：每日浏览 3-5 个同领域账号，记录爆款特征\n\n### 2. 每周里程碑\n\n| 周次 | 里程碑目标 | 验收标准 |\n|------|-----------|----------|\n| 第 1 周 | 账号资料 100% 完善 | 头像/简介/背景图全部就位 |\n| 第 2 周 | 首批 5 条内容发布 | 平均播放 ≥ 500 |\n| 第 3 周 | 粉丝突破 100 | 自然增粉（非买粉）|\n| 第 4 周 | 爆款内容 1 条 | 播放 ≥ 5000 |\n\n- 每周复盘数据，调整内容方向与发布策略\n- 与同领域创作者建立互推关系，扩大曝光\n\n### 3. 阶段 KPI\n\n| 指标 | 第 1 月目标 | 第 3 月目标 | 第 6 月目标 |\n|------|------------|------------|------------|\n| 粉丝数 | 500 | 5,000 | 30,000 |\n| 月均播放量 | 5 万 | 50 万 | 500 万 |\n| 爆款率 | ≥ 10% | ≥ 20% | ≥ 30% |\n| 变现收入 | 0 | 试水期 | ≥ 1 万/月 |\n\n---\n\n## 第二阶段：内容矩阵搭建（第 31-90 天）\n\n**核心目标：** 建立稳定内容输出体系，实现自然增粉。\n\n- 建立固定内容栏目（系列感增强用户黏性）\n- 开发爆款选题公式（结合热点 + 垂直领域）\n- 打造个人 IP 标签，强化用户记忆点\n\n## 第三阶段：商业化启动（第 91-180 天）\n\n**核心目标：** 粉丝达到变现门槛，启动初步商业合作。\n\n- 粉丝突破 1 万里程碑，解锁直播、橱窗等功能\n- 品牌合作：主动对接品牌方，提供数据报告\n- 私域沉淀：将粉丝引导至微信社群，建立会员体系\n\n---\n\n> 💡 以上为通用备用执行计划，实际执行计划需结合您的行业特点与个人资源定制。请稍后重试获取个性化方案。`,
    } satisfies Step4Output,
    // US-007 AC-6: recommend fallback
    recommend: {
      platform: 'douyin' as const,
      followersRange: '0-1k' as const,
      ipPositioning: '系统繁忙，建议选择专注垂直领域的内容方向，围绕自身专业优势建立差异化 IP 定位。',
      rationale: '系统繁忙，以下为通用备用推荐。抖音是目前覆盖面最广的平台，0-1k 粉丝阶段适合深耕垂直内容积累基础用户，建议从最擅长的领域入手，稳步建立账号权威性。请稍后重试获取基于您行业的个性化推荐。',
    } satisfies RecommendOutput,
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

    if (mode === 'recommend') {
      return this._invokeRecommend(ctx, req);
    }

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
        userId: req.userId,
      },
      timeout_ms: this.config.execution.timeout_ms,
      retry: this.config.execution.retry,
    });
  }

  // US-007 AC-6: recommend mode — lightweight · 15s timeout
  private async _invokeRecommend(
    ctx: AssembledContext,
    req: SpecialistRequest<PositioningInput>,
  ): Promise<InvokeLLMResult> {
    const industry = String(req.userInput['industry'] ?? '内容创作');

    const userPrompt = [
      ctx.userPrompt,
      '',
      '[IP 账号智能推荐任务 · recommend]',
      `用户行业: ${industry}`,
      '',
      '请根据行业特点，为该用户推荐最适合的 IP 账号起号参数，以 JSON 格式返回:',
      '{',
      '  "platform": "推荐平台(必须是 douyin / xiaohongshu / kuaishou 其中之一)",',
      '  "followersRange": "推荐粉丝量级(必须是 0-1k / 1k-10k / 10k+ 其中之一)",',
      '  "ipPositioning": "推荐 IP 定位描述(中文 20-50 字 · 描述账号定位核心方向)",',
      '  "rationale": "推荐理由(中文 100-200 字 · 说明为什么适合该平台+量级+定位)"',
      '}',
      '',
      '⚠️ 约束:',
      '- platform 必须严格是 douyin | xiaohongshu | kuaishou 之一(英文小写)',
      '- followersRange 必须严格是 0-1k | 1k-10k | 10k+ 之一',
      '- 根据行业特性客观推荐: 美妆/生活 → 小红书优先; 带货/企业服务 → 抖音优先; 农产品/本地生活 → 快手优先',
      '- rationale 100-200 字，具体说明推荐理由',
    ].join('\n');

    return this.llmGateway.complete({
      model_tier: 'lightweight',
      systemPrompt: ctx.systemPrompt,
      userPrompt,
      responseFormat: { type: 'json_schema' as const, schema: RecommendBaseSchema },
      metadata: {
        trace_id: req.traceId ?? '',
        agentId: this.config.agentId,
        accountId: req.accountId,
        userId: req.userId,
      },
      timeout_ms: 15_000,
      retry: 1,
    });
  }

  // AC-8: runtime check — throws if mode is not a valid union member
  private _validateMode(mode?: string): Mode {
    if (mode === 'industry' || mode === 'execution' || mode === 'recommend') return mode;
    throw new Error(
      `PositioningAgent: invalid mode '${mode}' · expected 'industry' | 'execution' | 'recommend'`,
    );
  }

  private _buildUserPrompt(
    mode: Mode,
    userInput: PositioningInput,
    ctxUserPrompt: string,
  ): string {
    // LD-018 PII 修: userInput 含自由文本字段(如 niche/product_description 等)可能带 PII →
    // 先用 piiMask 递归处理整个对象再 stringify · 枚举/数值字段 piiMask 会安全透传
    const inputStr = JSON.stringify(piiMask(userInput));
    if (mode === 'industry') {
      // PRD-37 US-P04: 提取子行业上下文，注入 prompt 让市场分析更精准
      const industryCategory = typeof userInput['industryCategory'] === 'string' ? userInput['industryCategory'] : undefined;
      const industrySub = typeof userInput['industrySub'] === 'string' ? userInput['industrySub'] : undefined;
      const subIndustryContext = (industryCategory || industrySub)
        ? [
            '',
            '[子行业上下文]',
            ...(industryCategory ? [`行业大类: ${industryCategory}`] : []),
            ...(industrySub ? [`细分子行业: ${industrySub}`] : []),
            '请在市场分析和定位建议中聚焦该细分子行业的竞争态势与差异化机会',
          ]
        : [];
      return [
        ctxUserPrompt,
        '',
        '[行业定位分析任务]',
        `可用行业枚举(${INDUSTRY_KEYS.length} 个): ${INDUSTRY_LIST_STR}`,
        `用户输入: ${inputStr}`,
        ...subIndustryContext,
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
