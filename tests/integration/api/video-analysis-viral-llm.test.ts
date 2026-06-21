/**
 * Integration test — PRD-5 US-009 AC-5
 * videoAnalysis.analyze: nock SDK + real DB history write + elements 字段验证
 *
 * Strategy:
 * - vi.mock '@/workers/llm-gateway' → mock complete() yields viral JSON
 * - vi.mock '@/services/context-assembler/ContextAssembler' → fixed context (no DB read)
 * - vi.mock '@/workers/llm-gateway/rate-limiter' → skip rate limit
 * - nock.disableNetConnect() safety net (real Anthropic API must NOT be called)
 * - Real test DB: history.create + cost_log.create (via BaseSpecialist module-level prisma)
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import nock from 'nock';
import { prisma } from '@/lib/prisma';

// ── Mock viral output (must satisfy analysisViralOutput schema) ───────────────

const INTEGRATION_VIRAL_RESULT = {
  analysis: {
    elements: ['curiosity', 'contrast', 'resonance'],
    structure: '钩子→痛点→案例→CTA',
    hookType: 'opening_5s',
    viralFormula: '好奇+反差→情绪共鸣→行动',
  },
  insights: [
    {
      element: 'curiosity',
      explanation: '标题制造信息缺口，触发用户「我要知道答案」的冲动，是驱动点击的核心心理机制。',
      impact: '高',
    },
    {
      element: 'contrast',
      explanation: '通过对比展现落差感，强化理想状态vs现实状态的感知，加深情绪共鸣效果。',
      impact: '高',
    },
    {
      element: 'resonance',
      explanation: '内容与目标用户日常经历高度重合，触发「说的就是我」的强烈认同感和转发欲。',
      impact: '中',
    },
  ],
  rewriteVersion:
    '这是基于爆款元素心理学重写的仿写版文案，融入了好奇心钩子、反差情绪和共鸣引导三个核心要素，完整呈现了一套高转化内容结构，建议参考优化自己的账号内容。',
  // analysisViralOutput schema requires viralStructure (PRD-37 US-P09 AC3)
  viralStructure: {
    hook: '标题制造信息缺口，前5秒触发强烈好奇心驱动点击',
    body: '对比手法展现落差感，结合真实案例强化情绪共鸣',
    cta: '关注账号获取更多爆款内容创作方法论',
  },
};

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
      systemPrompt: 'You are a viral analysis specialist. Return JSON.',
      userPrompt: '拆解这篇爆款文案',
      tools: [],
      metadata: { contextTokens: 70, layersUsed: ['L2'], ragHits: [] },
    }),
    assembleStep: vi.fn(),
  },
}));

vi.mock('@/workers/llm-gateway', () => {
  return {
    llmGateway: {
      // AnalysisAgent calls complete() (non-streaming) · returns parsed object as content
      complete: vi.fn(async () => ({
        content: INTEGRATION_VIRAL_RESULT,
        model: 'claude-sonnet-4-6',
        tokens: { prompt: 180, completion: 320, total: 500 },
        duration_ms: 1400,
      })),
    },
  };
});

// ── Router import (after mocks are declared) ──────────────────────────────────

import { videoAnalysisRouter } from '@/trpc/routers/app/videoAnalysis';

// ── Test fixtures ─────────────────────────────────────────────────────────────

let testAccountId = 0;
let testUserId = 0;
let testTraceId = '';

async function createTestFixtures(): Promise<void> {
  const user = await prisma.user.create({
    data: {
      openId: `test-video-analysis-viral-llm-${Date.now()}`,
      name: 'Test Video Analysis User',
      email: `video-analysis-viral-llm-${Date.now()}@test.internal`,
      loginMethod: 'google',
    },
  });
  const account = await prisma.ipAccount.create({
    data: {
      userId: user.id,
      name: 'Test Video Analysis Account',
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
  process.env.ANTHROPIC_API_KEY = 'sk-ant-nock-video-analysis-viral-test';
  process.env.OPENAI_API_KEY = 'sk-openai-nock-video-analysis-viral-test';
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
  testTraceId = `tr_video_viral_int_${Date.now()}`;
});

// ── Integration test ──────────────────────────────────────────────────────────

describe('US-009 AC-5: videoAnalysis.analyze integration — nock SDK + real DB + elements', () => {
  it('analyze: calls mock LLM, writes 1 history row (agentMode=viral, contentType=json) + cost_log + elements mapped from analysis.elements', async () => {
    const ctx = {
      traceId: testTraceId,
      activeAccountId: testAccountId,
      user: { id: testUserId, activeAccountId: testAccountId },
      prisma,
      req: new Request('http://localhost', { headers: { 'x-trace-id': testTraceId } }),
      sessionId: 'int-sess-video-009',
    };

    const caller = videoAnalysisRouter.createCaller(ctx);
    const result = await caller.analyze({
      lastCopy:
        '这是一篇用于测试爆款拆解分析的文案内容，包含超过十个字符的正文，用于验证 viral mode 分析功能是否正常工作。',
      lastTitle: '爆款文案拆解测试标题',
    });

    // ── Verify returned row ───────────────────────────────────────────────────

    expect(result.agentId).toBe('AnalysisAgent');
    expect(result.agentMode).toBe('viral');
    expect(result.contentType).toBe('json');
    expect(result.scriptType).toBeNull();
    expect(result.isFallback).toBe(false);
    expect(result.tokensUsed).toBeGreaterThan(0);
    expect(result.modelUsed).toBe('claude-sonnet-4-6');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);

    // AC-2: elements = analysis.elements from viral output
    expect(result.elements).toEqual(expect.arrayContaining(['curiosity', 'contrast', 'resonance']));
    expect(result.elements).toHaveLength(3);

    // content is valid JSON with analysis + insights + rewriteVersion
    const parsed = JSON.parse(result.content) as Record<string, unknown>;
    expect(parsed).toHaveProperty('analysis');
    expect(parsed).toHaveProperty('insights');
    expect(parsed).toHaveProperty('rewriteVersion');

    // ── Verify history row in real DB ─────────────────────────────────────────

    const historyRow = await prisma.history.findFirst({
      where: { traceId: testTraceId, agentId: 'AnalysisAgent' },
    });
    expect(historyRow).not.toBeNull();
    expect(historyRow?.accountId).toBe(testAccountId);
    expect(historyRow?.agentId).toBe('AnalysisAgent');
    expect(historyRow?.agentMode).toBe('viral');
    expect(historyRow?.contentType).toBe('json');
    expect(historyRow?.scriptType).toBeNull();
    expect(historyRow?.isFallback).toBe(false);
    expect(historyRow?.tokensUsed).toBeGreaterThan(0);
    expect(historyRow?.modelUsed).toBe('claude-sonnet-4-6');

    // elements: analysis.elements → history.elements (AC-2 · core assertion)
    expect(historyRow?.elements).toEqual(
      expect.arrayContaining(['curiosity', 'contrast', 'resonance']),
    );
    expect(historyRow?.elements).toHaveLength(3);

    // inputSummary: lastTitle used when provided
    expect(historyRow?.inputSummary).toBe('爆款文案拆解测试标题');

    // content must be parseable JSON with viral structure
    expect(() => JSON.parse(historyRow?.content ?? '')).not.toThrow();
    const dbParsed = JSON.parse(historyRow?.content ?? '') as Record<string, unknown>;
    expect(dbParsed).toHaveProperty('analysis');
    expect(dbParsed).toHaveProperty('insights');

    // ── Verify cost_log in real DB (written by BaseSpecialist) ───────────────

    const costRow = await prisma.costLog.findFirst({
      where: { traceId: testTraceId },
    });
    expect(costRow).not.toBeNull();
    expect(costRow?.callType).toBe('specialist_call');
    expect(costRow?.agentId).toBe('AnalysisAgent');
    expect(costRow?.promptTokens).toBeGreaterThan(0);
    expect(costRow?.completionTokens).toBeGreaterThan(0);
    expect(costRow?.totalTokens).toBeGreaterThan(0);
    expect(costRow?.modelUsed).toBe('claude-sonnet-4-6');
    expect(costRow?.isFallback).toBe(false);
    expect(costRow?.durationMs).toBeGreaterThanOrEqual(0);

    // No real HTTP calls
    expect(nock.pendingMocks()).toHaveLength(0);
  });
});
