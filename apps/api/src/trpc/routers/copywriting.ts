/**
 * copywriting router — PRD-2 US-004
 * AC-1: 4 procedures (generate/optimize/list/delete) · all return mock data
 * AC-7: mutations write History row with trace_id
 * AC-8: no LLM call — CopywritingAgent 留 PRD-3+
 * Note: Zod schemas inlined — @quanqn/schemas/specialist-io has canonical definition for client use
 */

import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { router } from '@/trpc/trpc';
import { protectedProcedure } from '@/trpc/middleware/account-isolation';

const generateCopywritingInput = z.object({
  stepKey: z.string().min(1).max(64),
  tone: z.string().max(32).optional(),
  length: z.enum(['short', 'medium', 'long']).optional(),
  context: z.record(z.unknown()).optional(),
});

const optimizeCopywritingInput = z.object({
  historyId: z.number().int().positive(),
  instruction: z.string().min(1).max(500),
});

const listCopywritingInput = z.object({
  stepKey: z.string().min(1).max(64).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

const deleteCopywritingInput = z.object({
  historyId: z.number().int().positive(),
});

const HISTORY_SELECT = {
  id: true,
  content: true,
  agentId: true,
  traceId: true,
  createdAt: true,
} satisfies Prisma.HistorySelect;

export const copywritingRouter = router({
  /** Generate copywriting via CopywritingAgent (P1 mock) */
  generate: protectedProcedure
    .input(generateCopywritingInput)
    .mutation(async ({ ctx, input: _input }) => {
      const { prisma, activeAccountId, traceId } = ctx;
      // AC-7: write History row; AC-8: content is mock, no LLM call
      const row = await prisma.history.create({
        data: {
          accountId: activeAccountId!,
          agentId: 'copywriting',
          sourceType: 'user',
          inputSummary: '[mock]',
          content: '[mock]',
          traceId: traceId ?? null,
        },
        select: HISTORY_SELECT,
      });
      return row;
    }),

  /** Optimize existing copywriting (P1 mock) */
  optimize: protectedProcedure
    .input(optimizeCopywritingInput)
    .mutation(async ({ ctx, input: _input }) => {
      const { prisma, activeAccountId, traceId } = ctx;
      const row = await prisma.history.create({
        data: {
          accountId: activeAccountId!,
          agentId: 'copywriting',
          sourceType: 'user',
          inputSummary: '[mock optimize]',
          content: '[mock]',
          traceId: traceId ?? null,
        },
        select: HISTORY_SELECT,
      });
      return row;
    }),

  /** List copywriting history for current account (RLS auto-filters by account) */
  list: protectedProcedure
    .input(listCopywritingInput)
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      return prisma.history.findMany({
        where: { agentId: 'copywriting' },
        select: HISTORY_SELECT,
        orderBy: { createdAt: 'desc' },
        take: input.limit,
        skip: input.offset,
      });
    }),

  /** Delete a copywriting history entry */
  delete: protectedProcedure
    .input(deleteCopywritingInput)
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      await prisma.history.delete({ where: { id: input.historyId } });
      return { ok: true };
    }),
});
