/**
 * VideoAgent production mode I/O schemas — PRD-6 US-001
 * production mode: 文案 → 完整视频方案(分镜 + 设备 + 日程)
 */

import { z } from 'zod';

// ── Input ────────────────────────────────────────────────────────────────────

export const videoProductionInput = z.object({
  sourceCopy: z.string().min(10, '原始文案至少 10 字符').max(3000, '原始文案不能超过3000字符'),
  videoType: z.enum(['short_form', 'long_form']).optional(),
  duration: z.enum(['15s', '30s', '60s', '180s']).optional(),
  additionalContext: z.string().optional(),
});

// ── Output ───────────────────────────────────────────────────────────────────

const shotItemSchema = z.object({
  index: z.number().int().positive(),
  shot: z.string().min(5).max(200),
  action: z.string().min(5).max(300),
  dialogue: z.string().optional(),
  camera: z.string().min(3).max(100),
  duration: z.string(),
});

export const videoProductionOutput = z.object({
  shotList: z.array(shotItemSchema).min(3).max(20),
  equipment: z.string().min(10),
  schedule: z.string().min(10),
  totalDuration: z.string(),
});

// ── Types ─────────────────────────────────────────────────────────────────────

export type VideoProductionInput = z.infer<typeof videoProductionInput>;
export type VideoProductionOutput = z.infer<typeof videoProductionOutput>;
export type ShotItem = z.infer<typeof shotItemSchema>;
