/**
 * Evolution router — PRD-2 US-002 + PRD-8 US-005
 * US-002 AC-3: getProfile returns EvolutionProfile for the active account
 * PRD-8 US-005: 4 procedures (getProfile/getInsightHistory/getFeedbackTrend/getModuleRanking) · real implementation
 * US-003 AC-8: evolve mutation hook → enqueueIfThresholdMet (async · 不阻塞 mutation)
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { inferLevel } from '@/lib/constants/evolution';
import { enqueueIfThresholdMet, getEvolutionQueueCount } from '@/lib/evolution/trigger';
import { logger } from '@/lib/logger';
import { contextAssembler } from '@/services/context-assembler/ContextAssembler';
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
  rateableId: z.number().int().min(0),
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
        latestInsight: true,
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

      // AC-8: 异步调 enqueueIfThresholdMet · 不阻塞 mutation
      void enqueueIfThresholdMet(activeAccountId!, traceId ?? row.traceId ?? 'unknown').catch(
        (err: unknown) => {
          logger.error({ err, accountId: activeAccountId }, 'evolution.evolve.trigger_failed');
        },
      );

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
      const rows = await prisma.feedbackLog.findMany({
        where: input.agentId ? { agentId: input.agentId } : undefined,
        select: FEEDBACK_LOG_SELECT,
        orderBy: { createdAt: 'desc' },
        take: input.limit,
      });
      // rating 列是 VarChar,但写入恒经 z.enum(['good','bad']) 校验 → 收窄回域类型(对齐 client FeedbackItem)
      return rows.map((r) => ({ ...r, rating: r.rating as 'good' | 'bad' }));
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

  // ─── PRD-8 US-005: 4 real procedures (AC-1~AC-5) ──────────────────────────

  /** AC-3: Insight history · max 10 · desc · LD-009 dual-layer: protectedProcedure + accountId filter */
  getInsightHistory: protectedProcedure.query(async ({ ctx }) => {
    const { prisma, activeAccountId } = ctx;
    return prisma.evolutionInsight.findMany({
      where: { accountId: activeAccountId! },
      select: EVOLUTION_INSIGHT_SELECT,
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }),

  /** AC-4: Feedback trend by day · approved deviation: Prisma groupBy cannot do DATE_TRUNC natively;
   *  $queryRaw produces the same {date,total,good,satisfactionRate}[] shape · LD-009 dual-layer */
  getFeedbackTrend: protectedProcedure
    .input(feedbackTrendInput)
    .query(async ({ ctx, input }) => {
      const { prisma, activeAccountId } = ctx;
      const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);

      const rows = await prisma.$queryRaw<
        Array<{ date: string; total: bigint; good: bigint }>
      >`
        SELECT
          DATE_TRUNC('day', created_at)::date::text AS date,
          COUNT(*)::bigint                          AS total,
          COUNT(*) FILTER (WHERE rating = 'good')::bigint AS good
        FROM feedback_logs
        WHERE account_id = ${activeAccountId!}
          AND created_at >= ${since}
        GROUP BY 1
        ORDER BY 1
      `;

      return rows.map((r) => ({
        date: r.date,
        total: Number(r.total),
        good: Number(r.good),
        satisfactionRate: Number(r.total) > 0 ? Number(r.good) / Number(r.total) : 0,
      }));
    }),

  /** AC-5: Module ranking · cost_log + feedback_log · grouped by agentId · LD-009 dual-layer */
  getModuleRanking: protectedProcedure
    .input(moduleRankingInput)
    .query(async ({ ctx, input }) => {
      const { prisma, activeAccountId } = ctx;

      const [feedbackGroups, goodGroups, costGroups] = await Promise.all([
        prisma.feedbackLog.groupBy({
          by: ['agentId'],
          where: { accountId: activeAccountId! },
          _count: { id: true },
        }),
        prisma.feedbackLog.groupBy({
          by: ['agentId'],
          where: { accountId: activeAccountId!, rating: 'good' },
          _count: { id: true },
        }),
        prisma.costLog.groupBy({
          by: ['agentId'],
          where: { accountId: activeAccountId! },
          _count: { id: true },
        }),
      ]);

      const goodMap = new Map(goodGroups.map((g) => [g.agentId, g._count.id]));
      const costMap = new Map(costGroups.map((g) => [g.agentId, g._count.id]));

      const ranking = feedbackGroups
        .map((g) => {
          const totalFeedback = g._count.id;
          const goodCount = goodMap.get(g.agentId) ?? 0;
          const badCount = totalFeedback - goodCount;
          return {
            agentId: g.agentId,
            goodCount,
            badCount,
            totalCalls: costMap.get(g.agentId) ?? 0,
            satisfactionRate: totalFeedback > 0 ? goodCount / totalFeedback : 0,
          };
        })
        .sort((a, b) => b.satisfactionRate - a.satisfactionRate)
        .slice(0, input.limit);

      return { ranking };
    }),

  // ─── US-006 DEBUG procedures (non-production only) ────────────────────────

  /** AC-1 debug: returns evolution BullMQ queue waiting count */
  debugQueueCount: protectedProcedure.query(async () => {
    if (process.env['NODE_ENV'] === 'production') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'debug endpoint disabled in production' });
    }
    const waiting = await getEvolutionQueueCount();
    return { waiting };
  }),

  /** AC-2 debug: seed a test EvolutionInsight + update profile level */
  debugSeedInsight: protectedProcedure.mutation(async ({ ctx }) => {
    if (process.env['NODE_ENV'] === 'production') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'debug endpoint disabled in production' });
    }
    const { prisma: db, activeAccountId } = ctx;
    const accountId = activeAccountId!;

    const testContent = {
      direction: '综合',
      insights: {
        styleTone: '亲切友好 · 轻松幽默',
        preferredCatchphrases: ['宝子们', '真的绝了', '不踩雷'],
        avoidList: ['老实说', '其实'],
        strongPoints: ['选品精准', '视觉美观'],
        weakPoints: ['转化率待提升'],
        sourceFeedbackIds: [1, 2, 3, 4, 5],
        summary: '用户偏爱轻松幽默风格，多用宝子们等亲切称呼',
      },
    };

    const profile = await db.evolutionProfile.findUnique({
      where: { accountId },
      select: { level: true, feedbackCountTotal: true },
    });
    const total = profile?.feedbackCountTotal ?? 5;
    const levelAfter = inferLevel(total);

    await db.evolutionProfile.upsert({
      where: { accountId },
      create: {
        accountId,
        level: levelAfter,
        latestInsight: testContent as unknown as Parameters<typeof db.evolutionProfile.create>[0]['data']['latestInsight'],
        lastEvolvedAt: new Date(),
      },
      update: {
        level: levelAfter,
        latestInsight: testContent as unknown as Parameters<typeof db.evolutionProfile.update>[0]['data']['latestInsight'],
        lastEvolvedAt: new Date(),
      },
    });
    await db.evolutionInsight.create({
      data: {
        accountId,
        triggerType: 'threshold:5',
        direction: testContent.direction,
        content: testContent as unknown as Parameters<typeof db.evolutionInsight.create>[0]['data']['content'],
        agentId: 'EvolutionAgent',
        modelUsed: 'test-seed',
        tokensUsed: 0,
        durationMs: 0,
        isFallback: false,
        levelBefore: 'L1',
        levelAfter,
        traceId: `debug-seed-${Date.now()}`,
      },
    });

    return { ok: true, levelAfter };
  }),

  /** AC-3 debug: assemble PositioningAgent context and return systemPrompt */
  debugAssembleSystemPrompt: protectedProcedure.query(async ({ ctx }) => {
    if (process.env['NODE_ENV'] === 'production') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'debug endpoint disabled in production' });
    }
    const { activeAccountId } = ctx;
    const result = await contextAssembler.assemble({
      agentId: 'PositioningAgent',
      accountId: activeAccountId!,
      // PRD-9 US-005: userMessage 提供中文关键词供 text-search fallback 检索(dev 环境无真实 embedding)
      userInput: { userMessage: '护肤 健康 内容创作' },
    });
    return { systemPrompt: result.systemPrompt };
  }),
});
