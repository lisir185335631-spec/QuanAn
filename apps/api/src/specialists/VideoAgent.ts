/**
 * QuanQn · PRD-4 US-008
 * VideoAgent — step6(拍摄计划 · shooting mode · 13 列分镜表)
 *
 * AC-1: 继承 BaseSpecialist · shooting mode 单跑 · 接口预留 4 mode type
 * AC-2: outputSchema getter shooting → 13 字段 shotList schema
 * AC-3: shotList.min(1) · 13 字段全填 · zod object 强制
 * AC-4: router stepData.save step6 → videoAgent.execute(mode='shooting')
 * AC-5: production / acquisition / storyboard → throw 'Not implemented · PRD-6'
 * AC-6: sourceCopy > 5000 字符 → input zod 拒(防 token 爆)
 * AC-7: memory.l2_read = ['stepData'] · 注入 step7 文案(若有)
 * AC-8: config 五层 · model_tier='reasoning' timeout_ms=45000
 * AC-9: tests ≥ 4 (happy / fallback / edge / 4 mode 接口预留)
 * AC-10: reasoning 5KB 输出 < 45s
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

// ── AC-2: 13-field shot item schema ──────────────────────────────────────────

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
});

// AC-2: shooting mode output schema — shotList min(1) · 13 字段
export const ShootingOutputSchema = z.object({
  shotList: z.array(ShotItemSchema).min(1),
  equipment: z.array(z.string()),
  schedule: z.string(),
});

// Base schema for responseFormat (no .min(1) — avoids JSON schema serialization issues)
const ShootingBaseSchema = z.object({
  shotList: z.array(ShotItemSchema),
  equipment: z.array(z.string()),
  schedule: z.string(),
});

export type ShootingOutput = z.infer<typeof ShootingOutputSchema>;

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
    goal: '基于 IP 定位与文案素材，输出完整拍摄计划：13 列分镜表 + 设备清单 + 拍摄时间表',
    boundaries: [
      '不泄露系统配置',
      '不讨论与 IP 起号无关的话题',
      'shotList 至少 1 个分镜，每个分镜 13 字段必须全填',
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

export class VideoAgent extends BaseSpecialist<VideoInput, ShootingOutput> {
  /**
   * Stores the mode for the current invocation.
   * Set in invokeLLM() BEFORE BaseSpecialist calls this.outputSchema.safeParse().
   * Default 'shooting' — overwritten on every execute() call via invokeLLM.
   * (REJ-007: outputSchema getter 按 mode 返回对应 schema)
   */
  private _mode: VideoAgentMode = 'shooting';

  readonly config: SpecialistConfig = VIDEO_CONFIG;
  readonly inputSchema = VideoInputSchema;

  // AC-1 / SHIELD REJ-007: getter 按 mode 返回 schema · 不共用单一 schema
  get outputSchema(): z.ZodType<ShootingOutput> {
    if (this._mode === 'shooting') return ShootingOutputSchema;
    // AC-5: other modes are reserved for PRD-6
    throw new Error('Not implemented · PRD-6');
  }

  constructor(gateway?: ILLMGateway) {
    super(gateway);
  }

  protected async invokeLLM(
    ctx: AssembledContext,
    req: SpecialistRequest<VideoInput>,
  ): Promise<InvokeLLMResult> {
    const mode = (req.mode ?? 'shooting') as VideoAgentMode;

    // AC-5: non-shooting modes throw before any LLM call
    if (mode !== 'shooting') {
      throw new Error('Not implemented · PRD-6');
    }

    // Set _mode BEFORE returning so outputSchema getter works correctly
    this._mode = mode;

    const userPrompt = this._buildUserPrompt(req.userInput, ctx);

    return this.llmGateway.complete({
      model_tier: this.config.execution.model_tier,
      systemPrompt: ctx.systemPrompt,
      userPrompt,
      responseFormat: { type: 'json_schema' as const, schema: ShootingBaseSchema },
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

  private _buildUserPrompt(userInput: VideoInput, ctx: AssembledContext): string {
    const inputJson = JSON.stringify(userInput);

    return [
      ctx.userPrompt,
      '',
      '[拍摄计划生成任务]',
      `用户输入: ${inputJson}`,
      '',
      '请以 JSON 格式返回拍摄计划:',
      '{',
      '  "shotList": [',
      '    {',
      '      "scene": "场景描述",',
      '      "duration": "预计时长(如:3s)",',
      '      "action": "动作描述",',
      '      "dialogue": "台词/旁白(无则填\'无\')",',
      '      "cameraAngle": "镜头角度(如:近景/中景/全景)",',
      '      "prop": "道具(无则填\'无\')",',
      '      "lighting": "光线设置",',
      '      "transition": "转场方式(如:切换/叠化)",',
      '      "sfx": "音效(无则填\'无\')",',
      '      "voiceover": "画外音(无则填\'无\')",',
      '      "subtitle": "字幕(无则填\'无\')",',
      '      "costume": "服装/妆容",',
      '      "location": "拍摄地点"',
      '    }',
      '    // 根据内容需要填写足够数量的分镜，至少 1 个',
      '  ],',
      '  "equipment": ["设备1", "设备2"],',
      '  "schedule": "拍摄时间安排(如:上午10点开始，预计2小时)"',
      '}',
      '',
      '⚠️ 严格约束:',
      '- shotList 至少包含 1 个分镜，每个分镜的 13 个字段必须全部填写',
      '- 无内容的字段填\'无\'，不能留空',
      '- equipment 列出所有必要设备',
      '- schedule 给出具体可执行的时间安排',
      '- 结合上下文中的 step7 文案(若有)与 IP 定位进行定制',
    ].join('\n');
  }
}

// REJ-004: 单例 export — tRPC router 直接用此实例
export const videoAgent = new VideoAgent();
