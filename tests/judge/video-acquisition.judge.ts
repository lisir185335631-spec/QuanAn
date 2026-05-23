/**
 * QuanAn · US-014 · VideoAgent acquisition mode LLM Judge
 * AC-2: 2 golden cases — 理财 + 教育
 * criteria: ctaScript 必含 CTA 关键词 + conversionPath 长度 ≥1
 */

import { describe, expect, it, vi } from 'vitest';

import { PASS_SCORE_THRESHOLD, runJudge } from './judge-runner';
import type { JudgeCase } from './judge-runner';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/lib/prisma', () => ({
  prisma: { costLog: { create: vi.fn().mockResolvedValue({ id: BigInt(1) }) } },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── CTA keywords for validation ────────────────────────────────────────────────

const CTA_KEYWORDS = ['立即', '马上', '点击', '扫码', '关注', '免费', '限时', '加入', '领取', '咨询'];

function hasCTAKeyword(text: string): boolean {
  return CTA_KEYWORDS.some((kw) => text.includes(kw));
}

// ── Golden cases ──────────────────────────────────────────────────────────────

const goldenCaseFinance: JudgeCase = {
  specialistId: 'VideoAgent',
  mode: 'acquisition',
  input: { industry: '理财', platform: 'douyin', conversionGoal: '引流进入理财训练营', sourceCopy: '分享我从负债到年入百万的理财心路历程，3个关键认知彻底改变我的财务状况' },
  actualOutput: {
    script: '三年前我月薪5000，负债10万。今天我想告诉你，改变财务状况不需要运气，只需要3个认知。第一个认知：时间是最贵的资产，今天投入的1元钱，10年后值5元。第二个认知：不是赚更多，而是留住更多——消费管理才是核心。第三个认知：资产配置比选股重要，普通人跑赢通胀就算成功。',
    ctaScript: '想要系统学习这套理财方法？立即扫描下方二维码，免费加入理财训练营，限时100名名额已剩最后23席！',
    conversionPath: '视频引流→扫码→免费社群→付费训练营',
    keyMessages: ['时间复利改变财务', '消费管理比收入更重要', '资产配置普通人也能做'],
  },
  criteria: [
    'script 字段为非空字符串，长度 ≥ 100 字符',
    'ctaScript 包含明确的 CTA 行动词（立即/马上/点击/扫码/关注/免费/限时/加入/领取/咨询 之一）',
    'conversionPath 字符串长度 ≥ 1（转化路径非空）',
    'keyMessages 数组长度 ≥ 1',
  ],
  expectedKeyFields: ['script', 'ctaScript', 'conversionPath', 'keyMessages'],
};

const goldenCaseEducation: JudgeCase = {
  specialistId: 'VideoAgent',
  mode: 'acquisition',
  input: { industry: '教育', platform: 'xiaohongshu', conversionGoal: '招募英语口语训练课学员', sourceCopy: '35岁从英语小白到雅思7分，我用的方法90%的人都没试过' },
  actualOutput: {
    script: '我35岁开始学英语，第一次考雅思得了4.5分，很多人劝我放弃。但2年后我拿到了雅思7分。不是我天赋异禀，而是我找到了大脑记忆的规律——输入输出平衡法。传统学习只注重输入（背单词、刷题），但大脑需要通过输出才能真正记住。每天30分钟口语练习，3个月你会发现显著变化。',
    ctaScript: '马上点击主页链接，领取我独家整理的口语提升30天打卡计划，完全免费！已经有2000+学员在用了，先到先得！',
    conversionPath: '视频种草→主页链接→免费资料领取→付费课程转化',
    keyMessages: ['输入输出平衡法', '每天30分钟有效练习', '35岁也能学好英语'],
  },
  criteria: [
    'script 字段为非空字符串，长度 ≥ 100 字符',
    'ctaScript 包含明确的 CTA 行动词（立即/马上/点击/扫码/关注/免费/限时/加入/领取/咨询 之一）',
    'conversionPath 字符串长度 ≥ 1（转化路径非空）',
    'keyMessages 数组长度 ≥ 1',
  ],
  expectedKeyFields: ['script', 'ctaScript', 'conversionPath', 'keyMessages'],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe.skipIf(!process.env.ANTHROPIC_API_KEY)('VideoAgent acquisition mode LLM Judge — 理财 + 教育 2 golden cases', () => {

  it('理财引流 golden case passes judge with score >= threshold', async () => {
    const result = await runJudge(goldenCaseFinance);

    expect(typeof result.pass).toBe('boolean');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(10);
    expect(result.reason).toBeTruthy();

    if (result.pass) {
      expect(result.score).toBeGreaterThanOrEqual(PASS_SCORE_THRESHOLD);
    } else {
      expect(result.score).toBeLessThan(PASS_SCORE_THRESHOLD);
    }

    expect(result.pass).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(PASS_SCORE_THRESHOLD);
  });

  it('教育口语课 golden case passes judge with score >= threshold', async () => {
    const result = await runJudge(goldenCaseEducation);

    expect(typeof result.pass).toBe('boolean');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(10);
    expect(result.reason).toBeTruthy();

    if (result.pass) {
      expect(result.score).toBeGreaterThanOrEqual(PASS_SCORE_THRESHOLD);
    } else {
      expect(result.score).toBeLessThan(PASS_SCORE_THRESHOLD);
    }

    expect(result.pass).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(PASS_SCORE_THRESHOLD);
  });

  it('ctaScript contains CTA keyword in both golden cases', () => {
    const financeCTA = goldenCaseFinance.actualOutput.ctaScript as string;
    const eduCTA = goldenCaseEducation.actualOutput.ctaScript as string;

    expect(hasCTAKeyword(financeCTA)).toBe(true);
    expect(hasCTAKeyword(eduCTA)).toBe(true);
  });

  it('conversionPath length ≥ 1 in both golden cases', () => {
    const financePath = goldenCaseFinance.actualOutput.conversionPath as string;
    const eduPath = goldenCaseEducation.actualOutput.conversionPath as string;

    expect(financePath.length).toBeGreaterThanOrEqual(1);
    expect(eduPath.length).toBeGreaterThanOrEqual(1);
  });
});
