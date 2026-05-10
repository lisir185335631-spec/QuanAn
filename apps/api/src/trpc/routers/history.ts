/**
 * history router — PRD-5 US-011 · PRD-6 US-013
 * AC-1: list query (protectedProcedure · agentId?, agentMode?, sourceType?, dateRange?, limit, offset)
 * AC-2: list select { id, agentId, agentMode, sourceType, inputSummary, content, contentType, scriptType, elements, isFallback, traceId, createdAt }
 * AC-3: detail query (findFirst + accountId · NOT_FOUND)
 * AC-4: delete mutation (deleteMany + accountId RLS · { ok: true })
 * AC-12: limit > 100 → zod max(100)
 * AC-13: detail not found → NOT_FOUND
 * US-013 AC-2: detail storyboard → join Asset table → scenes[]{ index, description, imagePromptEn, duration, status, sceneImageUrl }
 * SHIELD REJ-013: protectedProcedure (non-publicProcedure)
 * SHIELD REJ-008: explicit accountId where + RLS via protectedProcedure
 * SHIELD TD-019: explicit accountId double-layer guard (no RLS-only)
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { protectedProcedure } from '@/trpc/middleware/account-isolation';
import { router } from '@/trpc/trpc';

import type { Prisma } from '@prisma/client';

// ── Constants ─────────────────────────────────────────────────────────────────

const DATE_RANGE_VALUES = ['last_7d', 'last_30d', 'all'] as const;

// ── Storyboard scene types (US-013 · mirrors StoredScene in aiVideo.ts) ────────

interface StoredScene {
  index: number;
  description: string;
  imagePromptEn: string;
  duration: string;
  sceneImageUrl: string | null;
  status: 'pending' | 'completed' | 'failed';
}

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
   * US-013 AC-2: storyboard rows → join Asset table for sceneImageUrls
   * SHIELD TD-019: where: { id, accountId } double-layer guard
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

      // US-013 AC-2: storyboard → join Asset for authoritative sceneImageUrls
      if (row.agentMode === 'storyboard') {
        let contentScenes: StoredScene[] = [];
        try {
          const parsed = JSON.parse(row.content) as { scenes?: StoredScene[] };
          contentScenes = parsed.scenes ?? [];
        } catch { /* non-JSON content — return empty scenes */ }

        // Explicit accountId double-layer guard (LD-009 · TD-019)
        const assets = await prisma.asset.findMany({
          where: { relatedHistoryId: row.id, accountId: activeAccountId! },
          select: { sceneIndex: true, publicUrl: true },
          orderBy: { sceneIndex: 'asc' },
        });

        const assetMap = new Map(assets.map((a) => [a.sceneIndex, a.publicUrl]));

        const scenes = contentScenes.map((s) => ({
          index: s.index,
          description: s.description,
          imagePromptEn: s.imagePromptEn,
          duration: s.duration,
          status: s.status,
          sceneImageUrl: assetMap.get(s.index) ?? s.sceneImageUrl ?? null,
        }));

        return { ...row, scenes };
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
