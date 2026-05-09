/**
 * QuanQn · US-016 · MonetizationAgent LLM Judge
 * AC-2: golden case — 教育行业 / 新手创作者 / 零基础变现
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
  specialistId: 'MonetizationAgent',
  input: { currentRevenue: '0', industry: 'education', platform: 'douyin' },
  actualOutput: {
    currentAnalysis: '账号当前变现为零，处于冷启动阶段，需从内容积累粉丝信任开始，优先选择低门槛变现路径。',
    ladder: [
      { stage: '第一阶段(0-3个月)', revenue: '0-3000元/月', action: '开通直播打赏，建立知识星球社群，粉丝规模目标 5000 人' },
      { stage: '第二阶段(3-6个月)', revenue: '5000-20000元/月', action: '开通橱窗售书及教程课程，推出 199 元训练营，粉丝目标 2 万' },
      { stage: '第三阶段(6-12个月)', revenue: '30000元+/月', action: '推出 999 元精品课，承接教育品牌广告合作，粉丝目标 10 万' },
    ],
    revenueStructure: {
      primary: '知识付费课程销售(占比 60%)',
      secondary: ['品牌合作广告(占比 25%)', '社群会员费(占比 15%)'],
    },
    successCases: [
      { title: '教育博主@数学老师王', summary: '6个月从0到10万粉，靠刷题视频日更+知识星球组合，月收入突破5万' },
      { title: '语文老师@阅读达人', summary: '3个月积累2万精准粉，售出300份 299 元阅读训练营，单月营收近10万' },
    ],
  },
  criteria: [
    'currentAnalysis 为非空字符串，描述当前变现状况',
    'ladder 数组恰好包含 3 个阶段对象，每个含 stage/revenue/action 字段',
    'revenueStructure.secondary 数组恰好包含 2 个收入来源',
    'successCases 数组恰好包含 2 个案例，每个含 title 和 summary 字段',
    'ladder 中每个 action 包含至少 1 个可量化目标(数字/金额/人数)',
  ],
  expectedKeyFields: ['currentAnalysis', 'ladder', 'revenueStructure', 'successCases'],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('MonetizationAgent LLM Judge — education/zero-revenue golden case', () => {
  beforeEach(() => {
    mockComplete.mockResolvedValue({
      content: { pass: true, score: 8, reason: 'ladder 3阶段✓；revenueStructure.secondary 2项✓；successCases 2个✓；每个action含具体数字目标✓' },
      tokens: { prompt: 180, completion: 70, total: 250 },
      model: 'claude-haiku-4-5',
      duration_ms: 1050,
      trace_id: 'judge-MonetizationAgent-test',
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
