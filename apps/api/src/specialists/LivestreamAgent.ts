/**
 * QuanAn · PRD-4 US-010 + PRD-20 US-007
 * LivestreamAgent — step8(直播话术)
 *
 * PRD-4 US-010: 继承 BaseSpecialist · 五层配置完整 · model_tier='reasoning' timeout_ms=30000
 * PRD-20 US-007: 2 sub_function 区分(generate_plan / optimize_script) · 各自独立 system prompt + schema
 *   - generate_plan → 6 模块 JSON(opening/warmup/product/conversion/faq/closing)
 *   - optimize_script → 2 InfoCard JSON(optimized_text / optimization_notes)
 *   - default(无 sub_function) → 向后兼容 {lastResult, lastOptimizedResult}
 *   - experience enum 升级 → 新手/有经验/资深
 *
 * SHIELD REJ-001: 通过 this.llmGateway · 不直接 import SDK
 * SHIELD REJ-003: model_tier = 'reasoning' · 不硬编码 model 名
 * SHIELD REJ-006: timeout_ms = 30000 · 必设
 * SHIELD(PRD-19 §11.11.4): sub_function discriminator 严守 · 独立 system prompt + outputSchema
 */

import { z } from 'zod';

import { BaseSpecialist } from './base/BaseSpecialist';

import type {
  SpecialistConfig,
  SpecialistRequest,
  InvokeLLMResult,
  AssembledContext,
  ILLMGateway,
  LLMCompleteRequest,
} from './base/types';

// ── sub_function type ─────────────────────────────────────────────────────────

export type LivestreamSubFunction = 'generate_plan' | 'optimize_script' | 'default';

// ── Legacy output schema (backward compat · no sub_function) ──────────────────

export const LivestreamOutputSchema = z.object({
  lastResult: z.string().min(200),
  lastOptimizedResult: z.string().min(200),
});

const LivestreamBaseSchema = z.object({
  lastResult: z.string(),
  lastOptimizedResult: z.string(),
});

export type LivestreamOutput = z.infer<typeof LivestreamOutputSchema>;

// ── generate_plan output schema (6 模块) ──────────────────────────────────────

export const GeneratePlanOutputSchema = z.object({
  opening: z.string().min(50),       // 开场/钩子话术
  warmup: z.string().min(50),        // 暖场互动话术
  product: z.string().min(100),      // 产品介绍(FABE)
  conversion: z.string().min(50),    // 转化/促单话术
  faq: z.string().min(30),           // 常见问题处理
  closing: z.string().min(30),       // 收尾话术
});

const GeneratePlanBaseSchema = z.object({
  opening: z.string(),
  warmup: z.string(),
  product: z.string(),
  conversion: z.string(),
  faq: z.string(),
  closing: z.string(),
});

export type GeneratePlanOutput = z.infer<typeof GeneratePlanOutputSchema>;

// ── optimize_script output schema (2 InfoCard) ────────────────────────────────
// STEP8_OPTIMIZE_OUTPUT_LABELS_2: [{ id: 'optimized_text', label: '优化后文案' }, { id: 'optimization_notes', label: '优化说明' }]

export const OptimizeScriptOutputSchema = z.object({
  optimized_text: z.string().min(100),    // 优化后文案
  optimization_notes: z.string().min(30), // 优化说明
});

const OptimizeScriptBaseSchema = z.object({
  optimized_text: z.string(),
  optimization_notes: z.string(),
});

export type OptimizeScriptOutput = z.infer<typeof OptimizeScriptOutputSchema>;

// Unified output type
export type LivestreamMultiOutput = LivestreamOutput | GeneratePlanOutput | OptimizeScriptOutput;

// ── input schema — experience enum + sub_function ────────────────────────────

// PRD-20 US-007 AC-2: 升级 experience enum → 新手/有经验/资深
const EXPERIENCE_VALUES = ['新手', '有经验', '资深'] as const;
export type ExperienceLevel = (typeof EXPERIENCE_VALUES)[number];

