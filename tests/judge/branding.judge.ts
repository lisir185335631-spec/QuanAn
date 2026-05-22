/**
 * QuanAn · US-016 · BrandingAgent LLM Judge
 * AC-2: golden case — packaging mode / 美妆行业 / xiaohongshu
 * AC-10: real scenario input
 * AC-11: quantifiable criteria
 */

import { describe, it, expect, vi } from 'vitest';
import { runJudge, PASS_SCORE_THRESHOLD } from './judge-runner';
import type { JudgeCase } from './judge-runner';

// ── Mocks ─────────────────────────────────────────────────────────────────────

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

describe.skipIf(!process.env.ANTHROPIC_API_KEY)('BrandingAgent LLM Judge — packaging/beauty/xiaohongshu golden case', () => {

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

});
