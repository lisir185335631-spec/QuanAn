/**
 * Integration test — PRD-6 US-012 AC-11
 * copywriting.acquisitionGenerate: nock SDK + 真 DB cost_log 查 SQL + history 写入完整字段验证
 *
 * Strategy:
 * - vi.mock '@/workers/llm-gateway' → provide mock stream yielding valid acquisition-mode JSON
 * - vi.mock '@/services/context-assembler/ContextAssembler' → fixed context (no DB read)
 * - vi.mock '@/workers/llm-gateway/rate-limiter' → skip rate limit check
 * - nock.disableNetConnect() as safety net (real Anthropic API must NOT be called)
 * - Real test DB: history.create + cost_log.create via real prisma
 * - Verify history fields + cost_log via SQL after the call
 * - CTA check: markdown must contain 关注|私信|点击|获取|领取
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import nock from 'nock';
import { prisma } from '@/lib/prisma';

// ── Shared mock acquisition-mode output ───────────────────────────────────────

// markdown must be 200-500 chars and contain CTA keyword to pass CopywritingAcquisitionOutputSchema
const INTEGRATION_ACQUISITION_MARKDOWN =
  '理财小白如何用一套方法实现年收益 20%？\n\n' +
  '很多人每天辛苦工作，却不知道钱放在哪里才能稳定增值，这不是努力程度的问题，而是缺乏一套可复制的底层理财框架，导致钱始终在低效配置中慢慢贬值，时间成本极高。\n\n' +
  '今天分享一套经过实战验证的三阶段理财路径：先建立 3-6 个月应急资金；再用闲钱做低波动的指数基金定投；最后将余裕资金配置成长性资产，让钱为你工作，而不是你永远为钱工作。\n\n' +
  '关注我，每周分享一个可落地的理财技巧，帮你建立属于自己的财富增长飞轮。';

const INTEGRATION_ACQUISITION_JSON = JSON.stringify({
  markdown: INTEGRATION_ACQUISITION_MARKDOWN,
  metadata: {
    ctaPosition: '结尾关注引导',
    conversionGoal: '关注公众号',
  },
});

// ── Mocks (must be defined before imports that use them) ──────────────────────

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
      systemPrompt: 'You are a copywriting specialist. Return JSON.',
      userPrompt: '生成获客文案',
      tools: [],
      metadata: { contextTokens: 50, layersUsed: ['L2'], ragHits: [] },
    }),
    assembleStep: vi.fn(),
  },
}));

// Mock the LLM gateway to provide streaming chunks with valid acquisition-mode JSON
vi.mock('@/workers/llm-gateway', () => {
  async function* mockStream(_req: { metadata: { trace_id: string } }) {
    yield { type: 'meta' as const, meta: { model: 'claude-sonnet-4-6' } };
    yield { type: 'delta' as const, delta: INTEGRATION_ACQUISITION_JSON };
    yield {
      type: 'done' as const,
      tokens: { prompt: 130, completion: 290, total: 420 },
      duration_ms: 900,
    };
  }

  return {
    llmGateway: {
      stream: mockStream,
      complete: vi.fn().mockRejectedValue(new Error('complete() not used in streaming specialist')),
      embed: vi.fn().mockResolvedValue(new Array(1536).fill(0)),
    },
  };
});

// Import router AFTER mocks
import { copywritingRouter } from '@/trpc/routers/copywriting';

// ── Test fixtures ─────────────────────────────────────────────────────────────

let testAccountId = 0;
let testUserId = 0;
let testTraceId = '';

async function createTestFixtures(): Promise<void> {
  const user = await prisma.user.create({
    data: {
      openId: `test-copywriting-acq-llm-${Date.now()}`,
      name: 'Test CopyAcq User',
      email: `copywriting-acq-llm-${Date.now()}@test.internal`,
      loginMethod: 'google',
    },
  });
  const account = await prisma.ipAccount.create({
    data: {
      userId: user.id,
      name: 'Test CopyAcq Account',
      industry: '金融',
      platform: 'douyin',
    },
  });
  testAccountId = account.id;
  testUserId = user.id;
}

async function cleanupTestFixtures(): Promise<void> {
  if (testTraceId) {
    await prisma.history.deleteMany({ where: { traceId: testTraceId } });
    await prisma.costLog.deleteMany({ where: { traceId: testTraceId } });
  }
  if (testAccountId) {
    const account = await prisma.ipAccount.findUnique({ where: { id: testAccountId } });
    if (account) {
      await prisma.ipAccount.delete({ where: { id: testAccountId } });
      await prisma.user.delete({ where: { id: account.userId } });
    }
  }
}

beforeAll(async () => {
  nock.disableNetConnect();
  process.env.ANTHROPIC_API_KEY = 'sk-ant-nock-copywriting-acq-test';
  process.env.OPENAI_API_KEY = 'sk-openai-nock-copywriting-acq-test';
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
  testTraceId = `tr_copyacq_int_${Date.now()}`;
});

// ── Integration test ──────────────────────────────────────────────────────────

describe('US-012 AC-11: copywriting.acquisitionGenerate integration — nock SDK + real DB', () => {
  it('acquisitionGenerate: calls mock stream, writes history + cost_log to real DB with correct fields', async () => {
    const ctx = {
      traceId: testTraceId,
      activeAccountId: testAccountId,
      user: { id: testUserId, activeAccountId: testAccountId },
      prisma,
      req: new Request('http://localhost', { headers: { 'x-trace-id': testTraceId } }),
      sessionId: 'int-sess-012',
    };

    const caller = copywritingRouter.createCaller(ctx);
    const result = await caller.acquisitionGenerate({
      scriptType: 'tutorial',
      elements: ['greed', 'curiosity'],
      conversionGoal: '关注公众号',
      topic: '理财',
    });

    // ── Verify returned row ───────────────────────────────────────────────────

    expect(result.agentId).toBe('CopywritingAgent');
    expect(result.agentMode).toBe('acquisition');
    expect(result.contentType).toBe('markdown');
    expect(result.scriptType).toBe('tutorial');
    expect(result.elements).toContain('greed');
    expect(result.isFallback).toBe(false);
    expect(result.tokensUsed).toBe(420);
    expect(result.modelUsed).toBe('claude-sonnet-4-6');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.content).toBe(INTEGRATION_ACQUISITION_MARKDOWN);

    // AC-4: CTA keyword present in output
    expect(/关注|私信|点击|获取|领取/.test(result.content)).toBe(true);

    // ── Verify history row in real DB ─────────────────────────────────────────

    const historyRow = await prisma.history.findFirst({
      where: { traceId: testTraceId, agentId: 'CopywritingAgent' },
    });
    expect(historyRow).not.toBeNull();
    expect(historyRow?.accountId).toBe(testAccountId);
    expect(historyRow?.agentMode).toBe('acquisition');
    expect(historyRow?.contentType).toBe('markdown');
    expect(historyRow?.scriptType).toBe('tutorial');
    expect(historyRow?.elements).toEqual(expect.arrayContaining(['greed', 'curiosity']));
    expect(historyRow?.isFallback).toBe(false);
    expect(historyRow?.tokensUsed).toBe(420);
    expect(historyRow?.modelUsed).toBe('claude-sonnet-4-6');
    expect(historyRow?.inputSummary).toBe('理财');
    expect(historyRow?.content).toBe(INTEGRATION_ACQUISITION_MARKDOWN);

    // ── Verify cost_log in real DB (written by BaseSpecialist) ───────────────

    const costRow = await prisma.costLog.findFirst({
      where: { traceId: testTraceId },
    });
    expect(costRow).not.toBeNull();
    expect(costRow?.callType).toBe('specialist_call');
    expect(costRow?.agentId).toBe('CopywritingAgent');
    expect(costRow?.promptTokens).toBe(130);
    expect(costRow?.completionTokens).toBe(290);
    expect(costRow?.totalTokens).toBe(420);
    expect(costRow?.modelUsed).toBe('claude-sonnet-4-6');
    expect(costRow?.isFallback).toBe(false);
    expect(costRow?.durationMs).toBeGreaterThanOrEqual(0);

    // Verify nock had no pending interceptors (no real HTTP was made)
    expect(nock.pendingMocks()).toHaveLength(0);
  }, 5000);
});
