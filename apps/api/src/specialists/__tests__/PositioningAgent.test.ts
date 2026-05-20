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
