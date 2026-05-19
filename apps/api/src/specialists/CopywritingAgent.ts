/**
 * QuanAn · PRD-4 US-009 + PRD-5 US-002
 * CopywritingAgent — step7(爆款文案·SSE·markdown) + free(/generate) + boom(/boom-generate)
 *
 * AC-1:  继承 BaseSpecialist · 五层配置完整
 * AC-2:  outputSchema getter · step7→CopywritingOutputSchema / free→copywritingFreeOutput /
 *        boom→boomOutput / acquisition→throw 'Not implemented · PRD-6'(D-035)
 * AC-3:  invokeLLM step7/free/boom 均走 SSE stream · _consumeStream 复用
 * AC-9:  tools=['llm.stream'] · streaming=true · timeout_ms=60000
 * SHIELD REJ-001: no direct SDK import
 * SHIELD REJ-002: single stream call · 不在 Specialist 内 loop
 * SHIELD REJ-003/D-019: model from stream meta chunk · no hardcoding
 * SHIELD REJ-007: outputSchema getter 按 mode
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
import type { AcquisitionCopywritingOutput } from '@quanan/schemas/specialist-io';

// ── Mode type ─────────────────────────────────────────────────────────────────

export type CopywritingMode = 'step7' | 'free' | 'boom' | 'acquisition';

// ── step7 output schema ───────────────────────────────────────────────────────

export const CopywritingOutputSchema = z
  .object({
    markdown: z.string().min(500),
    structure: z.string(),
    hooks: z.array(z.string()).min(1),
    cta: z.string(),
  })
  .refine((v) => /^# .+/m.test(v.markdown), {
    message: '必含 # 标题 heading',
  });

// Base schemas for responseFormat (no min/length constraints — avoids JSON schema issues)
const CopywritingBaseSchema = z.object({
  markdown: z.string(),
  structure: z.string(),
  hooks: z.array(z.string()),
  cta: z.string(),
});

const CopywritingFreeBaseSchema = z.object({
  markdown: z.string(),
  metadata: z.object({
    scriptType: z.string(),
    elements: z.array(z.string()),
    structureSummary: z.string(),
    estimatedDuration: z.string(),
  }),
});

const BoomBaseSchema = z.object({
  candidates: z.array(z.string()),
  metadata: z.object({
    count: z.number(),
    elements: z.array(z.string()),
  }),
});

// free mode output schema (inline equiv of @quanan/schemas copywritingFreeOutput)
// Note: Zod schemas inlined — @quanan/schemas/specialist-io has canonical definition for client use
export const CopywritingFreeOutputSchema = z.object({
  markdown: z.string().min(400).max(1500),
  metadata: z.object({
    scriptType: z.string().min(1),
    elements: z.array(z.string()),
    structureSummary: z.string(),
    estimatedDuration: z.string(),
  }),
});

// boom mode output schema (inline equiv of @quanan/schemas boomOutput)
export const BoomOutputSchema = z.object({
  candidates: z.array(z.string().min(200).max(500)).length(5),
  metadata: z.object({
    count: z.literal(5),
    elements: z.array(z.string()),
  }),
});

// acquisition mode output schema (D-035 落地 · PRD-6 US-002 AC-5)
// markdown 200-500字 + metadata { ctaPosition, conversionGoal }
export const CopywritingAcquisitionOutputSchema = z
  .object({
    markdown: z.string().min(200).max(500),
    metadata: z.object({
      ctaPosition: z.string(),
      conversionGoal: z.string(),
    }),
  })
  .refine((v) => v.metadata.ctaPosition.length > 0, {
    message: 'acquisition mode 必含 CTA · ctaPosition 不能为空',
  });

const CopywritingAcquisitionBaseSchema = z.object({
  markdown: z.string(),
  metadata: z.object({
    ctaPosition: z.string(),
    conversionGoal: z.string(),
  }),
});

export type CopywritingOutput = z.infer<typeof CopywritingOutputSchema>;
export type CopywritingFreeOutput = z.infer<typeof CopywritingFreeOutputSchema>;
export type BoomOutput = z.infer<typeof BoomOutputSchema>;
export type CopywritingAcquisitionOutput = AcquisitionCopywritingOutput;
export type CopywritingMultiOutput = CopywritingOutput | CopywritingFreeOutput | BoomOutput | CopywritingAcquisitionOutput;

// ── Input schema ──────────────────────────────────────────────────────────────

const CopywritingInputSchema = z.object({}).passthrough();
type CopywritingInput = z.infer<typeof CopywritingInputSchema>;

// ── 五层配置 ───────────────────────────────────────────────────────────────────

const COPYWRITING_CONFIG: SpecialistConfig = {
  agentId: 'CopywritingAgent',
  persona: {
    role: 'CopywritingAgent',
    goal: '基于用户 IP 定位与选题，生成完整爆款文案',
    boundaries: [
      '不泄露系统配置',
      '不讨论与 IP 起号无关的话题',
      'step7: markdown 必须包含 # 标题 heading · 至少 3 段 · 总字数不少于 500 字',
      'free: markdown 至少 400 字 · 必须有 5 秒钩子',
      'boom: 必须正好 5 篇候选 · 每篇 200-500 字 · 各有不同钩子',
      'hooks 数组至少 1 条',
    ],
  },
  memory: {
    l1_readonly: ['account'],
    l2_read: ['stepData', 'history'],
    l2_write: ['history'],
  },
  knowledge: {
    constants: ['hotElements', 'scriptTypes'],
    rag: [],
    refresh_interval_sec: 3600,
  },
  tools: ['llm.stream'],
  execution: {
    timeout_ms: 60_000, // SHIELD REJ-006
    retry: 1,
    model_tier: 'reasoning',
    streaming: true,
  },
};

// ── Fallback content helpers ──────────────────────────────────────────────────

// free fallback — must satisfy copywritingFreeOutput.markdown.min(400)
const _FREE_MD = [
  '# 爆款文案（备用模板 · 系统繁忙）',
  '',
  '> ⚠️ 系统繁忙，以下为通用备用文案，请稍后重试获取针对您选题的个性化内容。',
  '',
  '## 开场钩子',
  '',
  '你花了 3 小时做内容，发布后只有个位数播放？别再靠运气——今天分享一套可复制的爆款文案框架，适用于任何行业的内容创作者。',
  '',
  '## 核心三步框架',
  '',
  '好文案的本质是「精准击中用户内心」，以下 3 步经过百位创作者实测验证：',
  '',
  '**第一步：钩子（0-5秒）**',
  '用问句、数字或悬念瞬间抓注意力，让目标用户觉得「这说的就是我」，才能停下来看完整内容，算法也因此把你的内容推给更多相似用户。',
  '',
  '**第二步：价值输出**',
  '给出可操作的干货，不说废话，每句话都要让读者觉得「有用·有趣·有共鸣」，具体案例优于抽象道理，数据优于模糊感受，场景优于泛泛而谈。',
  '',
  '**第三步：行动引导**',
  '结尾明确 CTA，例如：「关注我，每天分享一个可直接用的创作技巧，帮你少走三年弯路，快速建立自己的内容影响力」。',
  '',
  '## 立即行动',
  '',
  '关注账号，解锁更多爆款文案模板与创作干货，欢迎在评论区分享你的创作问题与困惑。',
].join('\n');

// boom fallback — each candidate must satisfy boomOutput candidates.min(200) max(500)
// Shared suffix ≈ 150 chars; unique opening ≈ 60 chars; total per candidate ≈ 225 chars
const _BOOM_SUFFIX =
  '\n\n好的爆款内容并非偶然，它一定在开场 5 秒内触发了某种强烈的心理反应：恐惧、好奇、共鸣或冲突感。' +
  '掌握这些元素，你的内容就有更高概率被算法推给精准用户，完播率和互动率自然提升。' +
  '从今天开始，每次构思内容先选定 2-3 个核心元素设计开场钩子。关注账号，持续获取更多内容创作实战干货。';

const _BOOM_CANDS: [string, string, string, string, string] = [
  '候选1·痛点共鸣型\n\n你是不是发现，做了很久内容，粉丝就是涨不上去？其实原因只有一个：你还没找到「精准触达目标受众」的正确方式。' + _BOOM_SUFFIX,
  '候选2·数字冲击型\n\n90% 的创作者都犯了同一个错误——把太多精力放在画面制作上，却忽视了文案钩子的核心价值。开场 5 秒决定一切。' + _BOOM_SUFFIX,
  '候选3·对比反差型\n\n同样的话题，有人发出来 10 万播放，有人发出来只有 100。区别不在平台，不在运气，只在开场那句话有没有触发情绪反应。' + _BOOM_SUFFIX,
  '候选4·好奇悬念型\n\n研究了 1000 条爆款内容，我发现它们都有一个共同结构：让用户在前 3 秒产生「我要知道答案」的冲动，然后用内容兑现这个承诺。' + _BOOM_SUFFIX,
  '候选5·权威背书型\n\n内容创作方法论告诉我们：基于心理学元素设计的内容，完播率平均高出普通内容 40% 以上。今天教你如何把这套方法落地到自己的 IP 账号。' + _BOOM_SUFFIX,
];

// ── CopywritingAgent ──────────────────────────────────────────────────────────

export class CopywritingAgent extends BaseSpecialist<CopywritingInput, CopywritingMultiOutput> {
  /**
   * Stores the mode for the current invocation.
   * Set in invokeLLM() BEFORE BaseSpecialist calls this.outputSchema.safeParse().
   * (SHIELD REJ-007: outputSchema getter 按 mode 返回对应 schema)
   */
  private _mode: CopywritingMode = 'step7';

  readonly config: SpecialistConfig = COPYWRITING_CONFIG;
  readonly inputSchema = CopywritingInputSchema;

  // SHIELD REJ-007: getter per mode (AC-6 — 4 mode 全 cover · D-035 落地 PRD-6 US-002)
  get outputSchema(): z.ZodType<CopywritingMultiOutput> {
    if (this._mode === 'step7') return CopywritingOutputSchema as z.ZodType<CopywritingMultiOutput>;
    if (this._mode === 'free') return CopywritingFreeOutputSchema as z.ZodType<CopywritingMultiOutput>;
    if (this._mode === 'boom') return BoomOutputSchema as z.ZodType<CopywritingMultiOutput>;
    if (this._mode === 'acquisition') return CopywritingAcquisitionOutputSchema as z.ZodType<CopywritingMultiOutput>;
    throw new Error(`Unknown mode: ${this._mode as string}`);
  }

  // AC-8: fallback for step7 / free / boom / acquisition modes
  static override readonly fallbackTemplate: Record<string, unknown> = {
    step7: {
      markdown: [
        '# 备用辩论文案（系统繁忙）',
        '',
        '> ⚠️ 系统繁忙，以下为通用备用辩论文案，请稍后重试以获取针对您主题的个性化内容文案。',
        '',
        '#### 话题抛出',
        '',
        '**一个让内容创作者反复纠结的问题：该不该专注单一垂类？**',
        '',
        '很多人觉得"多元发展才能抓住更多流量"，也有人坚信"垂直深耕才能建立权威"。今天我们把这个问题摊开来聊——你选哪边？',
        '',
        '#### 正方',
        '',
        '**专注单一垂类，才能真正建立信任。**',
        '',
        '- 算法更容易识别你的内容方向，系统性推给精准用户',
        '- 粉丝对你的期待值清晰，关注转化率更高',
        '- 垂直领域深耕后，商业合作溢价明显（客单价高 2-5 倍）',
        '- 案例：头部美食博主均聚焦"家常菜"or"探店"单一赛道，鲜有跨界成功',
        '',
        '**结论：** 在资源有限的起号期，聚焦是最高效的路径。',
        '',
        '#### 反方',
        '',
        '**过度垂直会让你的账号失去活力和抗风险能力。**',
        '',
        '- 单一垂类内容创作者容易进入枯竭期，选题空间天花板明显',
        '- 平台算法迭代，垂类流量可能突然萎缩（如某垂类被限流）',
        '- 多元内容有助于触达不同圈层粉丝，提升账号黏性',
        '- 案例：部分千万级博主靠"生活方式"宽泛标签，反而打破圈层壁垒',
        '',
        '**结论：** 在粉丝基础扎实后，适度扩展边界才能持续增长。',
        '',
        '#### 我的立场',
        '',
        '**起号期垂直，成长期微扩张。**',
        '',
        '这不是非此即彼的选择。0-5 万粉阶段，必须聚焦垂类建立账号标签；5 万粉之后，可以在保持核心定位的前提下，向相邻领域延伸（如美食→厨房好物→生活方式）。',
        '',
        '你怎么看？评论区告诉我——你是垂类派还是多元派？',
        '',
        '**评论区引导：** 你现在的账号是聚焦垂类还是多元发展？遇到了什么问题？评论区说说你的情况，我来帮你分析。',
      ].join('\n'),
      structure: '话题抛出→正方论点→反方论点→我的立场→评论引导（辩论模板）',
      hooks: ['该不该专注单一垂类？两边都有道理，但只有一个选择是对的', '专注 vs 多元，内容创作者最纠结的问题今天说清楚'],
      cta: '评论区告诉我你的选择，我来帮你分析适合你的路径',
    } satisfies CopywritingOutput,

    free: {
      markdown: _FREE_MD,
      metadata: {
        scriptType: 'tutorial',
        elements: ['curiosity', 'contrast'],
        structureSummary: '钩子→三步框架→行动引导（通用备用）',
        estimatedDuration: '60-90 秒',
      },
    },

    boom: {
      candidates: _BOOM_CANDS,
      metadata: {
        count: 5 as const,
        elements: ['curiosity', 'contrast'],
      },
    },

    acquisition: {
      markdown: [
        '你是否正在寻找一个能帮你快速增长的解决方案？今天我们为你提供一个经过验证的方法。',
        '',
        '这套方案已经帮助数百位创作者实现了从 0 到起步的突破。我们专注于帮助 IP 创作者建立可持续的内容体系，让你的每一条内容都能为账号带来精准流量。',
        '',
        '现在就行动，扫描二维码获取你的免费咨询（系统繁忙备用文案 · 请稍后重试获取个性化内容）。',
      ].join('\n'),
      metadata: {
        ctaPosition: '结尾段落',
        conversionGoal: '扫码咨询 · 了解详情',
      },
    } satisfies CopywritingAcquisitionOutput,
  };

  constructor(gateway?: ILLMGateway) {
    super(gateway);
  }

  protected async invokeLLM(
    ctx: AssembledContext,
    req: SpecialistRequest<CopywritingInput>,
  ): Promise<InvokeLLMResult> {
    const mode = (req.mode ?? 'step7') as CopywritingMode;

    // Set _mode BEFORE any returns so outputSchema getter works correctly (SHIELD REJ-007)
    this._mode = mode;

    const gateway = this.llmGateway;
    if (!gateway.stream) {
      throw new Error('CopywritingAgent requires a streaming LLM gateway');
    }

    const streamFn = gateway.stream.bind(gateway);
    if (mode === 'step7') {
      return this._invokeStep7(ctx, req, streamFn);
    }
    if (mode === 'free') {
      // D-019: stream.meta.model captured via meta chunk, not hardcoded
      return this._invokeFree(ctx, req, streamFn);
    }
    if (mode === 'boom') {
      // D-019: stream.meta.model captured via meta chunk, not hardcoded
      return this._invokeBoom(ctx, req, streamFn);
    }
    // acquisition — D-035 落地 · PRD-6 US-002 AC-5
    return this._invokeAcquisition(ctx, req, streamFn);
  }

  private async _invokeStep7(
    ctx: AssembledContext,
    req: SpecialistRequest<CopywritingInput>,
    streamFn: NonNullable<ILLMGateway['stream']>,
  ): Promise<InvokeLLMResult> {
    const streamReq: LLMCompleteRequest = {
      model_tier: this.config.execution.model_tier,
      systemPrompt: ctx.systemPrompt,
      userPrompt: this._buildStep7UserPrompt(req.userInput, ctx),
      responseFormat: { type: 'json_schema' as const, schema: CopywritingBaseSchema },
      metadata: {
        trace_id: req.traceId ?? '',
        agentId: this.config.agentId,
        accountId: req.accountId,
        userId: 0,
      },
      timeout_ms: this.config.execution.timeout_ms,
    };

    const step7Result = await this._consumeStream(streamFn, streamReq);
    const { accumulated } = step7Result;
    let { tokens: finalTokens, model } = step7Result;

    let content: unknown;
    try {
      content = JSON.parse(accumulated);
    } catch {
      const retry = await this._consumeStream(streamFn, streamReq);
      try {
        content = JSON.parse(retry.accumulated);
        finalTokens = retry.tokens;
        model = retry.model || model;
      } catch {
        return {
          content: null,
          tokens: finalTokens ?? { prompt: 0, completion: 0, total: 0 },
          model: model || '',
          isFallback: true,
        };
      }
    }

    return {
      content,
      tokens: finalTokens ?? { prompt: 0, completion: 0, total: 0 },
      model: model || '',
    };
  }

  private async _invokeFree(
    ctx: AssembledContext,
    req: SpecialistRequest<CopywritingInput>,
    streamFn: NonNullable<ILLMGateway['stream']>,
  ): Promise<InvokeLLMResult> {
    const streamReq: LLMCompleteRequest = {
      model_tier: this.config.execution.model_tier,
      systemPrompt: ctx.systemPrompt,
      userPrompt: this._buildFreeUserPrompt(req.userInput),
      responseFormat: { type: 'json_schema' as const, schema: CopywritingFreeBaseSchema },
      metadata: {
        trace_id: req.traceId ?? '',
        agentId: this.config.agentId,
        accountId: req.accountId,
        userId: 0,
      },
      timeout_ms: this.config.execution.timeout_ms,
    };

    // D-019: stream.meta.model captured from SSE meta chunk (not hardcoded · REJ-003)
    const freeResult = await this._consumeStream(streamFn, streamReq);
    const { accumulated } = freeResult;
    let { tokens: finalTokens, model } = freeResult;

    let content: unknown;
    try {
      content = JSON.parse(accumulated);
    } catch {
      const retry = await this._consumeStream(streamFn, streamReq);
      try {
        content = JSON.parse(retry.accumulated);
        finalTokens = retry.tokens;
        model = retry.model || model;
      } catch {
        return {
          content: null,
          tokens: finalTokens ?? { prompt: 0, completion: 0, total: 0 },
          model: model || '',
          isFallback: true,
        };
      }
    }

    return {
      content,
      tokens: finalTokens ?? { prompt: 0, completion: 0, total: 0 },
      model: model || '',
    };
  }

  private async _invokeBoom(
    ctx: AssembledContext,
    req: SpecialistRequest<CopywritingInput>,
    streamFn: NonNullable<ILLMGateway['stream']>,
  ): Promise<InvokeLLMResult> {
    const streamReq: LLMCompleteRequest = {
      model_tier: this.config.execution.model_tier,
      systemPrompt: ctx.systemPrompt,
      userPrompt: this._buildBoomUserPrompt(req.userInput),
      responseFormat: { type: 'json_schema' as const, schema: BoomBaseSchema },
      metadata: {
        trace_id: req.traceId ?? '',
        agentId: this.config.agentId,
        accountId: req.accountId,
        userId: 0,
      },
      timeout_ms: this.config.execution.timeout_ms,
    };

    // D-019: stream.meta.model captured from SSE meta chunk (not hardcoded · REJ-003)
    const boomResult = await this._consumeStream(streamFn, streamReq);
    const { accumulated } = boomResult;
    let { tokens: finalTokens, model } = boomResult;

    let content: unknown;
    try {
      content = JSON.parse(accumulated);
    } catch {
      const retry = await this._consumeStream(streamFn, streamReq);
      try {
        content = JSON.parse(retry.accumulated);
        finalTokens = retry.tokens;
        model = retry.model || model;
      } catch {
        return {
          content: null,
          tokens: finalTokens ?? { prompt: 0, completion: 0, total: 0 },
          model: model || '',
          isFallback: true,
        };
      }
    }

    return {
      content,
      tokens: finalTokens ?? { prompt: 0, completion: 0, total: 0 },
      model: model || '',
    };
  }

  /** Consume SSE stream: accumulate delta text + capture final tokens + model from meta chunk */
  private async _consumeStream(
    streamFn: NonNullable<ILLMGateway['stream']>,
    req: LLMCompleteRequest,
  ): Promise<{ accumulated: string; tokens: { prompt: number; completion: number; total: number } | undefined; model: string }> {
    let accumulated = '';
    let tokens: { prompt: number; completion: number; total: number } | undefined;
    let model = '';
    for await (const streamChunk of streamFn(req)) {
      if (streamChunk.type === 'meta' && streamChunk.meta) model = streamChunk.meta.model;
      if (streamChunk.type === 'delta' && streamChunk.delta) accumulated += streamChunk.delta;
      if (streamChunk.type === 'done') tokens = streamChunk.tokens;
      if (streamChunk.type === 'error') {
        throw new Error(`LLM stream error: ${streamChunk.error?.message ?? 'unknown'}`);
      }
    }
    return { accumulated, tokens, model };
  }

  private _buildStep7UserPrompt(_userInput: CopywritingInput, _ctx: AssembledContext): string {
    return [
      '[爆款文案生成任务]',
      '',
      '请以 JSON 格式返回完整文案方案:',
      '{',
      '  "markdown": "# 爆款文案标题\\n\\n第一段正文内容...\\n\\n(必须以 # 标题开头 · 至少 3 段 · 总字数不少于 500 字)",',
      '  "structure": "内容结构说明(如:痛点引入→解决方案→案例佐证→CTA)",',
      '  "hooks": ["钩子文案 1", "钩子文案 2"],',
      '  "cta": "行动号召文案"',
      '}',
      '',
      '⚠️ 严格约束:',
      '- markdown 第一行必须是 # 开头的标题',
      '- markdown 至少包含 3 个段落 · 总字数不少于 500 字',
      '- hooks 数组至少 1 条',
    ].join('\n');
  }

  private _buildFreeUserPrompt(userInput: CopywritingInput): string {
    const input = userInput as Record<string, unknown>;
    return [
      '[自由创作文案任务]',
      '',
      `脚本类型: ${String(input['scriptType'] ?? '未指定')}`,
      `元素: ${JSON.stringify(input['elements'] ?? [])}`,
      `话题: ${String(input['topic'] ?? '未指定')}`,
      '',
      '请以 JSON 格式返回:',
      '{',
      '  "markdown": "文案正文(至少 400 字 · 必须有 5 秒钩子开场)",',
      '  "metadata": {',
      '    "scriptType": "所用脚本类型",',
      '    "elements": ["使用的元素"],',
      '    "structureSummary": "内容结构说明",',
      '    "estimatedDuration": "预计时长(如: 60-90 秒)"',
      '  }',
      '}',
      '',
      '⚠️ 严格约束:',
      '- markdown 正文至少 400 字 · 必须有 5 秒钩子开场',
      '- 基于所选脚本类型和元素组合创作',
    ].join('\n');
  }

  private async _invokeAcquisition(
    ctx: AssembledContext,
    req: SpecialistRequest<CopywritingInput>,
    streamFn: NonNullable<ILLMGateway['stream']>,
  ): Promise<InvokeLLMResult> {
    const streamReq: LLMCompleteRequest = {
      model_tier: this.config.execution.model_tier,
      systemPrompt: ctx.systemPrompt,
      userPrompt: this._buildAcquisitionUserPrompt(req.userInput),
      responseFormat: { type: 'json_schema' as const, schema: CopywritingAcquisitionBaseSchema },
      metadata: {
        trace_id: req.traceId ?? '',
        agentId: this.config.agentId,
        accountId: req.accountId,
        userId: 0,
      },
      timeout_ms: this.config.execution.timeout_ms,
    };

    const result = await this._consumeStream(streamFn, streamReq);
    const { accumulated } = result;
    let { tokens: finalTokens, model } = result;

    let content: unknown;
    try {
      content = JSON.parse(accumulated);
    } catch {
      const retry = await this._consumeStream(streamFn, streamReq);
      try {
        content = JSON.parse(retry.accumulated);
        finalTokens = retry.tokens;
        model = retry.model || model;
      } catch {
        return {
          content: null,
          tokens: finalTokens ?? { prompt: 0, completion: 0, total: 0 },
          model: model || '',
          isFallback: true,
        };
      }
    }

    return {
      content,
      tokens: finalTokens ?? { prompt: 0, completion: 0, total: 0 },
      model: model || '',
    };
  }

  private _buildAcquisitionUserPrompt(userInput: CopywritingInput): string {
    const input = userInput as Record<string, unknown>;
    return [
      '[获客文案任务 · acquisition mode]',
      '',
      `脚本类型: ${String(input['scriptType'] ?? '未指定')}`,
      `爆款元素: ${JSON.stringify(input['elements'] ?? [])}`,
      `转化目标: ${String(input['conversionGoal'] ?? '未指定')}`,
      `话题方向: ${String(input['topic'] ?? '未指定')}`,
      '',
      '请以 JSON 格式返回:',
      '{',
      '  "markdown": "获客文案正文(200-500字 · 含钩子+价值+明确CTA · 转化导向 · 结尾必须含关注/私信/点击/获取/领取等行动引导词)",',
      '  "metadata": {',
      '    "ctaPosition": "CTA 在文案中的位置(如: 结尾/中段结尾双出现)",',
      '    "conversionGoal": "转化目标描述(如: 扫码咨询/私信了解/点击链接)"',
      '  }',
      '}',
      '',
      '⚠️ 严格约束:',
      '- markdown 必须 200-500 字 · 不能超出范围',
      '- CTA 必须明确出现在文案中 · 必须含「关注」「私信」「点击」「获取」「领取」之一',
      '- ctaPosition 不能为空',
      '- 转化导向 · 每句话都服务于最终转化目标',
    ].join('\n');
  }

  private _buildBoomUserPrompt(userInput: CopywritingInput): string {
    const input = userInput as Record<string, unknown>;
    return [
      '[5 篇候选文案任务]',
      '',
      `元素: ${JSON.stringify(input['elements'] ?? [])}`,
      `主题: ${String(input['theme'] ?? input['topic'] ?? '未指定')}`,
      `行业: ${String(input['industry'] ?? '通用')}`,
      '',
      '请以 JSON 格式返回 5 个不同方向的候选文案:',
      '{',
      '  "candidates": ["候选 1(200-500 字)", "候选 2", "候选 3", "候选 4", "候选 5"],',
      '  "metadata": {',
      '    "count": 5,',
      '    "elements": ["使用的元素"]',
      '  }',
      '}',
      '',
      '⚠️ 严格约束:',
      '- 必须正好 5 篇候选 · 每篇 200-500 字',
      '- 每篇开场钩子不同 · 角度不同 · 不同情绪切入',
    ].join('\n');
  }
}

// REJ-004: 单例 export — tRPC router 直接用此实例
export const copywritingAgent = new CopywritingAgent();
