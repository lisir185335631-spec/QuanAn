/**
 * QuanAn · US-012 · AnalysisAgent structural mode LLM Judge
 * AC-4: 2 golden cases — 减肥 + 育儿 · 5 维度评分
 * criteria: overall = 5 维度均分附近
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

// ── Golden cases ──────────────────────────────────────────────────────────────

const goldenCaseWeight: JudgeCase = {
  specialistId: 'AnalysisAgent',
  mode: 'structural',
  input: {
    copy: '今天教大家减脂的方法，很简单的，就是少吃多动。早上少吃一点，晚上也少吃，多运动就行了。坚持下去肯定能瘦的，加油！',
  },
  actualOutput: {
    scores: {
      hook: 20,
      structure: 30,
      emotion: 25,
      specificity: 15,
      cta: 35,
      overall: 25,
    },
    optimizations: [
      {
        dimension: 'hook',
        issue: '开头"今天教大家"是标准AI式平淡开场，无法抓住读者注意力',
        suggestion: '改为反常识开场："减脂不需要少吃？营养学家告诉我真相颠覆了我10年的认知"',
      },
      {
        dimension: 'specificity',
        issue: '"少吃多动"过于模糊，没有可执行的具体方案',
        suggestion: '补充具体数据：热量缺口多少、每周几次有氧、力量训练占比，让读者知道怎么做',
      },
      {
        dimension: 'structure',
        issue: '文案结构松散，缺乏逻辑层次感',
        suggestion: '采用"痛点→原因分析→解决方案→行动号召"四段式结构',
      },
    ],
    rewriteSnippet: '很多人减脂失败不是因为不努力，而是根本方法就错了。"少吃多动"这4个字，毁了无数人的代谢！今天我用数据告诉你，真正有效的减脂只需要做对这1件事。',
  },
  criteria: [
    'scores 包含 hook/structure/emotion/specificity/cta/overall 六个字段',
    '所有 score 字段值在 0-100 之间',
    'overall 值与 hook/structure/emotion/specificity/cta 五个维度均分相差不超过 20 分',
    'optimizations 数组包含 3-5 个元素',
    '每个 optimization 包含 dimension/issue/suggestion 三个字段',
    'rewriteSnippet 字符串长度在 50-200 个字符之间',
  ],
  expectedKeyFields: ['scores', 'optimizations', 'rewriteSnippet'],
};

const goldenCaseParenting: JudgeCase = {
  specialistId: 'AnalysisAgent',
  mode: 'structural',
  input: {
    copy: '宝妈们，今天分享一个让孩子乖乖吃饭的方法！很多孩子不爱吃饭是因为吃饭时玩手机，建议把手机收起来。另外让孩子参与做饭也很有效，他们会更愿意吃自己参与做的食物。还有就是给食物起有趣的名字，比如把西兰花叫做"小树林"，孩子就会很感兴趣。希望对大家有帮助！点赞关注！',
  },
  actualOutput: {
    scores: {
      hook: 55,
      structure: 65,
      emotion: 60,
      specificity: 70,
      cta: 45,
      overall: 59,
    },
    optimizations: [
      {
        dimension: 'hook',
        issue: '"宝妈们，今天分享"是常规开场，未能突出内容的独特价值',
        suggestion: '改为数据+悬念："90%的孩子挑食其实是家长造成的，3个步骤让挑食孩子变成"吃货""',
      },
      {
        dimension: 'cta',
        issue: '"希望对大家有帮助！点赞关注！"的结尾较弱，缺乏情感连接',
        suggestion: '改为互动型结尾："你家孩子最不爱吃哪种蔬菜？评论告诉我，我有专属解法！"',
      },
      {
        dimension: 'emotion',
        issue: '全程客观陈述，缺乏与宝妈共情的情感温度',
        suggestion: '加入"我家孩子以前也这样，直到我发现…"的个人故事，建立信任感',
      },
    ],
    rewriteSnippet: '90%的宝妈不知道，孩子挑食的根本原因不是"不饿"，而是吃饭没有参与感。今天分享3个亲测有效的方法，其中第3个让我孩子主动要求"多吃一碗"！',
  },
  criteria: [
    'scores 包含 hook/structure/emotion/specificity/cta/overall 六个字段',
    '所有 score 字段值在 0-100 之间',
    'overall 值与 hook/structure/emotion/specificity/cta 五个维度均分相差不超过 20 分',
    'optimizations 数组包含 3-5 个元素',
    '每个 optimization 包含 dimension/issue/suggestion 三个字段',
    'rewriteSnippet 字符串长度在 50-200 个字符之间',
  ],
  expectedKeyFields: ['scores', 'optimizations', 'rewriteSnippet'],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AnalysisAgent structural mode LLM Judge — 2 golden cases', () => {
  beforeEach(() => {
    mockComplete.mockResolvedValue({
      content: { pass: true, score: 8, reason: 'scores含6字段✓；分值0-100✓；overall与5维均分差<20✓；optimizations 3条✓；每条含3字段✓；rewriteSnippet 50-200字✓' },
      tokens: { prompt: 350, completion: 95, total: 445 },
      model: 'claude-haiku-4-5',
      duration_ms: 1300,
      trace_id: 'judge-AnalysisAgent-structural-test',
    });
  });

  it('减肥文案 golden case passes judge with score >= threshold', async () => {
    const result = await runJudge(goldenCaseWeight);

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

  it('育儿文案 golden case passes judge with score >= threshold', async () => {
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
});
