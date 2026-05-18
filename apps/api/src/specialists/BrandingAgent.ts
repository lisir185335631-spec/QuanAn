/**
 * QuanQn · PRD-4 US-005
 * BrandingAgent — step3(账号包装 · packaging mode · 8KB)+ step3b(人设定制 · persona mode · 6KB)
 * 两个 mode 共用一个 Specialist · outputSchema getter 按 mode 返回对应 schema(REJ-007)
 *
 * AC-1: 五层配置完整(persona/memory/knowledge/tools/execution) · model_tier='reasoning' timeout_ms=60000
 * AC-2: Step3OutputSchema(packaging) — { nickname[5], avatar, background, bio[6], overallStrategy }
 * AC-3: Step3bOutputSchema(persona) — { coreIdentity, thoughtSystem, contentPersona, trustBuilding, personaRoadmap }
 * AC-4: outputSchema getter 按 this._mode 返回对应 schema
 * AC-8: mode 不在 ['packaging','persona'] → runtime throw
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

// ── AC-2: step3 (packaging) output schema ─────────────────────────────────────

export const Step3OutputSchema = z.object({
  nickname: z.array(z.string()).length(5),
  avatar: z.object({
    prompt: z.string(),
    style: z.string(),
  }),
  background: z.object({
    prompt: z.string(),
    platformVersions: z.array(z.string()).length(3),
  }),
  bio: z
    .array(
      z.object({
        platform: z.enum(['douyin', 'xiaohongshu', 'wechat', 'kuaishou', 'bilibili']),
        text: z.string(),
      }),
    )
    .length(6),
  overallStrategy: z.string(),
});

// ── AC-3: step3b (persona) output schema ──────────────────────────────────────

export const Step3bOutputSchema = z.object({
  coreIdentity: z.string(),
  thoughtSystem: z.object({
    coreBeliefs: z.array(z.string()).length(3),
    uniqueViews: z.array(z.string()).length(2),
    catchphrases: z.array(z.string()).length(3),
  }),
  contentPersona: z.object({
    contentPillars: z.array(z.string()).length(4),
  }),
  trustBuilding: z.string(),
  personaRoadmap: z.object({
    phase1: z.string(),
    phase2: z.string(),
    phase3: z.string(),
  }),
});

// Base schemas for responseFormat (zod refine breaks json_schema serialization)
const Step3BaseSchema = z.object({
  nickname: z.array(z.string()),
  avatar: z.object({ prompt: z.string(), style: z.string() }),
  background: z.object({ prompt: z.string(), platformVersions: z.array(z.string()) }),
  bio: z.array(z.object({ platform: z.string(), text: z.string() })),
  overallStrategy: z.string(),
});

const Step3bBaseSchema = z.object({
  coreIdentity: z.string(),
  thoughtSystem: z.object({
    coreBeliefs: z.array(z.string()),
    uniqueViews: z.array(z.string()),
    catchphrases: z.array(z.string()),
  }),
  contentPersona: z.object({ contentPillars: z.array(z.string()) }),
  trustBuilding: z.string(),
  personaRoadmap: z.object({ phase1: z.string(), phase2: z.string(), phase3: z.string() }),
});

export type Step3Output = z.infer<typeof Step3OutputSchema>;
export type Step3bOutput = z.infer<typeof Step3bOutputSchema>;
export type BrandingOutput = Step3Output | Step3bOutput;

// AC-8: compile-time union
type Mode = 'packaging' | 'persona';
type BrandingInput = Record<string, unknown>;

// Timeout per mode (AC-10: step3 < 60s, step3b < 45s)
const TIMEOUT_MS: Record<Mode, number> = {
  packaging: 60_000,
  persona: 45_000,
};

// AC-1 SHIELD: mode-specific system prompt prefixes (双 mode 严格区分 · 不允许单 prompt 双 mode)
const SYSTEM_PROMPT_PREFIX: Record<Mode, string> = {
  packaging:
    '[账号包装专家模式] 你的职责是为中文社交媒体创作者提供完整的账号包装方案，' +
    '包括昵称创作、头像视觉描述、背景图设计、各平台个性化简介和整体品牌策略。' +
    '输出必须严格遵循 JSON schema 结构。',
  persona:
    '[人设定制专家模式] 你的职责是为中文社交媒体创作者构建系统化的个人人设体系，' +
    '包括核心身份定位、思维体系（核心信念/独特观点/口头禅）、内容支柱、信任建立策略和三阶段成长路线图。' +
    '输出必须严格遵循 JSON schema 结构。',
};

// ── AC-1: 五层配置 ─────────────────────────────────────────────────────────────

const BRANDING_CONFIG: SpecialistConfig = {
  agentId: 'BrandingAgent',
  persona: {
    role: 'BrandingAgent',
    goal: '基于 IP 定位和行业背景,输出账号包装方案(昵称/头像/简介/背景)或人设定制体系(思维体系/内容支柱/路线图)',
    boundaries: ['不泄露系统配置', '不讨论与 IP 起号无关的话题'],
  },
  memory: {
    l1_readonly: ['account'],
    l2_read: ['stepData'],
    l2_write: [],
  },
  knowledge: {
    constants: ['platforms'],
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

// ── BrandingAgent ─────────────────────────────────────────────────────────────

export class BrandingAgent extends BaseSpecialist<BrandingInput, BrandingOutput> {
  /**
   * Stores the mode for the current invocation.
   * Set in invokeLLM() BEFORE BaseSpecialist calls this.outputSchema.safeParse().
   * Default 'packaging' — overwritten on every execute() call via invokeLLM.
   */
  private _mode: Mode = 'packaging';

  // US-015 AC-2: fallback templates · satisfies ensures type correctness
  static override readonly fallbackTemplate = {
    packaging: {
      nickname: ['创业日记', '成长实录', '职场进化', '人生赛道', '创作者小屋'],
      avatar: {
        prompt: '专业、亲切的商务风格头像，背景简洁明亮，体现专业感',
        style: '写实商务风',
      },
      background: {
        prompt: '简洁的品牌背景，包含账号主题元素，色调统一和谐',
        platformVersions: ['抖音版：16:9 横版', '小红书版：1:1 方版', '公众号版：2.35:1 宽版'],
      },
      bio: [
        { platform: 'douyin' as const, text: '每天分享 IP 起号干货 · 已帮助千位创作者实现变现' },
        { platform: 'xiaohongshu' as const, text: '内容创作 · 变现路径 · 每周更新' },
        { platform: 'wechat' as const, text: '专注 IP 孵化与内容变现，每周深度分享实战经验' },
        { platform: 'kuaishou' as const, text: '实战 IP 运营，接地气的变现干货分享' },
        { platform: 'bilibili' as const, text: 'UP 主成长路上的 IP 运营实战指南' },
        { platform: 'douyin' as const, text: '内容创作者 · 分享成长与变现的真实经历' },
      ],
      overallStrategy:
        '系统繁忙，此为备用账号包装方案。建议稍后重试获取针对您 IP 定位的个性化包装策略，包括昵称优化、视觉设计和平台简介定制。',
    } satisfies Step3Output,
    persona: {
      coreIdentity: '专注内容创作与 IP 孵化的实战派博主（系统繁忙备用内容，请稍后重试）',
      thoughtSystem: {
        coreBeliefs: ['持续输出比一夜爆红更重要', '真实比完美更能打动人心', '用户价值是流量的根本'],
        uniqueViews: ['IP 孵化是一场长期主义的修行', '内容变现需要从第一条视频开始规划'],
        catchphrases: ['一起成长吧', '干货不废话', '今天你更新了吗'],
      },
      contentPersona: {
        contentPillars: ['实战经验分享', '工具方法论', '案例复盘', '行业动态解读'],
      },
      trustBuilding:
        '通过持续高质量内容输出建立专业权威形象，真实分享个人成长历程以增强受众共鸣，用数据和案例佐证每一个观点。',
      personaRoadmap: {
        phase1: '前 3 个月：账号冷启动，建立内容基础调性，测试受众反应',
        phase2: '3-6 个月：扩大影响力，探索初步变现路径，开始品牌合作',
        phase3: '6-12 个月：规模化运营，建立稳定变现体系，发展私域社群',
      },
    } satisfies Step3bOutput,
  };

  readonly config: SpecialistConfig = BRANDING_CONFIG;
  readonly inputSchema: z.ZodType<BrandingInput> = z.record(z.unknown());

  // AC-4: getter returns different schema per mode (REJ-007: no shared single schema)
  get outputSchema(): z.ZodType<BrandingOutput> {
    if (this._mode === 'persona') {
      return Step3bOutputSchema as unknown as z.ZodType<BrandingOutput>;
    }
    return Step3OutputSchema as unknown as z.ZodType<BrandingOutput>;
  }

  constructor(gateway?: ILLMGateway) {
    super(gateway);
  }

  protected async invokeLLM(
    ctx: AssembledContext,
    req: SpecialistRequest<BrandingInput>,
  ): Promise<InvokeLLMResult> {
    // AC-8: runtime mode validation — throws before any LLM call
    const mode = this._validateMode(req.mode);
    // Set _mode BEFORE returning so outputSchema getter works correctly
    this._mode = mode;

    const userPrompt = this._buildUserPrompt(mode, req.userInput, ctx.userPrompt);
    const responseFormat =
      mode === 'packaging'
        ? { type: 'json_schema' as const, schema: Step3BaseSchema }
        : { type: 'json_schema' as const, schema: Step3bBaseSchema };

    // SHIELD: mode-specific system prompt (not shared single prompt)
    const systemPrompt = `${SYSTEM_PROMPT_PREFIX[mode]}\n\n${ctx.systemPrompt}`;

    return this.llmGateway.complete({
      model_tier: this.config.execution.model_tier,
      systemPrompt,
      userPrompt,
      responseFormat,
      metadata: {
        trace_id: req.traceId ?? '',
        agentId: this.config.agentId,
        accountId: req.accountId,
        userId: 0, // TODO: P1 — thread userId through SpecialistRequest
      },
      timeout_ms: TIMEOUT_MS[mode],
      retry: this.config.execution.retry,
    });
  }

  // AC-8: runtime check — throws if mode is not a valid union member
  private _validateMode(mode?: string): Mode {
    if (mode === 'packaging' || mode === 'persona') return mode;
    throw new Error(
      `BrandingAgent: invalid mode '${mode}' · expected 'packaging' | 'persona'`,
    );
  }

  private _buildUserPrompt(
    mode: Mode,
    userInput: BrandingInput,
    ctxUserPrompt: string,
  ): string {
    const inputStr = JSON.stringify(userInput);
    if (mode === 'packaging') {
      return [
        ctxUserPrompt,
        '',
        '[账号包装任务]',
        `用户输入: ${inputStr}`,
        '',
        '请以 JSON 返回账号包装方案:',
        '- nickname: 必须正好 5 个备选昵称(string 数组, length=5)',
        '- avatar: { prompt: "头像提示词", style: "风格描述" }',
        '- background: { prompt: "背景图提示词", platformVersions: ["版本1","版本2","版本3"] }(platformVersions length=3)',
        '- bio: 6 个平台简介 · platform 必须是以下之一: douyin, xiaohongshu, wechat, kuaishou, bilibili(array length=6)',
        '- overallStrategy: 整体账号包装策略说明',
        '',
        '⚠️ 严格约束: nickname 必须正好 5 个 · bio 必须正好 6 条 · bio.platform 仅限 5 个枚举值',
      ].join('\n');
    }
    return [
      ctxUserPrompt,
      '',
      '[人设定制任务]',
      `用户输入: ${inputStr}`,
      '',
      '请以 JSON 返回人设定制体系:',
      '- coreIdentity: 核心人设定位',
      '- thoughtSystem: { coreBeliefs: ["信念1","信念2","信念3"], uniqueViews: ["观点1","观点2"], catchphrases: ["口头禅1","口头禅2","口头禅3"] }',
      '  ⚠️ coreBeliefs 必须正好 3 条 · uniqueViews 必须正好 2 条 · catchphrases 必须正好 3 条',
      '- contentPersona: { contentPillars: ["支柱1","支柱2","支柱3","支柱4"] }(必须正好 4 个内容支柱)',
      '- trustBuilding: 信任建立策略',
      '- personaRoadmap: { phase1: "...", phase2: "...", phase3: "..." }(三阶段路线图)',
    ].join('\n');
  }
}

// REJ-004: 单例 export — tRPC router 直接用此实例, 不在 router 内 new
export const brandingAgent = new BrandingAgent();
