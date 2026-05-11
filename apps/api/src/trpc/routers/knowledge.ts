/**
 * knowledge router — PRD-2 US-006 + PRD-9 US-004
 * AC-1: 7 procedures (getRecommendations/getScriptCases/getFavorites/addFavorite/removeFavorite/getNotes/addNote) · mock
 * AC-6: addFavorite/removeFavorite/getFavorites/getNotes/addNote use protectedProcedure → per-account RLS isolation
 * PRD-9 US-004 AC-1: 3 new public procedures (list/search/getById) — no auth, knowledge base public access
 */

import { z } from 'zod';

import { protectedProcedure } from '@/trpc/middleware/account-isolation';
import { publicProcedure, router } from '@/trpc/trpc';
import { ragRetrieveWorker } from '@/workers/rag/retrieve';

import type { Prisma } from '@prisma/client';
import type { KnowledgeChunkContent } from '@quanqn/schemas';

// ── PRD-9 US-004: public knowledge procedures ─────────────────────────────────

const listInput = z.object({
  type: z.enum(['case', 'formula', 'element']).optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

const searchInput = z.object({
  query: z.string().min(1).max(500),
  topK: z.number().int().min(1).max(20).default(10),
  type: z.enum(['case', 'formula', 'element']).optional(),
});

const getByIdInput = z.object({
  id: z.number().int().positive(),
});

const getRecommendationsInput = z.object({
  limit: z.number().int().min(1).max(50).default(10),
});

const getScriptCasesInput = z.object({
  industry: z.string().max(64).optional(),
  limit: z.number().int().min(1).max(50).default(10),
});

const getFavoritesInput = z.object({
  itemType: z.string().max(32).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

const addFavoriteInput = z.object({
  itemType: z.string().min(1).max(32),
  itemKey: z.string().min(1).max(128),
  userTags: z.array(z.string().max(64)).optional(),
});

const removeFavoriteInput = z.object({
  itemType: z.string().min(1).max(32),
  itemKey: z.string().min(1).max(128),
});

const getNotesInput = z.object({
  itemType: z.string().max(32).optional(),
  itemKey: z.string().max(128).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

const addNoteInput = z.object({
  content: z.string().min(1),
  title: z.string().max(200).optional(),
  itemType: z.string().max(32).optional(),
  itemKey: z.string().max(128).optional(),
  tags: z.array(z.string().max(64)).optional(),
});

const FAVORITE_SELECT = {
  id: true,
  accountId: true,
  itemType: true,
  itemKey: true,
  userTags: true,
  noteId: true,
  createdAt: true,
} satisfies Prisma.KnowledgeFavoriteSelect;

const NOTE_SELECT = {
  id: true,
  accountId: true,
  itemType: true,
  itemKey: true,
  content: true,
  title: true,
  tags: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.KnowledgeNoteSelect;

export const knowledgeRouter = router({
  /** List knowledge chunks by type (no embedding · public) */
  list: publicProcedure
    .input(listInput)
    .query(async ({ ctx, input }): Promise<KnowledgeChunkContent[]> => {
      const rows = await ctx.prisma.knowledgeChunk.findMany({
        where: input.type ? { type: input.type } : undefined,
        select: { id: true, type: true, title: true, content: true, metadata: true, tokens: true },
        orderBy: { id: 'asc' },
        take: input.limit,
        skip: input.offset,
      });
      return rows.map((r) => ({
        id: r.id,
        type: r.type as 'case' | 'formula' | 'element',
        title: r.title,
        content: r.content,
        metadata: r.metadata as Record<string, unknown>,
        tokens: r.tokens,
      }));
    }),

  /** Semantic search via ragRetrieveWorker (public — uses system accountId 0) */
  search: publicProcedure
    .input(searchInput)
    .mutation(async ({ ctx, input }): Promise<KnowledgeChunkContent[]> => {
      return ragRetrieveWorker.retrieve({
        query: input.query,
        topK: input.topK,
        type: input.type,
        accountId: 0,
        traceId: ctx.traceId,
      });
    }),

  /** Get single knowledge chunk by ID (public) */
  getById: publicProcedure
    .input(getByIdInput)
    .query(async ({ ctx, input }): Promise<KnowledgeChunkContent | null> => {
      const row = await ctx.prisma.knowledgeChunk.findUnique({
        where: { id: input.id },
        select: { id: true, type: true, title: true, content: true, metadata: true, tokens: true },
      });
      if (!row) return null;
      return {
        id: row.id,
        type: row.type as 'case' | 'formula' | 'element',
        title: row.title,
        content: row.content,
        metadata: row.metadata as Record<string, unknown>,
        tokens: row.tokens,
      };
    }),

  /** Get content recommendations for current account (P1 mock — actual RAG 留 PRD-9) */
  getRecommendations: protectedProcedure
    .input(getRecommendationsInput)
    .query(({ input: _input }) => {
      return [{ itemType: 'script_case', itemKey: 'mock-001', title: '[mock recommendation]' }];
    }),

  /** Get script case studies (P1 mock — actual RAG 留 PRD-9) */
  getScriptCases: protectedProcedure
    .input(getScriptCasesInput)
    .query(({ input }) => {
      return [{ itemType: 'script_case', itemKey: 'mock-001', title: '[mock script case]', industry: input.industry ?? null }];
    }),

  /** List favorites for current account (LD-009 双层防护: explicit accountId + RLS · TD-019 修) */
  getFavorites: protectedProcedure
    .input(getFavoritesInput)
    .query(async ({ ctx, input }) => {
      const { prisma, activeAccountId } = ctx;
      return prisma.knowledgeFavorite.findMany({
        where: {
          accountId: activeAccountId!,
          ...(input.itemType ? { itemType: input.itemType } : {}),
        },
        select: FAVORITE_SELECT,
        orderBy: { createdAt: 'desc' },
        take: input.limit,
        skip: input.offset,
      });
    }),

  /** Add a favorite (AC-6: per-account RLS isolation) */
  addFavorite: protectedProcedure
    .input(addFavoriteInput)
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId, traceId } = ctx;
      return prisma.knowledgeFavorite.create({
        data: {
          accountId: activeAccountId!,
          itemType: input.itemType,
          itemKey: input.itemKey,
          userTags: input.userTags ?? [],
          traceId: traceId ?? null,
        },
        select: FAVORITE_SELECT,
      });
    }),

  /** Remove a favorite (idempotent deleteMany) */
  removeFavorite: protectedProcedure
    .input(removeFavoriteInput)
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId } = ctx;
      await prisma.knowledgeFavorite.deleteMany({
        where: {
          accountId: activeAccountId!,
          itemType: input.itemType,
          itemKey: input.itemKey,
        },
      });
      return { ok: true };
    }),

  /** List notes for current account (LD-009 双层防护: explicit accountId + RLS · TD-019 修) */
  getNotes: protectedProcedure
    .input(getNotesInput)
    .query(async ({ ctx, input }) => {
      const { prisma, activeAccountId } = ctx;
      return prisma.knowledgeNote.findMany({
        where: {
          accountId: activeAccountId!,
          ...(input.itemType ? { itemType: input.itemType } : {}),
          ...(input.itemKey ? { itemKey: input.itemKey } : {}),
        },
        select: NOTE_SELECT,
        orderBy: { updatedAt: 'desc' },
        take: input.limit,
        skip: input.offset,
      });
    }),

  /** Add a note for current account */
  addNote: protectedProcedure
    .input(addNoteInput)
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId, traceId } = ctx;
      return prisma.knowledgeNote.create({
        data: {
          accountId: activeAccountId!,
          content: input.content,
          title: input.title ?? null,
          itemType: input.itemType ?? null,
          itemKey: input.itemKey ?? null,
          tags: input.tags ?? [],
          traceId: traceId ?? null,
        },
        select: NOTE_SELECT,
      });
    }),
});
