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

// ── Shared mock boom-mode output (5 candidates · each ≥ 200 chars) ─────────────

// Each candidate must be ≥200 chars to pass BoomOutputSchema z.string().min(200)
const _CAND_SUFFIX =
  '\n\n好的爆款内容并非偶然，它一定在开场 5 秒内触发了某种强烈的心理反应：恐惧、好奇、共鸣或冲突感。' +
  '掌握这些元素，你的内容就有更高概率被算法推给精准用户，完播率和互动率自然提升。' +
  '从今天开始，每次构思内容先选定 2-3 个核心元素设计开场钩子。关注账号，持续获取更多内容创作实战干货。';

const CAND1 =
  '候选1·痛点共鸣型\n\n你花了大量时间做内容，发布后却只有个位数播放？原因只有一个：你还没找到属于自己账号的内容节奏。从今天开始用这套方法，帮你快速打造爆款内容，积累真实粉丝，建立账号影响力。' +
  _CAND_SUFFIX;
const CAND2 =
  '候选2·数字冲击型\n\n90% 的创作者都犯了同一个错误——把太多精力放在画面制作上，却忽视了文案钩子的核心价值。开场 5 秒决定一切，掌握这个框架，你的完播率将提升 40% 以上。关注账号获取更多实战干货。' +
  _CAND_SUFFIX;
const CAND3 =
  '候选3·对比反差型\n\n同样的话题，有人发出来 10 万播放，有人发出来只有 100。区别不在平台，不在运气，只在开场那句话有没有触发情绪反应。今天教你如何设计出高转化钩子，让内容被更多精准用户看见。' +
  _CAND_SUFFIX;
const CAND4 =
  '候选4·好奇悬念型\n\n研究了 1000 条爆款内容，我发现它们都有一个共同结构：让用户在前 3 秒产生「我要知道答案」的冲动，然后用内容兑现这个承诺。点击关注，持续获取更多可直接套用的创作方法论。' +
  _CAND_SUFFIX;
const CAND5 =
  '候选5·权威背书型\n\n内容创作方法论研究表明：基于心理学元素设计的内容，完播率平均高出普通内容 40% 以上。今天教你如何把这套方法落地到自己的 IP 账号，快速建立内容竞争优势和账号影响力。' +
  _CAND_SUFFIX;

const INTEGRATION_BOOM_JSON = JSON.stringify({
  candidates: [CAND1, CAND2, CAND3, CAND4, CAND5],
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
