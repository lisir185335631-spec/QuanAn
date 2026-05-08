/**
 * videoAnalysis router — PRD-2 US-004
 * AC-2: 2 procedures (analyze/rewrite) · mock
 * AC-7: mutations write History row with trace_id
 * AC-8: no LLM call — AnalysisAgent 留 PRD-3+
 * Note: Zod schemas inlined — @quanqn/schemas/specialist-io has canonical definition for client use
 */

import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { router } from '@/trpc/trpc';
import { protectedProcedure } from '@/trpc/middleware/account-isolation';

const analyzeVideoInput = z.object({
  videoUrl: z.string().url(),
  platform: z.string().max(32).optional(),
  analysisType: z.enum(['full', 'quick']).default('full'),
});

const rewriteVideoInput = z.object({
  historyId: z.number().int().positive(),
  rewriteStyle: z.string().max(64).optional(),
  targetPlatform: z.string().max(32).optional(),
});

const HISTORY_SELECT = {
  id: true,
  content: true,
  agentId: true,
  traceId: true,
  createdAt: true,
} satisfies Prisma.HistorySelect;

export const videoAnalysisRouter = router({
  /** Analyze a video URL (P1 mock) */
  analyze: protectedProcedure
    .input(analyzeVideoInput)
    .mutation(async ({ ctx, input: _input }) => {
      const { prisma, activeAccountId, traceId } = ctx;
      const row = await prisma.history.create({
        data: {
          accountId: activeAccountId!,
          agentId: 'video_analysis',
          sourceType: 'user',
          inputSummary: '[mock]',
          content: '[mock]',
          traceId: traceId ?? null,
        },
        select: HISTORY_SELECT,
      });
      return row;
    }),

  /** Rewrite video script based on analysis (P1 mock) */
  rewrite: protectedProcedure
    .input(rewriteVideoInput)
    .mutation(async ({ ctx, input: _input }) => {
      const { prisma, activeAccountId, traceId } = ctx;
      const row = await prisma.history.create({
        data: {
          accountId: activeAccountId!,
          agentId: 'video_analysis',
          sourceType: 'user',
          inputSummary: '[mock rewrite]',
          content: '[mock]',
          traceId: traceId ?? null,
        },
        select: HISTORY_SELECT,
      });
      return row;
    }),
});
