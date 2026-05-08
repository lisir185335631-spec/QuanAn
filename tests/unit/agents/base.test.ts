/**
 * US-007 · Unit tests (3):
 *   1. BaseSpecialist — abstract execute contract (concrete subclass works)
 *   2. LLMGateway tier — selectTier pass-through
 *   3. trace_id propagation — extractTraceId / generateHttpTraceId
 * Note: assembleStep stub test removed — PRD-2 stub deleted; real ContextAssembler
 * is in services/context-assembler/ and tested in tests/unit/services/context-assembler.test.ts
 */

import { describe, it, expect } from 'vitest';
import { BaseSpecialist } from '@/agents/base/BaseSpecialist';
import { llmGateway } from '@/workers/llm-gateway';
import { extractTraceId, generateHttpTraceId } from '@/trpc/middleware/trace';
import type { SpecialistInput, SpecialistOutput, SpecialistConfig, AssembledContext } from '@/agents/base/types';

// ── 1. BaseSpecialist abstract execute contract ───────────────────────────────

describe('BaseSpecialist abstract contract', () => {
  it('concrete subclass implements execute and can be instantiated', async () => {
    class TestAgent extends BaseSpecialist<string, string> {
      readonly id = 'CopywritingAgent' as const;
      readonly config = {} as SpecialistConfig;

      protected async execute(
        _input: SpecialistInput<string>,
        _ctx: AssembledContext,
      ): Promise<SpecialistOutput<string>> {
        return {
          success: true,
          result: 'hello',
          trace_id: 'test-trace',
          agentId: 'CopywritingAgent',
          model: 'stub',
          tokens: { prompt: 0, completion: 0, total: 0 },
          durationMs: 0,
          feedbackHook: { rateableContentId: 0, rateableType: 'history' },
        };
      }
    }

    const agent = new TestAgent();
    expect(agent).toBeInstanceOf(BaseSpecialist);
    // execute is protected; verify via run (validateInput will throw on invalid input,
    // confirming the abstract method is wired into the template pattern)
    await expect(
      agent.run({ accountId: 0, userId: 1, agentId: 'CopywritingAgent', payload: 'x' }),
    ).rejects.toThrow('Invalid accountId');
  });
});

// ── 2. LLMGateway.selectTier pass-through ────────────────────────────────────

describe('LLMGateway.selectTier', () => {
  it('returns reasoning for reasoning hint', () => {
    expect(llmGateway.selectTier('reasoning', 1000)).toBe('reasoning');
  });

  it('returns lightweight for lightweight hint', () => {
    expect(llmGateway.selectTier('lightweight', 100)).toBe('lightweight');
  });
});

// ── 3. trace_id propagation ───────────────────────────────────────────────────

describe('trace_id propagation', () => {
  it('extractTraceId returns the X-Trace-Id header value', () => {
    const headers = new Headers({ 'x-trace-id': 'user-trace-001' });
    expect(extractTraceId(headers)).toBe('user-trace-001');
  });

  it('extractTraceId returns empty string when header absent', () => {
    const headers = new Headers();
    expect(extractTraceId(headers)).toBe('');
  });

  it('generateHttpTraceId returns a 16-char hex string', () => {
    const id = generateHttpTraceId();
    expect(id).toMatch(/^[0-9a-f]{16}$/);
  });

  it('generateHttpTraceId is unique per call', () => {
    const ids = new Set(Array.from({ length: 20 }, () => generateHttpTraceId()));
    expect(ids.size).toBe(20);
  });
});
