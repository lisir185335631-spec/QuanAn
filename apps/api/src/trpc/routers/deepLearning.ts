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

  /** Create a deep learning archive entry from text (P1 mock) */
  create: protectedProcedure
    .input(createInput)
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId, traceId } = ctx;
      const hash = Buffer.from(input.sample.slice(0, 64)).toString('base64url');
      return prisma.deepLearningArchive.create({
        data: {
          accountId: activeAccountId!,
          sourceType: 'text',
          sample: input.sample,
          sampleHash: hash,
          userTitle: input.userTitle ?? null,
          userTags: input.userTags,
          learningStatus: 'pending',
          agentId: 'DeepLearnAgent',
          traceId: traceId ?? null,
        },
        select: ARCHIVE_SELECT,
      });
    }),

  /** Create a deep learning archive entry from file URL (P1 mock — FileParser 留 PRD-7+) */
  createFromFile: protectedProcedure
    .input(createFromFileInput)
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId, traceId } = ctx;
      const hash = Buffer.from(input.fileUrl.slice(0, 64)).toString('base64url');
      return prisma.deepLearningArchive.create({
        data: {
          accountId: activeAccountId!,
          sourceType: 'file',
          sample: '[file-content-pending]',
          sampleHash: hash,
          userTitle: input.userTitle ?? null,
          userTags: input.userTags,
          learningStatus: 'pending',
          agentId: 'DeepLearnAgent',
          traceId: traceId ?? null,
        },
        select: ARCHIVE_SELECT,
      });
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
