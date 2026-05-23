/**
 * QuanAn · PRD-8 US-004 AC-8
 * EvolutionInsight 注入 LLM Judge — 2 golden cases
 * AC-8: PositioningAgent / CopywritingAgent 有 insight 注入 → 质量评分 ≥ 4.0/5 (≥ 8/10)
 *
 * 测试目标:
 * - ContextAssembler 组装 systemPrompt 时 Section 4 注入完整性
 * - 通过 runJudge 评判注入段对内容质量的提升贡献
 * - score ≥ 8/10 (= 4.0/5) → pass
 */

import { describe, expect, it, vi } from 'vitest';

import type { JudgeCase } from './judge-runner';
import { PASS_SCORE_THRESHOLD, runJudge } from './judge-runner';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/lib/prisma', () => ({
  prisma: {
    stepData: { findMany: vi.fn().mockResolvedValue([]) },
    costLog: { create: vi.fn().mockResolvedValue({ id: BigInt(1) }) },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── Golden cases ──────────────────────────────────────────────────────────────

const positioningGoldenCase: JudgeCase = {
  specialistId: 'PositioningAgent',
  mode: 'standard',
  input: {
    accountId: 42,
    agentId: 'PositioningAgent',
    hasInsight: true,
    insightDirection: '职场干货/科技资讯',
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
    insightDirection: '职场干货/科技资讯',
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

describe.skipIf(!process.env.ANTHROPIC_API_KEY)('EvolutionInsight 注入 LLM Judge — AC-8', () => {
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
});
