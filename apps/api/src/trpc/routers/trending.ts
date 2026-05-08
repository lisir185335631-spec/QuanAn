/**
 * trending router — PRD-2 US-006
 * AC-2: 3 procedures (fetch/listByIndustry/listByStyle) · mock TrendingItem list
 * AC-5: trending 走全局表(LD-009 例外) · globalProcedure skips RLS
 * Note: mock 留 PRD-6 真抓取 · viewCount(BigInt) omitted from mock to avoid JSON serialization issues
 */

import { z } from 'zod';
import { router } from '@/trpc/trpc';
import { globalProcedure } from '@/trpc/middleware/account-isolation';

const fetchInput = z.object({
  platform: z.string().max(32).optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

const listByIndustryInput = z.object({
  industry: z.string().min(1).max(64),
  limit: z.number().int().min(1).max(100).default(20),
});

const listByStyleInput = z.object({
  presentStyle: z.string().min(1).max(64),
  limit: z.number().int().min(1).max(100).default(20),
});

const MOCK_BASE = {
  id: 1,
  platform: 'douyin',
  title: '[mock trending]',
  industry: null as string | null,
  presentStyle: null as string | null,
  likeCount: 0,
  shareCount: 0,
  commentCount: 0,
  crawledAt: new Date('2026-01-01'),
};

export const trendingRouter = router({
  /** Fetch trending items (P1 mock — actual crawl 留 PRD-6) */
  fetch: globalProcedure
    .input(fetchInput)
    .query(async ({ input: _input }) => {
      return [{ ...MOCK_BASE }];
    }),

  /** List trending items filtered by industry (P1 mock) */
  listByIndustry: globalProcedure
    .input(listByIndustryInput)
    .query(async ({ input }) => {
      return [{ ...MOCK_BASE, industry: input.industry }];
    }),

  /** List trending items filtered by present style (P1 mock) */
  listByStyle: globalProcedure
    .input(listByStyleInput)
    .query(async ({ input }) => {
      return [{ ...MOCK_BASE, presentStyle: input.presentStyle }];
    }),
});
