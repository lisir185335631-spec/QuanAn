/**
 * TrendingScraper worker barrel — PRD-12 US-002
 */

export { trendingScraperQueue, TRENDING_SCRAPER_QUEUE_NAME } from './queue';
export type { TrendingScraperJobPayload } from './queue';
export { trendingScraperWorker, processTrendingScraperJob } from './worker';
