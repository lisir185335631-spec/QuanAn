/**
 * Integration test — PRD-5 US-005 AC-3
 * boomGenerate.generate: nock SDK + 5 篇候选 → 1 行 history 含 '---' 分隔验证 + cost_log 写入
 *
 * Strategy:
 * - vi.mock '@/workers/llm-gateway' → mock stream yields 5-candidate boom JSON
 * - vi.mock '@/services/context-assembler/ContextAssembler' → fixed context (no DB read)
 * - vi.mock '@/workers/llm-gateway/rate-limiter' → skip rate limit
 * - nock.disableNetConnect() safety net (real Anthropic API must NOT be called)
 * - Real test DB: history.create + cost_log.create (via BaseSpecialist module-level prisma)
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import nock from 'nock';
import { prisma } from '@/lib/prisma';

// ── Shared mock boom-mode output (5 candidates · each as BoomCandidateSchema objects) ──

// Helper to create a valid BoomCandidate object (min lengths: title 6-80, fields min 40, reason min 20)
function makeBoomCandidate(n: number) {
  const pad = '，帮助创作者快速掌握爆款内容方法论，打造高影响力的 IP 账号。'.repeat(2);
  return {
    title: `候选${n}·爆款文案示例标题`,
    opening: `开场：这是候选${n}的开场钩子内容，吸引用户注意力` + pad,
    development: `展开：候选${n}的主体内容，深入展示核心价值` + pad,
    climax: `高潮：候选${n}的情绪爆发点，引发强烈共鸣` + pad,
    ending: `结尾：候选${n}的行动召唤，引导用户关注互动` + pad,
    reason: `推荐理由：候选${n}结合好奇心和对比反差，有效触发用户情绪反应`,
    indexScore: `${75 + n}`,
  };
}

const CAND1_OBJ = makeBoomCandidate(1);
const CAND2_OBJ = makeBoomCandidate(2);
const CAND3_OBJ = makeBoomCandidate(3);
const CAND4_OBJ = makeBoomCandidate(4);
const CAND5_OBJ = makeBoomCandidate(5);

const INTEGRATION_BOOM_JSON = JSON.stringify({
  candidates: [CAND1_OBJ, CAND2_OBJ, CAND3_OBJ, CAND4_OBJ, CAND5_OBJ],
  metadata: {
    count: 5,
    elements: ['curiosity', 'contrast'],
  },
});

// ── Mocks ─────────────────────────────────────────────────────────────────────

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
      systemPrompt: 'You are a boom copywriting specialist. Return JSON.',
      userPrompt: '生成5篇候选文案',
      tools: [],
      metadata: { contextTokens: 80, layersUsed: ['L2'], ragHits: [] },
    }),
    assembleStep: vi.fn(),
  },
}));

vi.mock('@/workers/llm-gateway', () => {
  async function* mockStream(_req: { metadata: { trace_id: string } }) {
    yield { type: 'meta' as const, meta: { model: 'claude-sonnet-4-6' } };
    yield { type: 'delta' as const, delta: INTEGRATION_BOOM_JSON };
    yield {
      type: 'done' as const,
      tokens: { prompt: 200, completion: 450, total: 650 },
      duration_ms: 1500,
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

import { boomGenerateRouter } from '@/trpc/routers/app/boomGenerate';

// ── Test fixtures ─────────────────────────────────────────────────────────────

let testAccountId = 0;
let testUserId = 0;
let testTraceId = '';

async function createTestFixtures(): Promise<void> {
  const user = await prisma.user.create({
    data: {
      openId: `test-boom-generate-llm-${Date.now()}`,
      name: 'Test Boom User',
      email: `boom-generate-llm-${Date.now()}@test.internal`,
      loginMethod: 'google',
    },
  });
  const account = await prisma.ipAccount.create({
    data: {
      userId: user.id,
      name: 'Test Boom Account',
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
  nock.disableNetConnect();
  process.env.ANTHROPIC_API_KEY = 'sk-ant-nock-boom-generate-test';
  process.env.OPENAI_API_KEY = 'sk-openai-nock-boom-generate-test';
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
  testTraceId = `tr_boom_int_${Date.now()}`;
});

// ── Integration test ──────────────────────────────────────────────────────────

describe('US-005 AC-3: boomGenerate.generate integration — nock SDK + real DB', () => {
  it('generate: calls mock stream, writes 1 history row with --- separator + cost_log to real DB', async () => {
    const ctx = {
      traceId: testTraceId,
      activeAccountId: testAccountId,
      user: { id: testUserId, activeAccountId: testAccountId },
      prisma,
      req: new Request('http://localhost', { headers: { 'x-trace-id': testTraceId } }),
      sessionId: 'int-sess-boom-005',
    };

    const caller = boomGenerateRouter.createCaller(ctx);
    const result = await caller.generate({
      elements: ['curiosity', 'contrast'],
      theme: '快速涨粉方法论',
      industry: '教育',
    });

    // ── Verify returned row ───────────────────────────────────────────────────

    expect(result.agentId).toBe('CopywritingAgent');
    expect(result.agentMode).toBe('boom');
    expect(result.contentType).toBe('markdown');
    expect(result.scriptType).toBeNull();
    expect(result.elements).toContain('curiosity');
    expect(result.isFallback).toBe(false);
    expect(result.tokensUsed).toBe(650);
    expect(result.modelUsed).toBe('claude-sonnet-4-6');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);

    // D-032: content contains '---' separator with exactly 5 parts
    expect(result.content).toContain('\n\n---\n\n');
    expect(result.content.split('\n\n---\n\n')).toHaveLength(5);

    // ── Verify history row in real DB ─────────────────────────────────────────

    const historyRow = await prisma.history.findFirst({
      where: { traceId: testTraceId, agentId: 'CopywritingAgent' },
    });
    expect(historyRow).not.toBeNull();
    expect(historyRow?.accountId).toBe(testAccountId);
    expect(historyRow?.agentMode).toBe('boom');
    expect(historyRow?.contentType).toBe('markdown');
    expect(historyRow?.scriptType).toBeNull();
    expect(historyRow?.elements).toEqual(expect.arrayContaining(['curiosity', 'contrast']));
    expect(historyRow?.isFallback).toBe(false);
    expect(historyRow?.tokensUsed).toBe(650);
    expect(historyRow?.modelUsed).toBe('claude-sonnet-4-6');
    expect(historyRow?.inputSummary).toBe('快速涨粉方法论');
    expect(historyRow?.content).toContain('\n\n---\n\n');
    expect(historyRow?.content.split('\n\n---\n\n')).toHaveLength(5);

    // ── Verify cost_log in real DB (written by BaseSpecialist) ───────────────

    const costRow = await prisma.costLog.findFirst({
      where: { traceId: testTraceId },
    });
    expect(costRow).not.toBeNull();
    expect(costRow?.callType).toBe('specialist_call');
    expect(costRow?.agentId).toBe('CopywritingAgent');
    expect(costRow?.promptTokens).toBe(200);
    expect(costRow?.completionTokens).toBe(450);
    expect(costRow?.totalTokens).toBe(650);
    expect(costRow?.modelUsed).toBe('claude-sonnet-4-6');
    expect(costRow?.isFallback).toBe(false);
    expect(costRow?.durationMs).toBeGreaterThanOrEqual(0);

    // No real HTTP calls
    expect(nock.pendingMocks()).toHaveLength(0);
  });
});
