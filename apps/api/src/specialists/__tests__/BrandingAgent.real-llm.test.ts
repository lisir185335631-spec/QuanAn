/**
 * US-004 AC-2/3/5: BrandingAgent real LLM integration tests
 * 默认 skip · 设 RUN_REAL_LLM=1 且有有效 LLM key 才真跑 (CI safe · cost controlled)
 * test_command: RUN_REAL_LLM=1 cd apps/api && pnpm vitest run src/specialists/__tests__/BrandingAgent.real-llm.test.ts
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

// ── Test suite (skipped unless RUN_REAL_LLM=1) ────────────────────────────────

const skipRealLlm = process.env.RUN_REAL_LLM !== '1';

describe.skipIf(skipRealLlm)('BrandingAgent real LLM', () => {
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
      userId: 1,
      mode: 'packaging',
      userInput: {
        industry: '美食',
        targetAudience: '25-35岁美食爱好者',
        contentStyle: '生活记录',
      },
    });

    // AC-2: isFallback=false + modelUsed match /claude|gpt/ + tokensUsed.total > 0
    expect(result.isFallback).toBe(false);
    expect(result.modelUsed).toMatch(/claude|gpt|deepseek/);
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
      userId: 1,
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
      userId: 1,
      mode: 'persona',
      userInput: {
        industry: '健身',
        targetAudience: '18-30岁健身爱好者',
        contentStyle: '励志干货',
      },
    });

    // AC-2: isFallback=false + modelUsed match /claude|gpt/ + tokensUsed.total > 0
    expect(result.isFallback).toBe(false);
    expect(result.modelUsed).toMatch(/claude|gpt|deepseek/);
    expect(result.tokensUsed.total).toBeGreaterThan(0);
    expect(result.durationMs).toBeLessThan(45_000);

    const output = result.result as Step3bOutput;
    // coreIdentity
    expect(typeof output.coreIdentity.identityTag).toBe('string');
    expect(typeof output.coreIdentity.quote).toBe('string');
    expect(typeof output.coreIdentity.differentiation).toBe('string');
    expect(output.coreIdentity.memoryPoints.length).toBeGreaterThanOrEqual(3);
    expect(output.coreIdentity.traits.length).toBeGreaterThanOrEqual(3);
    // thoughtSystem
    expect(output.thoughtSystem.coreBeliefs.length).toBeGreaterThanOrEqual(3);
    expect(output.thoughtSystem.viewpoints.length).toBeGreaterThanOrEqual(2);
    expect(output.thoughtSystem.mottos.length).toBeGreaterThanOrEqual(3);
    // contentPersona
    expect(typeof output.contentPersona.speakingStyle).toBe('string');
    expect(output.contentPersona.speakingDos.length).toBeGreaterThanOrEqual(2);
    expect(output.contentPersona.speakingDonts.length).toBeGreaterThanOrEqual(2);
    expect(typeof output.contentPersona.examplePitch).toBe('string');
    expect(typeof output.contentPersona.visualStyle.style).toBe('string');
    expect(output.contentPersona.contentPillars.length).toBeGreaterThanOrEqual(4);
    // trustSystem
    expect(output.trustSystem.backings.length).toBeGreaterThanOrEqual(2);
    expect(output.trustSystem.socialProofs.length).toBeGreaterThanOrEqual(1);
    expect(typeof output.trustSystem.storyLine.mainStory).toBe('string');
    // roadmap
    expect(output.roadmap).toHaveLength(3);
    expect(['green', 'yellow', 'purple']).toContain(output.roadmap[0]?.accent);

    // AC-3: schema drift — real LLM output must pass strict OutputSchema validation
    const parsed = Step3bOutputSchema.safeParse(result.result);
    expect(parsed.success).toBe(true);

    // AC-4: cost_log 真存 · agentId + accountId + agentMode=persona
    expect(mockCostLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          agentId: 'BrandingAgent',
          accountId: TEST_ACCOUNT_ID,
      userId: 1,
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
