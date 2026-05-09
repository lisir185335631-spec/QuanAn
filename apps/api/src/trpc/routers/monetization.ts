/**
 * monetization router — PRD-2 US-004
 * AC-5: 1 procedure (generate) · mock
 * AC-7: mutation writes History row with trace_id
 * AC-8: no LLM call — MonetizationAgent 留 PRD-3+
 * Note: Zod schemas inlined — @quanqn/schemas/specialist-io has canonical definition for client use
 */

import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { router } from '@/trpc/trpc';
import { protectedProcedure } from '@/trpc/middleware/account-isolation';

const generateMonetizationInput = z.object({
  stepKey: z.string().min(1).max(64).default('step4b'),
  industryContext: z.record(z.unknown()).optional(),
  audienceProfile: z.record(z.unknown()).optional(),
});

const HISTORY_SELECT = {
  id: true,
  content: true,
  agentId: true,
  traceId: true,
  createdAt: true,
} satisfies Prisma.HistorySelect;

export const monetizationRouter = router({
  /** Generate monetization strategy (P1 mock) */
  generate: protectedProcedure
    .input(generateMonetizationInput)
    .mutation(async ({ ctx, input: _input }) => {
      const { prisma, activeAccountId, traceId } = ctx;
      const row = await prisma.history.create({
        data: {
          accountId: activeAccountId!,
          agentId: 'MonetizationAgent',
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
