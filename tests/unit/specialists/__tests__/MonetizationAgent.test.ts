/**
 * Unit tests — PRD-4 US-006
 * MonetizationAgent: 单 mode · 5 场景(happy / fallback / 边缘(currentRevenue 缺失) / cold start / config)
 * AC-8: ≥ 4 tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MonetizationAgent, Step4bOutputSchema } from '@/specialists/MonetizationAgent';
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

  it('fallback: throws SchemaValidationError when ladder has 4 stages instead of 3 (AC-4)', async () => {
    const badContent = {
      ...VALID_STEP4B_CONTENT,
      ladder: [
        { stage: '阶段一', revenue: '0-1k', action: '动作1' },
        { stage: '阶段二', revenue: '1k-5k', action: '动作2' },
        { stage: '阶段三', revenue: '5k-2w', action: '动作3' },
        { stage: '阶段四', revenue: '2w+', action: '动作4' }, // 4 instead of 3
      ],
    };
    const agent = new MonetizationAgent(makeGateway([badContent, badContent]));
    await expect(agent.execute(BASE_REQ)).rejects.toThrow(SchemaValidationError);
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
});
