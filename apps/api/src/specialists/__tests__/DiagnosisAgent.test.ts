/**
 * PRD-25 US-001 AC-10 · DiagnosisAgent unit tests
 * ≥ 3 test cases · mock LLMGateway
 * (a) prompt 含 7 维度定义关键字
 * (b) outputSchema 严守
 * (c) responseFormat='json'
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { DiagnosisAgent, diagnosisOutput } from '../DiagnosisAgent';

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

// ── Helpers ───────────────────────────────────────────────────────────────────

const VALID_ANSWERS = [
  { dimension: 'basic', score: 8, comment: '美业|皮肤管理|startup' },
  { dimension: 'positioning', score: 7 },
  { dimension: 'branding', score: 6 },
  { dimension: 'traffic', score: 5 },
  { dimension: 'value', score: 8 },
  { dimension: 'case', score: 4 },
  { dimension: 'persona', score: 6 },
  { dimension: 'authentic', score: 7 },
];

const VALID_LLM_RESULT = {
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

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('DiagnosisAgent', () => {
  const TEST_ACCOUNT_ID = 9999;

  beforeEach(() => {
    mockComplete.mockResolvedValue({
      content: VALID_LLM_RESULT,
      tokens: { prompt: 800, completion: 400, total: 1200 },
      model: 'claude-sonnet-4-6',
    });
  });

  // (a) prompt 含 7 维度定义关键字
  it('(a) invokeLLM 调用时 userPrompt 含 7 维度关键字', async () => {
    const agent = new DiagnosisAgent();
    await agent.execute({ accountId: TEST_ACCOUNT_ID, userInput: { answers: VALID_ANSWERS } });

    expect(mockComplete).toHaveBeenCalledOnce();
    const callArg = mockComplete.mock.calls[0]?.[0] as { userPrompt: string; systemPrompt: string };

    // AC-10: userPrompt 含 7 维度关键字
    expect(callArg.userPrompt).toContain('positioning');
    expect(callArg.userPrompt).toContain('branding');
    expect(callArg.userPrompt).toContain('traffic');
    expect(callArg.userPrompt).toContain('value');
    expect(callArg.userPrompt).toContain('case');
    expect(callArg.userPrompt).toContain('persona');
    expect(callArg.userPrompt).toContain('authentic');

    // system prompt 含 7 维度定义 (来自 DIAGNOSIS_TEMPLATE)
    expect(callArg.systemPrompt).toContain('positioning');
    expect(callArg.systemPrompt).toContain('branding');
    expect(callArg.systemPrompt).toContain('authentic');
    expect(callArg.systemPrompt.length).toBeGreaterThanOrEqual(800);
  });

  // (b) outputSchema 严守
  it('(b) LLM 返回数据通过 outputSchema.safeParse · schema-conformant', async () => {
    const agent = new DiagnosisAgent();
    const result = await agent.execute({ accountId: TEST_ACCOUNT_ID, userInput: { answers: VALID_ANSWERS } });

    // outputSchema 严守 — 7 维度都存在
    const parsed = diagnosisOutput.safeParse(result.result);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(Object.keys(parsed.data.dimensions)).toHaveLength(7);
      expect(parsed.data.overallScore).toBeGreaterThanOrEqual(0);
      expect(parsed.data.overallScore).toBeLessThanOrEqual(100);
      expect(Array.isArray(parsed.data.priority)).toBe(true);
    }
  });

  // (c) responseFormat='json' + model_tier 不硬编码
  it('(c) invokeLLM 使用 responseFormat json_schema + model_tier from config (不硬编码)', async () => {
    const agent = new DiagnosisAgent();
    await agent.execute({ accountId: TEST_ACCOUNT_ID, userInput: { answers: VALID_ANSWERS } });

    const callArg = mockComplete.mock.calls[0]?.[0] as {
      responseFormat: { type: string; schema: unknown };
      model_tier: string;
    };

    expect(callArg.responseFormat).toBeDefined();
    expect(callArg.responseFormat.type).toBe('json_schema');
    expect(callArg.responseFormat.schema).toBeDefined();

    // D-019/REJ-003: model_tier 来自 config · 不硬编码 model name
    expect(callArg.model_tier).toBe('reasoning');
  });

  // (d) isFallback=false on success path
  it('(d) isFallback=false · modelUsed from gateway · tokensUsed > 0', async () => {
    const agent = new DiagnosisAgent();
    const result = await agent.execute({ accountId: TEST_ACCOUNT_ID, userInput: { answers: VALID_ANSWERS } });

    expect(result.isFallback).toBe(false);
    expect(result.modelUsed).toBe('claude-sonnet-4-6');
    expect(result.tokensUsed.total).toBe(1200);
  });
});
