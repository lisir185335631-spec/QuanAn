/**
 * L5 Trending Cache — PRD-37 US-P11 AC-③
 *
 * 原 stub `return []` 已替换为调用 vendor adapter (mock vendor)。
 * 真实第三方 API (新榜 xinbang / 蝉妈妈 cmm / official_douyin) 待凭证授权——
 * 当前由 mock vendor 兑现(占位机制·非编造数据)，凭证就位后替换 adapter 内部实现即可。
 *
 * ADR-017 R-17: 禁止 self_crawler(puppeteer/playwright-core)。
 */

import { defaultAdapter } from '@/workers/trending-scraper/adapters';

export interface TrendingItem {
  id: string;
  title: string;
  category: string; // 对应 industry
  heat: number;    // 用 likeCount 作为热度指数
  platform: string;
  publishedAt: number;
  authorFollowers?: number;
  vendor: string;
}

/**
 * 获取热门 trending 内容。
 *
 * @param category - 行业/分类过滤(空 = 全部)
 * @param limit    - 最多返回条数
 * @param maxAuthorFollowers - 粉丝数上限阈值(过滤低粉爆款)
 * @returns TrendingItem[]
 *
 * 注意: 当前调用 mock vendor (xinbang 占位)。
 * 真实 API 待凭证: 在 vendor adapter 层替换 fetchTrending() 实现即可，此函数接口不变。
 */
export async function getHotTrending(
  category?: string,
  limit = 20,
  maxAuthorFollowers?: number,
): Promise<TrendingItem[]> {
  // TODO 真实第三方 API 待凭证 — 当前调用 mock vendor (xinbang adapter 占位实现)
  const items = await defaultAdapter.fetchTrending({
    industry: category,
    limit,
    maxAuthorFollowers,
  });

  return items.map((item) => ({
    id: item.sourceItemId,
    title: item.title,
    category: item.industry,
    heat: item.likeCount,
    platform: item.platform,
    publishedAt: item.crawledAt,
    authorFollowers: item.authorFollowers,
    vendor: item.vendor,
  }));
}
