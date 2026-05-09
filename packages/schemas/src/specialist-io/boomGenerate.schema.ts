/**
 * BoomGenerate Specialist I/O schemas — PRD-5 US-001
 * Rewritten from PRD-2 stepKey-based to element-based (boom mode)
 */

import { z } from 'zod';
import { HOT_ELEMENT_KEYS_22 } from './constants';

/** /boom-generate 工具页输入: 元素 + 可选行业/主题 */
export const generateBoomInput = z.object({
  elements: z.array(z.enum(HOT_ELEMENT_KEYS_22)).min(1).max(8),
  industry: z.string().max(64).optional(),
  theme: z.string().max(200).optional(),
});

/** /boom-generate 工具页输出: 5 候选标题 + metadata */
export const boomOutput = z.object({
  candidates: z.array(z.string().min(200).max(500)).length(5),
  metadata: z.object({
    count: z.literal(5),
    elements: z.array(z.enum(HOT_ELEMENT_KEYS_22)),
  }),
});

export type GenerateBoomInput = z.infer<typeof generateBoomInput>;
export type BoomOutput = z.infer<typeof boomOutput>;
