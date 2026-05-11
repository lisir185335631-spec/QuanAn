/**
 * Evolution Specialist I/O schemas — PRD-2 US-005 + PRD-8 US-001
 * AC-5: input/output schemas in packages/schemas/src/specialist-io/
 * Note: covers the 7 Specialist procedures (evolve/getConfig/updateConfig/history/recentFeedback/feedbackTrend/moduleRanking)
 * PRD-8: EvolutionInsightContentSchema + TriggerTypeSchema (SoT §1.0.1 · canonical: EvolutionAgent.ts)
 */

import { z } from 'zod';

export const evolveInput = z.object({
  rating: z.enum(['good', 'bad']),
  agentId: z.string().min(1).max(64),
  rateableType: z.string().max(32).default('history'),
  rateableId: z.number().int().positive(),
  historyId: z.number().int().positive().optional(),
  comment: z.string().max(200).optional(),
});

export const updateEvolutionConfigInput = z.object({
  autoEvolutionEnabled: z.boolean().optional(),
  currentDirection: z.string().max(32).optional(),
});

export const evolutionHistoryInput = z.object({
  limit: z.number().int().min(1).max(50).default(20),
  offset: z.number().int().min(0).default(0),
});

export const recentFeedbackInput = z.object({
  limit: z.number().int().min(1).max(50).default(20),
  agentId: z.string().max(64).optional(),
});

export const feedbackTrendInput = z.object({
  days: z.number().int().min(7).max(90).default(30),
});

export const moduleRankingInput = z.object({
  limit: z.number().int().min(1).max(20).default(10),
});

export const feedbackLogSchema = z.object({
  id: z.number().int().positive(),
  rating: z.string(),
  agentId: z.string(),
  comment: z.string().nullable(),
  traceId: z.string().nullable(),
  createdAt: z.date(),
});

export const evolutionInsightSchema = z.object({
  id: z.number().int().positive(),
  triggerType: z.string(),
  direction: z.string(),
  content: z.unknown(),
  levelBefore: z.string().nullable(),
  levelAfter: z.string().nullable(),
  createdAt: z.date(),
});

export type EvolveInput = z.infer<typeof evolveInput>;
export type UpdateEvolutionConfigInput = z.infer<typeof updateEvolutionConfigInput>;
export type FeedbackLog = z.infer<typeof feedbackLogSchema>;
export type EvolutionInsight = z.infer<typeof evolutionInsightSchema>;

// ── PRD-8 US-001 · EvolutionInsight content schema (SoT §1.0.1) ──────────────

export const InsightsSchema = z.object({
  preferredCatchphrases: z.array(z.string()).min(0).max(10),
  styleTone: z.string().min(1),
  avoidList: z.array(z.string()).min(0).max(10),
  strongPoints: z.array(z.string()).min(0).max(5),
  weakPoints: z.array(z.string()).min(0).max(5),
});

export const EvolutionInsightContentSchema = z.object({
  direction: z.enum(['综合', '创意', '转化', '真实']),
  insights: InsightsSchema,
});

export const TriggerTypeSchema = z.union([
  z.literal('threshold:5'),
  z.literal('threshold:20'),
  z.literal('threshold:50'),
  z.literal('threshold:100'),
]);

export type Insights = z.infer<typeof InsightsSchema>;
export type EvolutionInsightContent = z.infer<typeof EvolutionInsightContentSchema>;
export type TriggerType = z.infer<typeof TriggerTypeSchema>;
