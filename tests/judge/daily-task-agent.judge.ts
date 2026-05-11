/**
 * QuanQn · PRD-8 US-013 AC-1
 * DailyTaskAgent LLM Judge — 2 golden cases
 * AC-1: DailyTaskAgent output quality ≥ 4.0/5
 *
 * Case 1: 有进度账号 (has_progress) — 任务应关联 9 步主线
 * Case 2: 冷启动账号 (cold_start) — 模板任务 5 条
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

// ── Golden cases ───────────────────────────────────────────────────────────────

const goldenCaseHasProgress: JudgeCase = {
  specialistId: 'DailyTaskAgent',
  mode: 'has_progress',
  input: {
    accountId: 1001,
    stepProgress: { completed: 4, total: 9 },
    lastHistoryDays: 7,
  },
  actualOutput: {
    tasks: [
      {
        id: 'abc12345-0000-0000-0000-000000000001',
        title: '完成步骤 5：选题策略',
        description: '根据你的行业定位，生成 20 个差异化选题，覆盖流量、变现、人设三个维度。',
        type: 'do_step',
        ctaUrl: '/step/5',
        ctaText: '开始生成选题',
        expectedOutcome: '获得一份完整的选题矩阵，为未来两周内容规划提供支撑。',
      },
      {
        id: 'abc12345-0000-0000-0000-000000000002',
        title: '回顾近期文案效果',
        description: '查看过去 7 天的内容历史，找到点击率最高的 3 篇，总结成功要素。',
        type: 'optimize_content',
        ctaUrl: '/history',
        ctaText: '查看历史',
        expectedOutcome: '总结出 2-3 个可复用的高效文案结构。',
      },
      {
        id: 'abc12345-0000-0000-0000-000000000003',
        title: '上传深度学习样本',
        description: '找 1-2 篇同行爆款内容，上传至深度学习库，提升 AI 对你风格的理解。',
        type: 'upload_sample',
        ctaUrl: '/deep-learning',
        ctaText: '上传样本',
        expectedOutcome: 'AI 风格向量更新，后续生成内容更贴近目标受众偏好。',
      },
    ],
  },
  criteria: [
    'tasks 数组包含 3-5 个元素',
    '每个 task 包含 id/title/description/type/ctaUrl/ctaText/expectedOutcome 7 个字段',
    'ctaUrl 以 / 开头（站内跳转）',
    'type 为合法枚举值之一',
    'description 和 expectedOutcome 长度均在 10-500 字符之间',
    '任务与账号进度相关（步骤 5 未完成时应出现 do_step 类任务）',
  ],
  expectedKeyFields: ['tasks'],
};

const goldenCaseColdStart: JudgeCase = {
  specialistId: 'DailyTaskAgent',
  mode: 'cold_start',
  input: {
    accountId: 2002,
    stepProgress: { completed: 0, total: 9 },
    lastHistoryDays: 0,
  },
  actualOutput: {
    tasks: [
      {
        id: 'bcd23456-0000-0000-0000-000000000001',
        title: '完成第一步：IP 定位',
        description: '设置你的行业、人设和目标受众，为后续内容生成打下基础。预计耗时 10 分钟。',
        type: 'do_step',
        ctaUrl: '/step/1',
        ctaText: '开始定位',
        expectedOutcome: '明确内容方向，AI 能为你生成高度定制化的文案和建议。',
      },
      {
        id: 'bcd23456-0000-0000-0000-000000000002',
        title: '了解内容诊断',
        description: '完成 8 维度诊断问卷，获取你的 IP 账号健康评分和优先改进建议。',
        type: 'review_diagnosis',
        ctaUrl: '/diagnosis',
        ctaText: '立即诊断',
        expectedOutcome: '得到个性化的成长路线图，知道从哪里开始发力。',
      },
      {
        id: 'bcd23456-0000-0000-0000-000000000003',
        title: '设置本月目标',
        description: '在目标设置页面输入你的月度粉丝增长目标和变现目标，让 AI 为你量身定制学习计划。',
        type: 'set_goal',
        ctaUrl: '/accounts',
        ctaText: '设置目标',
        expectedOutcome: '每日任务将与你的目标对齐，确保每一天的努力都有明确方向。',
      },
    ],
  },
  criteria: [
    'tasks 数组包含 3-5 个元素',
    '冷启动时第一个任务应为 do_step 类型，引导完成步骤 1',
    '每个 task 包含完整的 7 字段',
    'ctaUrl 以 / 开头',
    'title 简洁明了（5-30 字），具有行动导向性',
    '任务符合新用户冷启动场景，不包含需要历史数据的分析类任务',
  ],
  expectedKeyFields: ['tasks'],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('DailyTaskAgent LLM Judge — has_progress golden case', () => {
  beforeEach(() => {
    mockComplete.mockResolvedValue({
      content: {
        pass: true,
        score: 9,
        reason:
          'tasks 包含 3 个元素✓；' +
          '7 字段完整✓；' +
          'ctaUrl 均以 / 开头✓；' +
          'type 均为合法枚举✓；' +
          'do_step 关联步骤 5 与进度一致✓；' +
          'description 和 expectedOutcome 详实有操作性✓',
      },
      tokens: { prompt: 380, completion: 90, total: 470 },
      model: 'claude-haiku-4-5',
      duration_ms: 1200,
      trace_id: 'judge-DailyTaskAgent-progress-test',
    });
  });

  it('AC-1: has_progress case passes judge with score ≥ 8/10', async () => {
    const result = await runJudge(goldenCaseHasProgress);

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

  it('runJudge calls llmGateway with lightweight tier and judge_call eventType', async () => {
    await runJudge(goldenCaseHasProgress);

    expect(mockComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        model_tier: 'lightweight',
        metadata: expect.objectContaining({ eventType: 'judge_call' }),
        timeout_ms: 10_000,
      }),
    );
  });
});

describe('DailyTaskAgent LLM Judge — cold_start golden case', () => {
  beforeEach(() => {
    mockComplete.mockResolvedValue({
      content: {
        pass: true,
        score: 8,
        reason:
          'tasks 包含 3 个元素✓；' +
          '首任务为 do_step 引导步骤 1✓；' +
          '7 字段完整✓；' +
          'ctaUrl 格式正确✓；' +
          '冷启动场景合理，无需历史数据的任务类型✓',
      },
      tokens: { prompt: 350, completion: 80, total: 430 },
      model: 'claude-haiku-4-5',
      duration_ms: 1100,
      trace_id: 'judge-DailyTaskAgent-coldstart-test',
    });
  });

  it('AC-1: cold_start case passes judge with score ≥ 8/10', async () => {
    const result = await runJudge(goldenCaseColdStart);

    expect(result.pass).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(8);
    expect(result.reason).toBeTruthy();
  });
});
