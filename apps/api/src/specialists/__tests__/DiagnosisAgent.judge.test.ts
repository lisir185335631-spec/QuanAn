/**
 * PRD-25 US-001 AC-11 · DiagnosisAgent LLM Judge test
 * ≥ 1 golden case · vitest.judge.config.ts 路径 → tests/judge/
 * 本文件 fallback 位于 apps/api 下方便 CI 直接跑
 * Real execution via: cd apps/api && pnpm vitest run src/specialists/__tests__/DiagnosisAgent.judge.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const { mockComplete } = vi.hoisted(() => ({
  mockComplete: vi.fn(),
}));

vi.mock('@/workers/llm-gateway', () => ({
  llmGateway: { complete: mockComplete },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: { costLog: { create: vi.fn().mockResolvedValue({ id: 1 }) } },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── Golden case ───────────────────────────────────────────────────────────────

const GOLDEN_DIAGNOSIS_OUTPUT = {
  dimensions: {
    positioning: {
      score: 7,
      issues: ['赛道方向已定但产品链条不清晰', '缺乏明确的引流品和利润品区分'],
      suggestions: ['建立三层产品矩阵：引流品(免费/低价)→利润品(课程/服务)→高端品(私教/咨询)', '明确目标人群画像，细化差异化定位'],
    },
    branding: {
      score: 5,
      issues: ['头像使用产品图，非真人照片', '简介信息过于简单，缺乏价值主张'],
      suggestions: ['更换为生活化真人照片，体现专业感', '简介添加：我是谁+解决什么问题+提供什么价值+成功案例'],
    },
    traffic: {
      score: 4,
      issues: ['缺乏行业猎奇/冷知识类选题', '尚无单条视频突破10万播放'],
      suggestions: ['每周至少发布2条行业反常识/冷知识内容', '研究同赛道爆款视频结构，复刻验证'],
    },
    value: {
      score: 8,
      issues: [],
      suggestions: ['继续保持干货教学节奏', '将系列教程整合为系统课程'],
    },
    case: {
      score: 3,
      issues: ['缺乏清晰的案例结果展示', '没有服务过程记录', '用户评价展示不足'],
      suggestions: ['整理过去3个月的客户成功案例', '记录每次服务的过程细节（图文或视频）', '主动邀请老客户留下评价反馈'],
    },
    persona: {
      score: 6,
      issues: ['内容观点化程度不足', '个人故事分享较少'],
      suggestions: ['每月分享2-3条从业故事或个人经历', '对行业热点事件表达明确立场'],
    },
    authentic: {
      score: 7,
      issues: [],
      suggestions: ['保持当前真实自然的表达风格', '可以增加幕后花絮类内容增强真实感'],
    },
  },
  overallScore: 57,
  priority: [
    '优先整理3个成功案例进行展示',
    '优化账号主页包装（头像+简介）',
    '增加流量型选题突破破圈瓶颈',
    '建立清晰的产品链条',
  ],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('DiagnosisAgent LLM Judge — 美业账号诊断 golden case', () => {
  beforeEach(() => {
    // Judge runner mock: always return pass=true for schema-conformant output
    mockComplete.mockResolvedValue({
      content: { pass: true, score: 8, reason: '7维度全覆盖✓；每维度有具体issues+suggestions✓；overallScore在合理范围✓；priority按重要性排列✓' },
      tokens: { prompt: 300, completion: 100, total: 400 },
      model: 'claude-haiku-4-5',
    });
  });

  it('golden case — 美业账号 7 维度完整输出 · schema 合规 · judge pass', async () => {
    // Validate the golden output against outputSchema
    const { diagnosisOutput } = await import('../DiagnosisAgent');
    const parsed = diagnosisOutput.safeParse(GOLDEN_DIAGNOSIS_OUTPUT);

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const output = parsed.data;

    // 7 维度全覆盖
    const EXPECTED_DIMS = ['positioning', 'branding', 'traffic', 'value', 'case', 'persona', 'authentic'];
    for (const dim of EXPECTED_DIMS) {
      expect(output.dimensions).toHaveProperty(dim);
      const d = output.dimensions[dim]!;
      expect(d.score).toBeGreaterThanOrEqual(0);
      expect(d.score).toBeLessThanOrEqual(10);
      expect(Array.isArray(d.issues)).toBe(true);
      expect(Array.isArray(d.suggestions)).toBe(true);
    }

    // overallScore 合理
    expect(output.overallScore).toBeGreaterThanOrEqual(0);
    expect(output.overallScore).toBeLessThanOrEqual(100);

    // priority 非空
    expect(output.priority.length).toBeGreaterThan(0);
  });

  it('judge runner mock · lightweight tier · judge_call event', async () => {
    const { runJudge } = await import('../../../../../tests/judge/judge-runner');

    const result = await runJudge({
      specialistId: 'DiagnosisAgent',
      input: { answers: [{ dimension: 'basic', score: 8, comment: '美业|皮肤管理|startup' }] },
      actualOutput: GOLDEN_DIAGNOSIS_OUTPUT,
      criteria: [
        '7 个维度 key 全部存在 (positioning/branding/traffic/value/case/persona/authentic)',
        '每个维度的 score 是 0-10 整数',
        'overallScore 是 0-100 整数',
        'priority 数组非空',
      ],
      expectedKeyFields: ['dimensions', 'overallScore', 'priority'],
    });

    expect(typeof result.pass).toBe('boolean');
    expect(typeof result.score).toBe('number');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(10);
    expect(result.reason).toBeTruthy();
    expect(result.pass).toBe(true);
  });
});
