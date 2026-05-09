/**
 * QuanQn · PRD-4 US-009 + PRD-5 US-002
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

// free mode output schema (inline equiv of @quanqn/schemas copywritingFreeOutput)
// Note: Zod schemas inlined — @quanqn/schemas/specialist-io has canonical definition for client use
export const CopywritingFreeOutputSchema = z.object({
  markdown: z.string().min(400).max(1500),
  metadata: z.object({
    scriptType: z.string().min(1),
    elements: z.array(z.string()),
    structureSummary: z.string(),
    estimatedDuration: z.string(),
  }),
});

// boom mode output schema (inline equiv of @quanqn/schemas boomOutput)
export const BoomOutputSchema = z.object({
  candidates: z.array(z.string().min(200).max(500)).length(5),
  metadata: z.object({
    count: z.literal(5),
    elements: z.array(z.string()),
  }),
});

export type CopywritingOutput = z.infer<typeof CopywritingOutputSchema>;
export type CopywritingFreeOutput = z.infer<typeof CopywritingFreeOutputSchema>;
export type BoomOutput = z.infer<typeof BoomOutputSchema>;
export type CopywritingMultiOutput = CopywritingOutput | CopywritingFreeOutput | BoomOutput;

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

  // SHIELD REJ-007: getter per mode (AC-6 — 4 mode 全 cover)
  get outputSchema(): z.ZodType<CopywritingMultiOutput> {
    if (this._mode === 'step7') return CopywritingOutputSchema as z.ZodType<CopywritingMultiOutput>;
    if (this._mode === 'free') return CopywritingFreeOutputSchema as z.ZodType<CopywritingMultiOutput>;
    if (this._mode === 'boom') return BoomOutputSchema as z.ZodType<CopywritingMultiOutput>;
    if (this._mode === 'acquisition') throw new Error('Not implemented · PRD-6'); // D-035
    throw new Error(`Unknown mode: ${this._mode as string}`);
  }

  // AC-8: fallback for step7 / free / boom modes
  static override readonly fallbackTemplate: Record<string, unknown> = {
    step7: {
      markdown: [
        '# 备用内容文案（系统繁忙）',
        '',
        '> ⚠️ 系统繁忙，以下为通用备用文案，请稍后重试以获取针对您 IP 定位的个性化内容文案。',
        '',
        '## 内容主题',
        '',
        '你是否曾经想过，如何在内容创作领域快速建立自己的影响力？今天我将分享一个经过多位头部创作者验证的内容创作框架，帮助你在竞争激烈的市场中脱颖而出，建立属于自己的内容品牌。',
        '',
        '## 核心价值观',
        '',
        '内容创作的成功，从来不是偶然的。优秀的创作者都掌握了一个共同的秘诀：**持续输出有价值的内容，并与受众建立真实的情感连接**。这种连接不仅仅是点赞和评论，而是一种基于信任的长期关系，是你的账号真正实现变现的基础。',
        '',
        '不管你目前是刚起步的新手，还是已经有一定粉丝基础的创作者，以下这个框架都能帮助你突破瓶颈，实现持续稳定的增长：',
        '',
        '1. **明确你的价值主张** — 你能为观众提供什么独特价值？清晰的定位是一切内容的起点，也是用户选择关注你而不是别人的核心理由。',
        '2. **保持内容一致性** — 稳定的更新频率帮助你建立用户习惯和期待感，让粉丝知道什么时候能看到你的新内容。',
        '3. **积极与受众互动** — 评论区的互动是增长最重要的信号，也是建立社区氛围、提升账号活跃度的最佳方式。',
        '4. **数据驱动内容优化** — 用数据说话，不靠感觉，让数字告诉你什么样的内容真正有效，持续迭代提升。',
        '',
        '## 行动引导',
        '',
        '现在就开始行动吧！关注我，我将持续分享更多 IP 起号实战干货，帮助你在内容创作的道路上走得更远、更稳。',
      ].join('\n'),
      structure: '钩子→痛点共鸣→价值框架→行动引导（通用模板）',
      hooks: ['你是否还在为内容没有流量而烦恼？', '3 步打造爆款内容，90% 的创作者不知道'],
      cta: '点击关注，获取更多 IP 起号实战干货',
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
  };

  constructor(gateway?: ILLMGateway) {
    super(gateway);
  }

  protected async invokeLLM(
    ctx: AssembledContext,
    req: SpecialistRequest<CopywritingInput>,
  ): Promise<InvokeLLMResult> {
    const mode = (req.mode ?? 'step7') as CopywritingMode;

    if (mode === 'acquisition') {
      throw new Error('Not implemented · PRD-6'); // D-035
    }

    // Set _mode BEFORE any returns so outputSchema getter works correctly
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
    // boom
    // D-019: stream.meta.model captured via meta chunk, not hardcoded
    return this._invokeBoom(ctx, req, streamFn);
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
