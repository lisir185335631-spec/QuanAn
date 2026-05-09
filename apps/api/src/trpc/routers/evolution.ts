/**
 * Evolution router — PRD-2 US-002 + US-005
 * US-002 AC-3: getProfile returns EvolutionProfile for the active account (cached client-side in LS)
 * US-005 AC-3: 7 procedures (evolve/getConfig/updateConfig/history/recentFeedback/feedbackTrend/moduleRanking) · mock
 * Note: EvolutionAgent heartbeat + actual evolution logic 留 PRD-8+
 */

import { z } from 'zod';

import { protectedProcedure } from '@/trpc/middleware/account-isolation';
import { router } from '@/trpc/trpc';

import type { Prisma } from '@prisma/client';

// ─── Shared selects ──────────────────────────────────────────────────────────

const FEEDBACK_LOG_SELECT = {
  id: true,
  rating: true,
  agentId: true,
  comment: true,
  traceId: true,
  createdAt: true,
} satisfies Prisma.FeedbackLogSelect;

const EVOLUTION_INSIGHT_SELECT = {
  id: true,
  triggerType: true,
  direction: true,
  content: true,
  levelBefore: true,
  levelAfter: true,
  createdAt: true,
} satisfies Prisma.EvolutionInsightSelect;

// ─── Input schemas ───────────────────────────────────────────────────────────

const evolveInput = z.object({
  rating: z.enum(['good', 'bad']),
  agentId: z.string().min(1).max(64),
  rateableType: z.string().max(32).default('history'),
  rateableId: z.number().int().positive(),
  historyId: z.number().int().positive().optional(),
  comment: z.string().max(200).optional(),
});

const updateConfigInput = z.object({
  autoEvolutionEnabled: z.boolean().optional(),
  currentDirection: z.string().max(32).optional(),
});

const historyInput = z.object({
  limit: z.number().int().min(1).max(50).default(20),
  offset: z.number().int().min(0).default(0),
});

const recentFeedbackInput = z.object({
  limit: z.number().int().min(1).max(50).default(20),
  agentId: z.string().max(64).optional(),
});

const feedbackTrendInput = z.object({
  days: z.number().int().min(7).max(90).default(30),
});

const moduleRankingInput = z.object({
  limit: z.number().int().min(1).max(20).default(10),
});

export const evolutionRouter = router({
  // ─── US-002: EvolutionProfile read ─────────────────────────────────────────
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const { prisma, activeAccountId } = ctx;

    const profile = await prisma.evolutionProfile.findUnique({
      where: { accountId: activeAccountId! },
      select: {
        id: true,
        level: true,
        feedbackCountGood: true,
        feedbackCountBad: true,
        feedbackCountTotal: true,
        satisfactionRate: true,
        currentDirection: true,
        autoEvolutionEnabled: true,
        deepLearningCount: true,
        lastEvolvedAt: true,
        lastUpgradedAt: true,
        updatedAt: true,
      },
    });

    return profile ?? null;
  }),

  // ─── US-005: 7 new Specialist procedures ───────────────────────────────────

  /** Write feedback + record (P1 mock — EvolutionAgent evolution loop 留 PRD-8+) */
  evolve: protectedProcedure
    .input(evolveInput)
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId, traceId } = ctx;
      const row = await prisma.feedbackLog.create({
        data: {
          accountId: activeAccountId!,
          userId: ctx.user?.id ?? null,
          rating: input.rating,
          agentId: input.agentId,
          historyId: input.historyId ?? null,
          comment: input.comment ?? null,
          rateableType: input.rateableType,
          rateableId: input.rateableId,
          traceId: traceId ?? null,
        },
        select: FEEDBACK_LOG_SELECT,
      });
      return { ok: true, feedbackId: row.id };
    }),

  /** Get evolution config for the current account */
  getConfig: protectedProcedure.query(async ({ ctx }) => {
    const { prisma, activeAccountId } = ctx;
    const profile = await prisma.evolutionProfile.findUnique({
      where: { accountId: activeAccountId! },
      select: { autoEvolutionEnabled: true, currentDirection: true, level: true },
    });
    return profile ?? { autoEvolutionEnabled: false, currentDirection: '综合', level: 'L1' };
  }),

  /** Update evolution config (autoEvolutionEnabled / currentDirection) */
  updateConfig: protectedProcedure
    .input(updateConfigInput)
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId } = ctx;
      const updated = await prisma.evolutionProfile.upsert({
        where: { accountId: activeAccountId! },
        create: { accountId: activeAccountId!, ...input },
        update: input,
        select: { autoEvolutionEnabled: true, currentDirection: true, level: true },
      });
      return { ok: true, config: updated };
    }),

  /** List evolution insights history (RLS auto-filters by account) */
  history: protectedProcedure
    .input(historyInput)
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      return prisma.evolutionInsight.findMany({
        select: EVOLUTION_INSIGHT_SELECT,
        orderBy: { createdAt: 'desc' },
        take: input.limit,
        skip: input.offset,
      });
    }),

  /** Recent feedback log entries (RLS auto-filters by account) */
  recentFeedback: protectedProcedure
    .input(recentFeedbackInput)
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      return prisma.feedbackLog.findMany({
        where: input.agentId ? { agentId: input.agentId } : undefined,
        select: FEEDBACK_LOG_SELECT,
        orderBy: { createdAt: 'desc' },
        take: input.limit,
      });
    }),

  /** Feedback trend by day (P1 mock — real aggregation 留 PRD-8+) */
  feedbackTrend: protectedProcedure
    .input(feedbackTrendInput)
    .query(({ ctx: _ctx, input }) => {
      return {
        data: [] as Array<{ date: string; good: number; bad: number }>,
        days: input.days,
      };
    }),

  /** Module satisfaction ranking (P1 mock — real aggregation 留 PRD-8+) */
  moduleRanking: protectedProcedure
    .input(moduleRankingInput)
    .query(({ ctx: _ctx, input: _input }) => {
      return {
        ranking: [] as Array<{
          agentId: string;
          goodCount: number;
          badCount: number;
          satisfactionRate: number;
        }>,
      };
    }),
});
