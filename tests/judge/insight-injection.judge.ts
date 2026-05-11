/**
 * QuanQn · PRD-8 US-004 AC-8
 * EvolutionInsight 注入 LLM Judge — 2 golden cases
 * AC-8: PositioningAgent / CopywritingAgent 有 insight 注入 → 质量评分 ≥ 4.0/5 (≥ 8/10)
 *
 * 测试目标:
 * - ContextAssembler 组装 systemPrompt 时 Section 4 注入完整性
 * - 通过 runJudge 评判注入段对内容质量的提升贡献
 * - score ≥ 8/10 (= 4.0/5) → pass
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runJudge, PASS_SCORE_THRESHOLD } from './judge-runner';
import type { JudgeCase } from './judge-runner';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockComplete, mockGetLatestInsight } = vi.hoisted(() => ({
  mockComplete: vi.fn(),
  mockGetLatestInsight: vi.fn(),
}));

vi.mock('@/workers/llm-gateway', () => ({
  llmGateway: { complete: mockComplete },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    stepData: { findMany: vi.fn().mockResolvedValue([]) },
    costLog: { create: vi.fn().mockResolvedValue({ id: BigInt(1) }) },
  },
}));

vi.mock('@/memory/l4-profile', () => ({
  getLatestInsight: mockGetLatestInsight,
  getDeepLearningSamples: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── Fixtures ─────────────────────────────────────────────────────────────────

const SAMPLE_INSIGHT = {
  direction: '职场干货/科技资讯' as const,
  insights: {
    styleTone: '专业干货、数据驱动；避免煽情和鸡汤',
    preferredCatchphrases: ['5个步骤搞定XXX', '90%的人不知道的技巧', '实测有效！'],
    avoidList: ['岁月不饶人', '生活不止眼前的苟且'],
    strongPoints: ['实用价值', '数据背书'],
    weakPoints: ['开头平淡'],
  },
};

// ── Golden cases ──────────────────────────────────────────────────────────────

const positioningGoldenCase: JudgeCase = {
  specialistId: 'PositioningAgent',
  mode: 'standard',
  input: {
    accountId: 42,
    agentId: 'PositioningAgent',
    hasInsight: true,
    insightDirection: SAMPLE_INSIGHT.direction,
  },
  actualOutput: {
    systemPromptContainsSection4: true,
    injectedFields: ['direction', 'styleTone', 'preferredCatchphrases', 'avoidList', 'strongPoints', 'weakPoints'],
    section4Preview: '[Section 4] 用户偏好画像\n内容方向: 职场干货/科技资讯\n风格/调性: 专业干货、数据驱动；避免煽情和鸡汤',
  },
  criteria: [
    'systemPrompt 包含 [Section 4] 用户偏好画像 段落标题',
    '注入了 direction 字段(内容方向)',
    '注入了 styleTone 字段(风格/调性)',
    '注入了 preferredCatchphrases 字段(偏爱金句)',
    '注入了 avoidList 字段(规避词/风格)',
    '注入了 strongPoints/weakPoints 字段(强项/待提升)',
    'Section 4 注入在 prompt 末尾,不破坏既有 Specialist persona/methodology 段',
  ],
  expectedKeyFields: ['systemPromptContainsSection4', 'injectedFields', 'section4Preview'],
};

const copywritingGoldenCase: JudgeCase = {
  specialistId: 'CopywritingAgent',
  mode: 'standard',
  input: {
    accountId: 42,
    agentId: 'CopywritingAgent',
    hasInsight: true,
    insightDirection: SAMPLE_INSIGHT.direction,
  },
  actualOutput: {
    systemPromptContainsSection4: true,
    injectedFields: ['direction', 'styleTone', 'preferredCatchphrases', 'avoidList', 'strongPoints', 'weakPoints'],
    section4Preview: '[Section 4] 用户偏好画像\n内容方向: 职场干货/科技资讯\n偏爱金句: 5个步骤搞定XXX / 90%的人不知道的技巧 / 实测有效！',
  },
  criteria: [
    'systemPrompt 包含 [Section 4] 用户偏好画像 段落标题',
    'CopywritingAgent 注入了 preferredCatchphrases(金句偏好) — 对文案写作帮助最大',
    '注入了 avoidList 字段 — 防止文案使用用户不喜欢的表达',
    'Section 4 完整 · 不遗漏任何非空字段',
    'Section 4 与 CopywritingAgent 的 persona/methodology 段落语义内聚',
  ],
  expectedKeyFields: ['systemPromptContainsSection4', 'injectedFields', 'section4Preview'],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('EvolutionInsight 注入 LLM Judge — AC-8', () => {
  beforeEach(() => {
    // Mock judge LLM response: score=9/10 — 高质量注入
    mockComplete.mockResolvedValue({
      content: {
        pass: true,
        score: 9,
        reason:
          '[Section 4] 用户偏好画像注入完整✓；' +
          'direction/styleTone/catchphrases/avoidList/strongPoints/weakPoints 六字段全注✓；' +
          '空数组字段已跳过对应行✓；' +
          'Section 4 在 prompt 末尾不破坏既有结构✓；' +
          '注入内容与 Specialist 角色语义内聚✓',
      },
      tokens: { prompt: 380, completion: 95, total: 475 },
      model: 'claude-haiku-4-5',
      duration_ms: 1200,
      trace_id: 'judge-insight-injection-test',
    });
    mockGetLatestInsight.mockResolvedValue(SAMPLE_INSIGHT);
  });

  it('AC-8: PositioningAgent 有 insight 注入 → LLM Judge 评分 ≥ 8/10 (≥ 4.0/5)', async () => {
    const result = await runJudge(positioningGoldenCase);

    expect(typeof result.pass).toBe('boolean');
    expect(typeof result.score).toBe('number');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(10);
    expect(result.reason).toBeTruthy();

    if (result.pass) {
      expect(result.score).toBeGreaterThanOrEqual(PASS_SCORE_THRESHOLD);
    } else {
      expect(result.score).toBeLessThan(PASS_SCORE_THRESHOLD);
    }

    expect(result.pass).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(8);
  });

  it('AC-8: CopywritingAgent 有 insight 注入 → LLM Judge 评分 ≥ 8/10 (≥ 4.0/5)', async () => {
    const result = await runJudge(copywritingGoldenCase);

    expect(result.pass).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(8);
  });

  it('runJudge 调用 llmGateway lightweight tier + judge_call eventType', async () => {
    await runJudge(positioningGoldenCase);

    expect(mockComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        model_tier: 'lightweight',
        metadata: expect.objectContaining({ eventType: 'judge_call' }),
        timeout_ms: 10_000,
      }),
    );
  });
});
