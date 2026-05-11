/**
 * L5 Trending Cache placeholder — PRD-8 US-001 AC-6
 * TODO PRD-9 真接 trending API
 * Returns empty array until PRD-9 implements real trending data source
 */

export interface TrendingItem {
  id: string;
  title: string;
  category: string;
  heat: number;
  platform: string;
  publishedAt: number;
}

// eslint-disable-next-line @typescript-eslint/require-await
export async function getHotTrending(
  _category?: string,
  _limit = 20,
): Promise<TrendingItem[]> {
  // TODO PRD-9 真接 trending API
  return [];
}
