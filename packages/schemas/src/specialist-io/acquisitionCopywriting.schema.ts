/**
 * CopywritingAgent acquisition mode I/O schemas — PRD-6 US-001 + US-012
 * acquisition mode: 产品信息 → 获客文案(转化导向 · 含 CTA · 200-500 字)
 * acquisitionCopywritingInputSchema: PRD-6 US-012 · scriptType+elements+conversionGoal+topic
 */

import { z } from 'zod';

import { HOT_ELEMENT_KEYS_22, SCRIPT_TYPE_KEYS_20 } from './constants';

// ── Input (PRD-6 US-001 legacy) ──────────────────────────────────────────────

export const acquisitionCopywritingInput = z.object({
  productInfo: z.string().min(10).max(1000, '产品信息不超过1000字'),
  conversionGoal: z.enum(['wechat', 'comment', 'private_msg']),
  ctaText: z.string().max(50).optional(),
  additionalContext: z.string().optional(),
});

// ── Input (PRD-6 US-012 · /generate acquisition mode) ────────────────────────

export const acquisitionCopywritingInputSchema = z.object({
  scriptType: z.enum(SCRIPT_TYPE_KEYS_20),
  elements: z.array(z.enum(HOT_ELEMENT_KEYS_22)).min(1).max(8),
  conversionGoal: z.string().min(1, '转化目标必填'),
  topic: z.string().min(1).max(500),
});

export type AcquisitionCopywritingInputNew = z.infer<typeof acquisitionCopywritingInputSchema>;

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
