import { z } from 'zod';

// DeepLearnReviewQueue status / autoVerdict enums — strict 1:1 with prisma model comments
export const deepLearnReviewStatusEnum = z.enum([
  'pending',
  'approved',
  'rejected',
  'auto_approved',
  'auto_rejected',
]);

export const deepLearnAutoVerdictEnum = z.enum([
  'auto_approved',
  'auto_rejected',
  'needs_review',
]);

export const deepLearnReviewQueueSchema = z.object({
  userId: z.number().int().positive(),
  accountId: z.number().int().positive(),
  fileName: z.string().min(1),
  fileMime: z.string().min(1),
  fileSize: z.number().int().positive(),
  fileUrl: z.string().url(),
  uploadedAt: z.date().optional(),
  autoScanResult: z.record(z.unknown()),
  autoVerdict: deepLearnAutoVerdictEnum,
  status: deepLearnReviewStatusEnum,
  reviewerAdminId: z.number().int().positive().optional(),
  reviewedAt: z.date().optional(),
  rejectReason: z.string().optional(),
  archiveId: z.number().int().positive().optional(),
});

export type DeepLearnReviewQueueInput = z.infer<typeof deepLearnReviewQueueSchema>;
