/**
 * Integration test — PRD-5 US-003 AC-4
 * copywriting.freeGenerate: nock SDK + 真 DB cost_log 查 SQL + history 写入完整字段验证
 *
 * Strategy:
 * - vi.mock '@/workers/llm-gateway' → provide mock stream that yields valid free-mode JSON chunks
 * - vi.mock '@/services/context-assembler/ContextAssembler' → fixed context (no DB read)
 * - vi.mock '@/workers/llm-gateway/rate-limiter' → skip rate limit check
 * - nock.disableNetConnect() as safety net (real Anthropic API must NOT be called)
 * - Real test DB: history.create (via ctx.prisma = realPrisma) + cost_log.create (via BaseSpecialist module-level prisma)
 * - Verify history fields + cost_log via SQL after the call
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import nock from 'nock';
import { prisma } from '@/lib/prisma';

// ── Shared mock free-mode output ──────────────────────────────────────────────

// IMPORTANT: markdown must be >= 400 chars to pass CopywritingFreeOutputSchema validation
const INTEGRATION_FREE_MARKDOWN =
  '# 快速涨粉的三个核心技巧\n\n' +
  '你是否曾花了大量时间做内容，却发现播放量始终上不去？这背后往往只有一个原因：你还没找到属于自己账号的内容节奏与精准切入点，导致内容无法触达真正有需求的目标受众群体。\n\n' +
  '今天分享一套经过验证的爆款文案框架，适合各类型内容创作者直接套用，帮助你从 0 快速起步，建立稳定的内容输出节奏，逐步形成账号的独特内容风格和粉丝粘性。\n\n' +
  '第一步：锁定精准目标受众，让内容只对一类人说话，让他们觉得「这就是在说我」，才能触发真实的情感共鸣，提升完播率和互动数据，推动算法继续推流扩散。\n\n' +
  '第二步：用数字或具体场景在开场 5 秒内抓住注意力，开头一句话决定了 80% 的用户是否愿意继续看下去，好的钩子是爆款内容成功的第一道门槛，不可忽视。\n\n' +
  '第三步：结尾给出明确的行动引导，告诉用户下一步该做什么，不要让内容在高潮处戛然而止，完整的 CTA 能有效提升关注转化率和收藏行为，累积账号权重。\n\n' +
  '关注账号，每天分享一个可直接用的创作技巧，帮你少走弯路，快速建立内容影响力和账号竞争优势。';

const INTEGRATION_FREE_JSON = JSON.stringify({
  markdown: INTEGRATION_FREE_MARKDOWN,
  metadata: {
    scriptType: 'tutorial',
    elements: ['curiosity', 'contrast'],
    structureSummary: '钩子→痛点共鸣→三步框架→行动引导',
    estimatedDuration: '60-90 秒',
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
      userPrompt: '生成爆款文案',
      tools: [],
      metadata: { contextTokens: 50, layersUsed: ['L2'], ragHits: [] },
    }),
    assembleStep: vi.fn(),
  },
}));

// Mock the LLM gateway to provide streaming chunks with valid free-mode JSON
vi.mock('@/workers/llm-gateway', () => {
  async function* mockStream(req: { metadata: { trace_id: string } }) {
    yield { type: 'meta' as const, meta: { model: 'claude-sonnet-4-6' } };
    yield { type: 'delta' as const, delta: INTEGRATION_FREE_JSON };
    yield {
      type: 'done' as const,
      tokens: { prompt: 120, completion: 280, total: 400 },
      duration_ms: 800,
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

// Import router AFTER mocks (mocks are hoisted, but explicit ordering aids readability)
import { copywritingRouter } from '@/trpc/routers/app/copywriting';

// ── Test fixtures ─────────────────────────────────────────────────────────────

let testAccountId = 0;
let testUserId = 0;
let testTraceId = '';

async function createTestFixtures(): Promise<void> {
  const user = await prisma.user.create({
    data: {
      openId: `test-copywriting-free-llm-${Date.now()}`,
      name: 'Test CopyFree User',
      email: `copywriting-free-llm-${Date.now()}@test.internal`,
      loginMethod: 'google',
    },
  });
  const account = await prisma.ipAccount.create({
    data: {
      userId: user.id,
      name: 'Test CopyFree Account',
      industry: '教育',
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
  // Safety net: disable real HTTP connections
  nock.disableNetConnect();
  process.env.ANTHROPIC_API_KEY = 'sk-ant-nock-copywriting-free-test';
  process.env.OPENAI_API_KEY = 'sk-openai-nock-copywriting-free-test';
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
  testTraceId = `tr_copyfree_int_${Date.now()}`;
});

// ── Integration test ──────────────────────────────────────────────────────────

describe('US-003 AC-4: copywriting.freeGenerate integration — nock SDK + real DB', () => {
  it('freeGenerate: calls mock stream, writes history + cost_log to real DB with correct fields', async () => {
    // Build ctx with real prisma (accountIsolationMiddleware will run SET LOCAL ROLE + set_config)
    const ctx = {
      traceId: testTraceId,
      activeAccountId: testAccountId,
      user: { id: testUserId, activeAccountId: testAccountId },
      prisma,
      req: new Request('http://localhost', { headers: { 'x-trace-id': testTraceId } }),
      sessionId: 'int-sess-003',
    };

    const caller = copywritingRouter.createCaller(ctx);
    const result = await caller.freeGenerate({
      scriptType: 'tutorial',
      elements: ['curiosity', 'contrast'],
      topic: '如何快速涨粉 — 三步打造爆款内容框架',
    });

    // ── Verify returned row ───────────────────────────────────────────────────

    expect(result.agentId).toBe('CopywritingAgent');
    expect(result.agentMode).toBe('free');
    expect(result.contentType).toBe('markdown');
    expect(result.scriptType).toBe('tutorial');
    expect(result.elements).toContain('curiosity');
    expect(result.isFallback).toBe(false);
    expect(result.tokensUsed).toBe(400);
    expect(result.modelUsed).toBe('claude-sonnet-4-6');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.content).toBe(INTEGRATION_FREE_MARKDOWN);

    // ── Verify history row in real DB (SQL query) ─────────────────────────────

    const historyRow = await prisma.history.findFirst({
      where: { traceId: testTraceId, agentId: 'CopywritingAgent' },
    });
    expect(historyRow).not.toBeNull();
    expect(historyRow?.accountId).toBe(testAccountId);
    expect(historyRow?.agentMode).toBe('free');
    expect(historyRow?.contentType).toBe('markdown');
    expect(historyRow?.scriptType).toBe('tutorial');
    expect(historyRow?.elements).toEqual(expect.arrayContaining(['curiosity', 'contrast']));
    expect(historyRow?.isFallback).toBe(false);
    expect(historyRow?.tokensUsed).toBe(400);
    expect(historyRow?.modelUsed).toBe('claude-sonnet-4-6');
    expect(historyRow?.inputSummary).toBe('如何快速涨粉 — 三步打造爆款内容框架');
    expect(historyRow?.content).toBe(INTEGRATION_FREE_MARKDOWN);

    // ── Verify cost_log in real DB (written by BaseSpecialist) ───────────────

    const costRow = await prisma.costLog.findFirst({
      where: { traceId: testTraceId },
    });
    expect(costRow).not.toBeNull();
    expect(costRow?.callType).toBe('specialist_call');
    expect(costRow?.agentId).toBe('CopywritingAgent');
    expect(costRow?.promptTokens).toBe(120);
    expect(costRow?.completionTokens).toBe(280);
    expect(costRow?.totalTokens).toBe(400);
    expect(costRow?.modelUsed).toBe('claude-sonnet-4-6');
    expect(costRow?.isFallback).toBe(false);
    expect(costRow?.durationMs).toBeGreaterThanOrEqual(0);

    // Verify nock had no pending interceptors (no real HTTP was made)
    expect(nock.pendingMocks()).toHaveLength(0);
  });
});
