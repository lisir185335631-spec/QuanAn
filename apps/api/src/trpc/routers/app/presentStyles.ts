/**
 * presentStyles router — PRD-15 US-004
 * PresentationAgent: recommend 3-5 presentation styles (stub)
 * No LLM call — PresentationAgent left for future PRD
 */

import { z } from 'zod';

import { protectedProcedure } from '@/trpc/middleware/account-isolation';
import { router } from '@/trpc/trpc';

import type { Prisma } from '@prisma/client';

const recommendInput = z.object({
  text: z.string().min(10).max(2000),
  platform: z.string().min(1).max(50),
});

const HISTORY_SELECT = {
  id: true,
  content: true,
  agentId: true,
  traceId: true,
  createdAt: true,
} satisfies Prisma.HistorySelect;

export const presentStylesRouter = router({
  /** Recommend presentation styles (stub — PresentationAgent 留 PRD-16+) */
  recommend: protectedProcedure
    .input(recommendInput)
    .mutation(async ({ ctx, input: _input }) => {
      const { prisma, activeAccountId, traceId } = ctx;
      const row = await prisma.history.create({
        data: {
          accountId: activeAccountId!,
          agentId: 'PresentationAgent',
          sourceType: 'user',
          inputSummary: '[mock]',
          content: '[mock]',
          traceId: traceId ?? null,
        },
        select: HISTORY_SELECT,
      });
      return row;
    }),
});
