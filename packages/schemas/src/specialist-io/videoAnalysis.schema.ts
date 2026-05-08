/**
 * VideoAnalysis Specialist I/O schemas — PRD-2 US-004
 */

import { z } from 'zod';

export const analyzeVideoInput = z.object({
  videoUrl: z.string().url(),
  platform: z.string().max(32).optional(),
  analysisType: z.enum(['full', 'quick']).default('full'),
});

export const rewriteVideoInput = z.object({
  historyId: z.number().int().positive(),
  rewriteStyle: z.string().max(64).optional(),
  targetPlatform: z.string().max(32).optional(),
});

export const videoAnalysisResultSchema = z.object({
  id: z.number().int().positive(),
  content: z.string(),
  agentId: z.string(),
  traceId: z.string().nullable(),
  createdAt: z.date(),
});

export type AnalyzeVideoInput = z.infer<typeof analyzeVideoInput>;
export type RewriteVideoInput = z.infer<typeof rewriteVideoInput>;
export type VideoAnalysisResult = z.infer<typeof videoAnalysisResultSchema>;
