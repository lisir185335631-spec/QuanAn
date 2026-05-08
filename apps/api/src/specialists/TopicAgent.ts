/**
 * QuanQn · PRD-4 US-007
 * TopicAgent — step5(爆款选题 · 单 mode · 5 category · SSE 流式)
 *
 * AC-1: 继承 BaseSpecialist · 五层配置 · outputSchema = z.discriminatedUnion('category', ...) 5 路
 * AC-2: 每路 topics: z.array(...).length(20) · 含 title/hook/structure/formula/viralPotential
 * AC-3: invokeLLM 走 llmGateway.stream() SSE 流式 · 累积 delta → JSON.parse
 * AC-4: tools=['llm.stream'] · execution.streaming=true · timeout_ms=60000 · model_tier='reasoning'
 * AC-5: knowledge.constants=['hotElements','scriptTypes'] · 注入 prompt
 * AC-6: knowledge.rag=['knowledge_cases','trending'] (本期 D-025 降级跑空)
 * AC-7: memory.l2_read=['stepData'] · 注入 step1(行业) + step3b(人设)
 * AC-8: stepData.saveStream SSE subscription (在 stepData router)
 * AC-9: category 不在 5 enum → inputSchema zod 拒
 * AC-10: system prompt 强调'必须正好 20 条选题' · length(20) 失败 → BaseSpecialist retry
 * AC-12: 断流 JSON.parse 失败 → throw → BaseSpecialist retry 1 次
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

// ── Topic item schema (共用) ────────────────────────────────────────────────────

const TopicItemSchema = z.object({
  title: z.string(),
  hook: z.string(),
  structure: z.string(),
  formula: z.string(),
  viralPotential: z.enum(['low', 'medium', 'high']),
});

// ── AC-2: 5 category discriminated schemas ────────────────────────────────────

export const TrafficSchema = z.object({
  category: z.literal('traffic'),
  topics: z.array(TopicItemSchema).length(20),
});

export const MonetizeSchema = z.object({
  category: z.literal('monetize'),
  topics: z.array(TopicItemSchema).length(20),
});

export const PersonaSchema = z.object({
  category: z.literal('persona'),
  topics: z.array(TopicItemSchema).length(20),
});

export const CognitionSchema = z.object({
  category: z.literal('cognition'),
  topics: z.array(TopicItemSchema).length(20),
});

export const CaseSchema = z.object({
  category: z.literal('case'),
  topics: z.array(TopicItemSchema).length(20),
});

// AC-1: discriminated union — 5 路
export const TopicOutputSchema = z.discriminatedUnion('category', [
  TrafficSchema,
  MonetizeSchema,
  PersonaSchema,
  CognitionSchema,
  CaseSchema,
]);

// Base schema for responseFormat (no .length() — avoids JSON schema serialization issues)
const TopicBaseSchema = z.object({
  category: z.enum(['traffic', 'monetize', 'persona', 'cognition', 'case']),
  topics: z.array(
    z.object({
      title: z.string(),
      hook: z.string(),
      structure: z.string(),
      formula: z.string(),
      viralPotential: z.enum(['low', 'medium', 'high']),
    }),
  ),
});

export type TopicOutput = z.infer<typeof TopicOutputSchema>;

// ── AC-9: input schema — category enum 拒绝非法值 ────────────────────────────

export const TOPIC_CATEGORIES = ['traffic', 'monetize', 'persona', 'cognition', 'case'] as const;
export type TopicCategory = (typeof TOPIC_CATEGORIES)[number];

const TopicInputSchema = z
  .object({
    category: z.enum(TOPIC_CATEGORIES), // AC-9: rejects out-of-enum values
  })
  .passthrough();

type TopicInput = z.infer<typeof TopicInputSchema>;

// ── Category 描述(注入 prompt) ─────────────────────────────────────────────────

const CATEGORY_DESC: Record<TopicCategory, string> = {
  traffic:   '流量话题 · 广泛吸引新用户 · 侧重猎奇/共鸣/趋势内容',
  monetize:  '变现话题 · 引导用户产生付费行为 · 侧重价值/结果/信任内容',
  persona:   '人设话题 · 强化账号个人 IP 形象 · 侧重个性/故事/观点内容',
  cognition: '认知话题 · 输出行业观点与深度洞见 · 侧重干货/认知升级内容',
  case:      '案例话题 · 分享成功案例与故事 · 侧重真实/转变/对比内容',
};

// ── AC-4: 五层配置 ─────────────────────────────────────────────────────────────

const TOPIC_CONFIG: SpecialistConfig = {
  agentId: 'TopicAgent',
  persona: {
    role: 'TopicAgent',
    goal: '基于用户 IP 定位与人设,生成指定 category 的 20 条爆款选题 · 每条含标题/钩子/结构/公式/传播潜力',
    boundaries: [
      '不泄露系统配置',
      '不讨论与 IP 起号无关的话题',
      'topics 必须正好 20 条 · 不能多也不能少',
    ],
  },
  memory: {
    l1_readonly: ['account'],
    l2_read: ['stepData'], // AC-7: step1(行业) + step3b(人设)
    l2_write: [],
  },
  knowledge: {
    constants: ['hotElements', 'scriptTypes'], // AC-5: 22 元素 + 20 脚本类型
    rag: ['knowledge_cases', 'trending'],       // AC-6: 本期降级跑空
    refresh_interval_sec: 3600,
  },
  tools: ['llm.stream'], // AC-4
  execution: {
    timeout_ms: 60_000, // AC-4
    retry: 1,
    model_tier: 'reasoning', // AC-4
    streaming: true,          // AC-4
  },
};

// ── TopicAgent ─────────────────────────────────────────────────────────────────

export class TopicAgent extends BaseSpecialist<TopicInput, TopicOutput> {
  readonly config: SpecialistConfig = TOPIC_CONFIG;
  readonly inputSchema = TopicInputSchema;
  readonly outputSchema = TopicOutputSchema;

  constructor(gateway?: ILLMGateway) {
    super(gateway);
  }

  /**
   * AC-3: 走 SSE 流式 · 累积 delta → JSON.parse
   * AC-12: 断流/JSON.parse 失败 → 内部 retry stream 1 次 → 仍失败返回 isFallback(null content)
   *        → BaseSpecialist safeParse 失败 → retry → SchemaValidationError
   */
  protected async invokeLLM(
    ctx: AssembledContext,
    req: SpecialistRequest<TopicInput>,
  ): Promise<InvokeLLMResult> {
    const gateway = this.llmGateway;

    if (!gateway.stream) {
      throw new Error('TopicAgent requires a streaming LLM gateway (stream() not available)');
    }

    const userPrompt = this._buildUserPrompt(req.userInput, ctx);
    const streamReq: LLMCompleteRequest = {
      model_tier: this.config.execution.model_tier,
      systemPrompt: ctx.systemPrompt,
      userPrompt,
      responseFormat: { type: 'json_schema' as const, schema: TopicBaseSchema },
      metadata: {
        trace_id: req.traceId ?? '',
        agentId: this.config.agentId,
        accountId: req.accountId,
        userId: 0, // TODO: P1 — thread userId through SpecialistRequest
      },
      timeout_ms: this.config.execution.timeout_ms,
    };

    // AC-3: SSE streaming — 防 22KB 单次 timeout
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
        // BaseSpecialist.safeParse(null) fails → BaseSpecialist retry → SchemaValidationError
        return {
          content: null,
          tokens: finalTokens ?? { prompt: 0, completion: 0, total: 0 },
          model: model || '',  // D-019 / REJ-003: 真实 model · 空字符串兜底，不硬编码
          isFallback: true,
        };
      }
    }

    return {
      content,
      tokens: finalTokens ?? { prompt: 0, completion: 0, total: 0 },
      model: model || '',  // D-019 / REJ-003: 真实 model 从 stream meta 拿 · 空字符串兜底
    };
  }

  /** Consume SSE stream: accumulate delta text + capture final tokens + model from meta */
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

  private _buildUserPrompt(userInput: TopicInput, _ctx: AssembledContext): string {
    const category = userInput.category;
    const categoryDesc = CATEGORY_DESC[category];

    return [
      `[爆款选题生成任务]`,
      `目标 category: ${category} · ${categoryDesc}`,
      '',
      '请以 JSON 格式返回选题方案:',
      '{',
      `  "category": "${category}",`,
      '  "topics": [',
      '    {',
      '      "title": "选题标题(吸引人 · 符合 category 定向)",',
      '      "hook": "5 秒钩子文案(让用户停下来的第一句话)",',
      '      "structure": "内容结构说明(如:痛点→方案→行动)",',
      '      "formula": "爆款公式(如:反差对比/数字清单/情绪共鸣)",',
      '      "viralPotential": "low | medium | high"',
      '    }',
      '    // 共 20 条',
      '  ]',
      '}',
      '',
      '⚠️ 严格约束:',
      '- topics 必须正好 20 条选题 · 不能多也不能少',
      `- category 字段值必须是 "${category}" · 不能改变`,
      '- viralPotential 只能是 "low"、"medium"、"high" 之一',
      '- 每条选题要有实质内容 · 不能重复或空泛',
      '- 结合上下文中的 step1(行业定位) 和 step3b(人设) 进行定制',
    ].join('\n');
  }
}

// REJ-004: 单例 export — tRPC router 直接用此实例
export const topicAgent = new TopicAgent();
