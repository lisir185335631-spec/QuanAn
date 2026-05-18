/**
 * US-007 AC-2/3/5: CopywritingAgent step7 mode real LLM integration tests
 * skipIf: no API keys present (CI safe · cost controlled)
 * test_command: cd apps/api && pnpm vitest run src/specialists/__tests__/CopywritingAgent.real-llm.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  CopywritingAgent,
  CopywritingOutputSchema,
} from '../CopywritingAgent';
import type { CopywritingOutput } from '../CopywritingAgent';

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

describe.skipIf(skipIfNoKey)('CopywritingAgent step7 real LLM', () => {
  const TEST_ACCOUNT_ID = 9999;

  let mockCostLogCreate: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    const { prisma } = await import('@/lib/prisma');
    mockCostLogCreate = prisma.costLog.create as ReturnType<typeof vi.fn>;
    mockCostLogCreate.mockClear();
  });

  it(
    '(a) step7 mode — markdown has # heading · schema valid · cost_log agentMode=step7 · tokens > 0',
    async () => {
      const agent = new CopywritingAgent();

      const result = await agent.execute({
        accountId: TEST_ACCOUNT_ID,
        mode: 'step7',
        userInput: {
          scriptType: 'educational',
          topic: '健康饮食习惯',
          elements: ['curiosity', 'contrast'],
        },
        stepKey: 'step7',
      });

      // AC-2: isFallback=false + real model + real tokens
      expect(result.isFallback).toBe(false);
      expect(result.modelUsed).toMatch(/claude|gpt/);
      expect(result.tokensUsed.total).toBeGreaterThan(0);
      expect(result.durationMs).toBeLessThan(60_000);

      const output = result.result as CopywritingOutput;

      // AC-3: schema drift — markdown must have # heading (CopywritingOutputSchema refine)
      expect(/^# .+/m.test(output.markdown)).toBe(true);
      expect(output.markdown.length).toBeGreaterThanOrEqual(500);
      expect(Array.isArray(output.hooks)).toBe(true);
      expect(output.hooks.length).toBeGreaterThanOrEqual(1);
      expect(typeof output.structure).toBe('string');
      expect(typeof output.cta).toBe('string');

      // AC-4: Schema drift — safeParse with strict CopywritingOutputSchema
      const parsed = CopywritingOutputSchema.safeParse(result.result);
      expect(parsed.success).toBe(true);

      // AC-5: cost_log 真接 · agentId=CopywritingAgent · agentMode='step7' · tokens > 0
      expect(mockCostLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            agentId: 'CopywritingAgent',
            agentMode: 'step7',
            isFallback: false,
          }),
        }),
      );
      const callData = (mockCostLogCreate.mock.calls[0]?.[0] as { data: Record<string, unknown> })?.data;
      expect(Number(callData?.promptTokens)).toBeGreaterThan(0);
      expect(Number(callData?.completionTokens)).toBeGreaterThan(0);
      expect(Number(callData?.costUsd)).toBeGreaterThan(0);
    },
    60_000,
  );

  it(
    '(b) fallback mock schema alignment — CopywritingAgent.fallbackTemplate.step7 satisfies CopywritingOutputSchema',
    () => {
      // AC-3 schema drift defense: fallback must match real LLM schema
      const fallback = CopywritingAgent.fallbackTemplate['step7'];
      expect(fallback).toBeDefined();

      const parsed = CopywritingOutputSchema.safeParse(fallback);
      expect(parsed.success).toBe(true);

      if (parsed.success) {
        expect(/^# .+/m.test(parsed.data.markdown)).toBe(true);
        expect(parsed.data.markdown.length).toBeGreaterThanOrEqual(500);
        expect(parsed.data.hooks.length).toBeGreaterThanOrEqual(1);
      }
    },
  );
});

// Always-run fallback schema alignment test (no API key required)
describe('CopywritingAgent fallback schema alignment (no key)', () => {
  it('step7 fallback satisfies CopywritingOutputSchema', () => {
    const fallback = CopywritingAgent.fallbackTemplate['step7'];
    const parsed = CopywritingOutputSchema.safeParse(fallback);
    expect(parsed.success).toBe(true);
  });
});
