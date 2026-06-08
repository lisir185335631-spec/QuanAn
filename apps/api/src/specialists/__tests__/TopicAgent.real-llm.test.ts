/**
 * US-006 AC-2/3/4: TopicAgent SSE real LLM integration tests
 * 默认 skip · 设 RUN_REAL_LLM=1 且有有效 LLM key 才真跑 (CI safe · cost controlled)
 * test_command: RUN_REAL_LLM=1 cd apps/api && pnpm vitest run src/specialists/__tests__/TopicAgent.real-llm.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  TopicAgent,
  TopicOutputSchema,
  TOPIC_CATEGORIES,
} from '../TopicAgent';

import type { TopicStreamChunk } from '../TopicAgent';

// ── Mock modules (vi.mock hoisted — no outer variable references) ─────────────

vi.mock('@/lib/prisma', () => ({
  prisma: {
    stepData: { findMany: vi.fn().mockResolvedValue([]) },
    userQuota: { findUnique: vi.fn().mockResolvedValue(null) },
    costLog: { create: vi.fn().mockResolvedValue({ id: 1 }) },
  },
}));

vi.mock('@/memory/l4-profile', () => ({
  getLatestInsight: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/workers/rag', () => ({
  ragRetrieveWorker: {
    retrieve: vi.fn().mockResolvedValue([]),
  },
}));

// ── Test suite (skipped unless RUN_REAL_LLM=1) ────────────────────────────────

const skipRealLlm = process.env.RUN_REAL_LLM !== '1';

describe.skipIf(skipRealLlm)('TopicAgent SSE real LLM', () => {
  const TEST_ACCOUNT_ID = 9999;

  let mockCostLogCreate: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    const { prisma } = await import('@/lib/prisma');
    mockCostLogCreate = prisma.costLog.create as ReturnType<typeof vi.fn>;
    mockCostLogCreate.mockClear();
  });

  it(
    '(a) executeStream — 5 done chunks · all categories present · schema valid · cost_log tokens > 0',
    async () => {
      const agent = new TopicAgent();

      const chunks: TopicStreamChunk[] = [];
      for await (const chunk of agent.executeStream({ accountId: TEST_ACCOUNT_ID })) {
        chunks.push(chunk);
      }

      // AC-2: exactly 5 done chunks (one per category)
      const doneChunks = chunks.filter(
        (c): c is Extract<TopicStreamChunk, { type: 'done' }> => c.type === 'done',
      );
      expect(doneChunks).toHaveLength(5);

      // AC-2: all 5 categories present
      const sortedCategories = [...doneChunks.map((c) => c.category)].sort();
      expect(sortedCategories).toEqual([...TOPIC_CATEGORIES].sort());

      // AC-3: schema drift — each category has exactly 20 topics + passes safeParse
      for (const chunk of doneChunks) {
        expect(chunk.result.topics).toHaveLength(20);
        const parsed = TopicOutputSchema.safeParse(chunk.result);
        expect(parsed.success).toBe(true);
      }

      // AC-1: at least one meta chunk with model name
      const metaChunks = chunks.filter(
        (c): c is Extract<TopicStreamChunk, { type: 'meta' }> => c.type === 'meta',
      );
      expect(metaChunks.length).toBeGreaterThan(0);
      expect(metaChunks[0]?.meta.model).toMatch(/claude|gpt|deepseek/);

      // AC-4: cost_log 真接 · called once per category (5 total) · tokens > 0
      expect(mockCostLogCreate).toHaveBeenCalledTimes(5);
      const firstCallData = (
        mockCostLogCreate.mock.calls[0]?.[0] as { data: Record<string, unknown> }
      )?.data;
      expect(Number(firstCallData?.promptTokens)).toBeGreaterThan(0);
      expect(Number(firstCallData?.completionTokens)).toBeGreaterThan(0);
      expect(Number(firstCallData?.costUsd)).toBeGreaterThan(0);
    },
    300_000, // 5-min timeout: 5 sequential LLM calls × up to 60s each
  );
});
