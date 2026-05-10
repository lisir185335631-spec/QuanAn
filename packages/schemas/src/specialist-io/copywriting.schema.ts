/**
 * Copywriting Specialist I/O schemas — PRD-2 US-004 (backward compat) + PRD-5 US-001 (free/boom)
 * AC-6: input/output in packages/schemas/src/specialist-io/
 */

import { z } from 'zod';

import { HOT_ELEMENT_KEYS_22, SCRIPT_TYPE_KEYS_20 } from './constants';

// ── PRD-2 backward-compat schemas (step7 mode) ────────────────────────────────

export const generateCopywritingInput = z.object({
  stepKey: z.string().min(1).max(64),
  tone: z.string().max(32).optional(),
  length: z.enum(['short', 'medium', 'long']).optional(),
  context: z.record(z.unknown()).optional(),
});

export const optimizeCopywritingInput = z.object({
  historyId: z.number().int().positive(),
  instruction: z.string().min(1).max(500),
});

export const listCopywritingInput = z.object({
  stepKey: z.string().min(1).max(64).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export const deleteCopywritingInput = z.object({
  historyId: z.number().int().positive(),
});

export const copywritingResultSchema = z.object({
  id: z.number().int().positive(),
  content: z.string(),
  agentId: z.string(),
  traceId: z.string().nullable(),
  createdAt: z.date(),
});

export type GenerateCopywritingInput = z.infer<typeof generateCopywritingInput>;
export type OptimizeCopywritingInput = z.infer<typeof optimizeCopywritingInput>;
export type ListCopywritingInput = z.infer<typeof listCopywritingInput>;
export type DeleteCopywritingInput = z.infer<typeof deleteCopywritingInput>;
export type CopywritingResult = z.infer<typeof copywritingResultSchema>;

// ── PRD-5 free generate schemas (free mode · /generate tool page) ─────────────

/** /generate 工具页输入: 脚本类型 + 元素 + 话题 */
export const copywritingFreeGenerateInput = z.object({
  scriptType: z.enum(SCRIPT_TYPE_KEYS_20),
  elements: z.array(z.enum(HOT_ELEMENT_KEYS_22)).min(1).max(8),
  topic: z.string().min(1).max(500),
});

/** /generate 工具页输出: markdown 文案 + metadata */
export const copywritingFreeOutput = z.object({
  markdown: z.string().min(400).max(1500),
  metadata: z.object({
    scriptType: z.enum(SCRIPT_TYPE_KEYS_20),
    elements: z.array(z.enum(HOT_ELEMENT_KEYS_22)),
    structureSummary: z.string(),
    estimatedDuration: z.string(),
  }),
});

export type CopywritingFreeGenerateInput = z.infer<typeof copywritingFreeGenerateInput>;
export type CopywritingFreeOutput = z.infer<typeof copywritingFreeOutput>;