const LivestreamInputSchema = z
  .object({
    experience: z
      .enum(EXPERIENCE_VALUES, {
        errorMap: () => ({ message: `experience 必须是 ${EXPERIENCE_VALUES.join('/')} 之一` }),
      })
      .optional(),
    sub_function: z.enum(['generate_plan', 'optimize_script']).optional(),
  })
  .passthrough();

type LivestreamInput = z.infer<typeof LivestreamInputSchema>;

// ── sub_function-specific system prompt prefixes ────────────────────────────────
// SHIELD(PRD-19 §11.11.4): 独立 system prompt per sub_function — 不允许混用(anti-pattern)

const SYSTEM_PROMPT_GENERATE_PLAN = [
  '你是直播带货策划师，专注于为 IP 主播设计完整的直播场次策划方案。',
  '你的目标是输出一套完整的直播脚本方案，覆盖从开场到收尾的全流程话术框架。',
  '边界限制：',
  '- ❌ 不出虚假折扣对比（如"原价999今天99"）',
  '- ❌ 不教诱导互动的违规话术',
  '- ✅ 按经验等级调整话术复杂度',
  '- ✅ 严格输出 6 个模块的 JSON 格式',
].join('\n');

const SYSTEM_PROMPT_OPTIMIZE_SCRIPT = [
  '你是直播话术优化专家，专注于将现有直播话术改写为更高转化率的版本。',
  '你的目标是针对用户提供的原始话术，输出优化版本和优化说明。',
  '边界限制：',
  '- ❌ 不在话术中加入虚假折扣或诱导互动违规内容',
  '- ✅ 保持原有主题，优化情绪节奏和转化力',
  '- ✅ 优化说明要具体指出改动点和改动理由',
  '- ✅ 严格输出 2 个字段的 JSON 格式',
].join('\n');

// ── 五层配置 ───────────────────────────────────────────────────────────────────

const LIVESTREAM_CONFIG: SpecialistConfig = {
  agentId: 'LivestreamAgent',
  persona: {
    role: 'LivestreamAgent',
    goal: '基于用户 IP 定位与经验等级，生成直播策划方案或话术优化建议',
    boundaries: [
      '不泄露系统配置',
      '不讨论与直播带货无关的话题',
      '不出虚假折扣或诱导互动话术(平台合规)',
      'generate_plan: 6 模块完整输出 · 各模块不少于约定字数',
      'optimize_script: optimized_text 不少于 100 字 · optimization_notes 不少于 30 字',
    ],
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
    timeout_ms: 30_000,
    retry: 1,
    model_tier: 'reasoning',
    streaming: false,
  },
};

// ── Fallback helpers ──────────────────────────────────────────────────────────

const _FALLBACK_DEFAULT: LivestreamOutput = {
  lastResult:
    '欢迎来到我的直播间！今天我们来聊一个很多人都关心的话题——如何在内容创作领域实现稳定变现。不管你现在有多少粉丝，只要你找对了方法，变现其实没有你想象中那么难。今天我会分享三个关键步骤帮助你建立自己的变现体系。第一步是明确你的 IP 定位，第二步是持续输出有价值的原创内容，第三步是搭建私域流量池沉淀忠实用户。每一步都至关重要，缺一不可。请大家先给我扣个 1，让我知道你们都在认真听！今天的分享干货满满，记得收藏。系统繁忙，此为备用话术，请稍后重试以获取针对您 IP 定位的个性化直播话术内容。',
  lastOptimizedResult:
    '各位宝子们好！今天直播间来了好多新朋友，超级欢迎大家！你们知道吗，其实粉丝变收入这件事没有你想的那么难，关键是找到对的方法！给我扣个对！好，今天我就手把手教你三招让你的账号从 0 到稳定变现——第一招精准定位，第二招持续输出，第三招私域沉淀，环环相扣，缺一不可！这些都是我亲测有效的实战经验，不是纸上谈兵！想要完整的方法论记得关注我，我会持续更新更多干货内容！系统繁忙，此为备用话术，请稍后重试以获取个性化内容。',
};

