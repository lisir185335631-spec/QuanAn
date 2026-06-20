/**
 * DiagnosisAgent · PII 脱敏守护单测
 * R-14 / LD-018
 *
 * 验证 _buildUserPrompt 对 answers[].comment 正确脱敏:
 *   - comment 含手机号 → userPrompt 不含原文手机
 *   - comment 含邮箱 → userPrompt 不含原文邮箱
 *   - dimension/score(枚举/数值) → 不受影响
 *   - comment=undefined → 安全透传(不崩溃)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { DiagnosisAgent } from '../DiagnosisAgent';
import type { DiagnosisOutput } from '../DiagnosisAgent';

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const { mockComplete } = vi.hoisted(() => ({
  mockComplete: vi.fn(),
}));

vi.mock('@/workers/llm-gateway', () => ({
  llmGateway: { complete: mockComplete },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    stepData: { findMany: vi.fn().mockResolvedValue([]) },
    userQuota: { findUnique: vi.fn().mockResolvedValue(null) },
    costLog: { create: vi.fn().mockResolvedValue({ id: 1 }) },
  },
}));

vi.mock('@/memory/l4-profile', () => ({
  getLatestInsight: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/workers/rag', () => ({
  ragRetrieveWorker: { retrieve: vi.fn().mockResolvedValue([]) },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── Fixtures ─────────────────────────────────────────────────────────────────

const VALID_LLM_RESULT: DiagnosisOutput = {
  dimensions: {
    positioning: { score: 7, issues: ['定位略模糊'], suggestions: ['明确赛道'] },
    branding:    { score: 6, issues: ['头像待优化'], suggestions: ['换真人照片'] },
    traffic:     { score: 5, issues: ['破圈不足'], suggestions: ['增加猎奇内容'] },
    value:       { score: 8, issues: [], suggestions: ['持续输出干货'] },
    case:        { score: 4, issues: ['案例少'], suggestions: ['整理案例'] },
    persona:     { score: 6, issues: ['人设弱'], suggestions: ['分享故事'] },
    authentic:   { score: 7, issues: [], suggestions: ['保持真实'] },
  },
  overallScore: 61,
  priority: ['完善定位', '增加案例', '强化破圈'],
};

// 8 答案（diagnosisInput.length(8) 约束）
function makeAnswers(commentOverride?: Partial<Record<number, string>>) {
  return [
    { dimension: 'basic',       score: 7, ...(commentOverride?.[0] !== undefined ? { comment: commentOverride[0] } : {}) },
    { dimension: 'positioning', score: 6, ...(commentOverride?.[1] !== undefined ? { comment: commentOverride[1] } : {}) },
    { dimension: 'branding',    score: 5, ...(commentOverride?.[2] !== undefined ? { comment: commentOverride[2] } : {}) },
    { dimension: 'traffic',     score: 4, ...(commentOverride?.[3] !== undefined ? { comment: commentOverride[3] } : {}) },
    { dimension: 'value',       score: 8, ...(commentOverride?.[4] !== undefined ? { comment: commentOverride[4] } : {}) },
    { dimension: 'case',        score: 3, ...(commentOverride?.[5] !== undefined ? { comment: commentOverride[5] } : {}) },
    { dimension: 'persona',     score: 6, ...(commentOverride?.[6] !== undefined ? { comment: commentOverride[6] } : {}) },
    { dimension: 'authentic',   score: 7, ...(commentOverride?.[7] !== undefined ? { comment: commentOverride[7] } : {}) },
  ];
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('DiagnosisAgent.answers[].comment · PII 脱敏 (R-14)', () => {
  beforeEach(() => {
    mockComplete.mockClear();
    mockComplete.mockResolvedValue({
      content: VALID_LLM_RESULT,
      tokens: { prompt: 800, completion: 400, total: 1200 },
      model: 'claude-sonnet-4-6',
    });
  });

  it('answers[0].comment 含手机号 → llmGateway userPrompt 不含原文手机', async () => {
    const agent = new DiagnosisAgent();
    await agent.execute({
      accountId: 9999,
      userId: 1,
      userInput: { answers: makeAnswers({ 0: '有问题请拨打13900139001咨询' }) },
    });

    expect(mockComplete).toHaveBeenCalled();
    const callArgs = mockComplete.mock.calls[0]![0] as { userPrompt: string };
    expect(callArgs.userPrompt).not.toContain('13900139001');
    expect(callArgs.userPrompt).toContain('<PHONE>');
  });

  it('answers[2].comment 含邮箱 → llmGateway userPrompt 不含原文邮箱', async () => {
    const agent = new DiagnosisAgent();
    await agent.execute({
      accountId: 9999,
      userId: 1,
      userInput: { answers: makeAnswers({ 2: '请联系 support@startup.io 获取帮助' }) },
    });

    expect(mockComplete).toHaveBeenCalled();
    const callArgs = mockComplete.mock.calls[0]![0] as { userPrompt: string };
    expect(callArgs.userPrompt).not.toContain('support@startup.io');
    expect(callArgs.userPrompt).toContain('<EMAIL>');
  });

  it('多个 comment 各含不同 PII → 全部脱敏', async () => {
    const agent = new DiagnosisAgent();
    await agent.execute({
      accountId: 9999,
      userId: 1,
      userInput: {
        answers: makeAnswers({
          0: '有问题拨打13811112222',
          3: '发邮件 hello@test.cn',
        }),
      },
    });

    expect(mockComplete).toHaveBeenCalled();
    const callArgs = mockComplete.mock.calls[0]![0] as { userPrompt: string };
    expect(callArgs.userPrompt).not.toContain('13811112222');
    expect(callArgs.userPrompt).not.toContain('hello@test.cn');
    expect(callArgs.userPrompt).toContain('<PHONE>');
    expect(callArgs.userPrompt).toContain('<EMAIL>');
  });

  it('dimension/score(枚举/数值) 不受脱敏影响', async () => {
    const agent = new DiagnosisAgent();
    await agent.execute({
      accountId: 9999,
      userId: 1,
      userInput: { answers: makeAnswers() },
    });

    expect(mockComplete).toHaveBeenCalled();
    const callArgs = mockComplete.mock.calls[0]![0] as { userPrompt: string };
    // 维度名和分数必须原文保留
    expect(callArgs.userPrompt).toContain('positioning');
    expect(callArgs.userPrompt).toContain('branding');
    expect(callArgs.userPrompt).toContain('"score"');
  });

  it('comment=undefined → 不崩溃 · dimension/score 正常出现在 userPrompt', async () => {
    const agent = new DiagnosisAgent();
    // 无 comment 字段的 answers
    const answersNoComment = [
      { dimension: 'basic',       score: 7 },
      { dimension: 'positioning', score: 6 },
      { dimension: 'branding',    score: 5 },
      { dimension: 'traffic',     score: 4 },
      { dimension: 'value',       score: 8 },
      { dimension: 'case',        score: 3 },
      { dimension: 'persona',     score: 6 },
      { dimension: 'authentic',   score: 7 },
    ];
    await agent.execute({
      accountId: 9999,
      userId: 1,
      userInput: { answers: answersNoComment },
    });

    expect(mockComplete).toHaveBeenCalled();
    const callArgs = mockComplete.mock.calls[0]![0] as { userPrompt: string };
    expect(callArgs.userPrompt).toContain('basic');
    expect(callArgs.userPrompt).toContain('authentic');
  });

  it('无 PII 的 comment 正常透传(不误伤)', async () => {
    const agent = new DiagnosisAgent();
    await agent.execute({
      accountId: 9999,
      userId: 1,
      userInput: {
        answers: makeAnswers({ 0: '我的行业是美业皮肤管理' }),
      },
    });

    expect(mockComplete).toHaveBeenCalled();
    const callArgs = mockComplete.mock.calls[0]![0] as { userPrompt: string };
    expect(callArgs.userPrompt).toContain('美业皮肤管理');
  });
});
