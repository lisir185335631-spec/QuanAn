/**
 * DeepLearning Specialist I/O schemas — PRD-2 US-005
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

export type ListDeepLearningInput = z.infer<typeof listDeepLearningInput>;
export type CreateDeepLearningInput = z.infer<typeof createDeepLearningInput>;
export type CreateDeepLearningFromFileInput = z.infer<typeof createDeepLearningFromFileInput>;
export type DeepLearningArchive = z.infer<typeof deepLearningArchiveSchema>;
