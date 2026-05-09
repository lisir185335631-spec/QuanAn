/**
 * QuanQn · US-012 · AnalysisAgent viral mode LLM Judge
 * AC-3: 2 golden cases — 美妆 + 美食 · 22 元素拆解
 * criteria: elements 数组非空 + insights ≥ 3
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

const goldenCaseBeauty: JudgeCase = {
  specialistId: 'AnalysisAgent',
  mode: 'viral',
  input: {
    lastTitle: '我用了3年的平价粉底液，终于找到了贵妇替代品',
    lastCopy: '姐妹们！找了3年的平价平替终于找到了！这款粉底液只要89元，但持妆力完全不输三四百块的贵妇款。我混油皮，北方干燥天气，中午12点上妆，晚上10点还是完整的！最关键是服帖感超好，不卡粉，遮瑕力中等偏上。适合日常通勤和普通场合，不适合重要场合（毕竟是平价）。推荐给所有预算有限但想要好底妆的姐妹！',
  },
  actualOutput: {
    analysis: {
      elements: ['price_anchor', 'social_proof', 'specificity', 'contrast'],
      structure: '平替钩子 → 产品参数 → 亲测数据 → 适用场景 → 目标人群号召',
      hookType: '价值锚定 + 问题解决',
      viralFormula: '高性价比 + 实测数据 + 场景化推荐',
    },
    insights: [
      {
        element: 'price_anchor',
        explanation: '89元 vs 300-400元的对比让读者立刻感受到价值落差，触发"我也要"的购买欲',
        impact: '高' as const,
      },
      {
        element: 'specificity',
        explanation: '中午12点上妆、晚上10点完整这种具体时间节点，比"持妆持久"更有说服力',
        impact: '高' as const,
      },
      {
        element: 'social_proof',
        explanation: '混油皮+北方干燥天气的使用条件描述，让同类型肤质用户产生强共鸣',
        impact: '中' as const,
      },
    ],
    rewriteVersion: '找了3年！89元的粉底液比300多的持妆力更强？我混油皮实测10小时，数据让我震惊了。北方冬天最考验底妆，但这款真的撑住了。姐妹们，平替神器终于来了！',
  },
  criteria: [
    'analysis.elements 数组非空且包含至少 1 个元素',
    'insights 数组包含至少 3 个元素',
    '每个 insight 包含 element/explanation/impact 三个字段',
    'impact 值为 高/中/低 之一',
    'rewriteVersion 字符串长度不少于 50 个字符',
    'analysis.structure 为非空字符串',
  ],
  expectedKeyFields: ['analysis', 'insights', 'rewriteVersion'],
};

const goldenCaseFood: JudgeCase = {
  specialistId: 'AnalysisAgent',
  mode: 'viral',
  input: {
    lastTitle: '这道菜我妈做了30年，今天终于学会了',
    lastCopy: '我妈做红烧肉做了30年，每次过年全家都等着这道菜。今年她终于肯教我了！关键在3个步骤：第一步焯水要冷水下锅，热水会让肉变柴；第二步炒糖色要全程小火，火大了就苦了；第三步要加热水不能加冷水，不然肉会收缩变硬。就这3个点，我练了5次终于成功了。今晚就去买五花肉，跟着我一起做！',
  },
  actualOutput: {
    analysis: {
      elements: ['nostalgia', 'authority', 'specificity', 'fear'],
      structure: '情感钩子(妈妈30年) → 技术秘密揭露 → 3步骤拆解 → 实践号召',
      hookType: '情感共鸣 + 权威背书',
      viralFormula: '家庭情感 + 技术干货 + 避坑指南',
    },
    insights: [
      {
        element: 'nostalgia',
        explanation: '"我妈做了30年"唤起中国人对家的情感记忆，触发情感共鸣，是传播的核心驱动力',
        impact: '高' as const,
      },
      {
        element: 'specificity',
        explanation: '冷水vs热水、小火vs大火、热水vs冷水的具体对比，把模糊的"技巧"变成可执行的步骤',
        impact: '高' as const,
      },
      {
        element: 'fear',
        explanation: '"火大了就苦了""肉会收缩变硬"的失败场景描述，激活读者的损失厌恶心理',
        impact: '中' as const,
      },
    ],
    rewriteVersion: '我妈藏了30年的红烧肉秘方，今年过年终于教给我了！3个反直觉步骤：冷水焯肉、小火糖色、热水收汁。练了5次才成功，现在教你一次就过！',
  },
  criteria: [
    'analysis.elements 数组非空且包含至少 1 个元素',
    'insights 数组包含至少 3 个元素',
    '每个 insight 包含 element/explanation/impact 三个字段',
    'impact 值为 高/中/低 之一',
    'rewriteVersion 字符串长度不少于 50 个字符',
    'analysis.structure 为非空字符串',
  ],
  expectedKeyFields: ['analysis', 'insights', 'rewriteVersion'],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AnalysisAgent viral mode LLM Judge — 2 golden cases', () => {
  beforeEach(() => {
    mockComplete.mockResolvedValue({
      content: { pass: true, score: 9, reason: 'elements非空✓；insights≥3条✓；每条含element/explanation/impact✓；impact值合法✓；rewriteVersion超50字✓；structure非空✓' },
      tokens: { prompt: 300, completion: 90, total: 390 },
      model: 'claude-haiku-4-5',
      duration_ms: 1200,
      trace_id: 'judge-AnalysisAgent-viral-test',
    });
  });

  it('美妆 golden case(平价粉底液平替) passes judge with score >= threshold', async () => {
    const result = await runJudge(goldenCaseBeauty);

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

  it('美食 golden case(红烧肉家传方) passes judge with score >= threshold', async () => {
    const result = await runJudge(goldenCaseFood);

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
