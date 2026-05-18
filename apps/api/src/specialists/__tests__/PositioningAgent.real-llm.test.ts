/**
 * US-003 AC-2/3/5: PositioningAgent real LLM integration tests
 * skipIf: no API keys present (CI safe · cost controlled)
 * test_command: OPENAI_API_KEY=$ANTHROPIC_API_KEY cd apps/api && pnpm vitest run src/specialists/__tests__/PositioningAgent.real-llm.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  PositioningAgent,
  Step1OutputSchema,
  Step4OutputSchema,
} from '../PositioningAgent';
import type { Step1Output, Step4Output } from '../PositioningAgent';

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

const SKIP = !process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY;

describe.skipIf(SKIP)('PositioningAgent real LLM', () => {
  const TEST_ACCOUNT_ID = 9999;

  // Get reference to mocked prisma after hoisting resolves
  let mockCostLogCreate: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    const { prisma } = await import('@/lib/prisma');
    mockCostLogCreate = prisma.costLog.create as ReturnType<typeof vi.fn>;
    mockCostLogCreate.mockClear();
  });

  it('(a) industry mode — market_analysis/competition_level/recommendation valid', async () => {
    const agent = new PositioningAgent();

    const result = await agent.execute({
      accountId: TEST_ACCOUNT_ID,
      mode: 'industry',
      userInput: { industry: '美食' },
    });

    // AC-2: isFallback=false + modelUsed match /claude|gpt/ + tokensUsed.total > 0
    expect(result.isFallback).toBe(false);
    expect(result.modelUsed).toMatch(/claude|gpt/);
    expect(result.tokensUsed.total).toBeGreaterThan(0);
    expect(result.durationMs).toBeLessThan(60_000);

    const output = result.result as Step1Output;
    expect(output.marketAnalysis.length).toBeGreaterThanOrEqual(50);
    expect(['low', 'medium', 'high']).toContain(output.competitionLevel);
    expect(output.recommendation.length).toBeGreaterThanOrEqual(50);

    // AC-3: schema drift — real LLM output must match fallback mock format exactly
    const parsed = Step1OutputSchema.safeParse(result.result);
    expect(parsed.success).toBe(true);

    // AC-5: cost_log written with real promptTokens / completionTokens / costUsd > 0
    expect(mockCostLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          agentId: 'PositioningAgent',
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

  it('(b) execution mode — daily_tasks/weekly_milestones/stage_kpis in markdown valid', async () => {
    const agent = new PositioningAgent();

    const result = await agent.execute({
      accountId: TEST_ACCOUNT_ID,
      mode: 'execution',
      userInput: {
        industry: '美食',
        targetAudience: '25-35岁美食爱好者',
        contentStyle: '实用干货',
      },
    });

    // AC-2: isFallback=false + modelUsed match /claude|gpt/ + tokensUsed.total > 0
    expect(result.isFallback).toBe(false);
    expect(result.modelUsed).toMatch(/claude|gpt/);
    expect(result.tokensUsed.total).toBeGreaterThan(0);
    expect(result.durationMs).toBeLessThan(60_000);

    const output = result.result as Step4Output;
    expect(output.markdown.trim()).toMatch(/^# 执行计划/);
    expect(output.markdown.length).toBeGreaterThanOrEqual(1000);

    // AC-3: schema drift — real LLM output must pass strict OutputSchema validation
    const parsed = Step4OutputSchema.safeParse(result.result);
    expect(parsed.success).toBe(true);

    // AC-5: cost_log written with real promptTokens / completionTokens / costUsd > 0
    expect(mockCostLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          agentId: 'PositioningAgent',
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
