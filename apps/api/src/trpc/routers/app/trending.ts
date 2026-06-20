/**
 * trending router — PRD-15 US-006 / PRD-37 US-P11 AC-③
 * AC-10: trpc.trending.{list,listWithFavorites,favorite,detail,kpiStats} procedures
 * AC-5: trending 走全局表(LD-009 例外) · globalProcedure skips RLS
 * AC-7: favorite uses protectedProcedure (per-account RLS) · writes trending_favorites
 * US-P11: vendor enum 应用层校验(xinbang/cmm/official_douyin) + authorFollowers 阈值过滤
 * Legacy: fetch/listByIndustry/listByStyle preserved for backwards-compat
 *
 * 批5③ 修复(2026-06-20):
 *   - DB select 补 authorFollowers + vendor (classifyItem 低粉分类必须能读到这两个字段)
 *   - DB 为空 fallback 改调 defaultAdapter.fetchTrending → adapter 框架真在请求路径
 *   - buildMockItems 补 vendor 字段 + mock 路径加 vendor 过滤
 *
 * 批5④ 修复(2026-06-20) — 第二轮对抗 review 坐实问题:
 *   P1: adapter 路径 search 过滤缺失 → fetchTrending 不接受 search，
 *       mapper 后补 in-memory title.toLowerCase().includes(searchLower)
 *       (list + listWithFavorites 两处 adapter/mock fallback 全覆盖)
 *   P2: listWithFavorites adapter 路径合成 id(i+1) 查 trendingFavorite 永不匹配 →
 *       明确 isFavorited=false，跳过无意义 DB 查询
 *   P3: adapter fetchTrending 只取 limit=pageSize 条，翻页 slice 给空 →
 *       改传 limit:200(pool 上限)，让 adapter 返回全量，router 端做 slice 分页
 */

import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { VALID_VENDORS, defaultAdapter } from '@/workers/trending-scraper/adapters';
import { globalProcedure, protectedProcedure } from '@/trpc/middleware/account-isolation';
import { router } from '@/trpc/trpc';

import type { Prisma } from '@prisma/client';

const PLATFORMS = ['douyin', 'xiaohongshu', 'bilibili', 'kuaishou', 'shipinhao', 'weibo'] as const;
type Platform = (typeof PLATFORMS)[number];

/**
 * vendor 应用层校验: ∈ {xinbang, cmm, official_douyin}
 * 禁止 self_crawler (ADR-017 R-17)
 * 真实第三方 API 待凭证 — 当前 mock vendor 占位
 */
const VENDOR_ENUM = z.enum(VALID_VENDORS);

const listInput = z.object({
  platforms: z.array(z.enum(PLATFORMS)).optional(),
  industry: z.string().max(64).optional(),
  timeRange: z.enum(['today', 'week', 'month', 'quarter']).default('week'),
  sort: z.enum(['likeCount', 'commentCount', 'shareCount', 'collectCount']).default('likeCount'),
  search: z.string().max(200).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  /**
   * 粉丝数上限阈值(可选) — 仅返回 authorFollowers < maxAuthorFollowers 的内容(低粉爆款)
   * PRD-37 US-P11 AC-③
   */
  maxAuthorFollowers: z.number().int().positive().optional(),
  /**
   * vendor 过滤(可选) — ∈ {xinbang, cmm, official_douyin}
   * 真实第三方 API 待凭证 · ADR-017 R-17 禁止 self_crawler
   */
  vendor: VENDOR_ENUM.optional(),
});

const favoriteInput = z.object({
  trendingItemId: z.number().int().positive(),
  action: z.enum(['add', 'remove']),
});

const detailInput = z.object({
  id: z.number().int().positive(),
});

function timeRangeCutoff(range: string): Date {
  const now = new Date();
  switch (range) {
    case 'today':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    case 'quarter':
      return new Date(now.getTime() - 90 * 24 * 3600 * 1000);
    default:
      return new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  }
}

