/**
 * DeepLearning Specialist I/O schemas — PRD-2 US-005, PRD-15 US-003
 * AC-5: input/output schemas in packages/schemas/src/specialist-io/
 */

import { z } from 'zod';

export const listDeepLearningInput = z.object({
  limit: z.number().int().min(1).max(50).default(20),
  offset: z.number().int().min(0).default(0),
  onlyActive: z.boolean().default(true),
});

export const createDeepLearningInput = z.object({
  sample: z.string().min(1).max(10000),
  userTitle: z.string().max(100).optional(),
  userTags: z.array(z.string().max(32)).max(10).default([]),
});

export const createDeepLearningFromFileInput = z.object({
  fileUrl: z.string().url(),
  userTitle: z.string().max(100).optional(),
  userTags: z.array(z.string().max(32)).max(10).default([]),
});

export const learnDeepLearningInput = z.object({
  archiveId: z.number().int().positive(),
});

export const deleteDeepLearningInput = z.object({
  archiveId: z.number().int().positive(),
});

export const deepLearningArchiveSchema = z.object({
  id: z.number().int().positive(),
  sourceType: z.string(),
  sample: z.string(),
  summary: z.string().nullable(),
  tags: z.array(z.string()),
  userTitle: z.string().nullable(),
  userTags: z.array(z.string()),
  learningStatus: z.string(),
  isActive: z.boolean(),
  agentId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// PRD-15 US-003: parse + applyFormula schemas
export const deepLearningParseInput = z.object({
  sample: z.string().min(100, '文案不少于 100 字').max(10000),
  sourcePlatform: z.string().min(1).max(32),
});

export const deepLearningParseAnalysis = z.object({
  coreFormula: z.string(),
  hookType: z.string(),
  structurePattern: z.string(),
  emotionalArc: z.string(),
  keywords: z.array(z.string()),
});

export const deepLearningParseOutput = z.object({
  queueId: z.number().int().positive(),
  analysis: deepLearningParseAnalysis,
});

export const deepLearningApplyFormulaInput = z.object({
  queueId: z.number().int().positive(),
  newTopic: z.string().min(1).max(500),
});

export const deepLearningApplyFormulaOutput = z.object({
  content: z.string(),
});

// Queue item returned by list (PRD-15 US-003)
export const deepLearningQueueItemSchema = z.object({
  id: z.number().int().positive(),
  sample: z.string(),
  sourcePlatform: z.string(),
  coreFormula: z.string(),
  status: z.string(),
  createdAt: z.date(),
});

export type ListDeepLearningInput = z.infer<typeof listDeepLearningInput>;
export type CreateDeepLearningInput = z.infer<typeof createDeepLearningInput>;
export type CreateDeepLearningFromFileInput = z.infer<typeof createDeepLearningFromFileInput>;
export type DeepLearningArchive = z.infer<typeof deepLearningArchiveSchema>;
export type DeepLearningParseInput = z.infer<typeof deepLearningParseInput>;
export type DeepLearningParseAnalysis = z.infer<typeof deepLearningParseAnalysis>;
export type DeepLearningParseOutput = z.infer<typeof deepLearningParseOutput>;
export type DeepLearningApplyFormulaInput = z.infer<typeof deepLearningApplyFormulaInput>;
export type DeepLearningApplyFormulaOutput = z.infer<typeof deepLearningApplyFormulaOutput>;
export type DeepLearningQueueItem = z.infer<typeof deepLearningQueueItemSchema>;