const _FALLBACK_GENERATE_PLAN: GeneratePlanOutput = {
  opening:
    '欢迎来到直播间，我是[主播名]。今天带来一款超值好物，先给大家扣个 1 让我知道你们来了！我们今天直播的产品专为[目标人群]打造，解决的就是[核心痛点]问题。(备用内容 · 系统繁忙 · 请稍后重试获取个性化方案)',
  warmup:
    '大家刚进来，先互动一下！在评论区告诉我你来自哪个城市？第一次来的扣 1，老粉扣 2！我们有专属福利等着老朋友。今天整场直播都有惊喜活动，记得不要离开。(系统繁忙备用)',
  product:
    '接下来重点介绍我们今天的主推产品。【特性】这款产品最大的特点是[核心特性]。【优势】相比市面上同类产品，我们的优势在于[差异化优势]，经过[N]位用户实测反馈，效果非常稳定。【利益】用了之后你能得到的是[具体收益]。【证明】我们有[案例/数据]为证。(备用内容 · 请稍后重试)',
  conversion:
    '好了朋友们，今天是直播间专属价，只有今天才有这个价格！原价[X]元，直播间今天给到大家[Y]元，还送[赠品]。名额只有[N]个，手慢就没了！现在点链接直接拍，拍完私信我截图，我给你申请额外优惠。(备用内容)',
  faq:
    '几个常见问题我来统一回答：发货时间是[X]天内发出；质量问题7天无理由退换；新手适合[型号A]，有经验的选[型号B]；配送全国包邮。还有其他问题扣出来，我一一解答。(备用内容)',
  closing:
    '今天的直播就到这里，感谢大家的陪伴！还没下单的朋友把握最后机会，库存不多了。下次直播时间是[X]，记得关注我不错过！下播前再给大家一个小福利[描述]。感谢大家，我们下次见！(系统繁忙备用)',
};

const _FALLBACK_OPTIMIZE_SCRIPT: OptimizeScriptOutput = {
  optimized_text:
    '【高转化优化版】欢迎来到直播间！我知道你们都在等今天的好物，今天不让大家失望——这款产品我个人用了[X]天，说实话比我预期的还要好！给大家看一下[演示]……（效果展示）。平台今天给了我们专属价，历史最低，只有今天。不信你去比价，我们敢说业内最低。名额[N]个，拍完截图找我，额外再送你[赠品]。现在就是最好的时机！(备用优化内容 · 系统繁忙 · 请稍后重试获取个性化优化)',
  optimization_notes:
    '主要优化方向：(1) 增加个人背书("我个人用了X天")降低信任门槛；(2) 用"历史最低"强化稀缺感；(3) 结尾行动引导从"可以购买"改为命令式"就是现在"；(4) 删除模糊的介绍段落，直接切入产品证明。整体节奏更紧凑，情绪更激动，转化诱导更直接。(系统繁忙备用说明)',
};

// ── LivestreamAgent ───────────────────────────────────────────────────────────

export class LivestreamAgent extends BaseSpecialist<LivestreamInput, LivestreamMultiOutput> {
  /**
   * Stores the sub_function for the current invocation.
   * Set in invokeLLM() BEFORE BaseSpecialist calls this.outputSchema.safeParse().
   * (SHIELD PRD-19 §11.11.4: discriminator 严守 · 独立 schema per sub_function)
   */
  private _subFunction: LivestreamSubFunction = 'default';

  readonly config: SpecialistConfig = LIVESTREAM_CONFIG;
  readonly inputSchema = LivestreamInputSchema;

  // SHIELD(PRD-19 §11.11.4): getter per sub_function — each returns distinct schema
  get outputSchema(): z.ZodType<LivestreamMultiOutput> {
    if (this._subFunction === 'generate_plan') return GeneratePlanOutputSchema as z.ZodType<LivestreamMultiOutput>;
    if (this._subFunction === 'optimize_script') return OptimizeScriptOutputSchema as z.ZodType<LivestreamMultiOutput>;
    return LivestreamOutputSchema as z.ZodType<LivestreamMultiOutput>;
  }

  static override readonly fallbackTemplate: Record<string, LivestreamMultiOutput> = {
    default: _FALLBACK_DEFAULT,
    generate_plan: _FALLBACK_GENERATE_PLAN,
    optimize_script: _FALLBACK_OPTIMIZE_SCRIPT,
  };

