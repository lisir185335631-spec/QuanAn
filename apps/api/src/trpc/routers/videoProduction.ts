/**
 * videoProduction router — PRD-2 US-004
 * AC-3: 3 procedures (generate/generateStoryboard/generateSceneImage) · mock
 * AC-7: mutations write History row with trace_id
 * AC-8: no LLM call — VideoAgent + ImageGen 留 PRD-3+
 * Note: Zod schemas inlined — @quanqn/schemas/specialist-io has canonical definition for client use
 */

import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { router } from '@/trpc/trpc';
import { protectedProcedure } from '@/trpc/middleware/account-isolation';

const generateVideoInput = z.object({
  stepKey: z.string().min(1).max(64),
  style: z.string().max(64).optional(),
  duration: z.number().int().min(1).max(600).optional(),
  context: z.record(z.unknown()).optional(),
});

const generateStoryboardInput = z.object({
  stepKey: z.string().min(1).max(64),
  sceneCount: z.number().int().min(1).max(30).default(5),
  style: z.string().max(64).optional(),
});

const generateSceneImageInput = z.object({
  storyboardHistoryId: z.number().int().positive(),
  sceneIndex: z.number().int().min(0),
  prompt: z.string().min(1).max(500).optional(),
});

const HISTORY_SELECT = {
  id: true,
  content: true,
  agentId: true,
  traceId: true,
  createdAt: true,
} satisfies Prisma.HistorySelect;

export const videoProductionRouter = router({
  /** Generate video script (P1 mock) */
  generate: protectedProcedure
    .input(generateVideoInput)
    .mutation(async ({ ctx, input: _input }) => {
      const { prisma, activeAccountId, traceId } = ctx;
      const row = await prisma.history.create({
        data: {
          accountId: activeAccountId!,
          agentId: 'video_production',
          sourceType: 'user',
          inputSummary: '[mock]',
          content: '[mock]',
          traceId: traceId ?? null,
        },
        select: HISTORY_SELECT,
      });
      return row;
    }),

  /** Generate video storyboard (P1 mock) */
  generateStoryboard: protectedProcedure
    .input(generateStoryboardInput)
    .mutation(async ({ ctx, input: _input }) => {
      const { prisma, activeAccountId, traceId } = ctx;
      const row = await prisma.history.create({
        data: {
          accountId: activeAccountId!,
          agentId: 'video_production',
          sourceType: 'user',
          inputSummary: '[mock storyboard]',
          content: '[mock]',
          traceId: traceId ?? null,
        },
        select: HISTORY_SELECT,
      });
      return row;
    }),

  /** Generate scene image from storyboard (P1 mock) */
  generateSceneImage: protectedProcedure
    .input(generateSceneImageInput)
    .mutation(async ({ ctx, input: _input }) => {
      const { prisma, activeAccountId, traceId } = ctx;
      const row = await prisma.history.create({
        data: {
          accountId: activeAccountId!,
          agentId: 'video_production',
          sourceType: 'user',
          inputSummary: '[mock scene]',
          content: '[mock]',
          traceId: traceId ?? null,
        },
        select: HISTORY_SELECT,
      });
      return row;
    }),
});
