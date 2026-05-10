/**
 * VideoAgent acquisition mode I/O schemas — PRD-6 US-001
 * acquisition mode: 文案 → 获客型视频方案(转化导向 · 必含 CTA)
 */

import { z } from 'zod';

// ── Input ────────────────────────────────────────────────────────────────────

export const acquisitionVideoInput = z.object({
  sourceCopy: z.string().min(10).max(3000, '原始文案不能超过3000字符'),
  conversionGoal: z.enum(['wechat', 'comment', 'private_msg']),
  ctaText: z.string().max(50).optional(),
  additionalContext: z.string().optional(),
});

// ── Output ───────────────────────────────────────────────────────────────────

const acquisitionShotSchema = z.object({
  index: z.number().int().positive(),
  shot: z.string().min(5).max(200),
  action: z.string().min(5).max(300),
  ctaPoint: z.boolean().optional(),
  camera: z.string().min(3).max(100),
  duration: z.string(),
});

export const acquisitionVideoOutput = z.object({
  shotList: z.array(acquisitionShotSchema).min(3).max(20),
  ctaSuggestion: z.string().min(10).max(200),
  equipment: z.string().min(10),
  totalDuration: z.string(),
});

// ── Types ─────────────────────────────────────────────────────────────────────

export type AcquisitionVideoInput = z.infer<typeof acquisitionVideoInput>;
export type AcquisitionVideoOutput = z.infer<typeof acquisitionVideoOutput>;
export type AcquisitionShot = z.infer<typeof acquisitionShotSchema>;
