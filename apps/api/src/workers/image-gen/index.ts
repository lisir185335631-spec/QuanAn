/**
 * ImageGen Worker — PRD-6 US-001 骨架
 * 真接实现: US-009(DALL-E 3 wrapper) + US-010(BullMQ queue)
 *
 * interface IImageGenWorker: generate(payload) → Promise<ImageGenJobResult>
 * DallE3ImageGenWorker: 占位 stub · US-009 解锁后真接
 *
 * Note: types inlined here — @quanqn/schemas/specialist-io imageGen.schema has canonical definition for client use
 */

// ── Inline types (canonical: @quanqn/schemas/specialist-io imageGen.schema) ──

export interface ImageGenJobPayload {
  sceneIndex: number;
  imagePromptEn: string;
  accountId: number;
  traceId: string;
  historyId: number;
  imageStyle: 'vivid' | 'natural';
}

export type ImageGenJobResult =
  | { sceneImageUrl: string; costUsd: number; durationMs: number }
  | { error: string; sceneImageUrl: string };

// ── Interface ─────────────────────────────────────────────────────────────────

export interface IImageGenWorker {
  generate(payload: ImageGenJobPayload): Promise<ImageGenJobResult>;
}

// ── Re-exports ────────────────────────────────────────────────────────────────

export { DallE3ImageGenWorker } from './dall-e-3';
export { imageGenQueue, IMAGE_GEN_QUEUE_NAME } from './queue';
