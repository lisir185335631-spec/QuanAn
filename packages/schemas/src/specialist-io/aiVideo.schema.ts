/**
 * VideoAgent storyboard mode I/O schemas — PRD-6 US-001
 * storyboard mode: 文案 → 分镜表(N 镜头) + ImageGen prompt(英文)
 */

import { z } from 'zod';

// ── Input ────────────────────────────────────────────────────────────────────

export const aiVideoInput = z.object({
  sourceCopy: z.string().min(10).max(3000, '原始文案不能超过3000字符'),
  scenesCount: z.union(
    [z.literal(5), z.literal(6), z.literal(7), z.literal(8)],
    { errorMap: () => ({ message: '镜头数应在 5-8 之间' }) },
  ),
  imageStyle: z.enum(['vivid', 'natural']),
});

// ── Output ───────────────────────────────────────────────────────────────────

export const aiVideoSceneSchema = z.object({
  index: z.number().int().positive(),
  description: z.string().min(20).max(500),
  imagePromptEn: z
    .string()
    .min(20)
    .regex(/^[\x00-\x7F]+$/, 'imagePromptEn 必须是英文 ASCII'),
  duration: z.string(),
});

export const aiVideoOutput = z.object({
  scenes: z.array(aiVideoSceneSchema).min(5).max(8),
  totalDuration: z.string(),
});

// ── Types ─────────────────────────────────────────────────────────────────────

export type AiVideoInput = z.infer<typeof aiVideoInput>;
export type AiVideoOutput = z.infer<typeof aiVideoOutput>;
export type AiVideoScene = z.infer<typeof aiVideoSceneSchema>;