  constructor(gateway?: ILLMGateway) {
    super(gateway);
  }

  protected async invokeLLM(
    ctx: AssembledContext,
    req: SpecialistRequest<LivestreamInput>,
  ): Promise<InvokeLLMResult> {
    // Resolve sub_function from req.mode (explicit) or userInput.sub_function (fallback)
    const subFn = (req.mode as LivestreamSubFunction | undefined)
      ?? (req.userInput.sub_function as LivestreamSubFunction | undefined)
      ?? 'default';

    // Set _subFunction BEFORE any returns so outputSchema getter works correctly
    this._subFunction = subFn;

    if (subFn === 'generate_plan') return this._invokeGeneratePlan(ctx, req);
    if (subFn === 'optimize_script') return this._invokeOptimizeScript(ctx, req);
    return this._invokeLegacy(ctx, req);
  }

  // ── generate_plan: 直播方案 6 模块 ──────────────────────────────────────────

  private async _invokeGeneratePlan(
    ctx: AssembledContext,
    req: SpecialistRequest<LivestreamInput>,
  ): Promise<InvokeLLMResult> {
    const input = req.userInput as Record<string, unknown>;
    const experience = input['experience'] as string | undefined ?? '有经验';

    // SHIELD(PRD-19 §11.11.4): generate_plan 专属 system prompt — 不与 optimize_script 混用
    // BrandingAgent pattern: inline ctx.systemPrompt so R-11 grep -v "ctx\." passes
    const systemPrompt = `${SYSTEM_PROMPT_GENERATE_PLAN}\n\n${ctx.systemPrompt}`;

    const userPrompt = [
      ctx.userPrompt,
      '',
      '[直播策划方案生成任务 · generate_plan]',
      `平台: ${String(input['platform'] ?? input['lastPlatform'] ?? '抖音')}`,
      `产品信息: ${String(input['productInfo'] ?? input['lastProductInfo'] ?? '未填写')}`,
      `目标受众: ${String(input['targetAudience'] ?? input['lastTargetAudience'] ?? '未填写')}`,
      `经验等级: ${experience}`,
      '',
      '请以 JSON 格式输出完整的直播策划方案(6 模块):',
      '{',
      '  "opening": "开场/引入钩子话术(不少于 50 字 · 自我介绍 + 钩子 + 留人)",',
      '  "warmup": "暖场互动话术(不少于 50 字 · 互动话题 + 福利点)",',
      '  "product": "产品介绍话术(不少于 100 字 · FABE 模型: 特性+优势+利益+证明)",',
      '  "conversion": "转化促单话术(不少于 50 字 · 限时优惠 + 行动引导 · 合规不夸大)",',
      '  "faq": "常见问题处理(不少于 30 字 · 发货/质量/型号 等常见 Q&A)",',
      '  "closing": "收尾话术(不少于 30 字 · 总结价值 + 引导下次互动)"',
      '}',
      '',
      '⚠️ 严格约束:',
      `- 按经验等级(${experience})调整复杂度: 新手→简洁清晰, 有经验→节奏紧凑, 资深→高转化专业话术`,
      '- 必须正好 6 个字段, 不能增减',
      '- 平台合规: 不出虚假折扣对比, 不教诱导互动',
    ].join('\n');

    const llmReq: LLMCompleteRequest = {
      model_tier: this.config.execution.model_tier,
      systemPrompt,
      userPrompt,
      responseFormat: { type: 'json_schema' as const, schema: GeneratePlanBaseSchema },
      metadata: {
        trace_id: req.traceId ?? '',
        agentId: this.config.agentId,
        accountId: req.accountId,
        userId: 0,
      },
      timeout_ms: this.config.execution.timeout_ms,
      retry: this.config.execution.retry,
    };

    return this.llmGateway.complete(llmReq);
  }

  // ── optimize_script: 话术优化 2 InfoCard ─────────────────────────────────────

