/**
 * TrendingScraper BullMQ Queue — PRD-12 US-002
 * LD-A-5: 抓回数据必须经 review queue · 不直接入 trendingItem 主表
 */

import { Queue } from 'bullmq';

import { redis } from '@/lib/redis';

export const TRENDING_SCRAPER_QUEUE_NAME = 'trending-scraper';

export interface TrendingScraperJobPayload {
  sourcePlatform: string; // 'douyin' | 'xiaohongshu' | 'bilibili' | ...
  sourceItemId: string;
  sourceUrl: string;
  rawContent: Record<string, unknown>;
}

export const trendingScraperQueue = new Queue<TrendingScraperJobPayload>(TRENDING_SCRAPER_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});
