/**
 * VideoAgent production mode I/O schemas — PRD-6 US-001, PRD-7 US-001
 * production mode: 文案 → 完整视频方案(分镜 + 设备 + 日程)
 * TD-022: canonical aligned with VideoAgent.ts ProductionOutputSchema (13+7 fields)
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

// 13 必填列 + 7 production mode optional 列(向后兼容)
// SoT: VideoAgent.ts ProductionOutputSchema / PROMPTS §6.2 13 列分镜表
const shotItemSchema = z.object({
  scene: z.string(),
  duration: z.string(),
  action: z.string(),
  dialogue: z.string(),
  cameraAngle: z.string(),
  prop: z.string(),
  lighting: z.string(),
  transition: z.string(),
  sfx: z.string(),
  voiceover: z.string(),
  subtitle: z.string(),
  costume: z.string(),
  location: z.string(),
  // 7 production mode extension fields (optional · backward-compatible)
  index: z.number().int().positive().optional(),
  angle: z.string().optional(),
  movement: z.string().optional(),
  description: z.string().optional(),
  bgm: z.string().optional(),
  reference: z.string().optional(),
  note: z.string().optional(),
});

export const videoProductionOutput = z.object({
  shotList: z.array(shotItemSchema).min(1),
  equipment: z.array(z.string()),
  schedule: z.string(),
});

// ── Types ─────────────────────────────────────────────────────────────────────

export type VideoProductionInput = z.infer<typeof videoProductionInput>;
export type VideoProductionOutput = z.infer<typeof videoProductionOutput>;
export type ShotItem = z.infer<typeof shotItemSchema>;
