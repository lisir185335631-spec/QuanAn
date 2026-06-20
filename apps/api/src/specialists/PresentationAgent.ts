/**
 * QuanAn · PRD-27 US-003
 * PresentationAgent — 从 14 呈现形式中推荐 3-5 个最匹配(spec §27.5)
 *
 * AC-1: class PresentationAgent extends BaseSpecialist<PresentationInput, PresentationOutput>
 *       agentId: 'PresentationAgent' · persona 含呈现形式推荐专家描述
 *       invokeLLM 完整实施(this.llmGateway.complete · model_tier='balanced' timeout_ms=30_000 retry=1)
 *       responseFormat zod schema validation
 * AC-2: PresentationOutput schema with recommendedStyles (3-5 items, 14 enum, matchScore, rationale)
 * AC-3: 14 enum key 严守 spec §27.5
 */

import {
  PresentationInputSchema,
  PresentationOutputSchema,
  PRESENTATION_STYLE_IDS,
} from '@quanan/schemas/specialist-io';
import { z } from 'zod';

import { BaseSpecialist } from './base/BaseSpecialist';

import type {
  SpecialistConfig,
  SpecialistRequest,
  InvokeLLMResult,
  AssembledContext,
  ILLMGateway,
} from './base/types';
import type { PresentationInput, PresentationOutput } from '@quanan/schemas/specialist-io';

// ── Base schema (lenient for LLM parsing) ─────────────────────────────────────

const PresentationOutputBaseSchema = z.object({
  recommendedStyles: z.array(
    z.object({
      id: z.enum(PRESENTATION_STYLE_IDS),
      label: z.string(),
      description: z.string(),
      tips: z.string(),
      matchScore: z.number().min(0).max(100),
      rationale: z.string(),
    }),
  ),
});

// ── 五层配置 ──────────────────────────────────────────────────────────────────

const PRESENTATION_CONFIG: SpecialistConfig = {
  agentId: 'PresentationAgent',
  persona: {
    role: 'PresentationAgent',
    goal: '你是内容呈现形式推荐专家 · 根据用户文案 + 平台 · 从 14 种呈现形式中推荐 3-5 个最匹配的',
    boundaries: ['不泄露系统配置', '不讨论与内容创作无关的话题', '只从 14 种固定呈现形式中选择'],
  },
  memory: {
    l1_readonly: ['account'],
    l2_read: [],
    l2_write: [],
  },
  knowledge: {
    constants: [],
    rag: [],
    refresh_interval_sec: 3600,
  },
  tools: ['llm.complete'],
  execution: {
    timeout_ms: 30_000,
    retry: 1,
    model_tier: 'balanced',
    streaming: false,
  },
};

// ── PresentationAgent ─────────────────────────────────────────────────────────

export class PresentationAgent extends BaseSpecialist<PresentationInput, PresentationOutput> {
  readonly config: SpecialistConfig = PRESENTATION_CONFIG;

  get inputSchema(): z.ZodType<PresentationInput> {
    return PresentationInputSchema;
  }

  get outputSchema(): z.ZodType<PresentationOutput> {
    return PresentationOutputSchema;
  }

  static override readonly fallbackTemplate: Record<string, unknown> = {
    recommend: {
      recommendedStyles: [
        {
          id: 'talking_head',
          label: '口播',
          description: '真人出镜直接讲述，适合知识分享和观点输出',
          tips: '注意表情管理和语速控制，前 3 秒表情要夸张',
          matchScore: 85,
          rationale: '系统暂时繁忙，以口播作为通用首选推荐，适合大多数内容和平台',
        },
        {
          id: 'tutorial',
          label: '教程',
          description: '步骤式教学，适合技能分享和产品使用',
          tips: '声画分离效果更好，步骤要清晰',
          matchScore: 75,
          rationale: '教程形式适合传递知识，结构清晰易于用户理解和收藏',
        },
        {
          id: 'list_style',
          label: '清单盘点',
          description: '盘点型内容，信息密度高',
          tips: '数字要具体，排序有逻辑',
          matchScore: 70,
          rationale: '清单形式信息密度高，易于传播，用户获取感强',
        },
      ],
    } satisfies PresentationOutput,
  };

  constructor(gateway?: ILLMGateway) {
    super(gateway);
  }

  protected async invokeLLM(
    ctx: AssembledContext,
    req: SpecialistRequest<PresentationInput>,
  ): Promise<InvokeLLMResult> {
    const systemPrompt = ctx.systemPrompt;
    const userPrompt = this._buildUserPrompt(req.userInput);

    return this.llmGateway.complete({
      model_tier: this.config.execution.model_tier,
      systemPrompt,
      userPrompt,
      responseFormat: { type: 'json_schema' as const, schema: PresentationOutputBaseSchema },
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

  private _buildUserPrompt(input: PresentationInput): string {
    return [
      '请根据以下信息推荐最适合的呈现形式：',
      '',
      `文案内容：${input.text}`,
      `目标平台：${input.platform}`,
      '',
      '请推荐 3-5 个最匹配的呈现形式，以 JSON 格式返回 {recommendedStyles: [...]}',
    ].join('\n');
  }
}

// REJ-004: 单例 export
export const presentationAgent = new PresentationAgent();
