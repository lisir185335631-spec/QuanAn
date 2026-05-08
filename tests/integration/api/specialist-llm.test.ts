/**
 * Integration test — PRD-4 US-003
 * AC-10: 真调 LLMGateway nock SDK · cost_log 真写 DB · 查 SQL 返回数据
 *
 * Uses nock to intercept Anthropic HTTP (tool_use json_schema mode).
 * Does NOT mock prisma — cost_log is written to the real test DB.
 * Mocks: rate-limiter (no Redis in CI), contextAssembler (focus on LLM+DB path).
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { z } from 'zod';
import nock from 'nock';
import { prisma } from '@/lib/prisma';
import { BaseSpecialist } from '@/specialists/base/BaseSpecialist';
import type {
  SpecialistConfig,
  SpecialistRequest,
  InvokeLLMResult,
  AssembledContext,
} from '@/specialists/base/types';

// ── Mocks (rate-limiter + contextAssembler only) ──────────────────────────────

vi.mock('@/workers/llm-gateway/rate-limiter', () => ({
  checkRateLimit: vi.fn(async () => undefined),
  RateLimitError: class extends Error {
    readonly code = 'RATE_LIMIT_EXCEEDED' as const;
    constructor(public readonly userId: number) {
      super(`Rate limit for user ${userId}`);
    }
  },
}));

vi.mock('@/services/context-assembler/ContextAssembler', () => ({
  contextAssembler: {
    assemble: vi.fn().mockResolvedValue({
      systemPrompt: 'You are a positioning specialist. Return JSON.',
      userPrompt: 'Position this niche: 宠物博主',
      tools: [],
      metadata: { contextTokens: 50, layersUsed: ['L2'], ragHits: [] },
    }),
    assembleStep: vi.fn(),
  },
}));

// ── Concrete specialist for test ──────────────────────────────────────────────

const OutputSchema = z.object({ positioning: z.string().min(1) });
type TOut = z.infer<typeof OutputSchema>;

class IntegrationSpecialist extends BaseSpecialist<{ topic: string }, TOut> {
  readonly config: SpecialistConfig = {
    agentId: 'PositioningAgent',
    persona: { role: '定位师', goal: '找赛道', boundaries: [] },
    memory: { l1_readonly: ['account'], l2_read: [], l2_write: [] },
    knowledge: { constants: [], rag: [], refresh_interval_sec: 600 },
    tools: ['llm.complete'],
    execution: { timeout_ms: 30_000, retry: 1, model_tier: 'reasoning', streaming: false },
  };
  readonly inputSchema = z.object({ topic: z.string().min(1) });
  readonly outputSchema = OutputSchema;

  protected async invokeLLM(
    ctx: AssembledContext,
    req: SpecialistRequest<{ topic: string }>,
  ): Promise<InvokeLLMResult> {
    return this.llmGateway.complete({
      model_tier: this.config.execution.model_tier,
      systemPrompt: ctx.systemPrompt,
      userPrompt: ctx.userPrompt,
      responseFormat: { type: 'json_schema', schema: this.outputSchema },
      metadata: {
        trace_id: req.traceId ?? `tr_${req.accountId}_test`,
        agentId: this.config.agentId,
        accountId: req.accountId,
        userId: 0,
      },
      timeout_ms: this.config.execution.timeout_ms,
    });
  }
}

// ── Test fixtures ─────────────────────────────────────────────────────────────

let testAccountId = 0;

async function createTestFixtures(): Promise<void> {
  // Insert test user + account to satisfy FK constraints on cost_log
  const user = await prisma.user.create({
    data: {
      openId: `test-specialist-llm-${Date.now()}`,
      name: 'Test Specialist User',
      email: `specialist-llm-${Date.now()}@test.internal`,
      loginMethod: 'google',
    },
  });
  const account = await prisma.ipAccount.create({
    data: {
      userId: user.id,
      name: 'Test Account',
      industry: '宠物',
      platform: 'douyin',
    },
  });
  testAccountId = account.id;
}

async function cleanupTestFixtures(): Promise<void> {
  await prisma.costLog.deleteMany({ where: { traceId: { startsWith: 'tr_specialist_int_' } } });
  if (testAccountId) {
    const account = await prisma.ipAccount.findUnique({ where: { id: testAccountId } });
    if (account) {
      await prisma.ipAccount.delete({ where: { id: testAccountId } });
      await prisma.user.delete({ where: { id: account.userId } });
    }
  }
}

// ── nock setup ────────────────────────────────────────────────────────────────

const ANTHROPIC_API = 'https://api.anthropic.com';

function mockAnthropicToolResponse(positioning: string): void {
  nock(ANTHROPIC_API)
    .post('/v1/messages')
    .reply(200, {
      id: 'msg_nock_specialist_001',
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'tool_use',
          id: 'tool_001',
          name: 'structured_output',
          input: { positioning },
        },
      ],
      model: 'claude-sonnet-4-6',
      stop_reason: 'tool_use',
      usage: { input_tokens: 80, output_tokens: 30 },
    });
}

beforeAll(async () => {
  nock.disableNetConnect();
  process.env.ANTHROPIC_API_KEY = 'sk-ant-nock-specialist-test';
  process.env.OPENAI_API_KEY = 'sk-openai-nock-specialist-test';
  await createTestFixtures();
});

afterAll(async () => {
  nock.enableNetConnect();
  nock.cleanAll();
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.OPENAI_API_KEY;
  await cleanupTestFixtures();
});

beforeEach(() => {
  nock.cleanAll();
});

// ── Integration test ──────────────────────────────────────────────────────────

describe('US-003 AC-10: specialist integration — nock LLM + real DB cost_log', () => {
  it('execute() calls Anthropic tool_use, returns valid result, writes cost_log to DB', async () => {
    const traceId = `tr_specialist_int_${Date.now()}`;
    mockAnthropicToolResponse('宠物博主·专注猫粮科普');

    const agent = new IntegrationSpecialist();
    const result = await agent.execute({
      accountId: testAccountId,
      userInput: { topic: '宠物博主' },
      traceId,
      stepKey: 'step_1_positioning',
    });

    // AC-2: result has valid structured output
    expect(result.result).toMatchObject({ positioning: '宠物博主·专注猫粮科普' });
    expect(result.isFallback).toBe(false);
    expect(result.traceId).toBe(traceId);
    expect(nock.isDone()).toBe(true);

    // AC-4/AC-10: cost_log was written to real DB with correct fields
    const row = await prisma.costLog.findFirst({ where: { traceId } });
    expect(row).not.toBeNull();
    expect(row?.callType).toBe('specialist_call');
    expect(row?.agentId).toBe('PositioningAgent');
    expect(row?.promptTokens).toBe(80);
    expect(row?.completionTokens).toBe(30);
    expect(row?.durationMs).toBeGreaterThan(0);
    // target jsonb field
    const target = row?.target as { stepKey: string; agentId: string } | null;
    expect(target?.agentId).toBe('PositioningAgent');
    expect(target?.stepKey).toBe('step_1_positioning');
  });
});
