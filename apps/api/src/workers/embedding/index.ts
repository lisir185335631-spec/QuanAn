/**
 * Embedding Worker — PRD-9 US-001
 * D-038: OpenAI text-embedding-3-small 仅限本 worker · 不走 LLMGateway
 * R-001: API key 不暴露给前端 · 仅 worker 层使用
 */

export interface EmbedPayload {
  text: string;
  accountId: number;
  traceId: string;
}

export interface EmbedResult {
  embedding: number[];
  tokens: number;
  costUsd: number;
}

export interface IEmbeddingWorker {
  embed(payload: EmbedPayload): Promise<EmbedResult>;
}

export { OpenAIEmbeddingWorker } from './openai-embedding';
