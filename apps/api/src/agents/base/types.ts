/**
 * QuanQn · BaseSpecialist 类型定义
 * 派生自 ARCHITECTURE.md §6.3 + AGENTS §4.7 + ADR-003
 */

import type { z } from 'zod';

/** Specialist ID(14 个 · LD-002) */
export type SpecialistId =
  | 'PositioningAgent' | 'BrandingAgent' | 'MonetizationAgent'
  | 'TopicAgent' | 'CopywritingAgent' | 'VideoAgent'
  | 'LivestreamAgent' | 'PrivateDomainAgent' | 'AnalysisAgent'
  | 'DiagnosisAgent' | 'DeepLearnAgent'
  | 'VoiceChatAgent' | 'EvolutionAgent' | 'DailyTaskAgent';

/** LLM tier(ADR-013) */
export type ModelTier = 'reasoning' | 'lightweight';

/** 输入(全 Specialist 共用) */
export interface SpecialistInput<P = unknown> {
  accountId: number;
  userId: number;
  agentId: SpecialistId;
  mode?: string;
  payload: P;
  trace_id?: string;
  metadata?: { referer?: string; feedbackParent?: string };
}

/** 输出(全 Specialist 共用) */
export interface SpecialistOutput<R = unknown> {
  success: boolean;
  result?: R;
  error?: { code: string; message: string; retryable: boolean };
  trace_id: string;
  agentId: SpecialistId;
  model: string;
  tokens: { prompt: number; completion: number; total: number };
  durationMs: number;
  feedbackHook: { rateableContentId: number; rateableType: 'history' | 'topic' | 'storyboard' | 'diagnosis' };
  isFallback?: boolean;
}

/** 五层配置(AGENTS §4.7) */
export interface SpecialistConfig {
  persona: { role: string; goal: string; boundaries: readonly string[] };
  memory: {
    l1_readonly: readonly ('account' | 'currentStep')[];
    l2_read: readonly ('stepData' | 'evolution' | 'diagnosis')[];
    l2_write: readonly ('stepData' | 'history')[];
  };
  knowledge: {
    constants: readonly string[];
    rag: readonly ('knowledge_cases' | 'formulas' | 'elements' | 'trending' | 'user_samples' | 'history')[];
    refresh_interval_sec: number;
  };
  tools: readonly ('llm.complete' | 'llm.stream' | 'image.generate' | 'file.parse' | 'tool.custom')[];
  execution: {
    timeout_ms: number;
    retry: number;
    model_tier: ModelTier;
    streaming: boolean;
    parallel_group?: string;
  };
  /** 失败降级策略(§4.4-D 冷启动) */
  fallback?: {
    on_missing: readonly ('evolution_profile' | 'step_data' | 'diagnosis')[];
    strategy: 'use_template' | 'skip_section' | 'use_industry_default';
  };
}

/** ContextAssembler 注入后的完整上下文 */
export interface AssembledContext {
  systemPrompt: string;
  userPrompt: string;
  tools: ToolSchema[];
  metadata: {
    contextTokens: number;
    layersUsed: readonly string[];
    ragHits: readonly { source: string; count: number }[];
  };
}

export interface ToolSchema {
  name: string;
  description: string;
  parameters: z.ZodTypeAny;
}

export function generateSpecialistTraceId(accountId: number, agentId: SpecialistId): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 6);
  return `tr_${accountId}_${agentId}_${ts}_${rand}`;
}
