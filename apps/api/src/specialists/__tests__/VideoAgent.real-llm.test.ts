/**
 * US-005 AC-2/3/4/5: VideoAgent real LLM integration tests (shooting mode)
 * skipIf: no API keys present (CI safe · cost controlled)
 * test_command: cd apps/api && pnpm vitest run src/specialists/__tests__/VideoAgent.real-llm.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  VideoAgent,
  ShootingOutputSchema,
  Storyboard8ColItemSchema,
} from '../VideoAgent';

import type { ShootingOutput, Storyboard8ColItem } from '../VideoAgent';

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

// ── Test suite (skipped when no API keys) ─────────────────────────────────────

const skipIfNoKey = !process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY;

// AC-4: 8-column names strictly defined (SHIELD: English keys · no Chinese drift)
const EXPECTED_8_COLS: (keyof Storyboard8ColItem)[] = [
  'duration', 'scene', 'shotType', 'angle', 'movement', 'emotion', 'dialogue', 'action',
];

describe.skipIf(skipIfNoKey)('VideoAgent real LLM', () => {
  const TEST_ACCOUNT_ID = 9999;

  let mockCostLogCreate: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    const { prisma } = await import('@/lib/prisma');
    mockCostLogCreate = prisma.costLog.create as ReturnType<typeof vi.fn>;
    mockCostLogCreate.mockClear();
  });

  it('(a) shooting mode — 8-column storyboard schema strict match + cost_log valid', async () => {
    const agent = new VideoAgent();

    const result = await agent.execute({
      accountId: TEST_ACCOUNT_ID,
      mode: 'shooting',
      userInput: {
        sourceCopy: '分享健身后生活改变的真实故事，面向25-35岁上班族',
      },
    });

    // AC-2: isFallback=false + modelUsed match /claude|gpt/ + tokensUsed.total > 0
    expect(result.isFallback).toBe(false);
    expect(result.modelUsed).toMatch(/claude|gpt/);
    expect(result.tokensUsed.total).toBeGreaterThan(0);
    expect(result.durationMs).toBeLessThan(60_000);

    const output = result.result as ShootingOutput;

    // AC-2: shotList min 1 row
    expect(Array.isArray(output.shotList)).toBe(true);
    expect(output.shotList.length).toBeGreaterThanOrEqual(1);

    // AC-4: storyboard 8-column strict match — each item must have all 8 English keys
    for (const shot of output.shotList) {
      for (const col of EXPECTED_8_COLS) {
        expect(typeof (shot as Record<string, unknown>)[col]).toBe('string');
      }
    }

    // AC-3: schema drift — safeParse with strict Storyboard8ColItemSchema per item
    for (const shot of output.shotList) {
      const itemParsed = Storyboard8ColItemSchema.safeParse(shot);
      expect(itemParsed.success).toBe(true);
    }

    // AC-3: full output schema drift check
    const parsed = ShootingOutputSchema.safeParse(result.result);
    expect(parsed.success).toBe(true);

    // AC-5: cost_log 真存 · agentId=VideoAgent + accountId + tokens > 0
    expect(mockCostLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          agentId: 'VideoAgent',
          accountId: TEST_ACCOUNT_ID,
          isFallback: false,
        }),
      }),
    );
    const callData = (mockCostLogCreate.mock.calls[0]?.[0] as { data: Record<string, unknown> })?.data;
    expect(Number(callData?.promptTokens)).toBeGreaterThan(0);
    expect(Number(callData?.completionTokens)).toBeGreaterThan(0);
    expect(Number(callData?.costUsd)).toBeGreaterThan(0);
  }, 60_000);
});
