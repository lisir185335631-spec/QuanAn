/**
 * Unit tests — PRD-4 US-006
 * MonetizationAgent: 单 mode · 5 场景(happy / fallback / 边缘(currentRevenue 缺失) / cold start / config)
 * AC-8: ≥ 4 tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MonetizationAgent, Step4bOutputSchema, MonetizationPlanOutputSchema } from '@/specialists/MonetizationAgent';
import { SchemaValidationError } from '@/specialists/base/errors';
import type { ILLMGateway, InvokeLLMResult } from '@/specialists/base/types';

// ── Hoisted shared state (vi.hoisted avoids "cannot access before initialization") ──

const { mockAssemble, mockCostLogCreate } = vi.hoisted(() => ({
  mockAssemble: vi.fn().mockResolvedValue({
    systemPrompt: '- step1: {"industry":"beauty"}\n- step3: {"nickname":["测试"]}\n- step4: {"markdown":"# 执行计划"}',
    userPrompt: '<user_input>{}</user_input>',
    tools: [],
    metadata: { contextTokens: 0, layersUsed: ['L2_step_data', 'constants'], ragHits: [] },
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

// ── Fixtures ──────────────────────────────────────────────────────────────────

const VALID_STEP4B_CONTENT = {
  currentAnalysis: '目前处于 IP 孵化期，粉丝基础尚在建立中，建议从低门槛变现入手',
  ladder: [
    { stage: '阶段一：信任建立', revenue: '0-3k/月', action: '发布干货内容，积累基础粉丝' },
    { stage: '阶段二：初步变现', revenue: '3k-2w/月', action: '推出知识付费产品，开启直播带货' },
    { stage: '阶段三：规模化', revenue: '2w+/月', action: '品牌合作 + 私域运营 + 高客单价' },
  ],
  revenueStructure: {
    primary: '知识付费课程',
    secondary: ['直播带货佣金', '品牌合作费'],
  },
  successCases: [
    { title: '护肤成分博主变现路径', summary: '从成分科普起步，6个月积累5万粉，月入过万' },
    { title: '美妆测评博主商业化', summary: '以真实测评建立口碑，品牌合作年收益超50万' },
  ],
};

function makeGateway(contents: unknown[]): ILLMGateway {
  let callIdx = 0;
  return {
    complete: vi.fn().mockImplementation(async () => {
      const content = contents[callIdx] ?? contents[contents.length - 1];
      callIdx++;
      return {
        content,
        tokens: { prompt: 300, completion: 1200, total: 1500 },
        model: 'claude-sonnet-4-6',
      } satisfies InvokeLLMResult;
    }),
  };
}

const BASE_REQ = {
  accountId: 42,
  userInput: {
    currentRevenue: '0',
    targetRevenue: '5000/月',
    resources: '有专业美妆知识，工作日有2小时创作时间',
  },
  traceId: 'trace-monetization-001',
  stepKey: 'step4b',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('MonetizationAgent', () => {
  beforeEach(() => {
    mockCostLogCreate.mockClear();
    // Reset to normal context (with step data)
    mockAssemble.mockResolvedValue({
      systemPrompt: '- step1: {"industry":"beauty"}\n- step3: {"nickname":["测试"]}\n- step4: {"markdown":"# 执行计划"}',
      userPrompt: '<user_input>{}</user_input>',
      tools: [],
      metadata: { contextTokens: 0, layersUsed: ['L2_step_data', 'constants'], ragHits: [] },
    });
  });

  // ── happy path ────────────────────────────────────────────────────────────

  it('happy path: returns valid Step4bOutput with ladder[3], successCases[2], writes cost_log', async () => {
    const agent = new MonetizationAgent(makeGateway([VALID_STEP4B_CONTENT]));
    const res = await agent.execute(BASE_REQ);

    const result = res.result as typeof VALID_STEP4B_CONTENT;
    expect(result.ladder).toHaveLength(3);
    expect(result.revenueStructure.secondary).toHaveLength(2);
    expect(result.successCases).toHaveLength(2);
    expect(typeof result.currentAnalysis).toBe('string');
    expect(Step4bOutputSchema.safeParse(res.result).success).toBe(true);
    expect(res.isFallback).toBe(false);
    expect(mockCostLogCreate).toHaveBeenCalledOnce();
    expect(mockCostLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          agentId: 'MonetizationAgent',
          callType: 'specialist_call',
        }),
      }),
    );
  });

  // ── fallback / schema retry ───────────────────────────────────────────────

  it('fallback: ladder has 4 stages → schema fails twice → returns fallback result (US-015 AC-1)', async () => {
    // US-015: with fallbackTemplate, schema errors no longer throw — they trigger fallback
    const badContent = {
      ...VALID_STEP4B_CONTENT,
      ladder: [
        { stage: '阶段一', revenue: '0-1k', action: '动作1' },
        { stage: '阶段二', revenue: '1k-5k', action: '动作2' },
        { stage: '阶段三', revenue: '5k-2w', action: '动作3' },
        { stage: '阶段四', revenue: '2w+', action: '动作4' }, // 4 instead of 3 → fails schema
      ],
    };
    const agent = new MonetizationAgent(makeGateway([badContent, badContent]));
    const res = await agent.execute(BASE_REQ);
    expect(res.isFallback).toBe(true);
    expect(res.modelUsed).toBe('fallback');
    expect(Step4bOutputSchema.safeParse(res.result).success).toBe(true);
  });

  // ── edge: currentRevenue missing (AC-5) ──────────────────────────────────

  it('edge: currentRevenue missing → prompt contains zero-base note, output is valid (AC-5)', async () => {
    const gateway = makeGateway([VALID_STEP4B_CONTENT]);
    const agent = new MonetizationAgent(gateway);
    const res = await agent.execute({
      ...BASE_REQ,
      userInput: { targetRevenue: '5000/月' }, // no currentRevenue
    });
    expect(Step4bOutputSchema.safeParse(res.result).success).toBe(true);
    // Verify prompt injection
    const callArgs = (gateway.complete as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as {
      userPrompt: string;
    };
    expect(callArgs.userPrompt).toContain('用户未填当前营收');
  });

  // ── cold start: no step data (AC-6) ──────────────────────────────────────

  it('cold start: succeeds with empty userInput; prompt contains cold-start note (AC-6)', async () => {
    // Simulate cold start — ContextAssembler returns no step data
    mockAssemble.mockResolvedValueOnce({
      systemPrompt: '[新用户 · 暂无 step 数据]',
      userPrompt: '<user_input>{}</user_input>',
      tools: [],
      metadata: { contextTokens: 0, layersUsed: [], ragHits: [] },
    });

    const gateway = makeGateway([VALID_STEP4B_CONTENT]);
    const agent = new MonetizationAgent(gateway);
    const res = await agent.execute({ ...BASE_REQ, userInput: {} });

    expect(res.result).toBeDefined();
    expect(Step4bOutputSchema.safeParse(res.result).success).toBe(true);
    // Verify cold start note injected
    const callArgs = (gateway.complete as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as {
      userPrompt: string;
    };
    expect(callArgs.userPrompt).toContain('[首次接触变现 · 暂无 IP 定位上下文]');
  });

  // ── config validation ─────────────────────────────────────────────────────

  it('config: five-layer structure and model_tier correct (AC-1)', () => {
    const agent = new MonetizationAgent();
    expect(agent.config.agentId).toBe('MonetizationAgent');
    expect(agent.config.persona.role).toBe('MonetizationAgent');
    expect(agent.config.memory.l2_read).toContain('stepData');
    expect(agent.config.tools).toContain('llm.complete');
    expect(agent.config.execution.model_tier).toBe('reasoning');
    expect(agent.config.execution.timeout_ms).toBe(45_000);
    expect(agent.config.execution.retry).toBe(1);
  });

  // ── monetization-plan mode ────────────────────────────────────────────────

  describe('monetization-plan mode', () => {
    const VALID_PLAN_CONTENT = {
      marketAnalysis: {
        industryAnalysis: 'AI智能体定制与OPC创业培训赛道',
        marketScale: '【建议参考】市场规模快速增长，个人IP商业化空间广阔。',
        competition: '竞争激烈但垂直细分仍有蓝海。',
        monetizationPotential: '变现潜力非常高，客单价高且可规模化。',
      },
      stages: [
        {
          number: 1,
          icon: 'trending',
          range: '建议目标 ¥0-90万',
          title: '起步阶段（建议参考）',
          duration: '建议 6-12 个月',
          coreStrategy: '【建议】积累私域，验证产品-市场契合',
          productMatrix: [
            {
              category: '引流品',
              name: '免费体验课',
              priceRange: '0元（建议）',
              targetCustomer: '对AI感兴趣的创业者',
              monthlyTarget: '建议目标 200-500人',
              monthlyRevenue: '建议目标 ¥0-5000',
            },
          ],
          keyActions: ['发布内容', '建立私域', '推出引流品'],
          risks: ['流量积累慢', '变现转化不稳定'],
        },
        {
          number: 2,
          icon: 'diamond',
          range: '建议目标 ¥100-1000万',
          title: '发展阶段（建议参考）',
          duration: '建议 12-24 个月',
          coreStrategy: '【建议】升级产品线，打造爆款',
          productMatrix: [
            {
              category: '利润品',
              name: '系统课程',
              priceRange: '9800元（建议）',
              targetCustomer: '有学习需求的OPC创业者',
              monthlyTarget: '建议目标 10-20人',
              monthlyRevenue: '建议目标 ¥10-20万',
            },
          ],
          keyActions: ['升级产品', '投放获客', '建立团队'],
          risks: ['团队管理难度', '竞争加剧'],
        },
        {
          number: 3,
          icon: 'crown',
          range: '建议目标 ¥1000万+',
          title: '规模化阶段（建议参考）',
          duration: '建议 24-48 个月',
          coreStrategy: '【建议】品牌化、平台化',
          productMatrix: [
            {
              category: '后端产品',
              name: '企业内训',
              priceRange: '10-100万元（建议）',
              targetCustomer: '企业客户',
              monthlyTarget: '建议目标 0.1-0.3单',
              monthlyRevenue: '建议目标 ¥1-30万',
            },
          ],
          keyActions: ['品牌化运营', '开发B端市场', '融资扩张'],
          risks: ['资本运作风险', '技术迭代快'],
        },
      ],
      revenueStructure: [
        { name: '定制服务', percentage: '40%', desc: '【建议配比】高客单价核心收入', highlight: true },
        { name: '培训课程', percentage: '35%', desc: '【建议配比】可规模化收入' },
        { name: '后端产品', percentage: '25%', desc: '【建议配比】高价值长期收入' },
      ],
      successCases: [
        {
          title: '【示例】AI教育IP成长路径',
          category: '示意性原型',
          journey: '典型成长路径（示例）：从AI工具教程起步 → 积累核心用户 → 推出系统课 → 建立平台。',
          outcome: '【示例参考】典型时间轴6-18个月，实际因执行力差异较大。',
          insight: '【核心启示】垂直深度是变现转化率的关键因素。',
        },
        {
          title: '【示例】技能服务型IP路径',
          category: '示意性原型',
          journey: '典型成长路径（示例）：展示案例 → 低价接单 → 涨价筛客 → 课程化。',
          outcome: '【示例参考】服务变产品是规模化关键。',
          insight: '【核心启示】尽早标准化，突破时间瓶颈。',
        },
      ],
    };

    it('monetization-plan: returns valid MonetizationPlanOutput with stages[3] and successCases[2]', async () => {
      const agent = new MonetizationAgent(makeGateway([VALID_PLAN_CONTENT]));
      const res = await agent.execute({ ...BASE_REQ, mode: 'monetization-plan', stepKey: 'step4b-plan' });

      const result = res.result as typeof VALID_PLAN_CONTENT;
      expect(result.stages).toHaveLength(3);
      expect(result.successCases).toHaveLength(2);
      expect(result.marketAnalysis.industryAnalysis).toBeTruthy();
      expect(result.revenueStructure.length).toBeGreaterThan(0);
      expect(res.isFallback).toBe(false);
    });

    it('monetization-plan: fallback satisfies MonetizationPlanOutputSchema', async () => {
      // Bad content triggers fallback — stages[] fails length(3)
      const badContent = { ...VALID_PLAN_CONTENT, stages: [] };
      const agent = new MonetizationAgent(makeGateway([badContent, badContent]));
      const res = await agent.execute({ ...BASE_REQ, mode: 'monetization-plan', stepKey: 'step4b-plan' });

      expect(res.isFallback).toBe(true);
      const parseResult = MonetizationPlanOutputSchema.safeParse(res.result);
      expect(parseResult.success).toBe(true);
    });

    it('monetization-plan: prompt includes advisory framing (plan persona)', async () => {
      const gateway = makeGateway([VALID_PLAN_CONTENT]);
      const agent = new MonetizationAgent(gateway);
      await agent.execute({ ...BASE_REQ, mode: 'monetization-plan', stepKey: 'step4b-plan' });

      const callArgs = (gateway.complete as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as {
        systemPrompt: string;
        userPrompt: string;
      };
      expect(callArgs.systemPrompt).toContain('建议性');
      expect(callArgs.systemPrompt).toContain('变现路径顾问');
      expect(callArgs.userPrompt).toContain('变现路径规划任务');
    });

    it('monetization-plan: existing tool mode unaffected', async () => {
      const toolContent = {
        productMatrix: ['课程A · 599元', '社群B · 2999元/年'],
        pricingStrategy: '阶梯定价策略',
        conversionFunnel: ['免费引流', '低价转化', '高价服务'],
      };
      const agent = new MonetizationAgent(makeGateway([toolContent]));
      const res = await agent.execute({ ...BASE_REQ, mode: 'monetization-tool', stepKey: 'tool-monetization' });

      expect(res.isFallback).toBe(false);
      const result = res.result as typeof toolContent;
      expect(result.productMatrix).toBeDefined();
      expect(result.pricingStrategy).toBeDefined();
      expect(result.conversionFunnel).toBeDefined();
    });
  });
});
