/**
 * ImageGen Worker — PRD-6 US-001 骨架
 * 真接实现: US-009(DALL-E 3 wrapper) + US-010(BullMQ queue)
 *
 * interface IImageGenWorker: generate(payload) → Promise<ImageGenJobResult>
 * DallE3ImageGenWorker: 占位 stub · US-009 解锁后真接
 */

import type { ImageGenJobPayload, ImageGenJobResult } from '@quanqn/schemas/specialist-io';

// ── Re-export for backward compat (dall-e-3.ts / queue.ts import from ./index) ──
export type { ImageGenJobPayload, ImageGenJobResult };

// ── Interface ─────────────────────────────────────────────────────────────────

export interface IImageGenWorker {
  generate(payload: ImageGenJobPayload): Promise<ImageGenJobResult>;
}

// ── Re-exports ────────────────────────────────────────────────────────────────

export { DallE3ImageGenWorker } from './dall-e-3';
export { imageGenQueue, IMAGE_GEN_QUEUE_NAME } from './queue';
