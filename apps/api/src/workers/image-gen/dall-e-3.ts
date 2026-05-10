/**
 * DALL-E 3 ImageGen Worker 占位实现 — PRD-6 US-001
 * 真接: US-009 · 本期 stub throw + placeholder
 *
 * ⚠️ R-001: OpenAI image API key 不暴露给前端 · 仅在 worker 层使用
 * ⚠️ REJ-008: 写 Asset 行时必带 accountId(RLS 防护)
 */

import type { IImageGenWorker, ImageGenJobPayload, ImageGenJobResult } from './index';

export class DallE3ImageGenWorker implements IImageGenWorker {
  async generate(_payload: ImageGenJobPayload): Promise<ImageGenJobResult> {
    throw new Error('PRD-6 US-009 真接');
  }
}
