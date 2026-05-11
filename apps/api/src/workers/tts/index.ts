/**
 * TTS Worker — PRD-8 US-010
 * D-038: OpenAI TTS-1 仅限本 worker · 不走 LLMGateway
 * R-001: API key 不暴露给前端 · 仅 worker 层使用
 */

export interface TtsSynthesizePayload {
  text: string;
  voice?: string;
  accountId: number;
  traceId: string;
}

export interface TtsSynthesizeResult {
  publicUrl: string;
  sizeBytes: number;
  costUsd: number;
}

export interface ITtsWorker {
  synthesize(payload: TtsSynthesizePayload): Promise<TtsSynthesizeResult>;
}

export { OpenAITtsWorker } from './openai-tts';
