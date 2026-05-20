/**
 * myTopics router — PRD-15 US-007
 * 5 procedures: list / add / update / delete / countBySource
 * Aggregates 3 data sources:
 *   - step5: step_data table (stepKey='step5') → TopicAgent output
 *   - trending: trending_favorites JOIN trending_items
 *   - manual: topics table (sourceType='manual')
 */

import { z } from 'zod';

import { protectedProcedure } from '@/trpc/middleware/account-isolation';
import { router } from '@/trpc/trpc';

export type MyTopicSource = 'step5' | 'trending' | 'manual';

export type MyTopicItem = {
  id: string;
  title: string;
  source: MyTopicSource;
  industry: string | null;
  platform: string | null;
  createdAt: Date | string;
  topicId?: number;
  trendingItemId?: number;
};

const listInput = z.object({
  source: z.enum(['all', 'step5', 'trending', 'manual']).default('all'),
  industry: z.string().max(64).optional(),
  search: z.string().max(200).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

const addInput = z.object({
  title: z.string().min(1).max(255),
  industry: z.string().max(64).optional(),
  platform: z.string().max(32).optional(),
});

const updateInput = z.object({
  topicId: z.number().int().positive(),
  title: z.string().min(1).max(255).optional(),
  industry: z.string().max(64).optional(),
  platform: z.string().max(32).optional(),
});

const deleteInput = z.object({
  id: z.string(), // 'manual-<topicId>' | 'trending-<trendingItemId>' | 'step5-<idx>'
});

function matchesFilters(
  item: MyTopicItem,
  industry?: string,
  search?: string,
): boolean {
  if (industry && industry !== '' && item.industry !== industry) return false;
  if (search && search !== '') {
    const q = search.toLowerCase();
    if (!item.title.toLowerCase().includes(q)) return false;
  }
  return true;
}

export const myTopicsRouter = router({
  /** Aggregate list from all 3 sources with filtering + pagination */
  list: protectedProcedure
    .input(listInput)
    .query(async ({ ctx, input }) => {
      const { prisma, activeAccountId } = ctx;
      const { source, industry, search, page, pageSize } = input;
      const accountId = activeAccountId!;

      const all: MyTopicItem[] = [];

      // ── Source 1: step5 topics from step_data ──────────────────────────────
      if (source === 'all' || source === 'step5') {
        const rows = await prisma.stepData.findMany({
          where: { stepKey: { in: ['step5', 'step5_topics_v2'] } },
          select: { result: true, updatedAt: true },
          orderBy: { updatedAt: 'desc' },
        });

        for (const row of rows) {
          const result = row.result as Record<string, unknown> | null;
          if (!result) continue;
          const topics = Array.isArray(result.topics)
            ? (result.topics as Array<{ title?: string }>)
            : [];
          topics.forEach((t, i) => {
            if (!t.title) return;
            all.push({
              id: `step5-${i}-${row.updatedAt.getTime()}`,
              title: t.title,
              source: 'step5',
              industry: null,
              platform: null,
              createdAt: row.updatedAt,
            });
          });
        }
      }

      // ── Source 2: trending favorites ────────────────────────────────────────
      if (source === 'all' || source === 'trending') {
        const favorites = await prisma.trendingFavorite.findMany({
          where: { accountId },
          select: { id: true, trendingItemId: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        });

        if (favorites.length > 0) {
          const itemIds = favorites.map((f) => f.trendingItemId);
          const trendingItems = await prisma.trendingItem.findMany({
            where: { id: { in: itemIds } },
            select: { id: true, title: true, industry: true, platform: true },
          });
          const itemMap = new Map(trendingItems.map((t) => [t.id, t]));

          for (const fav of favorites) {
            const ti = itemMap.get(fav.trendingItemId);
            const title = ti?.title ?? `Trending #${fav.trendingItemId}`;
            all.push({
              id: `trending-${fav.trendingItemId}`,
              title,
              source: 'trending',
              industry: ti?.industry ?? null,
              platform: ti?.platform ?? null,
              createdAt: fav.createdAt,
              trendingItemId: fav.trendingItemId,
            });
          }
        }
      }

      // ── Source 3: manually added topics ────────────────────────────────────
      if (source === 'all' || source === 'manual') {
        const manualTopics = await prisma.topic.findMany({
          where: { sourceType: 'manual', accountId },
          select: { id: true, title: true, category: true, platform: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        });

        for (const t of manualTopics) {
          all.push({
            id: `manual-${t.id}`,
            title: t.title,
            source: 'manual',
            industry: t.category,
            platform: t.platform,
            createdAt: t.createdAt,
            topicId: t.id,
          });
        }
      }

      // ── Filter + paginate ───────────────────────────────────────────────────
      const filtered = all.filter((item) => matchesFilters(item, industry, search));
      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const skip = (page - 1) * pageSize;
      const items = filtered.slice(skip, skip + pageSize);

      return { items, total, page, pageSize, totalPages };
    }),

  /** Add manual topic to topics table */
  add: protectedProcedure
    .input(addInput)
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId } = ctx;
      const accountId = activeAccountId!;

      const topic = await prisma.topic.create({
        data: {
          accountId,
          title: input.title,
          hook: '',
          // category stores industry for manual topics; platform stored directly
          category: input.industry ?? null,
          platform: input.platform ?? null,
          sourceType: 'manual',
        },
        select: { id: true, title: true, category: true, platform: true, createdAt: true },
      });

      return {
        id: `manual-${topic.id}`,
        title: topic.title,
        source: 'manual' as const,
        industry: topic.category,
        platform: topic.platform,
        createdAt: topic.createdAt,
        topicId: topic.id,
      } satisfies MyTopicItem;
    }),

  /** Update manual topic */
  update: protectedProcedure
    .input(updateInput)
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId } = ctx;
      const { topicId, ...updates } = input;

      const topic = await prisma.topic.findFirst({
        where: { id: topicId, sourceType: 'manual' },
        select: { id: true, accountId: true },
      });

      if (!topic || topic.accountId !== activeAccountId) {
        return null;
      }

      const updated = await prisma.topic.update({
        where: { id: topicId },
        data: {
          ...(updates.title !== undefined && { title: updates.title }),
          ...(updates.industry !== undefined && { category: updates.industry }),
          ...(updates.platform !== undefined && { platform: updates.platform }),
        },
        select: { id: true, title: true, category: true, platform: true, createdAt: true },
      });

      return {
        id: `manual-${updated.id}`,
        title: updated.title,
        source: 'manual' as const,
        industry: updated.category,
        platform: updated.platform,
        createdAt: updated.createdAt,
        topicId: updated.id,
      } satisfies MyTopicItem;
    }),

  /** Delete topic: manual → delete from topics table; trending → delete favorite */
  delete: protectedProcedure
    .input(deleteInput)
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId } = ctx;
      const accountId = activeAccountId!;
      const [sourceType, rawId] = input.id.split('-') as [string, string];
      const numId = parseInt(rawId, 10);

      if (sourceType === 'manual') {
        await prisma.topic.deleteMany({
          where: { id: numId, sourceType: 'manual', accountId },
        });
      } else if (sourceType === 'trending') {
        await prisma.trendingFavorite.deleteMany({
          where: { trendingItemId: numId, accountId },
        });
      }

      return { ok: true };
    }),

  /** Count topics by source for KPI display */
  countBySource: protectedProcedure
    .query(async ({ ctx }) => {
      const { prisma, activeAccountId } = ctx;
      const accountId = activeAccountId!;

      const [step5Row, trendingCount, manualCount] = await Promise.all([
        prisma.stepData.findFirst({
          where: { stepKey: { in: ['step5', 'step5_topics_v2'] } },
          select: { result: true },
        }),
        prisma.trendingFavorite.count({ where: { accountId } }),
        prisma.topic.count({ where: { sourceType: 'manual', accountId } }),
      ]);

      // Count topics in step5 result
      const step5Count = (() => {
        if (!step5Row?.result) return 0;
        const result = step5Row.result as Record<string, unknown>;
        if (Array.isArray(result.topics)) return result.topics.length;
        return 0;
      })();

      return { step5: step5Count, trending: trendingCount, manual: manualCount };
    }),
});
