/**
 * STT Worker — PRD-8 US-009
 * D-038: OpenAI Whisper-1 仅限本 worker · 不走 LLMGateway
 * R-001: API key 不暴露给前端 · 仅 worker 层使用
 */

export interface SttTranscribePayload {
  audioBuffer: Buffer;
  mimeType: string;
  accountId: number;
  traceId: string;
}

export interface SttTranscribeResult {
  transcript: string;
  durationSec: number;
  costUsd: number;
}

export interface ISttWorker {
  transcribe(payload: SttTranscribePayload): Promise<SttTranscribeResult>;
}

export { WhisperSttWorker } from './whisper';
