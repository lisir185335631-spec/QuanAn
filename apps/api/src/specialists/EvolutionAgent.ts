/**
 * QuanQn · PRD-8 US-002
 * EvolutionAgent — 骨架 (L5 · 反馈飞轮大脑)
 *
 * AC-1: 继承 BaseSpecialist · agentId='EvolutionAgent' · model_tier='reasoning' · timeout_ms=60000
 * AC-8: import type + export type re-export from @quanqn/schemas/specialist-io
 * execute(): throw 'PRD-8 US-003 真接' (真实实现留 US-003)
 */

import { EvolutionInsightContentSchema } from '@quanqn/schemas/specialist-io';
import { z } from 'zod';

import { BaseSpecialist } from './base/BaseSpecialist';

import type {
  AssembledContext,
  ILLMGateway,
  InvokeLLMResult,
  SpecialistConfig,
  SpecialistRequest,
  SpecialistResponse,
} from './base/types';

// AC-8: type re-export for downstream consumers
export type { EvolutionInsightContent } from '@quanqn/schemas/specialist-io';
export { EvolutionInsightContentSchema };

// ── Input schema (placeholder · 真实 schema PRD-8 US-003 补充) ───────────────

const evolutionAgentInput = z.object({
  accountId: z.number().int().positive(),
  triggerType: z.string(),
});

type EvolutionAgentInput = z.infer<typeof evolutionAgentInput>;
type EvolutionOutput = z.infer<typeof EvolutionInsightContentSchema>;

// ── SpecialistConfig ─────────────────────────────────────────────────────────

const EVOLUTION_CONFIG: SpecialistConfig = {
  agentId: 'EvolutionAgent',
  persona: {
    role: 'EvolutionAgent',
    goal: '把用户所有 feedback_log + DeepLearning samples 聚合成可注入 prompt 的偏好画像',
    boundaries: [
      '不编造金句 · 必须从用户实际反馈 / 样本 / 评论里提炼',
      '不放大单条负反馈 · 需看频次(≥2 条才入选)',
      '不超过 10 条 preferredCatchphrases / avoidList · 防 prompt 过长',
      'insights 必须可解释 · 每条必带 sourceFeedbackIds[] 反查',
    ],
  },
  memory: {
    l1_readonly: ['account', 'evolution_profile'],
    l2_read: ['feedback_log', 'deep_learning_archive', 'evolution_insight'],
    l2_write: ['evolution_insight'],
  },
  knowledge: {
    constants: [],
    rag: [],
    refresh_interval_sec: 86400,
  },
  tools: [],
  execution: {
    timeout_ms: 60_000,
    retry: 1,
    model_tier: 'reasoning',
    streaming: false,
  },
};

// ── EvolutionAgent ────────────────────────────────────────────────────────────

export class EvolutionAgent extends BaseSpecialist<EvolutionAgentInput, EvolutionOutput> {
  readonly config = EVOLUTION_CONFIG;
  readonly inputSchema = evolutionAgentInput;
  readonly outputSchema = EvolutionInsightContentSchema;

  constructor(gateway?: ILLMGateway) {
    super(gateway);
  }

  /** PRD-8 US-003 真接 · 本期仅骨架 */
  override execute(
    _req: SpecialistRequest<EvolutionAgentInput>,
  ): Promise<SpecialistResponse<EvolutionOutput>> {
    return Promise.reject(new Error('PRD-8 US-003 真接'));
  }

  protected invokeLLM(
    _ctx: AssembledContext,
    _req: SpecialistRequest<EvolutionAgentInput>,
  ): Promise<InvokeLLMResult> {
    return Promise.reject(new Error('PRD-8 US-003 真接'));
  }
}

export const evolutionAgent = new EvolutionAgent();
