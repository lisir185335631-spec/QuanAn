/**
 * PRD-25 US-007 AC-10 · PositioningAgent recommend mode unit tests
 * ≥ 3 cases · mock LLMGateway
 * (a) recommend mode: outputSchema 严守 {platform, followersRange, ipPositioning, rationale}
 * (b) recommend mode: uses model_tier='lightweight' and timeout=15000
 * (c) invalid mode throws
 * (d) fallback template for recommend mode exists
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  PositioningAgent,
  RecommendOutputSchema,
} from '../PositioningAgent';

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const { mockComplete } = vi.hoisted(() => ({
  mockComplete: vi.fn(),
}));

vi.mock('@/workers/llm-gateway', () => ({
  llmGateway: { complete: mockComplete },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    stepData: { findMany: vi.fn().mockResolvedValue([]) },
    userQuota: { findUnique: vi.fn().mockResolvedValue(null) },
    costLog: { create: vi.fn().mockResolvedValue({ id: 1 }) },
  },
}));

vi.mock('@/memory/l4-profile', () => ({
  getLatestInsight: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/workers/rag', () => ({
  ragRetrieveWorker: { retrieve: vi.fn().mockResolvedValue([]) },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── Test suite ─────────────────────────────────────────────────────────────────

const VALID_RECOMMEND_RESULT = {
  platform: 'douyin',
  followersRange: '0-1k',
  ipPositioning: '企业服务领域知识博主，专注于分享中小企业经营干货',
  rationale: '抖音是目前覆盖面最广的短视频平台，企业服务类内容受众广泛，0-1k粉丝阶段适合深耕垂直内容，通过持续输出企业经营干货快速积累精准用户，建立账号权威性。建议从老板最常见的5个经营痛点切入。',
};

describe('PositioningAgent recommend mode', () => {
  const TEST_ACCOUNT_ID = 9999;

  beforeEach(() => {
    mockComplete.mockResolvedValue({
      content: VALID_RECOMMEND_RESULT,
      tokens: { prompt: 400, completion: 200, total: 600 },
      model: 'claude-haiku-4-5',
    });
  });

  it('(a) recommend mode: execute 成功返回 {platform, followersRange, ipPositioning, rationale}', async () => {
    const agent = new PositioningAgent();
    const res = await agent.execute({
      accountId: TEST_ACCOUNT_ID,
      userId: 1,
      mode: 'recommend',
      userInput: { industry: '企业服务' },
    });
    expect(res.result).toMatchObject({
      platform: expect.stringMatching(/^(douyin|xiaohongshu|kuaishou)$/),
      followersRange: expect.any(String),
      ipPositioning: expect.any(String),
      rationale: expect.any(String),
    });
  });

  it('(b) recommend mode: llmGateway.complete 被调用时使用 model_tier="lightweight" + timeout_ms=15000', async () => {
    const agent = new PositioningAgent();
    await agent.execute({
      accountId: TEST_ACCOUNT_ID,
      userId: 1,
      mode: 'recommend',
      userInput: { industry: '美妆' },
    });
    expect(mockComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        model_tier: 'lightweight',
        timeout_ms: 15_000,
      }),
    );
  });

  it('(c) invalid mode throws Error', async () => {
    const agent = new PositioningAgent();
    await expect(
      agent.execute({
        accountId: TEST_ACCOUNT_ID,
      userId: 1,
        mode: 'invalid_mode',
        userInput: { industry: '美妆' },
      }),
    ).rejects.toThrow(/invalid mode/);
  });

  it('(d) fallback template for recommend mode 存在且字段完整', () => {
    const fallback = PositioningAgent.fallbackTemplate.recommend;
    expect(fallback).toBeDefined();
    expect(fallback.platform).toBe('douyin');
    expect(fallback.followersRange).toBe('0-1k');
    expect(typeof fallback.ipPositioning).toBe('string');
    expect(typeof fallback.rationale).toBe('string');
    expect(fallback.rationale.length).toBeGreaterThan(50);
  });

  it('(e) RecommendOutputSchema 严守字段名 {platform, followersRange, ipPositioning, rationale}', () => {
    const valid = RecommendOutputSchema.safeParse(VALID_RECOMMEND_RESULT);
    expect(valid.success).toBe(true);

    // Wrong platform should fail
    const invalid = RecommendOutputSchema.safeParse({ ...VALID_RECOMMEND_RESULT, platform: 'tiktok' });
    expect(invalid.success).toBe(false);
  });
});

// ── Issue-1 regression: lastIndustrySub field injection ───────────────────────
// Verifies that userInput.lastIndustrySub (Step1InputSchema field) is correctly
// picked up and injected as '[子行业上下文]' in the industry-mode user prompt.
// Prior bug: code read userInput['industrySub'] (wrong key) → context never injected.

describe('PositioningAgent industry mode — sub-industry context injection', () => {
  const VALID_INDUSTRY_RESULT = {
    industry: '美妆',
    marketAnalysis:
      '美妆护肤细分赛道竞争激烈，但国货美妆近年来凭借成分透明化与性价比快速崛起，精准定位高性价比成分党用户仍有较大增量空间。',
    competitionLevel: 'high' as const,
    recommendation:
      '建议深耕"成分党"细分人群，以产品成分科普为切入口，结合真实测评建立差异化内容矩阵，快速积累精准粉丝群体。',
  };

  beforeEach(() => {
    mockComplete.mockResolvedValue({
      content: VALID_INDUSTRY_RESULT,
      tokens: { prompt: 300, completion: 150, total: 450 },
      model: 'claude-haiku-4-5',
    });
  });

  it('(f) lastIndustrySub in userInput → prompt contains [子行业上下文] and sub-industry value', async () => {
    const agent = new PositioningAgent();
    await agent.execute({
      accountId: 9999,
      userId: 1,
      mode: 'industry',
      userInput: {
        lastIndustry: '美妆',
        lastIndustryCategory: '护肤',
        lastIndustrySub: '成分党护肤',
      },
    });

    expect(mockComplete).toHaveBeenCalled();
    // Check the first call's userPrompt (industry mode sends exactly one LLM request when schema passes)
    const callArg = mockComplete.mock.calls.find(
      (c) => (c[0] as { userPrompt?: string }).userPrompt?.includes('[行业定位分析任务]'),
    );
    expect(callArg).toBeDefined();
    const prompt = (callArg![0] as { userPrompt: string }).userPrompt;
    expect(prompt).toContain('[子行业上下文]');
    expect(prompt).toContain('成分党护肤');
  });
});
