import { z } from 'zod';

// TrendingReviewQueue status / autoVerdict enums — strict 1:1 with prisma model comments
export const trendingReviewStatusEnum = z.enum([
  'pending',
  'approved',
  'rejected',
  'auto_approved',
  'auto_rejected',
]);

export const autoVerdictEnum = z.enum([
  'auto_approved',
  'auto_rejected',
  'needs_review',
]);

export const trendingReviewQueueSchema = z.object({
  sourcePlatform: z.string().min(1),
  sourceItemId: z.string().min(1),
  sourceUrl: z.string().url(),
  rawContent: z.record(z.unknown()),
  fetchedAt: z.date().optional(),
  autoScanResult: z.record(z.unknown()),
  autoVerdict: autoVerdictEnum,
  status: trendingReviewStatusEnum,
  reviewerAdminId: z.number().int().positive().optional(),
  reviewedAt: z.date().optional(),
  rejectReason: z.string().optional(),
  trendingItemId: z.number().int().positive().optional(),
});

export type TrendingReviewQueueInput = z.infer<typeof trendingReviewQueueSchema>;

// TrendingTakedown
export const takedownReasonEnum = z.enum([
  'reported',
  'auto_rule',
  'admin_judgment',
]);

export const appealResolutionEnum = z.enum([
  'restored',
  'final_takedown',
]);

export const trendingTakedownSchema = z.object({
  trendingItemId: z.number().int().positive(),
  reason: takedownReasonEnum,
  takedownByAdminId: z.number().int().positive().optional(),
  takedownAt: z.date().optional(),
  hasAppeal: z.boolean().default(false),
  appealResolution: appealResolutionEnum.optional(),
  appealResolvedAt: z.date().optional(),
});

export type TrendingTakedownInput = z.infer<typeof trendingTakedownSchema>;

// AutoReviewRule
export const ruleTypeEnum = z.enum([
  'banned_word',
  'sampling_rate',
  'industry_quota',
]);

export const autoReviewRuleSchema = z.object({
  ruleType: ruleTypeEnum,
  ruleKey: z.string().min(1),
  ruleValue: z.record(z.unknown()),
  enabled: z.boolean().default(true),
  updatedByAdminId: z.number().int().positive(),
  updatedAt: z.date().optional(),
});

export type AutoReviewRuleInput = z.infer<typeof autoReviewRuleSchema>;
