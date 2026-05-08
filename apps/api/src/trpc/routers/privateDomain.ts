/**
 * privateDomain router — PRD-2 US-005
 * AC-1: 1 procedure (generate) · mock
 * AC-7: mutation writes History row with trace_id
 * AC-8: no LLM call — PrivateDomainAgent 留 PRD-6+
 */

import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { router } from '@/trpc/trpc';
import { protectedProcedure } from '@/trpc/middleware/account-isolation';

const generatePrivateDomainInput = z.object({
  stepKey: z.string().min(1).max(64),
  stage: z.enum(['awareness', 'interest', 'desire', 'action', 'loyalty', 'advocacy']).optional(),
  context: z.record(z.unknown()).optional(),
});

const HISTORY_SELECT = {
  id: true,
  content: true,
  agentId: true,
  traceId: true,
  createdAt: true,
} satisfies Prisma.HistorySelect;

export const privateDomainRouter = router({
  /** Generate private domain strategy content (P1 mock — PrivateDomainAgent 留 PRD-6+) */
  generate: protectedProcedure
    .input(generatePrivateDomainInput)
    .mutation(async ({ ctx, input: _input }) => {
      const { prisma, activeAccountId, traceId } = ctx;
      const row = await prisma.history.create({
        data: {
          accountId: activeAccountId!,
          agentId: 'private_domain',
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
