/**
 * US-004 AC-2/3/5: BrandingAgent real LLM integration tests
 * skipIf: no API keys present (CI safe · cost controlled)
 * test_command: cd apps/api && pnpm vitest run src/specialists/__tests__/BrandingAgent.real-llm.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  BrandingAgent,
  Step3OutputSchema,
  Step3bOutputSchema,
} from '../BrandingAgent';

import type { Step3Output, Step3bOutput } from '../BrandingAgent';

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

describe.skipIf(skipIfNoKey)('BrandingAgent real LLM', () => {
  const TEST_ACCOUNT_ID = 9999;

  let mockCostLogCreate: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    const { prisma } = await import('@/lib/prisma');
    mockCostLogCreate = prisma.costLog.create as ReturnType<typeof vi.fn>;
    mockCostLogCreate.mockClear();
  });

  it('(a) packaging mode — nickname[5] + bio[6] + avatar + background + overallStrategy valid', async () => {
    const agent = new BrandingAgent();

    const result = await agent.execute({
      accountId: TEST_ACCOUNT_ID,
      mode: 'packaging',
      userInput: {
        industry: '美食',
        targetAudience: '25-35岁美食爱好者',
        contentStyle: '生活记录',
      },
    });

    // AC-2: isFallback=false + modelUsed match /claude|gpt/ + tokensUsed.total > 0
    expect(result.isFallback).toBe(false);
    expect(result.modelUsed).toMatch(/claude|gpt/);
    expect(result.tokensUsed.total).toBeGreaterThan(0);
    expect(result.durationMs).toBeLessThan(60_000);

    const output = result.result as Step3Output;
    expect(output.nickname).toHaveLength(5);
    expect(output.bio).toHaveLength(6);
    expect(typeof output.avatar.prompt).toBe('string');
    expect(typeof output.overallStrategy).toBe('string');

    // AC-3: schema drift — real LLM output must match fallback mock format exactly
    const parsed = Step3OutputSchema.safeParse(result.result);
    expect(parsed.success).toBe(true);

    // AC-4: cost_log 真存 · agentId + accountId + agentMode=packaging
    expect(mockCostLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          agentId: 'BrandingAgent',
          accountId: TEST_ACCOUNT_ID,
          isFallback: false,
          agentMode: 'packaging',
        }),
      }),
    );
    const callData = (mockCostLogCreate.mock.calls[0]?.[0] as { data: Record<string, unknown> })?.data;
    expect(Number(callData?.promptTokens)).toBeGreaterThan(0);
    expect(Number(callData?.completionTokens)).toBeGreaterThan(0);
    expect(Number(callData?.costUsd)).toBeGreaterThan(0);
  }, 60_000);

  it('(b) persona mode — coreIdentity + thoughtSystem + contentPersona + personaRoadmap valid', async () => {
    const agent = new BrandingAgent();

    const result = await agent.execute({
      accountId: TEST_ACCOUNT_ID,
      mode: 'persona',
      userInput: {
        industry: '健身',
        targetAudience: '18-30岁健身爱好者',
        contentStyle: '励志干货',
      },
    });

    // AC-2: isFallback=false + modelUsed match /claude|gpt/ + tokensUsed.total > 0
    expect(result.isFallback).toBe(false);
    expect(result.modelUsed).toMatch(/claude|gpt/);
    expect(result.tokensUsed.total).toBeGreaterThan(0);
    expect(result.durationMs).toBeLessThan(45_000);

    const output = result.result as Step3bOutput;
    expect(typeof output.coreIdentity).toBe('string');
    expect(output.thoughtSystem.coreBeliefs).toHaveLength(3);
    expect(output.thoughtSystem.uniqueViews).toHaveLength(2);
    expect(output.thoughtSystem.catchphrases).toHaveLength(3);
    expect(output.contentPersona.contentPillars).toHaveLength(4);
    expect(typeof output.trustBuilding).toBe('string');
    expect(typeof output.personaRoadmap.phase1).toBe('string');

    // AC-3: schema drift — real LLM output must pass strict OutputSchema validation
    const parsed = Step3bOutputSchema.safeParse(result.result);
    expect(parsed.success).toBe(true);

    // AC-4: cost_log 真存 · agentId + accountId + agentMode=persona
    expect(mockCostLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          agentId: 'BrandingAgent',
          accountId: TEST_ACCOUNT_ID,
          isFallback: false,
          agentMode: 'persona',
        }),
      }),
    );
    const callData = (mockCostLogCreate.mock.calls[0]?.[0] as { data: Record<string, unknown> })?.data;
    expect(Number(callData?.promptTokens)).toBeGreaterThan(0);
    expect(Number(callData?.completionTokens)).toBeGreaterThan(0);
    expect(Number(callData?.costUsd)).toBeGreaterThan(0);
  }, 45_000);
});
