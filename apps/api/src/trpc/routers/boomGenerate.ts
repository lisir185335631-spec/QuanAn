/**
 * boomGenerate router — PRD-2 US-004
 * AC-4: 1 procedure (generate) · mock
 * AC-7: mutation writes History row with trace_id
 * AC-8: no LLM call — CopywritingAgent(boom mode) 留 PRD-3+
 * Note: Zod schemas inlined — @quanqn/schemas/specialist-io has canonical definition for client use
 */

import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { router } from '@/trpc/trpc';
import { protectedProcedure } from '@/trpc/middleware/account-isolation';

const generateBoomInput = z.object({
  stepKey: z.string().min(1).max(64),
  theme: z.string().max(64).optional(),
  tone: z.string().max(32).optional(),
  context: z.record(z.unknown()).optional(),
});

const HISTORY_SELECT = {
  id: true,
  content: true,
  agentId: true,
  traceId: true,
  createdAt: true,
} satisfies Prisma.HistorySelect;

export const boomGenerateRouter = router({
  /** Generate boom content (P1 mock) */
  generate: protectedProcedure
    .input(generateBoomInput)
    .mutation(async ({ ctx, input: _input }) => {
      const { prisma, activeAccountId, traceId } = ctx;
      const row = await prisma.history.create({
        data: {
          accountId: activeAccountId!,
          agentId: 'boom_generate',
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
