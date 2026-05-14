/**
 * Unit tests — PRD-4 US-015
 * isFallback 降级路径 · 7 Specialist fallback paths
 * AC-16: ≥ 7 tests (each Specialist 1 fallback test)
 * AC-10: fallbackTemplate values satisfy outputSchema (type guard + test assertion)
 * AC-9: no fallbackTemplate → re-throw error
 * AC-13: cost_log model='fallback', tokens=0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted shared state ────────────────────────────────────────────────────

const { mockAssemble, mockCostLogCreate } = vi.hoisted(() => ({
  mockAssemble: vi.fn().mockResolvedValue({
    systemPrompt: '[system-stub]',
    userPrompt: '<user_input>{}</user_input>',
    tools: [],
    metadata: { contextTokens: 0, layersUsed: ['L2'], ragHits: [] },
  }),
  mockCostLogCreate: vi.fn().mockResolvedValue({ id: BigInt(1) }),
}));

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/services/context-assembler/ContextAssembler', () => ({
  contextAssembler: { assemble: mockAssemble },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: { costLog: { create: mockCostLogCreate } },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── Imports (after mocks) ─────────────────────────────────────────────────────

import { PositioningAgent, Step1OutputSchema, Step4OutputSchema } from '@/specialists/PositioningAgent';
import { BrandingAgent, Step3OutputSchema, Step3bOutputSchema } from '@/specialists/BrandingAgent';
import { MonetizationAgent, Step4bOutputSchema } from '@/specialists/MonetizationAgent';
import { TopicAgent, TopicOutputSchema } from '@/specialists/TopicAgent';
import { VideoAgent, ShootingOutputSchema } from '@/specialists/VideoAgent';
import { CopywritingAgent, CopywritingOutputSchema } from '@/specialists/CopywritingAgent';
import { LivestreamAgent, LivestreamOutputSchema } from '@/specialists/LivestreamAgent';
import { LLMTimeoutError } from '@/specialists/base/errors';
import type { ILLMGateway } from '@/specialists/base/types';

// ── Gateway helpers ───────────────────────────────────────────────────────────

/** Gateway that returns content that fails schema validation twice → SchemaValidationError → fallback */
function makeInvalidContentGateway(badContent: unknown): ILLMGateway {
  return {
    complete: vi.fn().mockResolvedValue({
      content: badContent,
      tokens: { prompt: 0, completion: 0, total: 0 },
      model: 'claude-test',
    }),
  };
}

/** Streaming gateway that returns invalid JSON → JSON.parse fails → invokeLLM returns isFallback=true → fallback */
async function* invalidJsonStream() {
  yield { type: 'delta' as const, delta: 'not-valid-json-{' };
  yield { type: 'done' as const, tokens: { prompt: 0, completion: 0, total: 0 } };
}

function makeStreamingInvalidGateway(): ILLMGateway {
  return {
    complete: vi.fn().mockResolvedValue({
      content: null,
      tokens: { prompt: 0, completion: 0, total: 0 },
      model: 'claude-test',
    }),
    stream: () => invalidJsonStream(),
  };
}

