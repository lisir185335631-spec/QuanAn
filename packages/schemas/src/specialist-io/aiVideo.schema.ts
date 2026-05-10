/**
 * VideoAgent storyboard mode I/O schemas — PRD-6 US-001, PRD-7 US-001
 * storyboard mode: 文案 → 分镜表(N 镜头) + ImageGen prompt(英文)
 * TD-022: canonical aligned with VideoAgent.ts StoryboardOutputSchema
 */

import { z } from 'zod';

// ── Input ────────────────────────────────────────────────────────────────────

export const aiVideoInput = z.object({
  sourceCopy: z.string().min(10, '原始文案至少 10 字符').max(3000, '原始文案不超过3000字符'),
  scenesCount: z.union(
    [z.literal(5), z.literal(6), z.literal(7), z.literal(8)],
    { errorMap: () => ({ message: '镜头数应在 5-8 之间' }) },
  ),
  imageStyle: z.enum(['vivid', 'natural']).default('vivid'),
});

// ── Output ───────────────────────────────────────────────────────────────────

export const aiVideoSceneSchema = z.object({
  index: z.number().int().positive(),
  description: z.string().min(20).max(500),
  imagePromptEn: z
    .string()
    .min(20)
    // eslint-disable-next-line no-control-regex
    .regex(/^[\x00-\x7F]+$/, 'imagePromptEn 必须是英文 ASCII'),
  duration: z.string(),
});

// SoT: VideoAgent.ts StoryboardOutputSchema (title + scenes + totalDuration)
export const aiVideoOutput = z.object({
  scenes: z.array(aiVideoSceneSchema).min(5).max(8),
  title: z.string(),
  totalDuration: z.string(),
});

// ── Types ─────────────────────────────────────────────────────────────────────

export type AiVideoInput = z.infer<typeof aiVideoInput>;
export type AiVideoOutput = z.infer<typeof aiVideoOutput>;
export type AiVideoScene = z.infer<typeof aiVideoSceneSchema>;
