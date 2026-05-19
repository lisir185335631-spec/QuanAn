// @quanan/schemas/entities/trending — PRD-2 US-006

import { z } from 'zod';

export const trendingItemSchema = z.object({
  id: z.number().int().positive(),
  platform: z.string().max(32),
  title: z.string(),
  industry: z.string().max(64).nullable(),
  presentStyle: z.string().max(64).nullable(),
  likeCount: z.number().int(),
  shareCount: z.number().int(),
  commentCount: z.number().int(),
  crawledAt: z.date(),
});

export const trendingFetchInput = z.object({
  platform: z.string().max(32).optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

export const listByIndustryInput = z.object({
  industry: z.string().min(1).max(64),
  limit: z.number().int().min(1).max(100).default(20),
});

export const listByStyleInput = z.object({
  presentStyle: z.string().min(1).max(64),
  limit: z.number().int().min(1).max(100).default(20),
});

export type TrendingItemFields = z.infer<typeof trendingItemSchema>;
export type TrendingFetchInput = z.infer<typeof trendingFetchInput>;
export type ListByIndustryInput = z.infer<typeof listByIndustryInput>;
export type ListByStyleInput = z.infer<typeof listByStyleInput>;
