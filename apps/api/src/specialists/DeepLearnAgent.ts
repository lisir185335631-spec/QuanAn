/**
 * QuanAn · PRD-27 US-004
 * DeepLearnAgent — /deep-learning 深度学习批量样本分析
 * AC-4: system prompt '你是文案深度学习专家…' + 5维度输出 + model_tier='reasoning' timeout_ms=60_000 retry=1
 */

import { z } from 'zod';

import { BaseSpecialist } from './base/BaseSpecialist';

import type { AssembledContext, ILLMGateway, InvokeLLMResult, SpecialistConfig, SpecialistRequest } from './base/types';

// ── Legacy I/O (backward compat) ─────────────────────────────────────────────

export const deepLearnInput = z.object({
  sample: z.string().min(10).max(5000),
  sampleType: z.enum(['text', 'url']),
});

export const deepLearnOutput = z.object({
  styleVector: z.record(z.string(), z.number()),
  tags: z.array(z.string()).max(10),
  summary: z.string().max(500),
});

// ── Batch I/O (US-004) ────────────────────────────────────────────────────────

export const deepLearnBatchInput = z.object({
  samples: z
    .array(
      z.object({
        text: z.string().min(10).max(20000),
        source: z.string().min(1).max(200),
      }),
    )
    .min(1)
    .max(20),
});

export const deepLearnBatchOutput = z.object({
  summary: z.string().min(1),
  dimensions: z.object({
    tone: z.string().min(1),
    structure: z.string().min(1),
    hook: z.string().min(1),
    transition: z.string().min(1),
    closing: z.string().min(1),
  }),
});

export type DeepLearnBatchInput = z.infer<typeof deepLearnBatchInput>;
export type DeepLearnBatchOutput = z.infer<typeof deepLearnBatchOutput>;

// ── Config ────────────────────────────────────────────────────────────────────

const DEEP_LEARN_CONFIG: SpecialistConfig = {
  agentId: 'DeepLearnAgent',
  persona: {
    role: 'DeepLearnAgent',
    goal: '你是文案深度学习专家 · 用户提供 N 篇文案 · 拆段分析共性 + 总结 5 维度(语气/结构/钩子/转折/收尾)',
    boundaries: ['只分析传入样本 · 不做外部搜索'],
  },
  memory: { l1_readonly: ['account'], l2_read: [], l2_write: ['deep_learning_archive'] },
  knowledge: { constants: [], rag: [], refresh_interval_sec: 86400 },
  tools: [],
  execution: { timeout_ms: 60_000, retry: 1, model_tier: 'reasoning', streaming: false },
};

// ── Base schema for LLM response parsing ─────────────────────────────────────

const DeepLearnBatchBaseSchema = z.object({
  summary: z.string(),
  dimensions: z.object({
    tone: z.string(),
    structure: z.string(),
    hook: z.string(),
    transition: z.string(),
    closing: z.string(),
  }),
});

// ── DeepLearnAgent ────────────────────────────────────────────────────────────

export class DeepLearnAgent extends BaseSpecialist<DeepLearnBatchInput, DeepLearnBatchOutput> {
  readonly config = DEEP_LEARN_CONFIG;
  readonly inputSchema = deepLearnBatchInput;
  readonly outputSchema = deepLearnBatchOutput;

  static override readonly fallbackTemplate: Record<string, unknown> = {
    default: {
      summary: '系统繁忙，暂时无法完成文案深度分析。建议稍后重试。',
      dimensions: {
        tone: '暂无分析结果',
        structure: '暂无分析结果',
        hook: '暂无分析结果',
        transition: '暂无分析结果',
        closing: '暂无分析结果',
      },
    },
  };

  constructor(gateway?: ILLMGateway) {
    super(gateway);
  }

  protected async invokeLLM(
    _ctx: AssembledContext,
    req: SpecialistRequest<DeepLearnBatchInput>,
  ): Promise<InvokeLLMResult> {
    const systemPrompt = this._buildSystemPrompt();
    const userPrompt = this._buildUserPrompt(req.userInput);

    return this.llmGateway.complete({
      model_tier: this.config.execution.model_tier,
      systemPrompt,
      userPrompt,
      responseFormat: { type: 'json_schema' as const, schema: DeepLearnBatchBaseSchema },
      metadata: {
        trace_id: req.traceId ?? '',
        agentId: this.config.agentId,
        accountId: req.accountId,
        userId: 0,
        eventType: 'specialist_call',
      },
      timeout_ms: this.config.execution.timeout_ms,
      retry: this.config.execution.retry,
    });
  }

  private _buildSystemPrompt(): string {
    return [
      '你是文案深度学习专家，用户提供 N 篇优秀文案样本，你需要：',
      '1. 拆段分析各篇文案的写作共性',
      '2. 总结以下 5 个核心维度的规律：',
      '   - 语气(tone): 整体语气风格特征',
      '   - 结构(structure): 文章结构和段落布局规律',
      '   - 钩子(hook): 开头吸引注意力的技巧',
      '   - 转折(transition): 段落间过渡和转折方式',
      '   - 收尾(closing): 结尾引导行动的策略',
      '',
      '请以 JSON 格式输出，包含 summary(总体特征摘要)和 dimensions(5 个维度的详细分析)。',
      '每个维度描述需具体、可操作，100-300 字为宜。',
    ].join('\n');
  }

  private _buildUserPrompt(input: DeepLearnBatchInput): string {
    const sampleTexts = input.samples
      .map((s, i) => `## 样本 ${i + 1}（来源：${s.source}）\n${s.text}`)
      .join('\n\n---\n\n');

    return [
      `请分析以下 ${input.samples.length} 篇文案样本，总结共性规律：`,
      '',
      sampleTexts,
    ].join('\n');
  }
}

export const deepLearnAgent = new DeepLearnAgent();
