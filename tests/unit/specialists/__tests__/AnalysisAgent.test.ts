/**
 * Unit tests — PRD-5 US-002
 * AnalysisAgent: non-SSE · 2 mode × 4 scenarios = 8 unit tests
 * AC-14: happy / fallback / cold-start / config 验证
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  AnalysisAgent,
  analysisAgent,
} from '@/specialists/AnalysisAgent';
import type { ILLMGateway } from '@/specialists/base/types';

// ── Hoisted shared state ───────────────────────────────────────────────────────

const { mockAssemble, mockCostLogCreate } = vi.hoisted(() => ({
  mockAssemble: vi.fn().mockResolvedValue({
    systemPrompt: '- step1: {"industry":"beauty"}',
    userPrompt: '<user_input>{}</user_input>',
    tools: [],
    metadata: {
      contextTokens: 0,
      layersUsed: ['L2_step_data', 'constants'],
      ragHits: [],
    },
  }),
  mockCostLogCreate: vi.fn().mockResolvedValue({ id: BigInt(1) }),
}));

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/services/context-assembler/ContextAssembler', () => ({
  contextAssembler: { assemble: mockAssemble },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: { costLog: { create: mockCostLogCreate } },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeViralOutput() {
  const rewrite =
    '这是一篇基于 22 元素心理学的仿写版文案，换了行业但保留了原文核心结构与情绪张力。非常适合内容创作者直接使用。';
  return {
    analysis: {
      elements: ['curiosity', 'contrast'],
      structure: '钩子→痛点→案例→仿写',
      hookType: 'opening_5s',
      viralFormula: '好奇 + 反差 → 情绪共鸣 → 行动',
    },
    viralStructure: {
      hook: '你是否还在为内容没有播放量而烦恼？',
      body: '通过对比反差结构展现落差感，引发情绪共鸣后给出解决方案。',
      cta: '关注我获取更多干货',
    },
    insights: [
      { element: 'curiosity', explanation: '标题制造信息缺口', impact: '高' as const },
      { element: 'contrast', explanation: '对比展现落差感', impact: '高' as const },
      { element: 'resonance', explanation: '与目标用户日常共鸣', impact: '中' as const },
    ],
    rewriteVersion: rewrite,
    hookAnalysis: {
      score: 75,
      maxScore: 100,
      type: '提问型',
      technique: '通过问题引发用户好奇心。',
      evaluation: '效果良好，可加入数字增强。',
    },
    topicStrategy: {
      category: '内容创作',
      angle: '爆款文案分析',
      targetAudience: '内容创作者',
      evaluation: '选题精准，切入角度新颖。',
    },
    timeline: ['开头：钩子引入', '中段：展开论点', '结尾：引导行动'],
  };
}

function makeStructuralOutput() {
  const snippet = '这是优化后的关键段落示例，包含更清晰的钩子和更强的行动引导，建议参考此结构改写全文。语言更简练有力。';
  return {
    scores: {
      hook: 75,
      structure: 80,
      emotion: 65,
      specificity: 60,
      cta: 70,
      overall: 70,
    },
    optimizations: [
      { dimension: 'hook', issue: '钩子不够强', suggestion: '加入数字或悬念' },
      { dimension: 'specificity', issue: '内容抽象', suggestion: '增加具体案例' },
      { dimension: 'cta', issue: 'CTA 不明确', suggestion: '结尾明确指示' },
    ],
    rewriteSnippet: snippet,
    elements: ['钩子开场', '痛点共鸣'],
    pros: ['结构清晰，层次分明。'],
    cons: ['结尾引导不足。'],
  };
}

function makeCompleteGateway(content: unknown, model = 'lightweight-model-mock'): ILLMGateway {
  return {
    complete: vi.fn().mockResolvedValue({
      content,
      tokens: { prompt: 200, completion: 500, total: 700 },
      model,
    }),
  };
}

const VIRAL_REQ = {
  accountId: 42,
  traceId: 'test-viral-001',
  mode: 'viral',
};

const STRUCTURAL_REQ = {
  accountId: 42,
  traceId: 'test-structural-001',
  mode: 'structural',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AnalysisAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── viral mode × 4 scenarios ────────────────────────────────────────────────

  it('viral happy path: returns valid AnalysisViralOutput', async () => {
    const content = makeViralOutput();
    const agent = new AnalysisAgent(makeCompleteGateway(content));
    const res = await agent.execute({
      ...VIRAL_REQ,
      userInput: { lastCopy: '这是一篇爆款文案内容，包含了多个心理学元素。', lastTitle: '爆款标题' },
    });

    expect(res.isFallback).toBe(false);
    expect(res.result).toMatchObject({
      analysis: { elements: ['curiosity', 'contrast'] },
      insights: expect.arrayContaining([
        expect.objectContaining({ element: 'curiosity' }),
      ]),
      rewriteVersion: expect.any(String),
    });
    expect(res.tokensUsed.total).toBe(700);
    expect(res.modelUsed).toBe('lightweight-model-mock');
  });

  it('viral fallback: schema validation failure triggers isFallback=true', async () => {
    // Return malformed content (insights < 3) to trigger schema validation → fallback
    const badContent = {
      analysis: { elements: [], structure: '', hookType: '', viralFormula: '' },
      insights: [{ element: 'x', explanation: 'y', impact: '高' }], // only 1, need min(3)
      rewriteVersion: 'short', // < min(50) chars
    };
    const agent = new AnalysisAgent(makeCompleteGateway(badContent));
    const res = await agent.execute({
      ...VIRAL_REQ,
      userInput: { lastCopy: '爆款文案内容文案内容' },
    });

    expect(res.isFallback).toBe(true);
  });

  it('viral cold-start: no userInput context still calls LLM (passthrough inputSchema)', async () => {
    const content = makeViralOutput();
    const gateway = makeCompleteGateway(content);
    const agent = new AnalysisAgent(gateway);
    await agent.execute({
      ...VIRAL_REQ,
      userInput: { lastCopy: '任意爆款内容文字，至少十个字以上。' },
    });

    expect(gateway.complete).toHaveBeenCalledOnce();
    // Verify model_tier is lightweight (not reasoning)
    const callArg = (gateway.complete as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(callArg.model_tier).toBe('lightweight');
    expect(callArg.timeout_ms).toBe(30_000);
  });

  it('viral config: model_tier=lightweight, streaming=false, timeout_ms=30000', () => {
    const agent = new AnalysisAgent(makeCompleteGateway(makeViralOutput()));
    expect(agent.config.execution.model_tier).toBe('lightweight');
    expect(agent.config.execution.streaming).toBe(false);
    expect(agent.config.execution.timeout_ms).toBe(30_000);
    expect(agent.config.tools).toContain('llm.complete');
    expect(agent.config.knowledge.constants).toContain('hotElements');
    expect(agent.config.memory.l2_write).toContain('history');
  });

  // ── structural mode × 4 scenarios ──────────────────────────────────────────

  it('structural happy path: returns valid AnalysisStructuralOutput', async () => {
    const content = makeStructuralOutput();
    const agent = new AnalysisAgent(makeCompleteGateway(content));
    const res = await agent.execute({
      ...STRUCTURAL_REQ,
      userInput: { copy: '这是用户自己写的一篇文案，至少十个字符以上。' },
    });

    expect(res.isFallback).toBe(false);
    expect(res.result).toMatchObject({
      scores: { hook: 75, overall: 70 },
      optimizations: expect.arrayContaining([
        expect.objectContaining({ dimension: 'hook' }),
      ]),
      rewriteSnippet: expect.any(String),
    });
    expect(res.modelUsed).toBe('lightweight-model-mock');
  });

  it('structural fallback: bad schema (missing optimizations) → isFallback=true', async () => {
    const badContent = {
      scores: { hook: 50, structure: 50, emotion: 50, specificity: 50, cta: 50, overall: 50 },
      optimizations: [], // min(3) fails
      rewriteSnippet: 'x', // < min(50) chars
    };
    const agent = new AnalysisAgent(makeCompleteGateway(badContent));
    const res = await agent.execute({
      ...STRUCTURAL_REQ,
      userInput: { copy: '这是一篇需要评分的文案，字数超过十个字。' },
    });

    expect(res.isFallback).toBe(true);
  });

  it('structural cold-start: LLM called with structural responseFormat schema', async () => {
    const content = makeStructuralOutput();
    const gateway = makeCompleteGateway(content);
    const agent = new AnalysisAgent(gateway);
    await agent.execute({
      ...STRUCTURAL_REQ,
      userInput: { copy: '这是一篇需要评分的用户文案内容，字数足够。' },
    });

    expect(gateway.complete).toHaveBeenCalledOnce();
    const callArg = (gateway.complete as ReturnType<typeof vi.fn>).mock.calls[0][0];
    // structural uses scores schema (different from viral)
    expect(callArg.responseFormat.schema.shape).toHaveProperty('scores');
    expect(callArg.responseFormat.schema.shape).toHaveProperty('optimizations');
  });

  it('structural config: agentId=AnalysisAgent, singleton export works', () => {
    const agent = new AnalysisAgent(makeCompleteGateway(makeStructuralOutput()));
    expect(agent.config.agentId).toBe('AnalysisAgent');
    expect(agent.config.memory.l2_read).toContain('stepData');

    // REJ-004: singleton export is the same class (AC-11)
    expect(analysisAgent).toBeInstanceOf(AnalysisAgent);
  });

  it('structural happy path: returns elements/pros/cons from agent', async () => {
    const content = makeStructuralOutput();
    const agent = new AnalysisAgent(makeCompleteGateway(content));
    const res = await agent.execute({
      ...STRUCTURAL_REQ,
      userInput: { copy: '这是用户自己写的一篇文案，至少十个字符以上。' },
    });

    expect(res.isFallback).toBe(false);
    expect(res.result).toMatchObject({
      elements: expect.arrayContaining(['钩子开场', '痛点共鸣']),
      pros: expect.arrayContaining(['结构清晰，层次分明。']),
      cons: expect.arrayContaining(['结尾引导不足。']),
    });
  });

  it('viral happy path: returns hookAnalysis/topicStrategy/timeline from agent', async () => {
    const content = makeViralOutput();
    const agent = new AnalysisAgent(makeCompleteGateway(content));
    const res = await agent.execute({
      ...VIRAL_REQ,
      userInput: { lastCopy: '这是一篇爆款文案内容，包含了多个心理学元素。', lastTitle: '爆款标题' },
    });

    expect(res.isFallback).toBe(false);
    expect(res.result).toMatchObject({
      hookAnalysis: expect.objectContaining({ score: 75, type: '提问型' }),
      topicStrategy: expect.objectContaining({ category: '内容创作' }),
      timeline: expect.arrayContaining(['开头：钩子引入']),
    });
  });
});
