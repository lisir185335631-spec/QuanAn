/**
 * ImageGen Worker queue payload + result schemas — PRD-6 US-001
 * ImageGenJobPayload: BullMQ 队列入参
 * ImageGenJobResult: DALL-E 3 成功 | 失败(含 placeholder URL)
 */

import { z } from 'zod';

// ── Queue Payload ─────────────────────────────────────────────────────────────

export const imageGenJobPayload = z.object({
  sceneIndex: z.number().int().nonnegative(),
  imagePromptEn: z.string().min(1).max(1000),
  accountId: z.number().int().positive(),
  traceId: z.string(),
  historyId: z.number().int().positive(),
  imageStyle: z.enum(['vivid', 'natural']),
});

// ── Job Result ────────────────────────────────────────────────────────────────

export const imageGenJobResultSuccess = z.object({
  sceneImageUrl: z.string().url(),
  costUsd: z.number().nonnegative(),
  durationMs: z.number().int().nonnegative(),
});

export const imageGenJobResultError = z.object({
  error: z.string(),
  sceneImageUrl: z.string(), // placeholder URL on failure
});

export const imageGenJobResult = z.union([imageGenJobResultSuccess, imageGenJobResultError]);

// ── Types ─────────────────────────────────────────────────────────────────────

export type ImageGenJobPayload = z.infer<typeof imageGenJobPayload>;
export type ImageGenJobResult = z.infer<typeof imageGenJobResult>;
export type ImageGenJobResultSuccess = z.infer<typeof imageGenJobResultSuccess>;
export type ImageGenJobResultError = z.infer<typeof imageGenJobResultError>;
