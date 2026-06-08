/**
 * Integration test — PRD-6 US-005 AC-8
 * acquisitionVideo.generate: nock Anthropic SDK + real DB history write + cost_log write
 * 默认 skip · 设 RUN_REAL_LLM=1 且有有效 LLM key 才真跑 (CI safe · cost controlled)
 *
 * Strategy:
 * - vi.mock '@/workers/llm-gateway/rate-limiter' → skip rate limit check
 * - vi.mock '@/services/context-assembler/ContextAssembler' → fixed context (no DB read)
 * - nock.disableNetConnect() + nock intercept /v1/messages (VideoAgent uses complete())
 * - Real test DB: history.create + cost_log.create (via BaseSpecialist) + findFirst double-guard
 * - End-to-end: acquisitionVideoRouter.createCaller(ctx).generate(input) < 5s
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import nock from 'nock';
import { prisma } from '@/lib/prisma';

// ── Mocks (rate-limiter + contextAssembler only, NOT llmGateway) ──────────────

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
      systemPrompt: 'You are a video acquisition specialist. Return JSON.',
      userPrompt: '获客视频：引流私域社群',
      tools: [],
      metadata: { contextTokens: 60, layersUsed: ['L2'], ragHits: [] },
    }),
    assembleStep: vi.fn(),
  },
}));

// ── Router import (after mocks) ───────────────────────────────────────────────

import { acquisitionVideoRouter } from '@/trpc/routers/app/acquisitionVideo';

// ── Mock Anthropic response fixture ──────────────────────────────────────────

const MOCK_ACQUISITION_OUTPUT = {
  script:
    '你是否曾经遇到这个问题？每天花大量时间做内容，但粉丝增长却停滞不前？今天分享一个经过验证的方法，帮助你快速突破瓶颈，实现精准涨粉。关注我，私信发送「资料」即可免费获取详细方案。我们已帮助数百位创作者从 0 到 10 万粉丝，现在这个机会也属于你。',
  cta: '立即关注并私信发送「获取资料」领取免费方案',
  conversionPath: '视频引流→关注账号→私信咨询→社群成交',
  keyMessages: ['经过验证的精准涨粉方法', '针对创作者的专属方案', '免费获取详细资料'],
};

const ANTHROPIC_API = 'https://api.anthropic.com';

function mockAnthropicAcquisitionResponse(): void {
  nock(ANTHROPIC_API)
    .post('/v1/messages')
    .reply(200, {
      id: 'msg_nock_acquisition_005',
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'tool_use',
          id: 'tool_acq_005',
          name: 'structured_output',
          input: MOCK_ACQUISITION_OUTPUT,
        },
      ],
      model: 'claude-sonnet-4-6',
      stop_reason: 'tool_use',
      usage: { input_tokens: 200, output_tokens: 480 },
    });
}

// ── Test fixtures ─────────────────────────────────────────────────────────────

let testAccountId = 0;
let testUserId = 0;
let testTraceId = '';

async function createTestFixtures(): Promise<void> {
  const user = await prisma.user.create({
    data: {
      openId: `test-acq-video-llm-${Date.now()}`,
      name: 'Test AcquisitionVideo LLM User',
      email: `acq-video-llm-${Date.now()}@test.internal`,
      loginMethod: 'google',
    },
  });
  const account = await prisma.ipAccount.create({
    data: {
      userId: user.id,
      name: 'Test AcquisitionVideo Account',
      industry: '知识付费',
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
  process.env.ANTHROPIC_API_KEY = 'sk-ant-nock-acq-video-test';
  process.env.OPENAI_API_KEY = 'sk-openai-nock-acq-video-test';
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
  testTraceId = `tr_acq_video_int_${Date.now()}`;
});

// ── Integration test (skipped unless RUN_REAL_LLM=1) ─────────────────────────

const skipRealLlm = process.env.RUN_REAL_LLM !== '1';

describe.skipIf(skipRealLlm)('US-005 AC-8: acquisitionVideo.generate integration — nock Anthropic SDK + real DB', () => {
  it('generate: nock intercepts Anthropic call, writes history + cost_log to real DB, ctaScript contains CTA keyword, < 5s', async () => {
    mockAnthropicAcquisitionResponse();

    const ctx = {
      traceId: testTraceId,
      activeAccountId: testAccountId,
      user: { id: testUserId, activeAccountId: testAccountId },
      prisma,
      req: new Request('http://localhost', { headers: { 'x-trace-id': testTraceId } }),
      sessionId: `int-sess-acq-005-${Date.now()}`,
    };

    const caller = acquisitionVideoRouter.createCaller(ctx);
    const start = Date.now();

    const result = await caller.generate({
      sourceCopy:
        '针对想要涨粉但不知道方法的内容创作者，分享经过验证的精准涨粉策略，帮助快速突破瓶颈。',
      conversionGoal: '引流私域社群完成成交',
      platform: 'douyin',
      duration: '60s',
    });

    const elapsed = Date.now() - start;

    // AC-8: 总耗时 < 5s
    expect(elapsed).toBeLessThan(5000);

    // nock interceptor was consumed (real Anthropic HTTP call was intercepted)
    expect(nock.isDone()).toBe(true);

    // Result fields
    expect(result.agentId).toBe('VideoAgent');
    expect(result.agentMode).toBe('acquisition');
    expect(result.contentType).toBe('json');
    expect(result.isFallback).toBe(false);
    expect(result.traceId).toBe(testTraceId);
    expect(result.id).toBeGreaterThan(0);

    // AC-4: ctaScript maps from cta, contains CTA keyword
    const parsed = JSON.parse(result.content) as {
      script: string;
      ctaScript: string;
      conversionPath: string;
      keyMessages: string[];
    };
    expect(parsed.ctaScript).toBeDefined();
    expect(/关注|私信|点击|获取|领取/.test(parsed.ctaScript)).toBe(true);
    expect(parsed.conversionPath).toBeDefined();
    expect(parsed.keyMessages).toHaveLength(3);

    // Tokens tracked
    expect(result.tokensUsed).toBeGreaterThan(0);
    expect(result.modelUsed).toBe('claude-sonnet-4-6');

    // history written to real DB
    const historyRow = await prisma.history.findFirst({
      where: { traceId: testTraceId, agentId: 'VideoAgent', agentMode: 'acquisition' },
    });
    expect(historyRow).not.toBeNull();
    expect(historyRow?.contentType).toBe('json');
    expect(historyRow?.accountId).toBe(testAccountId);

    // cost_log written to real DB by BaseSpecialist
    const costRow = await prisma.costLog.findFirst({ where: { traceId: testTraceId } });
    expect(costRow).not.toBeNull();
    expect(costRow?.callType).toBe('specialist_call');
    expect(costRow?.agentId).toBe('VideoAgent');
    expect(costRow?.promptTokens).toBe(200);
    expect(costRow?.completionTokens).toBe(480);
    expect(costRow?.durationMs).toBeGreaterThan(0);
  });
});
