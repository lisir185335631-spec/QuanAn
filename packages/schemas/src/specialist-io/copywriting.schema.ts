/**
 * Copywriting Specialist I/O schemas — PRD-2 US-004
 * AC-6: input/output in packages/schemas/src/specialist-io/
 */

import { z } from 'zod';

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
