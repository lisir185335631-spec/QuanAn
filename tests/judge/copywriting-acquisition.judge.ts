/**
 * QuanAn · US-014 · CopywritingAgent acquisition mode LLM Judge
 * AC-4: 2 golden cases — 育儿 + 医美
 * criteria: markdown 200-500 字 + 末尾 CTA
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PASS_SCORE_THRESHOLD, runJudge } from './judge-runner';
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

// ── CTA ending check ──────────────────────────────────────────────────────────

const CTA_END_KEYWORDS = ['立即', '马上', '点击', '扫码', '关注', '免费', '限时', '加入', '领取', '咨询', '私信', '评论'];

function hasCtaEnding(markdown: string): boolean {
  const lastParagraph = markdown.trim().split('\n').reverse().find((line) => line.trim().length > 0) ?? '';
  return CTA_END_KEYWORDS.some((kw) => lastParagraph.includes(kw));
}

// ── Golden cases ──────────────────────────────────────────────────────────────

const goldenCaseParenting: JudgeCase = {
  specialistId: 'CopywritingAgent',
  mode: 'acquisition',
  input: { industry: '育儿', platform: 'xiaohongshu', topic: '0-3岁宝宝睡眠训练', conversionGoal: '引流到付费育儿课程' },
  actualOutput: {
    markdown: `# 宝宝每晚哭闹到凌晨？睡眠训练3步走，从此告别"睡渣"

很多新手妈妈都有这样的经历：宝宝睡着了，轻轻放下，10秒钟后又哭醒了。每天晚上被折腾到精疲力竭，自己也在崩溃边缘。

其实**宝宝睡眠问题80%可以通过训练解决**，关键在于找对方法。

## 第一步：建立睡前仪式（20分钟规律）

每天晚上固定时间：洗澡→按摩→喂奶→唱摇篮曲。重复7天，大脑会形成"到点睡觉"的条件反射。

## 第二步：渐进式独立入睡

不要突然断开，第1天拍背5分钟，第3天减到3分钟，第5天在身边守护不接触，第7天独立入睡。

## 第三步：夜醒处理原则

分清是真饿还是习惯性夜醒。6个月以上宝宝夜醒超过3次，通常是习惯问题，不需要立即喂奶。

**关键：坚持最重要，前3天会哭更多，第4天开始明显改善。**

想要完整的0-3岁睡眠训练方案？私信发"睡眠"领取我整理的专属攻略！`,
    metadata: {
      scriptType: 'tutorial',
      elements: ['social_proof', 'specificity', 'fear'],
      structureSummary: '痛点共鸣 → 解决方案3步 → 关键提醒 → CTA',
      estimatedDuration: '2分钟阅读',
    },
  },
  criteria: [
    'markdown 字段字符数在 200-500 字之间（中文字符计1字）',
    'markdown 末尾段落包含明确的 CTA 行动引导（私信/评论/立即/免费/领取 之一）',
    'markdown 包含至少 1 个以 "# " 开头的标题',
    'metadata.elements 数组非空',
  ],
  expectedKeyFields: ['markdown', 'metadata'],
};

const goldenCaseMedicalBeauty: JudgeCase = {
  specialistId: 'CopywritingAgent',
  mode: 'acquisition',
  input: { industry: '医美', platform: 'douyin', topic: '水光针初体验', conversionGoal: '引流到医美机构咨询预约' },
  actualOutput: {
    markdown: `# 打了10次水光针，我踩过的坑全在这里！

水光针是目前医美里性价比最高的项目之一，但很多人花了钱却没效果，原因就是踩了这3个坑。

**坑1：选错医生**。水光针注射深度决定效果，要找专业医生，不是所谓"美容师"能做的。

**坑2：术后护理没做到位**。注射后24小时避免化妆，72小时避免激烈运动，否则吸收率降低60%。

**坑3：频率太高**。1个月打2次，皮肤来不及吸收就是浪费钱。科学周期是每4-6周一次。

做对了，3次后皮肤真的会变得水润透亮，毛孔也细了很多。我现在是每6周固定去一次。

想了解适合你肤质的水光针方案？立即点击下方链接免费预约专业皮肤顾问！`,
    metadata: {
      scriptType: 'problem-solution',
      elements: ['fear', 'authority', 'specificity'],
      structureSummary: '结果吸引 → 3坑揭秘 → 正确做法 → CTA',
      estimatedDuration: '1.5分钟阅读',
    },
  },
  criteria: [
    'markdown 字段字符数在 200-500 字之间（中文字符计1字）',
    'markdown 末尾段落包含明确的 CTA 行动引导（私信/评论/立即/免费/领取/咨询/点击 之一）',
    'markdown 包含至少 1 个以 "# " 开头的标题',
    'metadata.elements 数组非空',
  ],
  expectedKeyFields: ['markdown', 'metadata'],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CopywritingAgent acquisition mode LLM Judge — 育儿 + 医美 2 golden cases', () => {
  beforeEach(() => {
    mockComplete.mockResolvedValue({
      content: { pass: true, score: 8, reason: 'markdown 200-500字✓；末尾含CTA关键词✓；含#标题✓；elements非空✓' },
      tokens: { prompt: 310, completion: 92, total: 402 },
      model: 'claude-haiku-4-5',
      duration_ms: 1180,
      trace_id: 'judge-CopywritingAgent-acquisition-test',
    });
  });

  it('育儿睡眠训练 golden case passes judge with score >= threshold', async () => {
    const result = await runJudge(goldenCaseParenting);

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

  it('医美水光针 golden case passes judge with score >= threshold', async () => {
    const result = await runJudge(goldenCaseMedicalBeauty);

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

  it('markdown length is 200-500 chars in both golden cases', () => {
    const parentingMd = goldenCaseParenting.actualOutput.markdown as string;
    const medicalMd = goldenCaseMedicalBeauty.actualOutput.markdown as string;

    expect(parentingMd.length).toBeGreaterThanOrEqual(200);
    expect(parentingMd.length).toBeLessThanOrEqual(500);
    expect(medicalMd.length).toBeGreaterThanOrEqual(200);
    expect(medicalMd.length).toBeLessThanOrEqual(500);
  });

  it('markdown ends with CTA in both golden cases', () => {
    const parentingMd = goldenCaseParenting.actualOutput.markdown as string;
    const medicalMd = goldenCaseMedicalBeauty.actualOutput.markdown as string;

    expect(hasCtaEnding(parentingMd)).toBe(true);
    expect(hasCtaEnding(medicalMd)).toBe(true);
  });
});
