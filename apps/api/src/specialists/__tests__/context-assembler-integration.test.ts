/**
 * US-002 AC-4 · ContextAssembler 接通验证
 * 对 4 个 Specialist(DeepLearn/PrivateDomain/Presentation/Monetization)各验:
 * - mock contextAssembler.assemble() 返回含进化档案标记的 ctx
 *   (systemPrompt 里含 '[Section 4]' 字符串)
 * - spy llmGateway.complete
 * - 断言其收到的 systemPrompt 含该进化档案标记
 *
 * 注意: MonetizationAgent 默认 mode 走 ctx.systemPrompt;
 *       monetization-tool mode 走自建 systemPrompt(已有模板但本测不测 tool mode)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { DeepLearnAgent } from '../DeepLearnAgent';
import { MonetizationAgent } from '../MonetizationAgent';
import { PresentationAgent } from '../PresentationAgent';
import { PrivateDomainAgent } from '../PrivateDomainAgent';

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const { mockComplete } = vi.hoisted(() => ({
  mockComplete: vi.fn(),
}));

// ContextAssembler mock — 返回带 evolutionInsight 标记的 ctx
vi.mock('@/services/context-assembler/ContextAssembler', () => ({
  contextAssembler: {
    assemble: vi.fn().mockResolvedValue({
      systemPrompt: '[Section 4] 用户偏好画像\n- 内容方向: 美妆护肤\n- 风格/调性: 温暖亲切',
      userPrompt: '<user_input>{}</user_input>',
      tools: [],
      evolutionInsight: {
        direction: '美妆护肤',
        insights: {
          styleTone: '温暖亲切',
          preferredCatchphrases: [],
          avoidList: [],
          strongPoints: [],
          weakPoints: [],
        },
      },
      metadata: { contextTokens: 100, layersUsed: ['L4_evolution_insight'], ragHits: [] },
    }),
  },
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

vi.mock('@/services/admin/feature-flag/feature-flag.service', () => ({
  getSystemConfigValue: vi.fn().mockResolvedValue(false),
}));

vi.mock('@/services/admin/prompt-version/prompt-version.service', () => ({
  getActivePromptVersion: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/workers/methodology-query', () => ({
  methodologyQueryWorker: {
    getAll: vi.fn().mockReturnValue({
      scriptTypes: [],
      hotElements: [],
      industries: [],
    }),
  },
}));

// ── Shared fixture ─────────────────────────────────────────────────────────────

const EVOLUTION_INSIGHT_MARKER = '[Section 4]';
const TEST_ACCOUNT_ID = 9999;

// ── DeepLearnAgent ─────────────────────────────────────────────────────────────

describe('AC-4: DeepLearnAgent · ctx.systemPrompt 含进化档案标记', () => {
  beforeEach(() => {
    mockComplete.mockClear();
    mockComplete.mockResolvedValue({
      content: {
        summary: '测试摘要',
        dimensions: {
          tone: '测试语气',
          structure: '测试结构',
          hook: '测试钩子',
          transition: '测试转折',
          closing: '测试收尾',
        },
      },
      tokens: { prompt: 100, completion: 50, total: 150 },
      model: 'claude-haiku-4-5',
    });
  });

  it('llmGateway.complete 收到的 systemPrompt 含进化档案 [Section 4]', async () => {
    const agent = new DeepLearnAgent();
    await agent.execute({
      accountId: TEST_ACCOUNT_ID,
      userId: 1,
      userInput: {
        samples: [{ text: '这是一篇测试文案样本，内容足够长以通过最小长度验证。', source: '测试来源' }],
      },
    });

    expect(mockComplete).toHaveBeenCalled();
    const callArgs = mockComplete.mock.calls[0]![0] as { systemPrompt: string };
    expect(callArgs.systemPrompt).toContain(EVOLUTION_INSIGHT_MARKER);
  });
});

// ── PrivateDomainAgent ────────────────────────────────────────────────────────

describe('AC-4: PrivateDomainAgent · ctx.systemPrompt 含进化档案标记', () => {
  beforeEach(() => {
    mockComplete.mockClear();
    mockComplete.mockResolvedValue({
      content: {
        phaseScript: '欢迎话术',
        variants: { professional: '专业版', friendly: '亲切版', sales: '销售版' },
      },
      tokens: { prompt: 100, completion: 50, total: 150 },
      model: 'claude-haiku-4-5',
    });
  });

  it('llmGateway.complete 收到的 systemPrompt 含进化档案 [Section 4]', async () => {
    const agent = new PrivateDomainAgent();
    await agent.execute({
      accountId: TEST_ACCOUNT_ID,
      userId: 1,
      userInput: {
        phase: 'welcome',
        productDescription: '高端护肤品',
        productPrice: 299,
        targetAudience: '25-35岁女性',
        ipPositioning: '美妆博主',
        currentChannel: 'wechat',
        monthlyTraffic: 5000,
      },
    });

    expect(mockComplete).toHaveBeenCalled();
    const callArgs = mockComplete.mock.calls[0]![0] as { systemPrompt: string };
    expect(callArgs.systemPrompt).toContain(EVOLUTION_INSIGHT_MARKER);
  });
});

// ── PresentationAgent ─────────────────────────────────────────────────────────

describe('AC-4: PresentationAgent · ctx.systemPrompt 含进化档案标记', () => {
  beforeEach(() => {
    mockComplete.mockClear();
    mockComplete.mockResolvedValue({
      content: {
        recommendedStyles: [
          { id: 'talking_head', label: '口播', description: '描述', tips: '技巧', matchScore: 85, rationale: '理由' },
          { id: 'tutorial', label: '教程', description: '描述', tips: '技巧', matchScore: 80, rationale: '理由' },
          { id: 'vlog', label: 'Vlog', description: '描述', tips: '技巧', matchScore: 75, rationale: '理由' },
        ],
      },
      tokens: { prompt: 100, completion: 50, total: 150 },
      model: 'claude-haiku-4-5',
    });
  });

  it('llmGateway.complete 收到的 systemPrompt 含进化档案 [Section 4]', async () => {
    const agent = new PresentationAgent();
    await agent.execute({
      accountId: TEST_ACCOUNT_ID,
      userId: 1,
      userInput: {
        text: '这是一段测试文案，用于验证呈现形式推荐的进化档案注入',
        platform: 'douyin',
      },
    });

    expect(mockComplete).toHaveBeenCalled();
    const callArgs = mockComplete.mock.calls[0]![0] as { systemPrompt: string };
    expect(callArgs.systemPrompt).toContain(EVOLUTION_INSIGHT_MARKER);
  });
});

// ── MonetizationAgent ─────────────────────────────────────────────────────────

describe('AC-4: MonetizationAgent · ctx.systemPrompt 含进化档案标记', () => {
  beforeEach(() => {
    mockComplete.mockClear();
    mockComplete.mockResolvedValue({
      content: {
        currentAnalysis: '当前分析',
        ladder: [
          { stage: '阶段一', revenue: '0-3k', action: '行动一' },
          { stage: '阶段二', revenue: '3k-2w', action: '行动二' },
          { stage: '阶段三', revenue: '2w+', action: '行动三' },
        ],
        revenueStructure: {
          primary: '知识付费',
          secondary: ['品牌合作', '直播带货'],
        },
        successCases: [
          { title: '案例一', summary: '摘要一' },
          { title: '案例二', summary: '摘要二' },
        ],
      },
      tokens: { prompt: 100, completion: 50, total: 150 },
      model: 'claude-haiku-4-5',
    });
  });

  it('llmGateway.complete 收到的 systemPrompt 含进化档案 [Section 4]', async () => {
    const agent = new MonetizationAgent();
    await agent.execute({
      accountId: TEST_ACCOUNT_ID,
      userId: 1,
      userInput: {
        currentRevenue: '3000',
      },
    });

    expect(mockComplete).toHaveBeenCalled();
    const callArgs = mockComplete.mock.calls[0]![0] as { systemPrompt: string };
    expect(callArgs.systemPrompt).toContain(EVOLUTION_INSIGHT_MARKER);
  });
});
