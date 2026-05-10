/**
 * CopywritingAgent acquisition mode I/O schemas — PRD-6 US-001
 * acquisition mode: 产品信息 → 获客文案(转化导向 · 含 CTA · 200-500 字)
 */

import { z } from 'zod';

// ── Input ────────────────────────────────────────────────────────────────────

export const acquisitionCopywritingInput = z.object({
  productInfo: z.string().min(10).max(1000, '产品信息不超过1000字'),
  conversionGoal: z.enum(['wechat', 'comment', 'private_msg']),
  ctaText: z.string().max(50).optional(),
  additionalContext: z.string().optional(),
});

// ── Output ───────────────────────────────────────────────────────────────────

export const acquisitionCopywritingOutput = z.object({
  result: z.string().min(200).max(500),
  metadata: z.object({
    conversionGoal: z.string(),
    ctaIncluded: z.boolean(),
    estimatedDuration: z.string(),
  }),
});

// ── Types ─────────────────────────────────────────────────────────────────────

export type AcquisitionCopywritingInput = z.infer<typeof acquisitionCopywritingInput>;
export type AcquisitionCopywritingOutput = z.infer<typeof acquisitionCopywritingOutput>;
