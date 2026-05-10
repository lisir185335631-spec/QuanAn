/**
 * VideoAgent acquisition mode I/O schemas — PRD-6 US-001, PRD-7 US-001
 * acquisition mode: 文案 → 获客型视频方案(转化导向 · 必含 CTA)
 * TD-022: canonical aligned with VideoAgent.ts VideoAcquisitionOutputSchema
 */

import { z } from 'zod';

// ── Input ────────────────────────────────────────────────────────────────────

export const acquisitionVideoInput = z.object({
  sourceCopy: z.string().min(10, '原始文案至少 10 字符').max(3000, '原始文案不能超过3000字符'),
  conversionGoal: z.string().min(1, '转化目标必填'),
  platform: z.string().optional(),
  duration: z.enum(['15s', '30s', '60s', '180s']).optional(),
});

// ── Output ───────────────────────────────────────────────────────────────────

// SoT: VideoAgent.ts VideoAcquisitionOutputSchema
export const acquisitionVideoOutput = z.object({
  script: z.string().min(100),
  cta: z.string().min(10),
  conversionPath: z.string(),
  keyMessages: z.array(z.string()).min(1),
});

// ── Types ─────────────────────────────────────────────────────────────────────

export type AcquisitionVideoInput = z.infer<typeof acquisitionVideoInput>;
export type AcquisitionVideoOutput = z.infer<typeof acquisitionVideoOutput>;
