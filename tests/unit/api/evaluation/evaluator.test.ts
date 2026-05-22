/**
 * QuanAn · PRD-28 US-005 · evaluator.ts unit tests
 * AC-8: ≥ 4 cases covering structurePass / judgeScore / judgePass / durationMs / tokensUsed / costUsd
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/specialists/PositioningAgent', () => ({
  positioningAgent: {
    execute: vi.fn(),
  },
}));

vi.mock('@/specialists/BrandingAgent', () => ({
  brandingAgent: { execute: vi.fn() },
}));
vi.mock('@/specialists/CopywritingAgent', () => ({
  copywritingAgent: { execute: vi.fn() },
}));
vi.mock('@/specialists/DeepLearnAgent', () => ({
  deepLearnAgent: { execute: vi.fn() },
}));
vi.mock('@/specialists/DiagnosisAgent', () => ({
  diagnosisAgent: { execute: vi.fn() },
}));
vi.mock('@/specialists/LivestreamAgent', () => ({
  livestreamAgent: { execute: vi.fn() },
}));
vi.mock('@/specialists/MonetizationAgent', () => ({
  monetizationAgent: { execute: vi.fn() },
}));
vi.mock('@/specialists/PresentationAgent', () => ({
  presentationAgent: { execute: vi.fn() },
}));
vi.mock('@/specialists/PrivateDomainAgent', () => ({
  privateDomainAgent: { execute: vi.fn() },
}));
vi.mock('@/specialists/TopicAgent', () => ({
  topicAgent: { execute: vi.fn() },
}));
vi.mock('@/specialists/VideoAgent', () => ({
  videoAgent: { execute: vi.fn() },
}));
vi.mock('@/specialists/VoiceChatAgent', () => ({
  voiceChatAgent: { execute: vi.fn() },
}));
vi.mock('@/specialists/AnalysisAgent', () => ({
  analysisAgent: { execute: vi.fn() },
}));
vi.mock('@/agents/specialists/DailyTaskAgent', () => ({
  dailyTaskAgent: { execute: vi.fn() },
}));
vi.mock('@/agents/evolution/EvolutionAgent', () => ({
  evolutionAgent: { execute: vi.fn() },
}));
vi.mock('@/lib/prisma', () => ({
  prisma: { costLog: { create: vi.fn().mockResolvedValue({ id: BigInt(1) }) } },
}));
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── Mock llmGateway for judge calls ───────────────────────────────────────────

const { mockComplete } = vi.hoisted(() => ({ mockComplete: vi.fn() }));
vi.mock('@/workers/llm-gateway', () => ({
  llmGateway: { complete: mockComplete },
}));

// ── Import after mocks ────────────────────────────────────────────────────────

import { runSampleEvaluation, JUDGE_PASS_THRESHOLD } from '@/evaluation/evaluator';
import { positioningAgent } from '@/specialists/PositioningAgent';

const mockPositioningExecute = vi.mocked(positioningAgent.execute);

// ── Fixture ───────────────────────────────────────────────────────────────────

const baseGolden = {
  id: 'sally-001',
  specialistId: 'PositioningAgent' as const,
  mode: 'industry',
  source: 'sally' as const,
  input: { industry: 'beauty' },
  expectedOutputPattern: { industry: 'string', recommendation: 'string' },
  criteria: ['industry 字段非空', 'recommendation ≥ 50 字符'],
  expectedKeyFields: ['industry', 'recommendation'],
};

const mockSpecialistResponse = {
  result: {
    industry: 'beauty',
    marketAnalysis: '市场分析内容'.repeat(10),
    competitionLevel: 'medium' as const,
    recommendation: '推荐内容'.repeat(20),
  },
  isFallback: false,
  durationMs: 1200,
  tokensUsed: { prompt: 500, completion: 300, total: 800 },
  modelUsed: 'claude-sonnet-4-6',
  traceId: 'test-trace-001',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('runSampleEvaluation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-8: returns structurePass=true when all expectedKeyFields present', async () => {
    mockPositioningExecute.mockResolvedValue(mockSpecialistResponse);
    mockComplete.mockResolvedValue({
      content: { pass: true, score: 8, reason: '两条 criteria 均满足' },
      tokens: { prompt: 50, completion: 30, total: 80 },
      model: 'claude-haiku-4-5',
    });

    const result = await runSampleEvaluation(baseGolden);

    expect(result.structurePass).toBe(true);
  });

  it('AC-8: returns structurePass=false when expectedKeyField missing', async () => {
    mockPositioningExecute.mockResolvedValue({
      ...mockSpecialistResponse,
      result: { industry: 'beauty' }, // missing 'recommendation'
    });
    mockComplete.mockResolvedValue({
      content: { pass: false, score: 3, reason: 'recommendation 字段缺失' },
      tokens: { prompt: 50, completion: 30, total: 80 },
      model: 'claude-haiku-4-5',
    });

    const result = await runSampleEvaluation(baseGolden);

    expect(result.structurePass).toBe(false);
  });

  it('AC-8: judgePass=true when judgeScore >= JUDGE_PASS_THRESHOLD (6)', async () => {
    mockPositioningExecute.mockResolvedValue(mockSpecialistResponse);
    mockComplete.mockResolvedValue({
      content: { pass: true, score: 7, reason: 'criteria 全满足' },
      tokens: { prompt: 50, completion: 30, total: 80 },
      model: 'claude-haiku-4-5',
    });

    const result = await runSampleEvaluation(baseGolden);

    expect(result.judgeScore).toBe(7);
    expect(result.judgePass).toBe(true);
    expect(JUDGE_PASS_THRESHOLD).toBe(6);
  });

  it('AC-8: judgePass=false when judgeScore < JUDGE_PASS_THRESHOLD', async () => {
    mockPositioningExecute.mockResolvedValue(mockSpecialistResponse);
    mockComplete.mockResolvedValue({
      content: { pass: false, score: 4, reason: 'recommendation 内容不足' },
      tokens: { prompt: 50, completion: 30, total: 80 },
      model: 'claude-haiku-4-5',
    });

    const result = await runSampleEvaluation(baseGolden);

    expect(result.judgeScore).toBe(4);
    expect(result.judgePass).toBe(false);
  });

  it('AC-8: returns durationMs / tokensUsed / costUsd from specialist response', async () => {
    mockPositioningExecute.mockResolvedValue(mockSpecialistResponse);
    mockComplete.mockResolvedValue({
      content: { pass: true, score: 8, reason: 'OK' },
      tokens: { prompt: 50, completion: 30, total: 80 },
      model: 'claude-haiku-4-5',
    });

    const result = await runSampleEvaluation(baseGolden);

    expect(result.durationMs).toBe(1200);
    expect(result.tokensUsed).toBe(800);
    // costUsd = (500 * 3.0 + 300 * 15.0) / 1_000_000 = (1500 + 4500) / 1_000_000 = 0.006
    expect(result.costUsd).toBeCloseTo(0.006, 5);
  });

  it('throws on unknown specialistId', async () => {
    const unknownGolden = { ...baseGolden, specialistId: 'UnknownAgent' as never };

    await expect(runSampleEvaluation(unknownGolden)).rejects.toThrow('Unknown specialist');
  });
});
