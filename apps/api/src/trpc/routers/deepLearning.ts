/**
 * deepLearning router — PRD-2 US-005
 * AC-4: 5 procedures (list/create/createFromFile/learn/delete) · mock
 * AC-6: createFromFile stores placeholder — FileParser + DeepLearnAgent 留 PRD-7+
 */

import { z } from 'zod';

import { protectedProcedure } from '@/trpc/middleware/account-isolation';
import { router } from '@/trpc/trpc';

import type { Prisma } from '@prisma/client';

const listInput = z.object({
  limit: z.number().int().min(1).max(50).default(20),
  offset: z.number().int().min(0).default(0),
  onlyActive: z.boolean().default(true),
});

const createInput = z.object({
  sample: z.string().min(1).max(10000),
  userTitle: z.string().max(100).optional(),
  userTags: z.array(z.string().max(32)).max(10).default([]),
});

const createFromFileInput = z.object({
  fileUrl: z.string().url(),
  userTitle: z.string().max(100).optional(),
  userTags: z.array(z.string().max(32)).max(10).default([]),
});

const learnInput = z.object({
  archiveId: z.number().int().positive(),
});

const deleteInput = z.object({
  archiveId: z.number().int().positive(),
});

const ARCHIVE_SELECT = {
  id: true,
  sourceType: true,
  sample: true,
  summary: true,
  tags: true,
  userTitle: true,
  userTags: true,
  learningStatus: true,
  isActive: true,
  agentId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.DeepLearningArchiveSelect;

export const deepLearningRouter = router({
  /** List deep learning archive entries for the current account (RLS auto-filters) */
  list: protectedProcedure
    .input(listInput)
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      return prisma.deepLearningArchive.findMany({
        where: input.onlyActive ? { isActive: true } : undefined,
        select: ARCHIVE_SELECT,
        orderBy: { createdAt: 'desc' },
        take: input.limit,
        skip: input.offset,
      });
    }),

  /** Submit a text sample to the deep learn review queue (P1 mock — LD-A-5: no direct archive.create) */
  create: protectedProcedure
    .input(createInput)
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId, user } = ctx;
      const hash = Buffer.from(input.sample.slice(0, 64)).toString('base64url');
      const queue = await prisma.deepLearnReviewQueue.create({
        data: {
          userId: user!.id,
          accountId: activeAccountId!,
          fileName: input.userTitle ?? 'text-sample',
          fileMime: 'text/plain',
          fileSize: Buffer.byteLength(input.sample, 'utf8'),
          fileUrl: `mock-s3://text-sample/${hash}`,
          autoScanResult: { note: 'p1-mock-text-upload', redactedTextPreview: input.sample.slice(0, 200) },
          autoVerdict: 'needs_review',
          status: 'pending',
        },
        select: { id: true, status: true, autoVerdict: true },
      });
      return { ok: true as const, queueId: queue.id, status: queue.status };
    }),

  /** Submit a file URL to the deep learn review queue (P1 mock — FileParser 留 PRD-7+, LD-A-5) */
  createFromFile: protectedProcedure
    .input(createFromFileInput)
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId, user } = ctx;
      const queue = await prisma.deepLearnReviewQueue.create({
        data: {
          userId: user!.id,
          accountId: activeAccountId!,
          fileName: input.userTitle ?? 'file-upload',
          fileMime: 'application/octet-stream',
          fileSize: 0,
          fileUrl: input.fileUrl,
          autoScanResult: { note: 'p1-mock-file-upload' },
          autoVerdict: 'needs_review',
          status: 'pending',
        },
        select: { id: true, status: true, autoVerdict: true },
      });
      return { ok: true as const, queueId: queue.id, status: queue.status };
    }),

  /** Trigger learning for an archive entry (P1 mock — DeepLearnAgent 留 PRD-7+) */
  learn: protectedProcedure
    .input(learnInput)
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      await prisma.deepLearningArchive.update({
        where: { id: input.archiveId },
        data: { learningStatus: 'pending' },
      });
      return { ok: true, status: 'queued' as const };
    }),

  /** Soft-delete a deep learning archive entry (isActive=false) */
  delete: protectedProcedure
    .input(deleteInput)
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      await prisma.deepLearningArchive.update({
        where: { id: input.archiveId },
        data: { isActive: false },
      });
      return { ok: true };
    }),
});
