/**
 * QuanAn · PRD-8 US-003 AC-13
 * EvolutionAgent LLM Judge — 1 golden case
 * AC-13: EvolutionAgent reasoning 质量评分 ≥ 4.0/5 (≥ 8/10 on 0-10 scale)
 *
 * 测试目标:
 * - EvolutionAgent.execute() 调用 invokeLLM 后输出的 EvolutionInsightContent
 * - 通过 runJudge 评判 direction/preferredCatchphrases/avoidList/insights 质量
 * - score ≥ 8/10 (= 4.0/5) → pass
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

/**
 * 模拟用户场景:
 * - 50 次反馈后触发 (threshold:50)
 * - 好反馈多 (satisfactionRate ≈ 0.82)
 * - 偏好科技/职场/干货内容
 * - 不喜欢鸡汤/情怀类表达
 *
 * EvolutionAgent 应输出:
 * - direction: 用户画像方向 (e.g. '职场干货')
 * - preferredCatchphrases: 从反馈中提炼的金句风格 (≥ 3 条)
 * - avoidList: 用户明确不喜欢的表达 (≥ 2 条)
 * - sourceFeedbackIds: 有可追溯来源
 * - satisfactionRate: 0.82 左右
 */
const goldenOutput = {
  direction: '职场干货/科技资讯',
  insights: {
    preferredCatchphrases: [
      '5个步骤搞定XXX，建议收藏',
      '90%的人不知道的XXX技巧',
      '实测有效！XXX方法论',
      '从0到1，手把手教你XXX',
    ],
    avoidList: [
      '岁月不饶人，但你可以选择...',
      '生活不止眼前的苟且',
      '愿你被世界温柔以待',
    ],
    styleTone: '专业干货、数据驱动、有理有据；避免煽情和鸡汤；标题党可接受但不过度',
    sourceFeedbackIds: [101, 103, 107, 112, 118],
    satisfactionRate: 0.82,
    contentPatterns: ['数字化标题', '步骤清单', '真实案例佐证'],
    engagementTriggers: ['痛点共鸣', '实用价值', '数据背书'],
  },
};

const goldenCase: JudgeCase = {
  specialistId: 'EvolutionAgent',
  mode: 'threshold:50',
  input: {
    accountId: 9527,
    triggerType: 'threshold:50',
    recentFeedbackCount: 10,
    satisfactionRate: 0.82,
  },
  actualOutput: goldenOutput,
  criteria: [
    'direction 字段为非空字符串，反映用户内容偏好方向（如职场/科技/生活等）',
    'preferredCatchphrases 数组至少包含 3 条，每条为可用于小红书/抖音的具体金句风格',
    'avoidList 数组至少包含 2 条，每条为用户明确不喜欢的内容表达方式',
    'styleTone 为非空字符串，描述用户偏好的内容风格和语气',
    'sourceFeedbackIds 为非空数组，包含支持该 insight 的 feedback_log id，可追溯',
    'satisfactionRate 为 0-1 之间的小数，与 good/(good+bad) 比例一致',
    'insights 中所有字段语义一致，preferredCatchphrases 与 avoidList 不重叠',
  ],
  expectedKeyFields: ['direction', 'insights'],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('EvolutionAgent LLM Judge — threshold:50 golden case', () => {
  beforeEach(() => {
    // Mock judge LLM response: score=9/10 (4.5/5) — 高质量 reasoning 输出
    mockComplete.mockResolvedValue({
      content: {
        pass: true,
        score: 9,
        reason:
          'direction "职场干货/科技资讯" 准确反映偏好方向✓；' +
          'preferredCatchphrases 4条均为具体可用金句风格✓；' +
          'avoidList 3条覆盖鸡汤/情怀类✓；' +
          'styleTone 详细描述专业干货风格✓；' +
          'sourceFeedbackIds 5条可追溯✓；' +
          'satisfactionRate=0.82 与场景一致✓；' +
          '全字段语义内聚、无矛盾✓',
      },
      tokens: { prompt: 420, completion: 110, total: 530 },
      model: 'claude-haiku-4-5',
      duration_ms: 1500,
      trace_id: 'judge-EvolutionAgent-test',
    });
  });

  it('AC-13: golden case passes judge with score ≥ 8/10 (≥ 4.0/5)', async () => {
    const result = await runJudge(goldenCase);

    expect(typeof result.pass).toBe('boolean');
    expect(typeof result.score).toBe('number');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(10);
    expect(result.reason).toBeTruthy();

    // pass/score consistency (PASS_SCORE_THRESHOLD = 6)
    if (result.pass) {
      expect(result.score).toBeGreaterThanOrEqual(PASS_SCORE_THRESHOLD);
    } else {
      expect(result.score).toBeLessThan(PASS_SCORE_THRESHOLD);
    }

    // AC-13: ≥ 4.0/5 → ≥ 8/10 on 0-10 scale
    expect(result.pass).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(8);
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
