/**
 * Unit tests — PRD-4 US-003
 * BaseSpecialist LLM 集成行为: zod retry · cost_log 完整字段 · TraceId · LLMTimeoutError
 * AC-9: tests/unit/specialists/base.llm.test.ts ≥ 6 tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { BaseSpecialist } from '@/specialists/base/BaseSpecialist';
import { SchemaValidationError, LLMTimeoutError } from '@/specialists/base/errors';
import type {
  SpecialistConfig,
  SpecialistRequest,
  InvokeLLMResult,
  ILLMGateway,
  AssembledContext,
} from '@/specialists/base/types';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/services/context-assembler/ContextAssembler', () => ({
  contextAssembler: {
    assemble: vi.fn().mockResolvedValue({
      systemPrompt: '[sys]',
      userPrompt: '[usr]',
      tools: [],
      metadata: { contextTokens: 0, layersUsed: ['L2'], ragHits: [] },
    }),
    assembleStep: vi.fn(),
  },
}));

// vi.hoisted needed: factory runs at top-of-file before variable declaration
const { mockCostLogCreate } = vi.hoisted(() => ({
  mockCostLogCreate: vi.fn().mockResolvedValue({ id: BigInt(1) }),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: { costLog: { create: mockCostLogCreate } },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const CONFIG: SpecialistConfig = {
  agentId: 'PositioningAgent',
  persona: { role: '定位师', goal: '找赛道', boundaries: [] },
  memory: { l1_readonly: ['account'], l2_read: ['stepData'], l2_write: ['stepData'] },
  knowledge: { constants: [], rag: [], refresh_interval_sec: 600 },
  tools: ['llm.complete'],
  execution: { timeout_ms: 30_000, retry: 1, model_tier: 'reasoning', streaming: false },
};

const InputSchema = z.object({ topic: z.string().min(1) });
const OutputSchema = z.object({ positioning: z.string().min(1) });
type TIn = z.infer<typeof InputSchema>;
type TOut = z.infer<typeof OutputSchema>;

const VALID_CONTENT = { positioning: '宠物博主·专注猫粮科普' };
const INVALID_CONTENT = { wrong: 'oops' };

function makeGateway(contentSeq: unknown[]): ILLMGateway {
  let call = 0;
  return {
    complete: vi.fn().mockImplementation(async () => {
      const content = contentSeq[call] ?? contentSeq[contentSeq.length - 1];
      call++;
      return { content, tokens: { prompt: 10, completion: 5, total: 15 }, model: 'claude-sonnet-4-6' };
    }),
  };
}

class TestSpecialist extends BaseSpecialist<TIn, TOut> {
  readonly config = CONFIG;
  readonly inputSchema = InputSchema;
  readonly outputSchema = OutputSchema;

  protected async invokeLLM(
    ctx: AssembledContext,
    req: SpecialistRequest<TIn>,
  ): Promise<InvokeLLMResult> {
    return this.llmGateway.complete({
      model_tier: this.config.execution.model_tier,
      systemPrompt: ctx.systemPrompt,
      userPrompt: ctx.userPrompt,
      responseFormat: { type: 'json_schema', schema: this.outputSchema },
      metadata: { trace_id: req.traceId ?? '', agentId: this.config.agentId, accountId: req.accountId, userId: 0 },
      timeout_ms: this.config.execution.timeout_ms,
    });
  }
}

const BASE_REQ: SpecialistRequest<TIn> = { accountId: 1, userInput: { topic: 'cat' } };

beforeEach(() => {
  vi.clearAllMocks();
  mockCostLogCreate.mockResolvedValue({ id: BigInt(1) });
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('US-003 AC-3: schema validation pass (no retry)', () => {
  it('valid LLM output passes on first invokeLLM call — gateway called once', async () => {
    const gw = makeGateway([VALID_CONTENT]);
    const agent = new TestSpecialist(gw);
    const result = await agent.execute(BASE_REQ);
    expect(result.result).toMatchObject(VALID_CONTENT);
    expect(gw.complete).toHaveBeenCalledTimes(1);
  });
});

describe('US-003 AC-3: schema validation fail → retry → pass', () => {
  it('invalid first output retries, second valid output succeeds — gateway called twice', async () => {
    const gw = makeGateway([INVALID_CONTENT, VALID_CONTENT]);
    const agent = new TestSpecialist(gw);
    const result = await agent.execute(BASE_REQ);
    expect(result.result).toMatchObject(VALID_CONTENT);
    expect(gw.complete).toHaveBeenCalledTimes(2);
  });
});

describe('US-003 AC-3: schema validation fail → retry → fail → SchemaValidationError', () => {
  it('two consecutive invalid outputs throw SchemaValidationError', async () => {
    const gw = makeGateway([INVALID_CONTENT, INVALID_CONTENT]);
    const agent = new TestSpecialist(gw);
    await expect(agent.execute(BASE_REQ)).rejects.toBeInstanceOf(SchemaValidationError);
    expect(gw.complete).toHaveBeenCalledTimes(2);
  });

  it('SchemaValidationError carries llmRawOutput', async () => {
    const gw = makeGateway([INVALID_CONTENT, INVALID_CONTENT]);
    const agent = new TestSpecialist(gw);
    const err = await agent.execute(BASE_REQ).catch((e) => e as SchemaValidationError);
    expect(err).toBeInstanceOf(SchemaValidationError);
    expect(err.llmRawOutput).toEqual(INVALID_CONTENT);
  });
});

describe('US-003 AC-4: cost_log callType + target', () => {
  it('cost_log written with callType=specialist_call and target.agentId', async () => {
    const gw = makeGateway([VALID_CONTENT]);
    const agent = new TestSpecialist(gw);
    await agent.execute({ ...BASE_REQ, stepKey: 'step_1_positioning', traceId: 'tr-llm-test-001' });
    expect(mockCostLogCreate).toHaveBeenCalledOnce();
    const data = mockCostLogCreate.mock.calls[0]?.[0]?.data;
    expect(data?.callType).toBe('specialist_call');
    expect(data?.target).toMatchObject({ agentId: 'PositioningAgent', stepKey: 'step_1_positioning' });
    expect(data?.traceId).toBe('tr-llm-test-001');
  });
});

describe('US-003 AC-5: traceId uses generateSpecialistTraceId pattern', () => {
  it('auto-generated traceId follows tr_accountId_agentId_... format', async () => {
    const gw = makeGateway([VALID_CONTENT]);
    const agent = new TestSpecialist(gw);
    const result = await agent.execute({ accountId: 42, userInput: { topic: 'food' } });
    // generateSpecialistTraceId format: tr_${accountId}_${agentId}_${ts}_${rand}
    expect(result.traceId).toMatch(/^tr_42_PositioningAgent_\d+_[a-z0-9]{4}$/);
  });
});

describe('US-003 AC-6: LLMTimeoutError from AbortError', () => {
  it('AbortError from invokeLLM is converted to LLMTimeoutError', async () => {
    const abortErr = Object.assign(new Error('aborted'), { name: 'AbortError' });
    const gw: ILLMGateway = { complete: vi.fn().mockRejectedValue(abortErr) };
    const agent = new TestSpecialist(gw);
    const err = await agent.execute(BASE_REQ).catch((e) => e);
    expect(err).toBeInstanceOf(LLMTimeoutError);
    expect((err as LLMTimeoutError).agentId).toBe('PositioningAgent');
    expect((err as LLMTimeoutError).timeoutMs).toBe(30_000);
  });
});

describe('US-003 AC-1: responseFormat json_schema passed to gateway', () => {
  it('invokeLLM passes responseFormat:{type:json_schema} to llmGateway.complete', async () => {
    const gw = makeGateway([VALID_CONTENT]);
    const agent = new TestSpecialist(gw);
    await agent.execute(BASE_REQ);
    expect(gw.complete).toHaveBeenCalledWith(
      expect.objectContaining({
        responseFormat: expect.objectContaining({ type: 'json_schema' }),
        timeout_ms: 30_000,
      }),
    );
  });
});
