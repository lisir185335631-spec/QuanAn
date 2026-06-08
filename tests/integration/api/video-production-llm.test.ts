/**
 * Integration test — PRD-6 US-003 AC-8
 * videoProduction.generate: nock Anthropic SDK + real DB history write + cost_log write
 * 默认 skip · 设 RUN_REAL_LLM=1 且有有效 LLM key 才真跑 (CI safe · cost controlled)
 *
 * Strategy:
 * - vi.mock '@/workers/llm-gateway/rate-limiter' → skip rate limit check
 * - vi.mock '@/services/context-assembler/ContextAssembler' → fixed context (no DB read)
 * - nock.disableNetConnect() + nock intercept /v1/messages (VideoAgent uses complete())
 * - Real test DB: history.create + cost_log.create (via BaseSpecialist) + findFirst double-guard
 * - End-to-end: videoProductionRouter.createCaller(ctx).generate(input) < 5s
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
      systemPrompt: 'You are a video production specialist. Return JSON.',
      userPrompt: '制作视频脚本：美妆博主产品推广',
      tools: [],
      metadata: { contextTokens: 60, layersUsed: ['L2'], ragHits: [] },
    }),
    assembleStep: vi.fn(),
  },
}));

// ── Router import (after mocks) ───────────────────────────────────────────────

import { videoProductionRouter } from '@/trpc/routers/app/videoProduction';

// ── Mock Anthropic response fixture ──────────────────────────────────────────

const MOCK_PRODUCTION_OUTPUT = {
  shotList: [
    {
      scene: '产品特写开场',
      duration: '5s',
      action: '镜头缓推产品，展示细节',
      dialogue: '无',
      cameraAngle: '近景推进',
      prop: '美妆产品',
      lighting: '三点布光：主光/补光/轮廓光',
      transition: '缓推',
      sfx: '无',
      voiceover: '今天为大家带来这款超好用的产品',
      subtitle: '开场字幕',
      costume: '与品牌调性一致',
      location: '摄影棚',
    },
    {
      scene: '使用效果展示',
      duration: '30s',
      action: '演示产品使用步骤，多角度展示效果',
      dialogue: '涂抹后肤感非常轻盈，完全不闷痘',
      cameraAngle: '近景+特写交替',
      prop: '化妆刷、产品本体',
      lighting: '柔光灯补光',
      transition: '跳切',
      sfx: '轻柔背景音乐',
      voiceover: '一款让皮肤水润透亮的神器',
      subtitle: '关键功效字幕',
      costume: '同开场',
      location: '同开场',
    },
    {
      scene: '结尾引导',
      duration: '5s',
      action: '面向镜头，引导关注和购买',
      dialogue: '觉得好用请点关注，购买链接在评论区',
      cameraAngle: '正面中景',
      prop: '无',
      lighting: '同开场',
      transition: '淡出',
      sfx: '结尾提示音',
      voiceover: '点赞收藏不迷路',
      subtitle: '关注获取优惠',
      costume: '同开场',
      location: '同开场',
    },
  ],
  equipment: ['专业相机或手机', '三脚架 + 稳定器', '三点布光套装', '收音麦克风', '反光板'],
  schedule: '建议在早上10-12点或下午14-16点拍摄，光线充足，预留2小时含调试',
};

const ANTHROPIC_API = 'https://api.anthropic.com';

function mockAnthropicProductionResponse(): void {
  nock(ANTHROPIC_API)
    .post('/v1/messages')
    .reply(200, {
      id: 'msg_nock_video_prod_003',
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'tool_use',
          id: 'tool_vp_003',
          name: 'structured_output',
          input: MOCK_PRODUCTION_OUTPUT,
        },
      ],
      model: 'claude-sonnet-4-6',
      stop_reason: 'tool_use',
      usage: { input_tokens: 180, output_tokens: 520 },
    });
}

// ── Test fixtures ─────────────────────────────────────────────────────────────

let testAccountId = 0;
let testUserId = 0;
let testTraceId = '';

async function createTestFixtures(): Promise<void> {
  const user = await prisma.user.create({
    data: {
      openId: `test-video-prod-llm-${Date.now()}`,
      name: 'Test VideoProduction LLM User',
      email: `video-prod-llm-${Date.now()}@test.internal`,
      loginMethod: 'google',
    },
  });
  const account = await prisma.ipAccount.create({
    data: {
      userId: user.id,
      name: 'Test VideoProduction Account',
      industry: '美妆',
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
  process.env.ANTHROPIC_API_KEY = 'sk-ant-nock-video-prod-test';
  process.env.OPENAI_API_KEY = 'sk-openai-nock-video-prod-test';
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
  testTraceId = `tr_video_prod_int_${Date.now()}`;
});

// ── Integration test (skipped unless RUN_REAL_LLM=1) ─────────────────────────

const skipRealLlm = process.env.RUN_REAL_LLM !== '1';

describe.skipIf(skipRealLlm)('US-003 AC-8: videoProduction.generate integration — nock Anthropic SDK + real DB', () => {
  it('generate: nock intercepts Anthropic call, writes history + cost_log to real DB, < 5s', async () => {
    mockAnthropicProductionResponse();

    const ctx = {
      traceId: testTraceId,
      activeAccountId: testAccountId,
      user: { id: testUserId, activeAccountId: testAccountId },
      prisma,
      req: new Request('http://localhost', { headers: { 'x-trace-id': testTraceId } }),
      sessionId: `int-sess-video-prod-003-${Date.now()}`,
    };

    const caller = videoProductionRouter.createCaller(ctx);
    const start = Date.now();

    const result = await caller.generate({
      sourceCopy: '这款美妆产品保湿效果极佳，适合干皮使用，轻盈不闷痘，持妆时间长达12小时。',
      videoType: 'short_form',
      duration: '60s',
    });

    const elapsed = Date.now() - start;

    // AC-8: 总耗时 < 5s
    expect(elapsed).toBeLessThan(5000);

    // nock interceptor was consumed (real Anthropic HTTP call was intercepted)
    expect(nock.isDone()).toBe(true);

    // Result fields
    expect(result.agentId).toBe('VideoAgent');
    expect(result.agentMode).toBe('production');
    expect(result.contentType).toBe('json');
    expect(result.isFallback).toBe(false);
    expect(result.traceId).toBe(testTraceId);
    expect(result.id).toBeGreaterThan(0);

    // content is valid JSON matching ProductionOutput
    const parsed = JSON.parse(result.content) as { shotList: unknown[]; equipment: string[]; schedule: string };
    expect(parsed.shotList).toHaveLength(3);
    expect(parsed.equipment).toContain('三脚架 + 稳定器');
    expect(parsed.schedule).toContain('建议');

    // Tokens tracked
    expect(result.tokensUsed).toBeGreaterThan(0);
    expect(result.modelUsed).toBe('claude-sonnet-4-6');

    // history written to real DB
    const historyRow = await prisma.history.findFirst({
      where: { traceId: testTraceId, agentId: 'VideoAgent', agentMode: 'production' },
    });
    expect(historyRow).not.toBeNull();
    expect(historyRow?.contentType).toBe('json');
    expect(historyRow?.accountId).toBe(testAccountId);

    // cost_log written to real DB by BaseSpecialist
    const costRow = await prisma.costLog.findFirst({ where: { traceId: testTraceId } });
    expect(costRow).not.toBeNull();
    expect(costRow?.callType).toBe('specialist_call');
    expect(costRow?.agentId).toBe('VideoAgent');
    expect(costRow?.promptTokens).toBe(180);
    expect(costRow?.completionTokens).toBe(520);
    expect(costRow?.durationMs).toBeGreaterThan(0);
  });
});
