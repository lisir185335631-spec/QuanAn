import { z } from 'zod';

// violationType enum — strict 1:1 with DATA-MODEL §13.6.E
export const violationTypeEnum = z.enum([
  'pii_upload',
  'banned_content',
  'trending_abuse',
  'other',
]);

export const userViolationLogSchema = z.object({
  userId: z.number().int().positive(),
  violationType: violationTypeEnum,
  count: z.number().int().min(1).default(1),
  lastViolationAt: z.date().optional(),
  lastReviewItemId: z.number().int().positive().optional(),
  warningCount: z.number().int().min(0).default(0),
  suspendedAt: z.date().optional(),
  suspendedByAdminId: z.number().int().positive().optional(),
  suspendedReason: z.string().optional(),
});

export type UserViolationLogInput = z.infer<typeof userViolationLogSchema>;

// Upsert input — used by service layer to increment count safely (anti-race upsert pattern)
export const upsertUserViolationSchema = z.object({
  userId: z.number().int().positive(),
  violationType: violationTypeEnum,
});

export type UpsertUserViolationInput = z.infer<typeof upsertUserViolationSchema>;
