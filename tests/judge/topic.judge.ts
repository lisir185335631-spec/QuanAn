/**
 * QuanAn · US-016 · TopicAgent LLM Judge
 * AC-2: golden case — category='traffic' / 健康行业
 * AC-10: real scenario input
 * AC-11: quantifiable criteria (topics.length === 20, 含5 fields/item)
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

// ── Helper: build 20 topic items ──────────────────────────────────────────────

function buildTopics(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    title: `减肥误区第${i + 1}条：你以为正确的方法其实在伤身`,
    hook: `90%的人减肥都踩过这个坑，第${i + 1}条震惊了我`,
    structure: '痛点引入 → 错误分析 → 正确方法 → 行动号召',
    formula: '反常识揭秘公式',
    viralPotential: 'high' as const,
  }));
}

// ── Golden case ───────────────────────────────────────────────────────────────

const goldenCase: JudgeCase = {
  specialistId: 'TopicAgent',
  mode: 'traffic',
  input: { category: 'traffic', industry: 'health', platform: 'douyin' },
  actualOutput: {
    category: 'traffic',
    topics: buildTopics(20),
  },
  criteria: [
    'category 字段值为 "traffic"',
    'topics 数组恰好包含 20 个元素(不多不少)',
    '每个 topic 包含 title/hook/structure/formula/viralPotential 五个字段',
    'viralPotential 值为 low/medium/high 之一',
    '每个 title 非空且长度大于 5 个字符',
  ],
  expectedKeyFields: ['category', 'topics'],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe.skipIf(!process.env.ANTHROPIC_API_KEY)('TopicAgent LLM Judge — traffic/health/douyin golden case', () => {

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
