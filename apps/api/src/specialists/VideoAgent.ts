/**
 * QuanAn · PRD-4 US-008 + PRD-6 US-002 + PRD-20 US-005
 * VideoAgent — 4 mode: shooting / production / acquisition / storyboard
 *
 * PRD-4:
 * AC-1: 继承 BaseSpecialist · shooting mode · 接口预留 4 mode type
 * AC-2: outputSchema getter shooting → 8 列分镜表 schema (PRD-20 US-005 升级)
 * AC-3: shotList.min(1) · 8 列全填 · zod object 强制
 * AC-5: production / acquisition / storyboard → throw 'Not implemented · PRD-6' (已由 PRD-6 US-002 解锁)
 * AC-6: sourceCopy > 5000 字符 → input zod 拒(防 token 爆)
 * AC-7: memory.l2_read = ['stepData'] · 注入 step7 文案(若有)
 * AC-8: config 五层 · model_tier='reasoning' timeout_ms=45000
 *
 * PRD-6 US-002:
 * AC-1: production/acquisition/storyboard mode 解锁 (移除 throw · 按 mode 走 invokeLLM 分支)
 * AC-2: outputSchema getter 完整 switch (4 mode · D-028 模式)
 * AC-3: _buildUserPrompt(mode) 4 分支
 * AC-4: storyboard imagePromptEn ASCII enforced via schema-level regex (StoryboardSceneSchema · matches aiVideoSceneSchema)
 * SHIELD REJ-007: outputSchema getter 按 mode · 不用 z.discriminatedUnion
 *
 * PRD-20 US-005:
 * AC-2: shooting mode 升级为 8 列分镜表 schema(时长/场景/景别/角度/运镜/情绪/台词/动作)
 * AC-4: column 名严格匹配 · safeParse 严格 · SHIELD 英文 key 防 LLM 漂移
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

// ── AC-1: VideoAgent mode union ───────────────────────────────────────────────

export type VideoAgentMode = 'shooting' | 'production' | 'acquisition' | 'storyboard';

// ── PRD-20 US-005 AC-2: 8-column storyboard item schema for shooting mode ─────
// columns: duration/scene/shotType/angle/movement/emotion/dialogue/action
// SHIELD REJ: English key names — LLM must not drift to Chinese keys (e.g. '镜头号')

export const Storyboard8ColItemSchema = z.object({
  duration: z.string(),   // 时长
  scene: z.string(),      // 场景
  shotType: z.string(),   // 景别 (wide/medium/close-up)
  angle: z.string(),      // 角度
  movement: z.string(),   // 运镜
  emotion: z.string(),    // 情绪
  dialogue: z.string(),   // 台词
  action: z.string(),     // 动作
});

export type Storyboard8ColItem = z.infer<typeof Storyboard8ColItemSchema>;

// ── Production mode shared 13-field shot item schema (production/acquisition only) ─

const ShotItemSchema = z.object({
  scene: z.string(),
  duration: z.string(),
  action: z.string(),
  dialogue: z.string(),
  cameraAngle: z.string(),
  prop: z.string(),
  lighting: z.string(),
  transition: z.string(),
  sfx: z.string(),
  voiceover: z.string(),
  subtitle: z.string(),
  costume: z.string(),
  location: z.string(),
  // PRD-6 US-004 AC-2: production mode 13-column fields (向后兼容 · optional)
  index: z.number().int().positive().optional(),
  angle: z.string().optional(),
  movement: z.string().optional(),
  description: z.string().optional(),
  bgm: z.string().optional(),
  reference: z.string().optional(),
  note: z.string().optional(),
});

// ── shooting mode schemas (PRD-20 US-005: 8 columns) ─────────────────────────

export const ShootingOutputSchema = z.object({
  shotList: z.array(Storyboard8ColItemSchema).min(1),
  equipment: z.array(z.string()),
  schedule: z.string(),
});

const ShootingBaseSchema = z.object({
  shotList: z.array(Storyboard8ColItemSchema),
  equipment: z.array(z.string()),
  schedule: z.string(),
});

export type ShootingOutput = z.infer<typeof ShootingOutputSchema>;

// ── production mode schemas ───────────────────────────────────────────────────

export const ProductionOutputSchema = z.object({
  shotList: z.array(ShotItemSchema).min(1),
  equipment: z.array(z.string()),
  schedule: z.string(),
});

const ProductionBaseSchema = z.object({
  shotList: z.array(ShotItemSchema),
  equipment: z.array(z.string()),
  schedule: z.string(),
});

export type ProductionOutput = z.infer<typeof ProductionOutputSchema>;

// ── acquisition mode schemas (VideoAgent) ─────────────────────────────────────

export const VideoAcquisitionOutputSchema = z.object({
  script: z.string().min(100),
  cta: z.string().min(10),
  conversionPath: z.string(),
  keyMessages: z.array(z.string()).min(1),
});

const VideoAcquisitionBaseSchema = z.object({
  script: z.string(),
  cta: z.string(),
  conversionPath: z.string(),
  keyMessages: z.array(z.string()),
});

export type VideoAcquisitionOutput = z.infer<typeof VideoAcquisitionOutputSchema>;

// ── storyboard mode schemas (AC-4 · matches packages/schemas aiVideoSceneSchema exactly) ──────────

const StoryboardSceneSchema = z.object({
  index: z.number().int().positive(),
  description: z.string().min(20).max(500),
  imagePromptEn: z
    .string()
    .min(20)
    // eslint-disable-next-line no-control-regex
    .regex(/^[\x00-\x7F]+$/, 'imagePromptEn 必须是英文 ASCII'),
  duration: z.string(),
});

export const StoryboardOutputSchema = z.object({
  scenes: z.array(StoryboardSceneSchema).min(5).max(8),
  title: z.string(),
  totalDuration: z.string(),
});

const StoryboardBaseSchema = z.object({
  scenes: z.array(z.object({
    index: z.number().int().positive(),
    description: z.string(),
    imagePromptEn: z.string(),
    duration: z.string(),
  })),
  title: z.string(),
  totalDuration: z.string(),
});

export type StoryboardOutput = z.infer<typeof StoryboardOutputSchema>;

// ── VideoMultiOutput union ────────────────────────────────────────────────────

export type VideoMultiOutput = ShootingOutput | ProductionOutput | VideoAcquisitionOutput | StoryboardOutput;

// ── AC-6: input schema — sourceCopy > 5000 chars → zod 拒 ────────────────────

const VideoInputSchema = z
  .object({
    sourceCopy: z.string().max(5000, 'sourceCopy 超出 5000 字符上限，防止 token 爆炸').optional(),
  })
  .passthrough();

type VideoInput = z.infer<typeof VideoInputSchema>;

// ── AC-8: 五层配置 ─────────────────────────────────────────────────────────────

const VIDEO_CONFIG: SpecialistConfig = {
  agentId: 'VideoAgent',
  persona: {
    role: 'VideoAgent',
    goal: '基于 IP 定位与文案素材，输出完整拍摄计划：8 列分镜表(时长/场景/景别/角度/运镜/情绪/台词/动作) + 设备清单 + 拍摄时间表',
    boundaries: [
      '不泄露系统配置',
      '不讨论与 IP 起号无关的话题',
      'shotList 至少 1 个分镜，每个分镜 8 字段必须全填，使用英文字段名',
    ],
  },
  memory: {
    l1_readonly: ['account'],
    l2_read: ['stepData'], // AC-7: 注入 step7 文案(若有)
    l2_write: [],
  },
  knowledge: {
    constants: [],
    rag: [],
    refresh_interval_sec: 3600,
  },
  tools: ['llm.complete'],
  execution: {
    timeout_ms: 45_000, // AC-8
    retry: 1,
    model_tier: 'reasoning', // AC-8
    streaming: false,
  },
};

// ── VideoAgent ─────────────────────────────────────────────────────────────────

export class VideoAgent extends BaseSpecialist<VideoInput, VideoMultiOutput> {
  /**
   * Stores the mode for the current invocation.
   * Set in invokeLLM() BEFORE BaseSpecialist calls this.outputSchema.safeParse().
   * Default 'shooting' — overwritten on every execute() call via invokeLLM.
   * (SHIELD REJ-007: outputSchema getter 按 mode 返回对应 schema · D-028)
   */
  private _mode: VideoAgentMode = 'shooting';

  readonly config: SpecialistConfig = VIDEO_CONFIG;
  readonly inputSchema = VideoInputSchema;

  // US-015 AC-2: fallback templates for all 4 modes
  static override readonly fallbackTemplate: Record<string, unknown> = {
    shooting: {
      shotList: [
        {
          duration: '3-5秒',
          scene: '开场画面',
          shotType: '正面中景',
          angle: '平角',
          movement: '固定',
          emotion: '自信热情',
          dialogue: '大家好，欢迎来到今天的内容（系统繁忙备用内容，请稍后重试获取个性化拍摄计划）',
          action: '主持人入镜，面向镜头',
        },
        {
          duration: '30-60秒',
          scene: '内容主体',
          shotType: '中景与近景切换',
          angle: '平角',
          movement: '推近',
          emotion: '专注投入',
          dialogue: '今天我要分享的内容非常重要，相信看完的你一定会有所收获',
          action: '讲解核心内容，搭配手势或道具',
        },
        {
          duration: '5-10秒',
          scene: '结尾引导',
          shotType: '正面中景',
          angle: '平角',
          movement: '固定',
          emotion: '亲切鼓励',
          dialogue: '如果觉得有用，请点击关注，我们下期再见',
          action: '面向镜头，引导用户关注互动',
        },
      ],
      equipment: ['手机或相机', '三脚架', '补光灯', '麦克风'],
      schedule: '拍摄时间约 1-2 小时，建议在光线充足的上午（9-11点）或下午（14-16点）进行（系统繁忙备用拍摄计划）',
    } satisfies ShootingOutput,

    production: {
      shotList: [
        {
          scene: '制作开场',
          duration: '3s',
          action: '镜头从产品特写拉远至全景',
          dialogue: '无',
          cameraAngle: '近景拉远',
          prop: '产品或主题道具',
          lighting: '三点布光：主光/补光/轮廓光',
          transition: '缓推',
          sfx: '无',
          voiceover: '开场旁白（系统繁忙备用）',
          subtitle: '开场字幕',
          costume: '与品牌调性一致',
          location: '摄影棚或专业场景',
          index: 1,
          angle: '近景',
          movement: '拉远',
          description: '镜头从产品特写拉远展示整体场景（系统繁忙备用）',
          bgm: '轻快开场音乐',
          reference: '无',
          note: '系统繁忙备用',
        },
        {
          scene: '核心内容展示',
          duration: '30s',
          action: '详细展示核心内容，多角度切换',
          dialogue: '系统繁忙备用台词，请稍后重试获取个性化方案',
          cameraAngle: '多角度切换',
          prop: '演示用品或图表',
          lighting: '补光灯辅助',
          transition: '跳切',
          sfx: '背景音乐',
          voiceover: '核心卖点阐述',
          subtitle: '关键信息字幕',
          costume: '同开场',
          location: '同开场',
          index: 2,
          angle: '中景',
          movement: '摇',
          description: '详细展示核心内容主体（系统繁忙备用）',
          bgm: '专业背景音乐',
          reference: '无',
          note: '系统繁忙备用',
        },
        {
          scene: '结尾收尾',
          duration: '5s',
          action: '展示品牌标识或联系方式',
          dialogue: '感谢观看',
          cameraAngle: '正面中景',
          prop: '品牌 Logo 卡片',
          lighting: '同主体',
          transition: '淡出',
          sfx: '结尾音效',
          voiceover: '关注我们',
          subtitle: '关注引导',
          costume: '同开场',
          location: '同开场',
          index: 3,
          angle: '中景',
          movement: '固定',
          description: '展示品牌标识收尾（系统繁忙备用）',
          bgm: '结尾音效',
          reference: '无',
          note: '系统繁忙备用',
        },
      ],
      equipment: ['专业相机或手机', '三脚架 + 稳定器', '三点布光套装', '收音麦克风', '反光板'],
      schedule: '制作拍摄约 2-3 小时，后期剪辑约 1-2 小时（系统繁忙备用制作计划）',
    } satisfies ProductionOutput,

    acquisition: {
      script: '你是否曾经遇到这个问题？每天花大量时间做内容，但粉丝增长却停滞不前？今天分享一个经过验证的方法，帮助你快速突破瓶颈，实现精准涨粉。我们的系统已帮助数百位创作者从 0 到 10 万粉丝，现在这个机会也属于你（系统繁忙备用文案·请稍后重试）。',
      cta: '立即扫描下方二维码，免费获取详细方案（系统繁忙备用 CTA）',
      conversionPath: '视频引流→扫码→咨询群→成交',
      keyMessages: ['经验证的涨粉方法', '针对创作者的专属方案', '免费咨询了解详情'],
    } satisfies VideoAcquisitionOutput,

    storyboard: {
      title: 'Content Creator Story (Fallback Template)',
      totalDuration: '60s',
      scenes: [
        {
          index: 1,
          duration: '5s',
          description: '创作者面对镜头展示成果对比，展现IP起号前后的鲜明变化',
          imagePromptEn: 'A confident content creator facing camera in modern studio, warm golden lighting, professional setup, cinematic portrait style',
        },
        {
          index: 2,
          duration: '10s',
          description: '展示创作者的困境和挑战，引发目标用户强烈共鸣',
          imagePromptEn: 'A person sitting at desk looking at phone with low view count, frustrated expression, dim room, realistic style',
        },
        {
          index: 3,
          duration: '20s',
          description: '介绍核心方法和工具，清晰呈现解决方案的价值与差异化',
          imagePromptEn: 'Split screen showing before and after: left dark office stressed person, right bright modern workspace happy creator, high contrast',
        },
        {
          index: 4,
          duration: '15s',
          description: '展示成功案例和数据，用真实社会证明强化方案的可信度',
          imagePromptEn: 'Dashboard showing growing analytics charts with green upward arrows, clean modern UI design, data visualization, optimistic colors',
        },
        {
          index: 5,
          duration: '10s',
          description: '明确行动召唤，引导用户立即行动，实现关键转化目标',
          imagePromptEn: 'Mobile phone screen showing QR code with call to action button, clean white background, modern minimalist design, focus lighting',
        },
      ],
    } satisfies StoryboardOutput,
  };

  // AC-2 / SHIELD REJ-007: getter 按 mode 返回对应 schema · D-028 模式
  get outputSchema(): z.ZodType<VideoMultiOutput> {
    switch (this._mode) {
      case 'shooting':    return ShootingOutputSchema as z.ZodType<VideoMultiOutput>;
      case 'production':  return ProductionOutputSchema as z.ZodType<VideoMultiOutput>;
      case 'acquisition': return VideoAcquisitionOutputSchema as z.ZodType<VideoMultiOutput>;
      case 'storyboard':  return StoryboardOutputSchema as z.ZodType<VideoMultiOutput>;
      default:            throw new Error(`Unknown VideoAgent mode: ${this._mode as string}`);
    }
  }

  constructor(gateway?: ILLMGateway) {
    super(gateway);
  }

  protected async invokeLLM(
    ctx: AssembledContext,
    req: SpecialistRequest<VideoInput>,
  ): Promise<InvokeLLMResult> {
    const mode = (req.mode ?? 'shooting') as VideoAgentMode;

    // Set _mode BEFORE any LLM call so outputSchema getter is correct (SHIELD REJ-007)
    this._mode = mode;

    if (mode === 'shooting')    return this._invokeShooting(ctx, req);
    if (mode === 'production')  return this._invokeProduction(ctx, req);
    if (mode === 'acquisition') return this._invokeVideoAcquisition(ctx, req);
    if (mode === 'storyboard')  return this._invokeStoryboard(ctx, req);
    throw new Error(`Unknown VideoAgent mode: ${mode as string}`);
  }

  // ── shooting mode ─────────────────────────────────────────────────────────

  private async _invokeShooting(
    ctx: AssembledContext,
    req: SpecialistRequest<VideoInput>,
  ): Promise<InvokeLLMResult> {
    return this.llmGateway.complete({
      model_tier: this.config.execution.model_tier,
      systemPrompt: ctx.systemPrompt,
      userPrompt: this._buildUserPrompt(req.userInput, ctx, 'shooting'),
      responseFormat: { type: 'json_schema' as const, schema: ShootingBaseSchema },
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

  // ── production mode ───────────────────────────────────────────────────────
  // PRD-29.6 fix: LLM error or safeParse failure → return fallbackTemplate.production
  // (isFallback=true) instead of throwing. Aligns with BrandingAgent/BaseSpecialist
  // fallback contract without depending on isFallbackable string-matching heuristics.

  private async _invokeProduction(
    ctx: AssembledContext,
    req: SpecialistRequest<VideoInput>,
  ): Promise<InvokeLLMResult> {
    try {
      const res = await this.llmGateway.complete({
        model_tier: this.config.execution.model_tier,
        systemPrompt: ctx.systemPrompt,
        userPrompt: this._buildUserPrompt(req.userInput, ctx, 'production'),
        responseFormat: { type: 'json_schema' as const, schema: ProductionBaseSchema },
        metadata: {
          trace_id: req.traceId ?? '',
          agentId: this.config.agentId,
          accountId: req.accountId,
          userId: req.userId,
        },
        timeout_ms: this.config.execution.timeout_ms,
        retry: this.config.execution.retry,
      });

      // Validate the LLM response against the strict schema before returning.
      // If the content fails safeParse (e.g. LLM returned a string error message
      // or a malformed object), fall back rather than letting BaseSpecialist retry
      // and eventually throw SchemaValidationError with no fallback catch.
      const parsed = ProductionOutputSchema.safeParse(res.content);
      if (!parsed.success) {
        const fallback = VideoAgent.fallbackTemplate['production'] as ProductionOutput;
        return {
          content: fallback,
          tokens: res.tokens,
          model: res.model,
          isFallback: true,
        };
      }

      return res;
    } catch {
      // Any LLM gateway error (API auth failure, network error, rate-limit, etc.)
      // → return production fallback template so execute() returns isFallback=true
      // instead of propagating the throw through tRPC.
      // BaseSpecialist.execute() will see isFallback=true on the InvokeLLMResult and
      // propagate it outward; outputSchema.safeParse(fallback) will pass since the
      // fallbackTemplate.production satisfies ProductionOutputSchema (all 13 columns set).
      const fallback = VideoAgent.fallbackTemplate['production'] as ProductionOutput;
      return {
        content: fallback,
        tokens: { prompt: 0, completion: 0, total: 0 },
        model: 'fallback',
        isFallback: true,
      };
    }
  }

  // ── acquisition mode ─────────────────────────────────────────────────────
  // PRD-29.6 fix: LLM error or safeParse failure → return fallbackTemplate.acquisition
  // (isFallback=true) instead of throwing. Mirrors _invokeProduction pattern.

  private async _invokeVideoAcquisition(
    ctx: AssembledContext,
    req: SpecialistRequest<VideoInput>,
  ): Promise<InvokeLLMResult> {
    try {
      const res = await this.llmGateway.complete({
        model_tier: this.config.execution.model_tier,
        systemPrompt: ctx.systemPrompt,
        userPrompt: this._buildUserPrompt(req.userInput, ctx, 'acquisition'),
        responseFormat: { type: 'json_schema' as const, schema: VideoAcquisitionBaseSchema },
        metadata: {
          trace_id: req.traceId ?? '',
          agentId: this.config.agentId,
          accountId: req.accountId,
          userId: req.userId,
        },
        timeout_ms: this.config.execution.timeout_ms,
        retry: this.config.execution.retry,
      });

      // Validate the LLM response against the strict schema before returning.
      // If the content fails safeParse (e.g. LLM returned a string error message
      // or a malformed object), fall back rather than letting BaseSpecialist retry
      // and eventually throw SchemaValidationError with no fallback catch.
      const parsed = VideoAcquisitionOutputSchema.safeParse(res.content);
      if (!parsed.success) {
        const fallback = VideoAgent.fallbackTemplate['acquisition'] as VideoAcquisitionOutput;
        return {
          content: fallback,
          tokens: res.tokens,
          model: res.model,
          isFallback: true,
        };
      }

      return res;
    } catch {
      // Any LLM gateway error (API auth failure, network error, rate-limit, etc.)
      // → return acquisition fallback template so execute() returns isFallback=true
      // instead of propagating the throw through tRPC.
      const fallback = VideoAgent.fallbackTemplate['acquisition'] as VideoAcquisitionOutput;
      return {
        content: fallback,
        tokens: { prompt: 0, completion: 0, total: 0 },
        model: 'fallback',
        isFallback: true,
      };
    }
  }

  // ── storyboard mode — AC-4 ASCII enforced via schema-level regex ─────────

  private async _invokeStoryboard(
    ctx: AssembledContext,
    req: SpecialistRequest<VideoInput>,
  ): Promise<InvokeLLMResult> {
    return this.llmGateway.complete({
      model_tier: this.config.execution.model_tier,
      systemPrompt: ctx.systemPrompt,
      userPrompt: this._buildUserPrompt(req.userInput, ctx, 'storyboard'),
      responseFormat: { type: 'json_schema' as const, schema: StoryboardBaseSchema },
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

  // ── AC-3: _buildUserPrompt(mode) 4 分支 ───────────────────────────────────

  private _buildUserPrompt(userInput: VideoInput, ctx: AssembledContext, mode: VideoAgentMode): string {
    switch (mode) {
      case 'shooting':    return this._buildShootingPrompt(userInput, ctx);
      case 'production':  return this._buildProductionPrompt(userInput, ctx);
      case 'acquisition': return this._buildAcquisitionVideoPrompt(userInput, ctx);
      case 'storyboard':  return this._buildStoryboardPrompt(userInput, ctx);
    }
  }

  private _buildShootingPrompt(userInput: VideoInput, ctx: AssembledContext): string {
    const inputJson = JSON.stringify(userInput);
    return [
      ctx.userPrompt,
      '',
      '[拍摄计划生成任务 · 8 列分镜表]',
      `用户输入: ${inputJson}`,
      '',
      '请以 JSON 格式返回拍摄计划:',
      '{',
      '  "shotList": [',
      '    {',
      '      "duration": "时长(如: 5s)",',
      '      "scene": "场景描述",',
      '      "shotType": "景别(如: 近景/中景/全景)",',
      '      "angle": "角度(如: 平角/仰角/俯角)",',
      '      "movement": "运镜(如: 固定/推/拉/摇)",',
      '      "emotion": "情绪(如: 自信/激动/温暖)",',
      '      "dialogue": "台词内容",',
      '      "action": "动作描述"',
      '    }',
      '  ],',
      '  "equipment": ["设备1", "设备2"],',
      '  "schedule": "拍摄时间安排"',
      '}',
      '',
      '⚠️ 严格约束:',
      '- shotList 至少 1 个分镜 · 以上 8 个字段全部用英文 key 填写 · 无内容填"无"',
      '- 字段名严格使用英文: duration / scene / shotType / angle / movement / emotion / dialogue / action',
      '- 结合 step7 文案(若有)与 IP 定位定制分镜表',
    ].join('\n');
  }

  private _buildProductionPrompt(userInput: VideoInput, ctx: AssembledContext): string {
    const inputJson = JSON.stringify(userInput);
    return [
      ctx.userPrompt,
      '',
      '[视频制作计划任务 · production mode]',
      `用户输入: ${inputJson}`,
      '',
      '请以 JSON 格式返回制作执行计划(与拍摄脚本配套):',
      '{',
      '  "shotList": [{ "scene": "制作场景", "duration": "时长", "action": "制作动作/要点", "dialogue": "台词", "cameraAngle": "机位", "prop": "道具/设备", "lighting": "布光方案", "transition": "转场/剪辑方式", "sfx": "音效/配乐", "voiceover": "旁白", "subtitle": "字幕", "costume": "服装/妆造", "location": "拍摄地点", "index": 1, "angle": "景别(全景/中景/近景/特写)", "movement": "运镜(推/拉/摇/移/固定)", "description": "画面内容描述", "bgm": "BGM音乐风格", "reference": "参考样片", "note": "备注" }],',
      '  "equipment": ["专业设备清单"],',
      '  "schedule": "制作时间排期"',
      '}',
      '',
      '⚠️ 严格约束:',
      '- shotList 至少 1 个分镜 · 全部字段填写 · 从制作角度标注设备调度和技术要求',
      '- index 从 1 开始递增 · angle 填景别(全景/中景/近景/特写) · movement 填运镜方式',
      '- description 填画面内容描述 · bgm 填音乐风格 · reference 和 note 无内容填"无"',
      '- equipment 包含完整专业设备 · 含备用方案',
      '- schedule 按场景集中拍摄 · 减少换场成本',
    ].join('\n');
  }

  private _buildAcquisitionVideoPrompt(userInput: VideoInput, ctx: AssembledContext): string {
    const inputJson = JSON.stringify(userInput);
    return [
      ctx.userPrompt,
      '',
      '[获客视频脚本任务 · acquisition mode]',
      `用户输入: ${inputJson}`,
      '',
      '请以 JSON 格式返回获客视频方案:',
      '{',
      '  "script": "完整视频脚本文案(至少 100 字 · 含钩子+价值+CTA · 转化导向)",',
      '  "cta": "明确行动号召(至少 10 字 · 具体可操作：扫码/私信/点击链接)",',
      '  "conversionPath": "转化路径描述(视频→CTA行动→落地页→成交)",',
      '  "keyMessages": ["核心卖点1", "核心卖点2"]',
      '}',
      '',
      '⚠️ 严格约束:',
      '- script 前 5 秒必须命中痛点 · CTA 出现在中段和结尾',
      '- cta 必须具体可操作 · 不能模糊',
      '- keyMessages 最多 3 个 · 聚焦核心转化点',
    ].join('\n');
  }

  private _buildStoryboardPrompt(userInput: VideoInput, ctx: AssembledContext): string {
    const inputJson = JSON.stringify(userInput);
    return [
      ctx.userPrompt,
      '',
      '[AI 分镜故事板任务 · storyboard mode]',
      `用户输入: ${inputJson}`,
      '',
      '请以 JSON 格式返回 5-8 场景的完整故事板:',
      '{',
      '  "title": "视频标题",',
      '  "totalDuration": "总时长(如: 60s)",',
      '  "scenes": [',
      '    {',
      '      "index": 1,',
      '      "description": "场景中文描述(至少 20 字)",',
      '      "imagePromptEn": "English-only ASCII image generation prompt, >= 20 chars (Stable Diffusion / DALL-E format)",',
      '      "duration": "时长(如: 5s)"',
      '    }',
      '  ]',
      '}',
      '',
      '⚠️ 严格约束:',
      '- scenes 必须 5-8 个 · 构成完整叙事弧线',
      '- description 每场景至少 20 字符 · 中文描述场景内容与画面',
      '- imagePromptEn 必须是纯英文 ASCII · 不含任何中文 · 至少 20 字符 · 格式: "subject, setting, lighting, style"',
      '- imagePromptEn 示例: "Professional woman in modern office, warm bokeh lighting, cinematic portrait"',
    ].join('\n');
  }
}

// REJ-004: 单例 export — tRPC router 直接用此实例
export const videoAgent = new VideoAgent();
