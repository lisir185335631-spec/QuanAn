/**
 * Integration test — PRD-5 US-007 AC-5
 * analysis.analyze: nock SDK + real DB history write + cost_log
 *
 * Strategy:
 * - vi.mock '@/workers/llm-gateway' → mock stream yields structural JSON
 * - vi.mock '@/services/context-assembler/ContextAssembler' → fixed context (no DB read)
 * - vi.mock '@/workers/llm-gateway/rate-limiter' → skip rate limit
 * - nock.disableNetConnect() safety net (real Anthropic API must NOT be called)
 * - Real test DB: history.create + cost_log.create (via BaseSpecialist module-level prisma)
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import nock from 'nock';
import { prisma } from '@/lib/prisma';

// ── Mock structural output (must satisfy analysisStructuralOutput schema) ──────

const INTEGRATION_STRUCTURAL_RESULT = {
  scores: {
    hook: 75,
    structure: 80,
    emotion: 65,
    specificity: 70,
    cta: 60,
    overall: 70,
  },
  optimizations: [
    {
      dimension: 'hook',
      issue: '开场钩子吸引力不足，缺乏具体数字或悬念设置',
      suggestion: '在第一句话中加入具体数字或反问句，如「90%的人都不知道...」',
    },
    {
      dimension: 'specificity',
      issue: '内容描述较为抽象，缺乏具体案例和数据支撑',
      suggestion: '用真实场景数据替换抽象描述，增加内容的可信度和画面感',
    },
    {
      dimension: 'cta',
      issue: '结尾行动引导不够明确，用户不知道下一步该做什么',
      suggestion: '在结尾明确说明希望用户采取的行动，如关注账号或私信获取资料',
    },
  ],
  rewriteSnippet:
    '这是优化后的关键段落示例，融入了更清晰的数字钩子与情绪共鸣元素，行动引导明确具体，建议参考此结构进行全文改写。',
  // analysisStructuralOutput schema requires elements/pros/cons (min(1) each)
  elements: ['好奇心', '对比反差'],
  pros: ['开场节奏明快，前5秒有效抓住注意力'],
  cons: ['结尾行动引导力度不足，转化率偏低'],
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
      systemPrompt: 'You are an analysis specialist. Return JSON.',
      userPrompt: '分析这篇文案的结构',
      tools: [],
      metadata: { contextTokens: 60, layersUsed: ['L2'], ragHits: [] },
    }),
    assembleStep: vi.fn(),
  },
}));

vi.mock('@/workers/llm-gateway', () => {
  return {
    llmGateway: {
      // AnalysisAgent calls complete() (non-streaming) · returns parsed object as content
      complete: vi.fn(async () => ({
        content: INTEGRATION_STRUCTURAL_RESULT,
        model: 'claude-sonnet-4-6',
        tokens: { prompt: 150, completion: 280, total: 430 },
        duration_ms: 1200,
      })),
    },
  };
});

// ── Router import (after mocks are declared) ──────────────────────────────────

import { analysisRouter } from '@/trpc/routers/app/analysis';

// ── Test fixtures ─────────────────────────────────────────────────────────────

let testAccountId = 0;
let testUserId = 0;
let testTraceId = '';

async function createTestFixtures(): Promise<void> {
  const user = await prisma.user.create({
    data: {
      openId: `test-analysis-structural-llm-${Date.now()}`,
      name: 'Test Analysis User',
      email: `analysis-structural-llm-${Date.now()}@test.internal`,
      loginMethod: 'google',
    },
  });
  const account = await prisma.ipAccount.create({
    data: {
      userId: user.id,
      name: 'Test Analysis Account',
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
  process.env.ANTHROPIC_API_KEY = 'sk-ant-nock-analysis-structural-test';
  process.env.OPENAI_API_KEY = 'sk-openai-nock-analysis-structural-test';
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
  testTraceId = `tr_analysis_int_${Date.now()}`;
});

// ── Integration test ──────────────────────────────────────────────────────────

describe('US-007 AC-5: analysis.analyze integration — nock SDK + real DB', () => {
  it('analyze: calls mock LLM, writes 1 history row (contentType=json) + cost_log to real DB', async () => {
    const ctx = {
      traceId: testTraceId,
      activeAccountId: testAccountId,
      user: { id: testUserId, activeAccountId: testAccountId },
      prisma,
      req: new Request('http://localhost', { headers: { 'x-trace-id': testTraceId } }),
      sessionId: 'int-sess-analysis-007',
    };

    const caller = analysisRouter.createCaller(ctx);
    const result = await caller.analyze({
      copy: '这是一篇需要进行结构分析的用户文案内容，包含多个维度的信息，用于测试分析功能是否正常工作。',
    });

    // ── Verify returned row ───────────────────────────────────────────────────

    expect(result.agentId).toBe('AnalysisAgent');
    expect(result.agentMode).toBe('structural');
    expect(result.contentType).toBe('json');
    expect(result.scriptType).toBeNull();
    expect(result.elements).toEqual([]);
    expect(result.isFallback).toBe(false);
    expect(result.tokensUsed).toBeGreaterThan(0);
    expect(result.modelUsed).toBe('claude-sonnet-4-6');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);

    // content is valid JSON with scores + optimizations + rewriteSnippet
    const parsed = JSON.parse(result.content) as Record<string, unknown>;
    expect(parsed).toHaveProperty('scores');
    expect(parsed).toHaveProperty('optimizations');
    expect(parsed).toHaveProperty('rewriteSnippet');

    // ── Verify history row in real DB ─────────────────────────────────────────

    const historyRow = await prisma.history.findFirst({
      where: { traceId: testTraceId, agentId: 'AnalysisAgent' },
    });
    expect(historyRow).not.toBeNull();
    expect(historyRow?.accountId).toBe(testAccountId);
    expect(historyRow?.agentId).toBe('AnalysisAgent');
    expect(historyRow?.agentMode).toBe('structural');
    expect(historyRow?.contentType).toBe('json');
    expect(historyRow?.scriptType).toBeNull();
    expect(historyRow?.elements).toEqual([]);
    expect(historyRow?.isFallback).toBe(false);
    expect(historyRow?.tokensUsed).toBeGreaterThan(0);
    expect(historyRow?.modelUsed).toBe('claude-sonnet-4-6');

    // content must be parseable JSON
    expect(() => JSON.parse(historyRow?.content ?? '')).not.toThrow();
    const dbParsed = JSON.parse(historyRow?.content ?? '') as Record<string, unknown>;
    expect(dbParsed).toHaveProperty('scores');

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
