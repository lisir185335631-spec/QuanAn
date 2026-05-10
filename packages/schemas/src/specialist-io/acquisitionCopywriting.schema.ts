/**
 * CopywritingAgent acquisition mode I/O schemas — PRD-6 US-001 + US-012, PRD-7 US-001
 * acquisition mode: 产品信息 → 获客文案(转化导向 · 含 CTA · 200-500 字)
 * TD-022: legacy acquisitionCopywritingInput deleted · only acquisitionCopywritingInputSchema retained
 */

import { z } from 'zod';

import { HOT_ELEMENT_KEYS_22, SCRIPT_TYPE_KEYS_20 } from './constants';

// ── Input (canonical · PRD-6 US-012) ──────────────────────────────────────────

export const acquisitionCopywritingInputSchema = z.object({
  scriptType: z.enum(SCRIPT_TYPE_KEYS_20),
  elements: z.array(z.enum(HOT_ELEMENT_KEYS_22)).min(1).max(8),
  conversionGoal: z.string().min(1, '转化目标必填'),
  topic: z.string().min(1).max(500),
});

// ── Output (canonical · SoT: CopywritingAgent.ts CopywritingAcquisitionOutputSchema) ──

export const acquisitionCopywritingOutput = z
  .object({
    markdown: z.string().min(200).max(500),
    metadata: z.object({
      ctaPosition: z.string(),
      conversionGoal: z.string(),
    }),
  })
  .refine((v) => v.metadata.ctaPosition.length > 0, {
    message: 'acquisition mode 必含 CTA · ctaPosition 不能为空',
  });

// ── Types ─────────────────────────────────────────────────────────────────────

export type AcquisitionCopywritingInputSchema = z.infer<typeof acquisitionCopywritingInputSchema>;
export type AcquisitionCopywritingOutput = z.infer<typeof acquisitionCopywritingOutput>;