const BASE_REQ = {
  accountId: 42,
  traceId: 'trace-fallback-test',
  stepKey: 'test-step',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('US-015 · isFallback 降级路径', () => {

  beforeEach(() => {
    mockCostLogCreate.mockClear();
  });

  // ── 1. PositioningAgent industry fallback ─────────────────────────────────

  it('PositioningAgent industry: invalid LLM output → fallback · output satisfies Step1OutputSchema (AC-16)', async () => {
    // Invalid content: missing required fields → schema fails twice → SchemaValidationError → fallback
    const agent = new PositioningAgent(makeInvalidContentGateway({ invalid: true }));
    const res = await agent.execute({ ...BASE_REQ, mode: 'industry', userInput: {} });

    expect(res.isFallback).toBe(true);
    expect(res.modelUsed).toBe('fallback');
    expect(res.tokensUsed).toEqual({ prompt: 0, completion: 0, total: 0 });
    // AC-10: output satisfies outputSchema
    expect(Step1OutputSchema.safeParse(res.result).success).toBe(true);
    // AC-13: cost_log written with model='fallback', tokens=0
    expect(mockCostLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          modelUsed: 'fallback',
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          isFallback: true,
          callType: 'specialist_call',
        }),
      }),
    );
  });

  // ── 2. BrandingAgent packaging fallback ──────────────────────────────────

  it('BrandingAgent packaging: invalid output → fallback · output satisfies Step3OutputSchema (AC-16)', async () => {
    const agent = new BrandingAgent(makeInvalidContentGateway({ bad: 'data' }));
    const res = await agent.execute({ ...BASE_REQ, mode: 'packaging', userInput: {} });

    expect(res.isFallback).toBe(true);
    expect(res.modelUsed).toBe('fallback');
    expect(Step3OutputSchema.safeParse(res.result).success).toBe(true);
    const r = res.result as import('@/specialists/BrandingAgent').Step3Output;
    expect(r.nickname).toHaveLength(5);
    expect(r.bio).toHaveLength(6);
  });

  // ── 3. MonetizationAgent fallback ────────────────────────────────────────

  it('MonetizationAgent: invalid output → fallback · output satisfies Step4bOutputSchema (AC-16)', async () => {
    const agent = new MonetizationAgent(makeInvalidContentGateway({ wrong: true }));
    const res = await agent.execute({ ...BASE_REQ, userInput: {} });

    expect(res.isFallback).toBe(true);
    expect(Step4bOutputSchema.safeParse(res.result).success).toBe(true);
    const r = res.result as import('@/specialists/MonetizationAgent').Step4bOutput;
    expect(r.ladder).toHaveLength(3);
    expect(r.successCases).toHaveLength(2);
    expect(r.revenueStructure.secondary).toHaveLength(2);
  });

  // ── 4. VideoAgent fallback ────────────────────────────────────────────────

  it('VideoAgent shooting: invalid output → fallback · output satisfies ShootingOutputSchema (AC-16)', async () => {
    // Empty shotList violates min(1)
    const agent = new VideoAgent(makeInvalidContentGateway({ shotList: [], equipment: [], schedule: '' }));
    const res = await agent.execute({ ...BASE_REQ, mode: 'shooting', userInput: {} });

    expect(res.isFallback).toBe(true);
    expect(ShootingOutputSchema.safeParse(res.result).success).toBe(true);
    const r = res.result as import('@/specialists/VideoAgent').ShootingOutput;
    expect(r.shotList.length).toBeGreaterThanOrEqual(1);
    expect(r.equipment.length).toBeGreaterThanOrEqual(1);
  });

  // ── 5. CopywritingAgent fallback ──────────────────────────────────────────

  it('CopywritingAgent step7: stream invalid JSON → fallback · output satisfies CopywritingOutputSchema (AC-16)', async () => {
    // Streaming gateway returns invalid JSON → invokeLLM returns isFallback: true → SchemaValidationError → fallback
    const agent = new CopywritingAgent(makeStreamingInvalidGateway());
    const res = await agent.execute({ ...BASE_REQ, mode: 'step7', userInput: {} });

    expect(res.isFallback).toBe(true);
    expect(CopywritingOutputSchema.safeParse(res.result).success).toBe(true);
    const r = res.result as import('@/specialists/CopywritingAgent').CopywritingOutput;
    expect(r.markdown.length).toBeGreaterThanOrEqual(500);
    expect(/^# .+/m.test(r.markdown)).toBe(true);
    expect(r.hooks.length).toBeGreaterThanOrEqual(1);
  });

  // ── 6. LivestreamAgent fallback ───────────────────────────────────────────

  it('LivestreamAgent: invalid output (short strings) → fallback · output satisfies LivestreamOutputSchema (AC-16)', async () => {
    // Too-short strings violate min(200) → schema fails twice → SchemaValidationError → fallback
    const agent = new LivestreamAgent(makeInvalidContentGateway({
      lastResult: '太短',
      lastOptimizedResult: '太短',
    }));
    const res = await agent.execute({ ...BASE_REQ, userInput: { experience: '新手' } });

    expect(res.isFallback).toBe(true);
    expect(LivestreamOutputSchema.safeParse(res.result).success).toBe(true);
    const r = res.result as import('@/specialists/LivestreamAgent').LivestreamOutput;
    expect(r.lastResult.length).toBeGreaterThanOrEqual(200);
    expect(r.lastOptimizedResult.length).toBeGreaterThanOrEqual(200);
  });

  // ── 7. TopicAgent traffic fallback ───────────────────────────────────────

  it('TopicAgent traffic: stream invalid JSON → fallback · 20 topics in output (AC-16)', async () => {
    const agent = new TopicAgent(makeStreamingInvalidGateway());
    const res = await agent.execute({ ...BASE_REQ, userInput: { category: 'traffic' } });

    expect(res.isFallback).toBe(true);
    expect(TopicOutputSchema.safeParse(res.result).success).toBe(true);
    const r = res.result as import('@/specialists/TopicAgent').TopicOutput;
    expect(r.topics).toHaveLength(20);
    expect(r.category).toBe('traffic');
  });

  // ── AC-9: no fallbackTemplate → re-throw ─────────────────────────────────

  it('AC-9: specialist without fallbackTemplate re-throws the error on schema failure', async () => {
    const { z } = await import('zod');
    const { BaseSpecialist } = await import('@/specialists/base/BaseSpecialist');
    const { SchemaValidationError } = await import('@/specialists/base/errors');

    class NoFallbackSpecialist extends BaseSpecialist<Record<string, unknown>, { ok: boolean }> {
      readonly config = {
        agentId: 'NoFallbackTest',
        persona: { role: 'test', goal: 'test', boundaries: [] as string[] },
        memory: { l1_readonly: [] as string[], l2_read: [] as string[], l2_write: [] as string[] },
        knowledge: { constants: [] as string[], rag: [] as string[], refresh_interval_sec: 0 },
        tools: [] as string[],
        execution: { timeout_ms: 1000, retry: 0, model_tier: 'lightweight' as const, streaming: false },
      };
      readonly inputSchema = z.record(z.unknown());
      readonly outputSchema = z.object({ ok: z.boolean() });
      // No static override fallbackTemplate

      protected async invokeLLM(): Promise<import('@/specialists/base/types').InvokeLLMResult> {
        return { content: { bad: 'data' }, tokens: { prompt: 0, completion: 0, total: 0 }, model: '' };
      }
    }

    const agent = new NoFallbackSpecialist();
    await expect(agent.execute({ accountId: 1, userInput: {} })).rejects.toThrow(SchemaValidationError);
  });

  // ── AC-10: fallbackTemplate type guard assertion for all specialists ───────

  it('AC-10: all fallbackTemplates pass their respective outputSchema (type guard)', () => {
    // PositioningAgent
    expect(Step1OutputSchema.safeParse(PositioningAgent.fallbackTemplate.industry).success).toBe(true);
    expect(Step4OutputSchema.safeParse(PositioningAgent.fallbackTemplate.execution).success).toBe(true);

    // BrandingAgent
    expect(Step3OutputSchema.safeParse(BrandingAgent.fallbackTemplate.packaging).success).toBe(true);
    expect(Step3bOutputSchema.safeParse(BrandingAgent.fallbackTemplate.persona).success).toBe(true);

    // MonetizationAgent
    expect(Step4bOutputSchema.safeParse(MonetizationAgent.fallbackTemplate.default).success).toBe(true);

    // TopicAgent
    expect(TopicOutputSchema.safeParse(TopicAgent.fallbackTemplate.traffic).success).toBe(true);
    expect(TopicOutputSchema.safeParse(TopicAgent.fallbackTemplate.monetize).success).toBe(true);
    expect(TopicOutputSchema.safeParse(TopicAgent.fallbackTemplate.persona).success).toBe(true);
    expect(TopicOutputSchema.safeParse(TopicAgent.fallbackTemplate.cognition).success).toBe(true);
    expect(TopicOutputSchema.safeParse(TopicAgent.fallbackTemplate.case).success).toBe(true);

    // VideoAgent
    expect(ShootingOutputSchema.safeParse(VideoAgent.fallbackTemplate.shooting).success).toBe(true);

    // CopywritingAgent
    expect(CopywritingOutputSchema.safeParse(CopywritingAgent.fallbackTemplate.step7).success).toBe(true);

    // LivestreamAgent
    expect(LivestreamOutputSchema.safeParse(LivestreamAgent.fallbackTemplate.default).success).toBe(true);
  });

  // ── AC-13: LLMTimeoutError → fallback cost_log (mode matches template) ────

  it('AC-13: LLMTimeoutError on a non-mode specialist triggers fallback cost_log with model=fallback', async () => {
    // MonetizationAgent has no mode → 'default' key in fallbackTemplate
    const gateway: ILLMGateway = {
      complete: vi.fn().mockImplementation(() => Promise.reject(new LLMTimeoutError('MonetizationAgent', 45_000))),
    };
    const agent = new MonetizationAgent(gateway);
    const res = await agent.execute({ ...BASE_REQ, userInput: {} });

    expect(res.isFallback).toBe(true);
    expect(res.modelUsed).toBe('fallback');
    expect(res.tokensUsed.total).toBe(0);
    expect(mockCostLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ modelUsed: 'fallback', isFallback: true }),
      }),
    );
  });
});
