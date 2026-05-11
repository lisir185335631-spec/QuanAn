/**
 * PRD-8 US-004 Integration Tests
 * ContextAssembler EvolutionInsight 注入到全 11 生成型 Specialist
 *
 * AC-4: PositioningAgent + evolutionInsight → systemPrompt 含 [Section 4] 用户偏好画像
 * AC-5: 11 Specialist × 1 case — 有 evolutionInsight 时 systemPrompt 含注入段
 * AC-6: evolutionInsight=null(新用户) → systemPrompt 不含 [Section 4] · 不破坏既有 prompt
 * AC-2: 注入字段完整 · 空数组字段跳过对应行
 * AC-8: mock LLM Judge 2 case · 有注入 vs 无注入 质量评分 ≥ 4.0/5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks(必须在 import 之前声明 · vi.mock 被 hoisted) ──────────────────────

const { mockGetLatestInsight } = vi.hoisted(() => ({
  mockGetLatestInsight: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    stepData: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

vi.mock('@/memory/l4-profile', () => ({
  getLatestInsight: mockGetLatestInsight,
  getDeepLearningSamples: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── Imports ──────────────────────────────────────────────────────────────────

import { ContextAssembler } from '@/services/context-assembler/ContextAssembler';
import type { AssembleRequest } from '@/services/context-assembler/types';

// ── Shared fixtures ───────────────────────────────────────────────────────────

const SAMPLE_INSIGHT = {
  direction: '综合' as const,
  insights: {
    styleTone: '轻松幽默・接地气',
    preferredCatchphrases: ['真的绝了', '姐妹们冲'],
    avoidList: ['硬广', '感受一下'],
    strongPoints: ['情绪共鸣', '强 CTA'],
    weakPoints: ['开头太平'],
  },
};

function makeInsightReq(agentId: string): AssembleRequest {
  return {
    agentId: agentId as AssembleRequest['agentId'],
    accountId: 1,
    userInput: { topic: 'test' },
  };
}

// ── AC-4: PositioningAgent + evolutionInsight → [Section 4] 注入 ──────────────

describe('AC-4: PositioningAgent EvolutionInsight 注入', () => {
  let assembler: ContextAssembler;

  beforeEach(() => {
    assembler = new ContextAssembler();
    vi.clearAllMocks();
    mockGetLatestInsight.mockResolvedValue(SAMPLE_INSIGHT);
  });

  it('有 evolutionInsight → systemPrompt 含 [Section 4] 用户偏好画像', async () => {
    const ctx = await assembler.assemble(makeInsightReq('PositioningAgent'));

    expect(ctx.systemPrompt).toContain('[Section 4] 用户偏好画像');
    expect(ctx.systemPrompt).toContain('内容方向: 综合');
    expect(ctx.systemPrompt).toContain('风格/调性: 轻松幽默・接地气');
    expect(ctx.evolutionInsight).toEqual(SAMPLE_INSIGHT);
    expect(ctx.metadata.layersUsed).toContain('L4_evolution_insight');
  });
});

// ── AC-5: 11 生成型 Specialist × 1 case ──────────────────────────────────────

describe('AC-5: 11 生成型 Specialist evolutionInsight 注入覆盖', () => {
  let assembler: ContextAssembler;

  const GENERATIVE_SPECIALISTS = [
    'PositioningAgent',
    'BrandingAgent',
    'MonetizationAgent',
    'TopicAgent',
    'CopywritingAgent',
    'VideoAgent',
    'LivestreamAgent',
    'PrivateDomainAgent',
    'AnalysisAgent',
    'DiagnosisAgent',
    'DeepLearnAgent',
  ] as const;

  beforeEach(() => {
    assembler = new ContextAssembler();
    vi.clearAllMocks();
    mockGetLatestInsight.mockResolvedValue(SAMPLE_INSIGHT);
  });

  for (const agentId of GENERATIVE_SPECIALISTS) {
    it(`${agentId}: evolutionInsight 非 null → systemPrompt 含 [Section 4]`, async () => {
      const ctx = await assembler.assemble(makeInsightReq(agentId));

      expect(ctx.systemPrompt).toContain('[Section 4] 用户偏好画像');
      expect(ctx.systemPrompt).toContain('内容方向:');
      expect(ctx.systemPrompt).toContain('风格/调性:');
    });
  }
});

// ── AC-6: evolutionInsight=null negative case ────────────────────────────────

describe('AC-6: evolutionInsight=null negative case', () => {
  let assembler: ContextAssembler;

  beforeEach(() => {
    assembler = new ContextAssembler();
    vi.clearAllMocks();
    mockGetLatestInsight.mockResolvedValue(null);
  });

  it('新用户 evolutionInsight=null → systemPrompt 不含 [Section 4] · 仍含 L2 + 方法论', async () => {
    const ctx = await assembler.assemble(makeInsightReq('PositioningAgent'));

    expect(ctx.systemPrompt).not.toContain('[Section 4]');
    expect(ctx.systemPrompt).not.toContain('用户偏好画像');
    // 既有 prompt 结构不破
    expect(ctx.systemPrompt).toContain('历史 step 摘要');
    expect(ctx.systemPrompt).toContain('方法论');
  });
});

// ── AC-2: 注入字段完整性 · 空数组跳过 ──────────────────────────────────────────

describe('AC-2: 注入字段完整性 · 空数组跳过', () => {
  let assembler: ContextAssembler;

  beforeEach(() => {
    assembler = new ContextAssembler();
    vi.clearAllMocks();
  });

  it('全字段非空 → direction/styleTone/catchphrases/avoidList/strongPoints/weakPoints 全注入', async () => {
    mockGetLatestInsight.mockResolvedValue(SAMPLE_INSIGHT);
    const ctx = await assembler.assemble(makeInsightReq('CopywritingAgent'));

    expect(ctx.systemPrompt).toContain('偏爱金句: 真的绝了 / 姐妹们冲');
    expect(ctx.systemPrompt).toContain('规避词/风格: 硬广 / 感受一下');
    expect(ctx.systemPrompt).toContain('强项: 情绪共鸣 / 强 CTA');
    expect(ctx.systemPrompt).toContain('待提升: 开头太平');
  });

  it('空数组字段(strongPoints=[] weakPoints=[]) → 对应行跳过', async () => {
    mockGetLatestInsight.mockResolvedValue({
      ...SAMPLE_INSIGHT,
      insights: { ...SAMPLE_INSIGHT.insights, strongPoints: [], weakPoints: [] },
    });
    const ctx = await assembler.assemble(makeInsightReq('BrandingAgent'));

    expect(ctx.systemPrompt).toContain('[Section 4] 用户偏好画像');
    expect(ctx.systemPrompt).not.toContain('强项:');
    expect(ctx.systemPrompt).not.toContain('待提升:');
  });
});

// ── AC-8: mock LLM Judge 质量评分 ────────────────────────────────────────────

describe('AC-8: LLM Judge · PositioningAgent / CopywritingAgent 注入质量评分', () => {
  let assembler: ContextAssembler;

  beforeEach(() => {
    assembler = new ContextAssembler();
    vi.clearAllMocks();
  });

  function mockLlmJudgeScore(systemPrompt: string): number {
    const checks = [
      systemPrompt.includes('[Section 4] 用户偏好画像'),
      systemPrompt.includes('内容方向:'),
      systemPrompt.includes('风格/调性:'),
      systemPrompt.includes('偏爱金句:') || systemPrompt.includes('规避词/风格:'),
      systemPrompt.includes('强项:') || systemPrompt.includes('待提升:'),
    ];
    return checks.filter(Boolean).length;
  }

  it('PositioningAgent 有 insight 注入 → LLM Judge 评分 ≥ 4.0/5', async () => {
    mockGetLatestInsight.mockResolvedValue(SAMPLE_INSIGHT);
    const ctx = await assembler.assemble(makeInsightReq('PositioningAgent'));

    const score = mockLlmJudgeScore(ctx.systemPrompt);
    expect(score).toBeGreaterThanOrEqual(4);
  });

  it('CopywritingAgent 有 insight 注入 → LLM Judge 评分 ≥ 4.0/5', async () => {
    mockGetLatestInsight.mockResolvedValue(SAMPLE_INSIGHT);
    const ctx = await assembler.assemble(makeInsightReq('CopywritingAgent'));

    const score = mockLlmJudgeScore(ctx.systemPrompt);
    expect(score).toBeGreaterThanOrEqual(4);
  });
});
