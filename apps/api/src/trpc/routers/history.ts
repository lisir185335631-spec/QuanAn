/**
 * history router — PRD-5 US-011
 * AC-1: list query (protectedProcedure · agentId?, agentMode?, sourceType?, dateRange?, limit, offset)
 * AC-2: list select { id, agentId, agentMode, sourceType, inputSummary, content, contentType, scriptType, elements, isFallback, traceId, createdAt }
 * AC-3: detail query (findFirst + accountId · NOT_FOUND)
 * AC-4: delete mutation (deleteMany + accountId RLS · { ok: true })
 * AC-12: limit > 100 → zod max(100)
 * AC-13: detail not found → NOT_FOUND
 * SHIELD REJ-013: protectedProcedure (non-publicProcedure)
 * SHIELD REJ-008: explicit accountId where + RLS via protectedProcedure
 */

import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { router } from '@/trpc/trpc';
import { protectedProcedure } from '@/trpc/middleware/account-isolation';

// ── Constants ─────────────────────────────────────────────────────────────────

const DATE_RANGE_VALUES = ['last_7d', 'last_30d', 'all'] as const;

// ── Select ────────────────────────────────────────────────────────────────────

const HISTORY_SELECT = {
  id: true,
  agentId: true,
  agentMode: true,
  sourceType: true,
  inputSummary: true,
  content: true,
  contentType: true,
  scriptType: true,
  elements: true,
  isFallback: true,
  traceId: true,
  createdAt: true,
} satisfies Prisma.HistorySelect;

function buildDateFilter(dateRange: 'last_7d' | 'last_30d' | 'all'): Prisma.HistoryWhereInput {
  if (dateRange === 'all') return {};
  const since = new Date();
  since.setDate(since.getDate() - (dateRange === 'last_7d' ? 7 : 30));
  return { createdAt: { gte: since } };
}

export const historyRouter = router({
  /**
   * AC-1,2: list with optional filters, pagination, ordered by createdAt desc
   * AC-12: limit capped at 100 by zod max
   */
  list: protectedProcedure
    .input(
      z.object({
        agentId: z.string().optional(),
        agentMode: z.string().optional(),
        sourceType: z.string().optional(),
        dateRange: z.enum(DATE_RANGE_VALUES).default('all'),
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { prisma, activeAccountId } = ctx;
      const { agentId, agentMode, sourceType, dateRange, limit, offset } = input;

      const where: Prisma.HistoryWhereInput = {
        accountId: activeAccountId!,
        ...(agentId !== undefined ? { agentId } : {}),
        ...(agentMode !== undefined ? { agentMode } : {}),
        ...(sourceType !== undefined ? { sourceType } : {}),
        ...buildDateFilter(dateRange),
      };

      return prisma.history.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: HISTORY_SELECT,
      });
    }),

  /**
   * AC-3: detail by id — explicit accountId check → NOT_FOUND if missing
   */
  detail: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const { prisma, activeAccountId } = ctx;

      const row = await prisma.history.findFirst({
        where: { id: input.id, accountId: activeAccountId! },
        select: HISTORY_SELECT,
      });

      if (!row) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'history_not_found' });
      }

      return row;
    }),

  /**
   * AC-4: delete by id — explicit accountId guard via deleteMany
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId } = ctx;

      await prisma.history.deleteMany({
        where: { id: input.id, accountId: activeAccountId! },
      });

      return { ok: true } as const;
    }),
});
