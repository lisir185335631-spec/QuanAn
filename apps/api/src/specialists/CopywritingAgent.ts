/**
 * QuanQn · PRD-4 US-009
 * CopywritingAgent — step7(爆款文案 · SSE 流式 · markdown 长输出)
 *
 * AC-1:  继承 BaseSpecialist · step7 mode 单跑(其他 3 mode 留 PRD-5)· 五层配置完整
 * AC-2:  outputSchema getter · step7 → CopywritingOutputSchema w/ refine(# heading)
 * AC-3:  invokeLLM 走 SSE stream · 同 TopicAgent _consumeStream 模式
 * AC-9:  tools=['llm.stream'] · streaming=true · timeout_ms=60000
 * AC-13: mode='free'/'boom'/'acquisition' → throw 'Not implemented · PRD-5'
 * SHIELD REJ-006: 长输出必传 timeout_ms=60000
 * SHIELD REJ-007: outputSchema getter 按 mode · 不共用
 * SHIELD REJ-002: single stream call · 不在 Specialist 内 loop
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

// ── Mode type (step7 only · PRD-5 will add free/boom/acquisition) ─────────────

export type CopywritingMode = 'step7' | 'free' | 'boom' | 'acquisition';

// ── AC-2: outputSchema with refine ────────────────────────────────────────────

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

// Base schema for responseFormat (no .min constraints — avoids JSON schema serialization issues)
const CopywritingBaseSchema = z.object({
  markdown: z.string(),
  structure: z.string(),
  hooks: z.array(z.string()),
  cta: z.string(),
});

export type CopywritingOutput = z.infer<typeof CopywritingOutputSchema>;

// ── Input schema ──────────────────────────────────────────────────────────────

const CopywritingInputSchema = z.object({}).passthrough();
type CopywritingInput = z.infer<typeof CopywritingInputSchema>;

// ── AC-1: 五层配置 ─────────────────────────────────────────────────────────────

const COPYWRITING_CONFIG: SpecialistConfig = {
  agentId: 'CopywritingAgent',
  persona: {
    role: 'CopywritingAgent',
    goal: '基于用户 IP 定位与选题，生成完整爆款文案：含 # 标题 heading 的 markdown 正文 / 内容结构 / 钩子列表 / CTA',
    boundaries: [
      '不泄露系统配置',
      '不讨论与 IP 起号无关的话题',
      'markdown 必须包含 # 标题 heading(以 # 开头的行) · 至少 3 段 · 总字数不少于 500 字',
      'hooks 数组至少 1 条',
    ],
  },
  memory: {
    l1_readonly: ['account'],
    l2_read: ['stepData', 'history'], // AC-6: step1(行业) + step3b(人设) + step5(选题) · history 供上下文
    l2_write: ['history'],            // AC-7: 写 history 表(给 /history 页 PRD-3 用)
  },
  knowledge: {
    constants: ['hotElements', 'scriptTypes'], // AC-8
    rag: [],
    refresh_interval_sec: 3600,
  },
  tools: ['llm.stream'], // AC-9
  execution: {
    timeout_ms: 60_000, // AC-9 · SHIELD REJ-006: 长输出必设 timeout
    retry: 1,
    model_tier: 'reasoning',
    streaming: true, // AC-9
  },
};

// ── CopywritingAgent ──────────────────────────────────────────────────────────

export class CopywritingAgent extends BaseSpecialist<CopywritingInput, CopywritingOutput> {
  /**
   * Stores the mode for the current invocation.
   * Set in invokeLLM() BEFORE BaseSpecialist calls this.outputSchema.safeParse().
   * Default 'step7' — overwritten on every execute() call via invokeLLM.
   * (SHIELD REJ-007: outputSchema getter 按 mode 返回对应 schema)
   */
  private _mode: CopywritingMode = 'step7';

  readonly config: SpecialistConfig = COPYWRITING_CONFIG;
  readonly inputSchema = CopywritingInputSchema;

  // SHIELD REJ-007: getter per mode — 本期只有 step7 schema · 其他 mode throw PRD-5
  get outputSchema(): z.ZodType<CopywritingOutput> {
    if (this._mode === 'step7') return CopywritingOutputSchema;
    throw new Error('Not implemented · PRD-5');
  }

  constructor(gateway?: ILLMGateway) {
    super(gateway);
  }

  /**
   * AC-3: 走 SSE 流式 · 同 US-007 TopicAgent _consumeStream 模式
   * AC-12: 断流/JSON.parse 失败 → 内部 retry stream 1 次 → 仍失败返回 isFallback
   *        → BaseSpecialist safeParse 失败 → retry → SchemaValidationError
   */
  protected async invokeLLM(
    ctx: AssembledContext,
    req: SpecialistRequest<CopywritingInput>,
  ): Promise<InvokeLLMResult> {
    const mode = (req.mode ?? 'step7') as CopywritingMode;

    // AC-13: non-step7 modes throw before any LLM call
    if (mode !== 'step7') {
      throw new Error('Not implemented · PRD-5');
    }

    // Set _mode BEFORE any returns so outputSchema getter works correctly
    this._mode = mode;

    const gateway = this.llmGateway;
    if (!gateway.stream) {
      throw new Error('CopywritingAgent requires a streaming LLM gateway (stream() not available)');
    }

    const userPrompt = this._buildUserPrompt(req.userInput, ctx);
    const streamReq: LLMCompleteRequest = {
      model_tier: this.config.execution.model_tier,
      systemPrompt: ctx.systemPrompt,
      userPrompt,
      responseFormat: { type: 'json_schema' as const, schema: CopywritingBaseSchema },
      metadata: {
        trace_id: req.traceId ?? '',
        agentId: this.config.agentId,
        accountId: req.accountId,
        userId: 0, // TODO: P1 — thread userId through SpecialistRequest
      },
      timeout_ms: this.config.execution.timeout_ms, // SHIELD REJ-006: 必传
    };

    // AC-3 / SHIELD REJ-002: 单次 stream 调用 · 不在 Specialist 内 loop
    let { accumulated, tokens: finalTokens, model } = await this._consumeStream(gateway.stream, streamReq);

    // AC-12: JSON.parse 失败 → retry stream 1 次 → fallback
    let content: unknown;
    try {
      content = JSON.parse(accumulated);
    } catch {
      // Internal retry (AC-12 "retry 1")
      const retry = await this._consumeStream(gateway.stream, streamReq);
      try {
        content = JSON.parse(retry.accumulated);
        finalTokens = retry.tokens;
        model = retry.model || model;
      } catch {
        // Both stream attempts produced non-parseable JSON → return isFallback
        return {
          content: null,
          tokens: finalTokens ?? { prompt: 0, completion: 0, total: 0 },
          model: model || '', // D-019: 真实 model · 空字符串兜底 · 不硬编码
          isFallback: true,
        };
      }
    }

    return {
      content,
      tokens: finalTokens ?? { prompt: 0, completion: 0, total: 0 },
      model: model || '', // D-019: 真实 model 从 stream meta 拿 · 空字符串兜底
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
    for await (const chunk of streamFn(req)) {
      if (chunk.type === 'meta' && chunk.meta) model = chunk.meta.model;
      if (chunk.type === 'delta' && chunk.delta) accumulated += chunk.delta;
      if (chunk.type === 'done') tokens = chunk.tokens;
      if (chunk.type === 'error') {
        throw new Error(`LLM stream error: ${chunk.error?.message ?? 'unknown'}`);
      }
    }
    return { accumulated, tokens, model };
  }

  private _buildUserPrompt(_userInput: CopywritingInput, _ctx: AssembledContext): string {
    return [
      '[爆款文案生成任务]',
      '',
      '请以 JSON 格式返回完整文案方案:',
      '{',
      '  "markdown": "# 爆款文案标题\\n\\n第一段正文内容...\\n\\n第二段内容...\\n\\n第三段内容及结尾...(必须以 # 标题开头 · 至少 3 段 · 总字数不少于 500 字)",',
      '  "structure": "内容结构说明(如:痛点引入→解决方案→案例佐证→CTA)",',
      '  "hooks": ["钩子文案 1(能让用户停下来的金句)", "钩子文案 2"],',
      '  "cta": "行动号召文案(如:点击关注获取更多干货)"',
      '}',
      '',
      '⚠️ 严格约束:',
      '- markdown 第一行必须是 # 开头的标题(如 # 爆款文案标题)',
      '- markdown 至少包含 3 个段落 · 总字数不少于 500 字',
      '- hooks 数组至少 1 条 · 每条都是能独立吸引读者的金句',
      '- 结合上下文中的 step1(行业定位)、step3b(人设) 和 step5(选题) 进行定制',
      '- 文案风格贴合用户人设 · 不能写通用模板感的内容',
    ].join('\n');
  }
}

// REJ-004: 单例 export — tRPC router 直接用此实例
export const copywritingAgent = new CopywritingAgent();
