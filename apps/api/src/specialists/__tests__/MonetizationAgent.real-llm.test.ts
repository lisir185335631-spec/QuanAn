/**
 * US-005 AC-1/3/4/5: MonetizationAgent real LLM integration tests
 * skipIf: no API keys present (CI safe · cost controlled)
 * test_command: cd apps/api && pnpm vitest run src/specialists/__tests__/MonetizationAgent.real-llm.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  MonetizationAgent,
  Step4bOutputSchema,
} from '../MonetizationAgent';


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

describe.skipIf(skipIfNoKey)('MonetizationAgent real LLM', () => {
  const TEST_ACCOUNT_ID = 9999;

  let mockCostLogCreate: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    const { prisma } = await import('@/lib/prisma');
    mockCostLogCreate = prisma.costLog.create as ReturnType<typeof vi.fn>;
    mockCostLogCreate.mockClear();
  });

  it('(a) 3-stage monetization — ladder[3] + revenueStructure + successCases[2] valid', async () => {
    const agent = new MonetizationAgent();

    const result = await agent.execute({
      accountId: TEST_ACCOUNT_ID,
      userInput: {
        industry: '健身',
        currentRevenue: '0',
      },
    });

    // AC-1: isFallback=false + modelUsed match /claude|gpt/ + tokensUsed.total > 0
    expect(result.isFallback).toBe(false);
    expect(result.modelUsed).toMatch(/claude|gpt/);
    expect(result.tokensUsed.total).toBeGreaterThan(0);
    expect(result.durationMs).toBeLessThan(60_000);

    const output = result.result;

    // AC-4: Schema drift defense — ladder.length strictly === 3 (三阶梯)
    expect(output.ladder).toHaveLength(3);

    // AC-1: ladder items have required fields
    for (const item of output.ladder) {
      expect(typeof item.stage).toBe('string');
      expect(typeof item.revenue).toBe('string');
      expect(typeof item.action).toBe('string');
    }

    // AC-1: revenueStructure — primary + secondary[2]
    expect(typeof output.revenueStructure.primary).toBe('string');
    expect(output.revenueStructure.secondary).toHaveLength(2);

    // AC-1: successCases — exactly 2 items
    expect(output.successCases).toHaveLength(2);
    for (const c of output.successCases) {
      expect(typeof c.title).toBe('string');
      expect(typeof c.summary).toBe('string');
    }

    // AC-3: schema drift — real LLM output must match fallback mock format exactly
    const parsed = Step4bOutputSchema.safeParse(result.result);
    expect(parsed.success).toBe(true);

    // AC-5: cost_log 真存 · agentId + accountId + tokens > 0
    expect(mockCostLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          agentId: 'MonetizationAgent',
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