function buildMockItems(count: number) {
  const mockTitles = [
    '3分钟看懂！高阶极简风穿搭的底层逻辑，摆脱路人感',
    '保姆级教程：如何用AI工具在10分钟内生成整月爆款文案？',
    '下班后的4小时，我如何治愈精神内耗？沉浸式独居Vlog',
    '#春季极简穿搭公式，这样穿不踩雷！',
    '#AI绘画效率工具，效率提升10倍的秘密',
    '#打工人的松弛感，摸鱼艺术家养成记',
    '#沉浸式护肤ASMR，深夜独处的仪式感',
    '冷知识：为什么高颜值的人更容易成为博主？',
    '测评了50款网红零食，这3款真的绝了！',
    '一个视频涨粉10万的秘密，普通人也能复制',
    '深夜食堂Vlog，一个人的烟火气',
    '职场潜规则大揭秘，打工人必看！',
    '限时！99元买到1000元品质的包包，攻略来了',
    '我用AI做了一个月副业，收入超出预期',
    '35岁还在减肥？这套方法让我3个月瘦20斤',
    '佛系打工人的一天，摆烂不是真摆烂',
    '内衣新手入门指南，再也不踩坑了',
    '手残党亲测：这个护肤品真的能改变皮肤',
    '毕业两年存款10万，我做对了什么？',
    '独居女孩的日常，一个人也能过得很好',
  ];
  const platforms: Platform[] = ['douyin', 'xiaohongshu', 'bilibili', 'kuaishou', 'shipinhao', 'weibo'];
  const industries = ['美妆个护', '服饰穿搭', '科技数码', '美食餐饮', '健身运动', '生活方式', '情感社交'];

  // authorFollowers 分层: 低粉(<10w) / 中粉(10w-50w) / 高粉(>50w) 按 i 分布
  const followerTiers = [5000, 15000, 45000, 8000, 120000, 25000, 380000, 9500, 62000, 210000];
  // 批5③: mock vendor 诚实标注 xinbang 占位·classifyItem 能拿到 vendor 字段
  const mockVendor = 'xinbang' as const;

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    platform: platforms[i % platforms.length] as Platform,
    sourceUrl: `https://mock.example.com/item/${i + 1}`,
    title: mockTitles[i % mockTitles.length]!,
    contentText: `这是第${i + 1}条爆款内容的完整文案。原文内容展示在详情页，用户可复制后直接跳转到 Step 7 进行文案创作。这条内容之所以爆火，在于它精准切中了受众痛点，结合了热点话题和实用信息，带动了大量互动。`,
    industry: industries[i % industries.length]!,
    presentStyle: null as string | null,
    authorFollowers: followerTiers[i % followerTiers.length]!,
    vendor: mockVendor,
    likeCount: Math.floor((Math.sin(i * 2.3) + 1) * 250000) + 10000,
    commentCount: Math.floor((Math.cos(i * 1.7) + 1) * 25000) + 1000,
    shareCount: Math.floor((Math.sin(i * 1.1) + 1) * 50000) + 5000,
    collectCount: Math.floor((Math.cos(i * 0.9) + 1) * 40000) + 2000,
    crawledAt: new Date(Date.now() - (i % 7) * 24 * 3600 * 1000),
  }));
}

