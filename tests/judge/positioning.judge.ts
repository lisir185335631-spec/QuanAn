/**
 * QuanAn · US-016 · PositioningAgent LLM Judge
 * AC-2: golden case — industry='medical' / platform='douyin'
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

// ── Golden case (AC-2, AC-10) ─────────────────────────────────────────────────

const goldenCase: JudgeCase = {
  specialistId: 'PositioningAgent',
  mode: 'industry',
  input: { industry: 'medical', platform: 'douyin', followerCount: 0 },
  actualOutput: {
    industry: 'medical',
    marketAnalysis:
      '医疗健康赛道在抖音平台用户规模超 3 亿,科普类账号月均涨粉 5-20 万,竞争激烈但垂直细分(骨科/营养/皮肤科)蓝海空间明显',
    competitionLevel: 'high',
    recommendation:
      '建议聚焦"骨科康复科普"垂直赛道,以医生人设切入,通过每日 60 秒病例问答短视频积累精准用户,前 3 个月目标 1 万精准粉丝',
  },
  criteria: [
    'industry 字段值为字符串且非空',
    'marketAnalysis 字段不少于 50 个字符',
    'competitionLevel 为 low/medium/high 之一',
    'recommendation 字段不少于 50 个字符且包含具体可执行的建议',
    '输出包含 industry、marketAnalysis、competitionLevel、recommendation 四个字段',
  ],
  expectedKeyFields: ['industry', 'marketAnalysis', 'competitionLevel', 'recommendation'],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PositioningAgent LLM Judge — industry/douyin golden case', () => {
  beforeEach(() => {
    mockComplete.mockResolvedValue({
      content: { pass: true, score: 8, reason: '输出包含全部必要字段；marketAnalysis 87字超过50字下限；competitionLevel=high符合规范；recommendation含具体行动路径' },
      tokens: { prompt: 120, completion: 60, total: 180 },
      model: 'claude-haiku-4-5',
      duration_ms: 980,
      trace_id: 'judge-PositioningAgent-test',
    });
  });

  it('golden case passes judge with score >= threshold', async () => {
    const result = await runJudge(goldenCase);

    // AC-7: assert both pass AND score
    expect(typeof result.pass).toBe('boolean');
    expect(typeof result.score).toBe('number');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(10);
    expect(result.reason).toBeTruthy();
    expect(result.reason.length).toBeGreaterThan(0);

    // pass/score consistency (AC-7)
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