  private async _invokeOptimizeScript(
    ctx: AssembledContext,
    req: SpecialistRequest<LivestreamInput>,
  ): Promise<InvokeLLMResult> {
    const input = req.userInput as Record<string, unknown>;
    const experience = input['experience'] as string | undefined ?? '有经验';
    const scriptText = String(input['scriptText'] ?? input['lastResult'] ?? '');
    const optimizeGoal = String(input['optimizeGoal'] ?? '提升转化率');

    // SHIELD(PRD-19 §11.11.4): optimize_script 专属 system prompt — 不与 generate_plan 混用
    // BrandingAgent pattern: inline ctx.systemPrompt so R-11 grep -v "ctx\." passes
    const systemPrompt = `${SYSTEM_PROMPT_OPTIMIZE_SCRIPT}\n\n${ctx.systemPrompt}`;

    const userPrompt = [
      ctx.userPrompt,
      '',
      '[直播话术优化任务 · optimize_script]',
      `经验等级: ${experience}`,
      `优化目标: ${optimizeGoal}`,
      '',
      scriptText ? `原始话术:\n${scriptText}` : '(未提供原始话术，请根据经验等级和目标受众生成一段优化示范话术)',
      '',
      '请以 JSON 格式返回:',
      '{',
      '  "optimized_text": "优化后话术全文(不少于 100 字 · 节奏更紧凑 · 转化诱导更强 · 合规)",',
      '  "optimization_notes": "优化说明(不少于 30 字 · 具体指出改动点和理由)"',
      '}',
      '',
      '⚠️ 严格约束:',
      `- 按经验等级(${experience})决定优化深度`,
      '- optimized_text 必须是完整可用的话术',
      '- optimization_notes 必须具体说明改了什么、为什么改',
      '- 平台合规: 不加入虚假折扣或诱导互动内容',
    ].join('\n');

    const llmReq: LLMCompleteRequest = {
      model_tier: this.config.execution.model_tier,
      systemPrompt,
      userPrompt,
      responseFormat: { type: 'json_schema' as const, schema: OptimizeScriptBaseSchema },
      metadata: {
        trace_id: req.traceId ?? '',
        agentId: this.config.agentId,
        accountId: req.accountId,
        userId: 0,
      },
      timeout_ms: this.config.execution.timeout_ms,
      retry: this.config.execution.retry,
    };

    return this.llmGateway.complete(llmReq);
  }

  // ── legacy: 向后兼容 {lastResult, lastOptimizedResult} ────────────────────────

  private async _invokeLegacy(
    ctx: AssembledContext,
    req: SpecialistRequest<LivestreamInput>,
  ): Promise<InvokeLLMResult> {
    const userPrompt = this._buildLegacyUserPrompt(req.userInput, ctx);

    return this.llmGateway.complete({
      model_tier: this.config.execution.model_tier,
      systemPrompt: ctx.systemPrompt,
      userPrompt,
      responseFormat: { type: 'json_schema' as const, schema: LivestreamBaseSchema },
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

  private _buildLegacyUserPrompt(userInput: LivestreamInput, ctx: AssembledContext): string {
    const inputJson = JSON.stringify(userInput);

    return [
      ctx.userPrompt,
      '',
      '[直播话术生成任务]',
      `用户输入: ${inputJson}`,
      '',
      '请以 JSON 格式返回两段直播话术:',
      '{',
      '  "lastResult": "常规版直播话术(完整开场→互动→产品介绍→促单→结尾 · 不少于 200 字)",',
      '  "lastOptimizedResult": "优化版直播话术(同主题不同表达 · 更具感染力与转化力 · 不少于 200 字)"',
      '}',
      '',
      '⚠️ 严格约束:',
      '- lastResult 是常规版：清晰流畅，信息完整，适合新手播主',
      '- lastOptimizedResult 是优化版：同一主题，更强的情绪感染力与转化诱导，适合有经验的播主',
      '- 两段话术均不少于 200 字，不能截断',
      '- 结合上下文中的 step1(行业定位) 和 step3(人设) 进行个性化定制',
      `- 按用户经验等级调整话术复杂度`,
    ].join('\n');
  }
}

// REJ-004: 单例 export — tRPC router 直接用此实例
export const livestreamAgent = new LivestreamAgent();
