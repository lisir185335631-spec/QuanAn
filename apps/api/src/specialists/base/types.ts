/**
 * QuanQn · PRD-4 Specialist 类型定义
 * SpecialistConfig(五层) + SpecialistRequest<TIn> + SpecialistResponse<TOut>
 * AC-2(US-001)
 */

/** LLM tier(ADR-013) */
export type ModelTier = 'reasoning' | 'lightweight';

/** 五层 Specialist 配置 */
export interface SpecialistConfig {
  /** Specialist 标识 ID · 写入 cost_log.agentId */
  agentId: string;
  persona: {
    role: string;
    goal: string;
    boundaries: readonly string[];
  };
  memory: {
    l1_readonly: readonly string[];
    l2_read: readonly string[];
    l2_write: readonly string[];
  };
  knowledge: {
    constants: readonly string[];
    rag: readonly string[];
    refresh_interval_sec: number;
  };
  tools: readonly string[];
  execution: {
    timeout_ms: number;
    retry: number;
    model_tier: ModelTier;
    streaming: boolean;
    parallel_group?: string;
  };
}

/** 调用入参(所有 PRD-4 Specialist 共用) */
export interface SpecialistRequest<TIn> {
  accountId: number;
  mode?: string;
  userInput: TIn;
  traceId?: string;
  /** IP 流程步骤标识 · cost_log.target.stepKey */
  stepKey?: string;
}

/** 调用出参(所有 PRD-4 Specialist 共用) */
export interface SpecialistResponse<TOut> {
  result: TOut;
  isFallback: boolean;
  durationMs: number;
  tokensUsed: { prompt: number; completion: number; total: number };
  modelUsed: string;
  traceId: string;
}

/** invokeLLM 抽象方法返回类型 */
export interface InvokeLLMResult {
  content: unknown;
  tokens: { prompt: number; completion: number; total: number };
  model: string;
  isFallback?: boolean;
}

/** SSE 流式 chunk(与 workers/llm-gateway StreamChunk 对齐) */
export interface LLMStreamChunk {
  type: 'meta' | 'delta' | 'done' | 'error';
  /** stream 启动时 LLMGateway 通过 meta chunk 告知实际使用的 model · D-019 / REJ-003 */
  meta?: { model: string };
  delta?: string;
  tokens?: { prompt: number; completion: number; total: number };
  error?: { code: string; message: string };
}

/** 最小化 LLMGateway 接口(DI 用) */
export interface ILLMGateway {
  complete(req: LLMCompleteRequest): Promise<InvokeLLMResult>;
  /** 流式调用 · TopicAgent / CopywritingAgent 等 streaming=true 的 Specialist 需要 */
  stream?(req: LLMCompleteRequest): AsyncIterable<LLMStreamChunk>;
}

/** invokeLLM 内部调用 gateway 时使用的请求结构 */
export interface LLMCompleteRequest {
  model_tier: ModelTier;
  systemPrompt: string;
  userPrompt: string;
  responseFormat?: { type: 'json_schema'; schema: import('zod').ZodTypeAny };
  metadata: {
    trace_id: string;
    agentId: string;
    accountId: number;
    userId: number;
  };
  timeout_ms?: number;
  retry?: number;
}

/** ContextAssembler 注入后的上下文(与 agents/base/types 兼容) */
export interface AssembledContext {
  systemPrompt: string;
  userPrompt: string;
  tools?: unknown[];
  metadata: {
    contextTokens: number;
    layersUsed: readonly string[];
    ragHits: readonly { source: string; count: number }[];
  };
}
