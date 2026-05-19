/**
 * QuanAn · PRD-8 US-013 AC-1
 * feedback-evolution-loop LLM Judge — 1 golden case
 * AC-1: feedback → trigger → EvolutionInsight → injection quality ≥ 4.0/5
 *
 * 验证反馈飞轮完整闭环:
 * 用户 feedback_log 积累 → threshold 触发 EvolutionAgent → insight 写入 →
 * 下次 ContextAssembler 注入 → Specialist 收到 [Section 4]
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { JudgeCase } from './judge-runner';
import { PASS_SCORE_THRESHOLD, runJudge } from './judge-runner';

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
 * 场景: 用户在 20 次反馈后触发 EvolutionAgent
 * 输出: 一份 EvolutionInsight，之后被 ContextAssembler 注入到 CopywritingAgent 的 Section 4
 */
const feedbackEvolutionLoopCase: JudgeCase = {
  specialistId: 'feedback-evolution-loop',
  mode: 'threshold:20',
  input: {
    accountId: 5050,
    triggerType: 'threshold:20',
    feedbackSummary: {
      total: 20,
      good: 16,
      bad: 4,
      satisfactionRate: 0.80,
      topPositive: ['教程类内容', '干货清单', '数据驱动标题'],
      topNegative: ['过度煽情', '鸡汤类表达'],
    },
    injectionContext: {
      specialistId: 'CopywritingAgent',
      systemPromptSection4: `[Section 4] 用户偏好画像
- 内容方向: 干货教程/职场提升
- 偏好金句: ["5步学会XXX", "90%的人不知道", "实测有效"]
- 避免: ["生活不止眼前的苟且", "愿你被温柔以待"]
- 风格: 专业简洁，数据支撑，行动导向`,
    },
  },
  actualOutput: {
    evolutionInsight: {
      direction: '干货教程/职场提升',
      insights: {
        preferredCatchphrases: ['5步学会XXX', '90%的人不知道', '实测有效', '手把手教你'],
        avoidList: ['生活不止眼前的苟且', '愿你被温柔以待'],
        styleTone: '专业简洁、数据支撑、行动导向；避免鸡汤煽情',
        sourceFeedbackIds: [201, 205, 210, 214, 218],
        satisfactionRate: 0.80,
        contentPatterns: ['教程清单', '数字化标题'],
        engagementTriggers: ['实用价值', '痛点解决'],
      },
    },
    injectionQuality: {
      section4Present: true,
      catchphrasesInjected: 4,
      avoidListInjected: 2,
      directionAligned: true,
    },
  },
  criteria: [
    'evolutionInsight.direction 与 feedbackSummary 中的 topPositive 主题一致',
    'evolutionInsight.insights.preferredCatchphrases 包含 ≥ 3 条金句风格',
    'evolutionInsight.insights.avoidList 与 topNegative 对应一致',
    'injectionQuality.section4Present = true，说明 ContextAssembler 注入成功',
    'injectionQuality.catchphrasesInjected ≥ 3，说明金句注入数量充分',
    'injectionQuality.directionAligned = true，说明方向与 insight 一致',
    '全链路语义一致：feedback → insight → injection 三段内容方向相同',
  ],
  expectedKeyFields: ['evolutionInsight', 'injectionQuality'],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('feedback-evolution-loop LLM Judge — threshold:20 end-to-end', () => {
  beforeEach(() => {
    mockComplete.mockResolvedValue({
      content: {
        pass: true,
        score: 9,
        reason:
          'direction "干货教程/职场提升" 与 topPositive 一致✓；' +
          'preferredCatchphrases 4 条覆盖用户偏好✓；' +
          'avoidList 2 条与 topNegative 完全对应✓；' +
          'section4Present=true 注入成功✓；' +
          'catchphrasesInjected=4 充分✓；' +
          'directionAligned=true✓；' +
          '全链路 feedback→insight→injection 语义一致✓',
      },
      tokens: { prompt: 450, completion: 120, total: 570 },
      model: 'claude-haiku-4-5',
      duration_ms: 1600,
      trace_id: 'judge-feedback-evolution-loop-test',
    });
  });

  it('AC-1: feedback-evolution-loop golden case passes judge with score ≥ 8/10', async () => {
    const result = await runJudge(feedbackEvolutionLoopCase);

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
});
