/**
 * Diagnosis Specialist I/O schemas — PRD-2 US-005
 * AC-5: input/output schemas in packages/schemas/src/specialist-io/
 */

import { z } from 'zod';

export const diagnosisAnswerSchema = z.object({
  dimension: z.string().min(1).max(64),
  score: z.number().int().min(0).max(10),
  comment: z.string().max(200).optional(),
});

export const generateDiagnosisInput = z.object({
  answers: z.array(diagnosisAnswerSchema).length(8),
});

export const historyDiagnosisInput = z.object({
  limit: z.number().int().min(1).max(20).default(10),
  offset: z.number().int().min(0).default(0),
});

export const diagnosisReportSchema = z.object({
  id: z.number().int().positive(),
  answers: z.unknown(),
  dimensions: z.unknown(),
  overallScore: z.number().int(),
  inferredStage: z.string(),
  topPriority: z.string(),
  recommendedSteps: z.array(z.string()),
  agentId: z.string(),
  traceId: z.string().nullable(),
  createdAt: z.date(),
});

export type DiagnosisAnswer = z.infer<typeof diagnosisAnswerSchema>;
export type GenerateDiagnosisInput = z.infer<typeof generateDiagnosisInput>;
export type HistoryDiagnosisInput = z.infer<typeof historyDiagnosisInput>;
export type DiagnosisReport = z.infer<typeof diagnosisReportSchema>;
