/**
 * ContextAssembler 类型定义 — 完全对齐 ARCHITECTURE §6.4 接口契约
 * AssembleRequest · AssembledContext
 */

import type { SpecialistId } from '@/agents/base/types';

export type { SpecialistId };

/** §6.4 ContextAssembler 调用入参 */
export interface AssembleRequest {
  agentId: SpecialistId;
  accountId: number;
  mode?: string;
  userInput: unknown;
  needRag?: readonly string[];
  needLayers?: readonly string[];
}

/** §6.4 ContextAssembler 调用出参(与 specialists/base/types 结构兼容) */
export interface AssembledContext {
  /** 完整 system prompt(参 §5.5 模板) */
  systemPrompt: string;
  /** 用户输入格式化 */
  userPrompt: string;
  /** Specialist 可用工具子集 */
  tools: unknown[];
  metadata: {
    /** 上下文 token 量(本期 chars/4 粗算) */
    contextTokens: number;
    /** 真实反映哪些层 fetched 成功(给 audit 用) */
    layersUsed: readonly string[];
    /** RAG 命中统计 */
    ragHits: readonly { source: string; count: number }[];
  };
}