export const trendingRouter = router({
  /** Paginated list — no favorite status (public) */
  list: globalProcedure
    .input(listInput)
    .query(async ({ input }) => {
      const { platforms, industry, timeRange, sort, search, page, pageSize, maxAuthorFollowers, vendor } = input;
      const cutoff = timeRangeCutoff(timeRange);
      const skip = (page - 1) * pageSize;

      const where: Prisma.TrendingItemWhereInput = { crawledAt: { gte: cutoff } };
      if (platforms && platforms.length > 0) where.platform = { in: platforms };
      if (industry) where.industry = { contains: industry, mode: 'insensitive' };
      if (search) where.title = { contains: search, mode: 'insensitive' };
      if (maxAuthorFollowers !== undefined) where.authorFollowers = { lt: maxAuthorFollowers };
      if (vendor) where.vendor = vendor;

      const sortField = sort === 'collectCount' ? 'likeCount' : (sort as 'likeCount' | 'commentCount' | 'shareCount');

      const [dbItems, total] = await Promise.all([
        prisma.trendingItem.findMany({
          where,
          orderBy: { [sortField]: 'desc' },
          skip,
          take: pageSize,
          select: {
            id: true, platform: true, sourceUrl: true, title: true, industry: true,
            presentStyle: true, likeCount: true, commentCount: true, shareCount: true, crawledAt: true,
            authorFollowers: true, vendor: true,
          },
        }),
        prisma.trendingItem.count({ where }),
      ]);

      if (dbItems.length === 0 && total === 0) {
        // 批5③: DB 为空 — 调 defaultAdapter.fetchTrending 让 adapter 框架真在请求路径
        // P3修复: 传 limit:200(pool上限) 让 adapter 返回全量，由 router 端做 slice 分页
        const adapterItems = await defaultAdapter.fetchTrending({
          industry,
          limit: 200,
          maxAuthorFollowers,
        });

        let adapterMapped = adapterItems.map((a, i) => ({
          id: i + 1,
          platform: a.platform as Platform,
          sourceUrl: a.sourceUrl ?? `https://mock.example.com/item/${i + 1}`,
          title: a.title,
          contentText: a.contentText ?? '',
          industry: a.industry,
          presentStyle: null as string | null,
          authorFollowers: a.authorFollowers ?? 0,
          vendor: a.vendor,
          likeCount: a.likeCount,
          commentCount: a.commentCount,
          shareCount: a.shareCount,
          collectCount: 0,
          crawledAt: new Date(a.crawledAt),
        }));

        if (platforms && platforms.length > 0) {
          adapterMapped = adapterMapped.filter((m) => platforms.includes(m.platform));
        }
        if (vendor) {
          adapterMapped = adapterMapped.filter((m) => m.vendor === vendor);
        }
        // P1修复: adapter 路径 search 过滤 — fetchTrending 不处理 search，这里 in-memory 过滤
        if (search) {
          const searchLower = search.toLowerCase();
          adapterMapped = adapterMapped.filter((m) => m.title.toLowerCase().includes(searchLower));
        }

        if (adapterMapped.length === 0) {
          const mocks = buildMockItems(200);
          let filteredMocks = platforms && platforms.length > 0
            ? mocks.filter((m) => platforms.includes(m.platform))
            : mocks;
          if (maxAuthorFollowers !== undefined) {
            filteredMocks = filteredMocks.filter((m) => m.authorFollowers < maxAuthorFollowers);
          }
          if (vendor) {
            filteredMocks = filteredMocks.filter((m) => m.vendor === vendor);
          }
          if (search) {
            const searchLower = search.toLowerCase();
            filteredMocks = filteredMocks.filter((m) => m.title.toLowerCase().includes(searchLower));
          }
          const filteredMockTotal = filteredMocks.length;
          const paged = filteredMocks.slice(skip, skip + pageSize);
          return {
            items: paged.map((m, i) => ({ ...m, isFavorited: false, rank: skip + i + 1 })),
            total: filteredMockTotal,
            page,
            pageSize,
            totalPages: Math.ceil(filteredMockTotal / pageSize),
          };
        }

        const filteredTotal = adapterMapped.length;
        const paged = adapterMapped.slice(skip, skip + pageSize);
        return {
          items: paged.map((m, i) => ({ ...m, isFavorited: false, rank: skip + i + 1 })),
          total: filteredTotal,
          page,
          pageSize,
          totalPages: Math.ceil(filteredTotal / pageSize),
        };
      }

      return {
        items: dbItems.map((item, i) => ({ ...item, collectCount: 0, isFavorited: false, rank: skip + i + 1 })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }),

  /** Paginated list with per-account favorite status */
  listWithFavorites: protectedProcedure
    .input(listInput)
    .query(async ({ input, ctx }) => {
      const { platforms, industry, timeRange, sort, search, page, pageSize, maxAuthorFollowers, vendor } = input;
      const cutoff = timeRangeCutoff(timeRange);
      const skip = (page - 1) * pageSize;
      const accountId = ctx.activeAccountId!;

      const where: Prisma.TrendingItemWhereInput = { crawledAt: { gte: cutoff } };
      if (platforms && platforms.length > 0) where.platform = { in: platforms };
      if (industry) where.industry = { contains: industry, mode: 'insensitive' };
      if (search) where.title = { contains: search, mode: 'insensitive' };
      if (maxAuthorFollowers !== undefined) where.authorFollowers = { lt: maxAuthorFollowers };
      if (vendor) where.vendor = vendor;

      const sortField = sort === 'collectCount' ? 'likeCount' : (sort as 'likeCount' | 'commentCount' | 'shareCount');

      const [dbItems, total] = await Promise.all([
        prisma.trendingItem.findMany({
          where,
          orderBy: { [sortField]: 'desc' },
          skip,
          take: pageSize,
          select: {
            id: true, platform: true, sourceUrl: true, title: true, industry: true,
            presentStyle: true, likeCount: true, commentCount: true, shareCount: true, crawledAt: true,
            authorFollowers: true, vendor: true,
          },
        }),
        prisma.trendingItem.count({ where }),
      ]);

      if (dbItems.length === 0 && total === 0) {
        // P3修复: 传 limit:200(pool上限) 让 adapter 返回全量，由 router 端做 slice 分页
        const adapterItems = await defaultAdapter.fetchTrending({
          industry,
          limit: 200,
          maxAuthorFollowers,
        });

        let adapterMapped = adapterItems.map((a, i) => ({
          id: i + 1,
          platform: a.platform as Platform,
          sourceUrl: a.sourceUrl ?? `https://mock.example.com/item/${i + 1}`,
          title: a.title,
          contentText: a.contentText ?? '',
          industry: a.industry,
          presentStyle: null as string | null,
          authorFollowers: a.authorFollowers ?? 0,
          vendor: a.vendor,
          likeCount: a.likeCount,
          commentCount: a.commentCount,
          shareCount: a.shareCount,
          collectCount: 0,
          crawledAt: new Date(a.crawledAt),
        }));

        if (platforms && platforms.length > 0) {
          adapterMapped = adapterMapped.filter((m) => platforms.includes(m.platform));
        }
        if (vendor) {
          adapterMapped = adapterMapped.filter((m) => m.vendor === vendor);
        }
        // P1修复: adapter 路径 search 过滤 — fetchTrending 不处理 search，这里 in-memory 过滤
        if (search) {
          const searchLower = search.toLowerCase();
          adapterMapped = adapterMapped.filter((m) => m.title.toLowerCase().includes(searchLower));
        }

        if (adapterMapped.length === 0) {
          const mocks = buildMockItems(200);
          let filteredFavMocks = platforms && platforms.length > 0
            ? mocks.filter((m) => platforms.includes(m.platform))
            : mocks;
          if (maxAuthorFollowers !== undefined) {
            filteredFavMocks = filteredFavMocks.filter((m) => m.authorFollowers < maxAuthorFollowers);
          }
          if (vendor) {
            filteredFavMocks = filteredFavMocks.filter((m) => m.vendor === vendor);
          }
          if (search) {
            const searchLower = search.toLowerCase();
            filteredFavMocks = filteredFavMocks.filter((m) => m.title.toLowerCase().includes(searchLower));
          }
          const filteredFavMockTotal = filteredFavMocks.length;
          const paged = filteredFavMocks.slice(skip, skip + pageSize);
          // P2修复: mock 路径的 id 是合成整数，不可能存在于 trendingFavorite 表
          // 明确 isFavorited=false，跳过无意义的 DB 查询
          return {
            items: paged.map((m, i) => ({ ...m, isFavorited: false, rank: skip + i + 1 })),
            total: filteredFavMockTotal,
            page,
            pageSize,
            totalPages: Math.ceil(filteredFavMockTotal / pageSize),
          };
        }

        const filteredFavTotal = adapterMapped.length;
        const paged = adapterMapped.slice(skip, skip + pageSize);
        // P2修复: adapter 路径 id 为合成整数(i+1)，不是真实 DB id，查 trendingFavorite 永不匹配
        // adapter 路径无真实 DB 数据故不可能有收藏，明确设 isFavorited=false
        return {
          items: paged.map((m, i) => ({ ...m, isFavorited: false, rank: skip + i + 1 })),
          total: filteredFavTotal,
          page,
          pageSize,
          totalPages: Math.ceil(filteredFavTotal / pageSize),
        };
      }

      const ids = dbItems.map((item) => item.id);
      const favs = await prisma.trendingFavorite.findMany({
        where: { accountId, trendingItemId: { in: ids } },
        select: { trendingItemId: true },
      });
      const favSet = new Set(favs.map((f: { trendingItemId: number }) => f.trendingItemId));
      return {
        items: dbItems.map((item, i) => ({
          ...item,
          collectCount: 0,
          isFavorited: favSet.has(item.id),
          rank: skip + i + 1,
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }),

  /** Toggle favorite */
  favorite: protectedProcedure
    .input(favoriteInput)
    .mutation(async ({ input, ctx }) => {
      const { trendingItemId, action } = input;
      const accountId = ctx.activeAccountId!;

      const exists = await prisma.trendingItem.findUnique({
        where: { id: trendingItemId },
        select: { id: true },
      });
      if (!exists) {
        return { favorited: false, skipped: true } as { favorited: boolean; skipped?: boolean };
      }

      if (action === 'add') {
        await prisma.trendingFavorite.upsert({
          where: { accountId_trendingItemId: { accountId, trendingItemId } },
          create: { accountId, trendingItemId },
          update: {},
        });
        return { favorited: true } as { favorited: boolean; skipped?: boolean };
      }
      await prisma.trendingFavorite.deleteMany({ where: { accountId, trendingItemId } });
      return { favorited: false } as { favorited: boolean; skipped?: boolean };
    }),

  /** Detail view — full content */
  detail: globalProcedure
    .input(detailInput)
    .query(async ({ input }) => {
      const item = await prisma.trendingItem.findUnique({
        where: { id: input.id },
        select: { id: true, platform: true, sourceUrl: true, title: true, contentText: true,
          industry: true, presentStyle: true, authorName: true, likeCount: true,
          commentCount: true, shareCount: true, crawledAt: true },
      });

      if (!item) {
        const mocks = buildMockItems(200);
        const mock = mocks.find((m) => m.id === input.id) ?? mocks[0]!;
        return { ...mock, authorName: null as string | null };
      }
      return item;
    }),

  /** KPI stats (per-account favorites) */
  kpiStats: protectedProcedure
    .query(async ({ ctx }) => {
      const accountId = ctx.activeAccountId!;
      const weekCutoff = new Date(Date.now() - 7 * 24 * 3600 * 1000);
      const [total, weekNew, myFavorites, lastItem] = await Promise.all([
        prisma.trendingItem.count(),
        prisma.trendingItem.count({ where: { crawledAt: { gte: weekCutoff } } }),
        prisma.trendingFavorite.count({ where: { accountId } }),
        prisma.trendingItem.findFirst({ orderBy: { crawledAt: 'desc' }, select: { crawledAt: true } }),
      ]);
      const useMock = total === 0;
      return {
        total: useMock ? 1842 : total,
        weekNew: useMock ? 127 : weekNew,
        myFavorites,
        lastUpdatedAt: lastItem?.crawledAt ?? new Date(),
      };
    }),

  /** Legacy: fetch */
  fetch: globalProcedure
    .input(z.object({ platform: z.string().max(32).optional(), limit: z.number().int().min(1).max(100).default(20) }))
    .query(() => {
      return buildMockItems(1).map((m) => ({
        id: m.id, platform: m.platform, title: m.title, industry: m.industry,
        presentStyle: m.presentStyle, likeCount: m.likeCount, shareCount: m.shareCount,
        commentCount: m.commentCount, crawledAt: m.crawledAt,
      }));
    }),

  /** Legacy: listByIndustry */
  listByIndustry: globalProcedure
    .input(z.object({ industry: z.string().min(1).max(64), limit: z.number().int().min(1).max(100).default(20) }))
    .query(({ input }) => buildMockItems(1).map((m) => ({ ...m, industry: input.industry }))),

  /** Legacy: listByStyle */
  listByStyle: globalProcedure
    .input(z.object({ presentStyle: z.string().min(1).max(64), limit: z.number().int().min(1).max(100).default(20) }))
    .query(({ input }) => buildMockItems(1).map((m) => ({ ...m, presentStyle: input.presentStyle }))),
});
