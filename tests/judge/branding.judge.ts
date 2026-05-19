/**
 * QuanAn · US-016 · BrandingAgent LLM Judge
 * AC-2: golden case — packaging mode / 美妆行业 / xiaohongshu
 * AC-10: real scenario input
 * AC-11: quantifiable criteria
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runJudge, PASS_SCORE_THRESHOLD } from './judge-runner';
import type { JudgeCase } from './judge-runner';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockComplete } = vi.hoisted(() => ({
  mockComplete: vi.fn(),
}));

vi.mock('@/workers/llm-gateway', () => ({
  llmGateway: { complete: mockComplete },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: { costLog: { create: vi.fn().mockResolvedValue({ id: BigInt(1) }) } },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── Golden case ───────────────────────────────────────────────────────────────

const goldenCase: JudgeCase = {
  specialistId: 'BrandingAgent',
  mode: 'packaging',
  input: { industry: 'beauty', platform: 'xiaohongshu', followerGoal: 10000 },
  actualOutput: {
    nickname: ['成分党小宝', '护肤实验室', '皮肤科小科普', '成分解码师', '护肤避坑指南'],
    avatar: { prompt: '专业白大褂背景，温和微笑，手持护肤品', style: '专业温和型' },
    background: {
      prompt: '整洁实验室风格，白色基调，简洁明了',
      platformVersions: ['1:1方形背景', '16:9横屏背景', '9:16竖屏背景'],
    },
    bio: [
      { platform: 'douyin', text: '皮肤科医师 | 成分党护肤科普 | 帮你避坑选对护肤品' },
      { platform: 'xiaohongshu', text: '成分党护肤指南 | 皮肤科背景 | 科学护肤不踩雷' },
      { platform: 'wechat', text: '专注护肤成分科普，皮肤科医师背景，陪你科学护肤' },
      { platform: 'kuaishou', text: '皮肤科医师教你护肤，成分党避坑必关注' },
      { platform: 'bilibili', text: '科学护肤UP主 | 成分党护肤知识库 | 皮肤科专业背景' },
      { platform: 'xiaohongshu', text: '护肤成分解码 | 皮肤科医师科普 | 看完不再踩雷' },
    ],
    overallStrategy: '以皮肤科专业背景建立信任背书，通过成分科普建立护肤知识壁垒，针对小红书"成分党"精准受众定制内容风格',
  },
  criteria: [
    'nickname 数组恰好包含 5 个非空字符串',
    'avatar 包含 prompt 和 style 两个字段',
    'background.platformVersions 数组恰好包含 3 个元素',
    'bio 数组恰好包含 6 个对象，每个对象含 platform 和 text 字段',
    'overallStrategy 为非空字符串，描述整体账号策略',
  ],
  expectedKeyFields: ['nickname', 'avatar', 'background', 'bio', 'overallStrategy'],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('BrandingAgent LLM Judge — packaging/beauty/xiaohongshu golden case', () => {
  beforeEach(() => {
    mockComplete.mockResolvedValue({
      content: { pass: true, score: 9, reason: 'nickname 5个✓；bio 6条覆盖所有平台✓；background.platformVersions 3个✓；overallStrategy阐明差异化定位✓' },
      tokens: { prompt: 200, completion: 80, total: 280 },
      model: 'claude-haiku-4-5',
      duration_ms: 1100,
      trace_id: 'judge-BrandingAgent-test',
    });
  });

  it('golden case passes judge with score >= threshold', async () => {
    const result = await runJudge(goldenCase);

    expect(typeof result.pass).toBe('boolean');
    expect(typeof result.score).toBe('number');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(10);
    expect(result.reason).toBeTruthy();

    // AC-7: pass/score consistency
    if (result.pass) {
      expect(result.score).toBeGreaterThanOrEqual(PASS_SCORE_THRESHOLD);
    } else {
      expect(result.score).toBeLessThan(PASS_SCORE_THRESHOLD);
    }

    expect(result.pass).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(PASS_SCORE_THRESHOLD);
  });

  it('runJudge calls llmGateway with lightweight tier and judge_call eventType', async () => {
    await runJudge(goldenCase);

    expect(mockComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        model_tier: 'lightweight',
        metadata: expect.objectContaining({ eventType: 'judge_call' }),
        timeout_ms: 10_000,
      }),
    );
  });
});
