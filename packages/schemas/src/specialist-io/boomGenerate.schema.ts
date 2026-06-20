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

/** /boom-generate 工具页输出: 5 候选结构化对象 + metadata */
export const boomCandidateSchema = z.object({
  title: z.string().min(6).max(80),
  opening: z.string().min(40),
  development: z.string().min(40),
  climax: z.string().min(40),
  ending: z.string().min(40),
  reason: z.string().min(20),
  indexScore: z.string().min(1).max(8),
});

export const boomOutput = z.object({
  candidates: z.array(boomCandidateSchema).length(5),
  metadata: z.object({
    count: z.literal(5),
    elements: z.array(z.enum(HOT_ELEMENT_KEYS_22)),
  }),
});

export type GenerateBoomInput = z.infer<typeof generateBoomInput>;
export type BoomCandidate = z.infer<typeof boomCandidateSchema>;
export type BoomOutput = z.infer<typeof boomOutput>;
