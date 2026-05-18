/**
 * US-007 AC-2/3/5: LivestreamAgent real LLM integration tests (2 sub_functions)
 * skipIf: no API keys present (CI safe · cost controlled)
 * test_command: cd apps/api && pnpm vitest run src/specialists/__tests__/LivestreamAgent.real-llm.test.ts
 *
 * SHIELD(PRD-19 §11.11.4): 2 sub_function 各自独立测试 — discriminator 严守
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  LivestreamAgent,
  GeneratePlanOutputSchema,
  OptimizeScriptOutputSchema,
  LivestreamOutputSchema,
} from '../LivestreamAgent';
import type { GeneratePlanOutput, OptimizeScriptOutput } from '../LivestreamAgent';

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

// AC-4: 6-module field names strictly defined
const EXPECTED_6_MODULES = ['opening', 'warmup', 'product', 'conversion', 'faq', 'closing'] as const;

describe.skipIf(skipIfNoKey)('LivestreamAgent real LLM', () => {
  const TEST_ACCOUNT_ID = 9999;

  let mockCostLogCreate: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    const { prisma } = await import('@/lib/prisma');
    mockCostLogCreate = prisma.costLog.create as ReturnType<typeof vi.fn>;
    mockCostLogCreate.mockClear();
  });

  it(
    '(a) generate_plan — 6-module JSON schema strict · cost_log agentMode=generate_plan · tokens > 0',
    async () => {
      const agent = new LivestreamAgent();

      const result = await agent.execute({
        accountId: TEST_ACCOUNT_ID,
        mode: 'generate_plan',
        userInput: {
          sub_function: 'generate_plan',
          experience: '新手',
          platform: 'douyin',
          productInfo: '有机绿茶礼盒',
          targetAudience: '25-45岁注重健康的消费者',
        },
        stepKey: 'step8',
      });

      // AC-2: isFallback=false + real model + real tokens
      expect(result.isFallback).toBe(false);
      expect(result.modelUsed).toMatch(/claude|gpt/);
      expect(result.tokensUsed.total).toBeGreaterThan(0);
      expect(result.durationMs).toBeLessThan(60_000);

      const output = result.result as GeneratePlanOutput;

      // AC-4: 6-module strict field check
      for (const field of EXPECTED_6_MODULES) {
        expect(typeof (output as Record<string, unknown>)[field]).toBe('string');
        expect(((output as Record<string, unknown>)[field] as string).length).toBeGreaterThan(0);
      }

      // AC-3: schema drift — safeParse with GeneratePlanOutputSchema
      const parsed = GeneratePlanOutputSchema.safeParse(result.result);
      expect(parsed.success).toBe(true);

      // AC-5: cost_log 真接 · agentId=LivestreamAgent · agentMode='generate_plan' · tokens > 0
      expect(mockCostLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            agentId: 'LivestreamAgent',
            agentMode: 'generate_plan',
            isFallback: false,
          }),
        }),
      );
      const callData = (mockCostLogCreate.mock.calls[0]?.[0] as { data: Record<string, unknown> })?.data;
      expect(Number(callData?.promptTokens)).toBeGreaterThan(0);
      expect(Number(callData?.completionTokens)).toBeGreaterThan(0);
    },
    60_000,
  );

  it(
    '(b) optimize_script — 2 InfoCard schema strict · cost_log agentMode=optimize_script · tokens > 0',
    async () => {
      const agent = new LivestreamAgent();

      const result = await agent.execute({
        accountId: TEST_ACCOUNT_ID,
        mode: 'optimize_script',
        userInput: {
          sub_function: 'optimize_script',
          experience: '有经验',
          scriptText: '欢迎来到直播间，我是XXX，今天给大家推荐一款好产品，质量很好价格实惠，大家可以看一下。',
          optimizeGoal: '提升开场吸引力和转化率',
        },
        stepKey: 'step8',
      });

      // AC-2: isFallback=false + real model + real tokens
      expect(result.isFallback).toBe(false);
      expect(result.modelUsed).toMatch(/claude|gpt/);
      expect(result.tokensUsed.total).toBeGreaterThan(0);
      expect(result.durationMs).toBeLessThan(60_000);

      const output = result.result as OptimizeScriptOutput;

      // AC-4: 2 InfoCard field check
      expect(typeof output.optimized_text).toBe('string');
      expect(output.optimized_text.length).toBeGreaterThan(0);
      expect(typeof output.optimization_notes).toBe('string');
      expect(output.optimization_notes.length).toBeGreaterThan(0);

      // AC-3: schema drift — safeParse with OptimizeScriptOutputSchema
      const parsed = OptimizeScriptOutputSchema.safeParse(result.result);
      expect(parsed.success).toBe(true);

      // AC-5: cost_log 真接 · agentId=LivestreamAgent · agentMode='optimize_script' · tokens > 0
      expect(mockCostLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            agentId: 'LivestreamAgent',
            agentMode: 'optimize_script',
            isFallback: false,
          }),
        }),
      );
      const callData = (mockCostLogCreate.mock.calls[0]?.[0] as { data: Record<string, unknown> })?.data;
      expect(Number(callData?.promptTokens)).toBeGreaterThan(0);
      expect(Number(callData?.completionTokens)).toBeGreaterThan(0);
    },
    60_000,
  );
});

// Always-run fallback schema alignment tests (no API key required)
describe('LivestreamAgent fallback schema alignment (no key)', () => {
  it('generate_plan fallback satisfies GeneratePlanOutputSchema', () => {
    const fallback = LivestreamAgent.fallbackTemplate['generate_plan'];
    expect(fallback).toBeDefined();
    const parsed = GeneratePlanOutputSchema.safeParse(fallback);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      for (const field of EXPECTED_6_MODULES) {
        expect(typeof (parsed.data as Record<string, unknown>)[field]).toBe('string');
      }
    }
  });

  it('optimize_script fallback satisfies OptimizeScriptOutputSchema', () => {
    const fallback = LivestreamAgent.fallbackTemplate['optimize_script'];
    expect(fallback).toBeDefined();
    const parsed = OptimizeScriptOutputSchema.safeParse(fallback);
    expect(parsed.success).toBe(true);
  });

  it('default fallback satisfies LivestreamOutputSchema', () => {
    const fallback = LivestreamAgent.fallbackTemplate['default'];
    expect(fallback).toBeDefined();
    const parsed = LivestreamOutputSchema.safeParse(fallback);
    expect(parsed.success).toBe(true);
  });
});
