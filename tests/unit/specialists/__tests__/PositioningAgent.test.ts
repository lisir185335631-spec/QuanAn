/**
 * Unit tests — PRD-4 US-004
 * PositioningAgent: 2 mode × 3 场景(happy / schema-retry / cold start)
 * AC-10: ≥ 6 tests
 * AC-12: cost_log 写入(specialist_call · agent_id='PositioningAgent')
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  PositioningAgent,
  Step1OutputSchema,
  Step4OutputSchema,
} from '@/specialists/PositioningAgent';
import { SchemaValidationError } from '@/specialists/base/errors';
import type { ILLMGateway, InvokeLLMResult } from '@/specialists/base/types';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/services/context-assembler/ContextAssembler', () => ({
  contextAssembler: {
    assemble: vi.fn().mockResolvedValue({
      systemPrompt: '[system: PositioningAgent · 定位顾问]',
      userPrompt: '<user_input>{}</user_input>',
      tools: [],
      metadata: { contextTokens: 0, layersUsed: [], ragHits: [] },
    }),
  },
}));

const { mockCostLogCreate } = vi.hoisted(() => ({
  mockCostLogCreate: vi.fn().mockResolvedValue({ id: BigInt(1) }),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: { costLog: { create: mockCostLogCreate } },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

// Step1 strings: each must be ≥ 50 chars (zod min(50))
const VALID_STEP1_CONTENT = {
  industry: 'beauty',
  marketAnalysis:
    '美妆市场竞争激烈，但护肤科普细分赛道用户需求旺盛，适合通过差异化内容创作实现快速增长，建议深耕细分领域',
  competitionLevel: 'high' as const,
  recommendation:
    '聚焦成分党护肤科普，以简洁易懂测评风格切入，通过高质量差异化内容建立专业信任感，持续积累忠实用户粉丝',
};

// step4: markdown must start with '# 执行计划' and be ≥ 1000 chars
// '每天发布短视频坚持创作内容稳定输出。\n' ≈ 19 chars × 55 = 1045 chars + header ≈ 1056 total
const LONG_PLAN_BODY = '每天发布短视频坚持创作内容稳定输出。\n'.repeat(55);
const VALID_STEP4_CONTENT = {
  markdown: `# 执行计划\n\n${LONG_PLAN_BODY}`,
};

function makeGateway(contents: unknown[]): ILLMGateway {
  let callIdx = 0;
  return {
    complete: vi.fn().mockImplementation(async () => {
      const content = contents[callIdx] ?? contents[contents.length - 1];
      callIdx++;
      return {
        content,
        tokens: { prompt: 100, completion: 500, total: 600 },
        model: 'claude-sonnet-4-6',
      } satisfies InvokeLLMResult;
    }),
  };
}

function makeAgent(gateway?: ILLMGateway): PositioningAgent {
  return new PositioningAgent(gateway);
}

const BASE_REQ = {
  accountId: 42,
  userInput: { industry: 'beauty', personalInfo: '5年护肤经验' },
  traceId: 'trace-test-001',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PositioningAgent', () => {
  beforeEach(() => {
    mockCostLogCreate.mockClear();
  });

  // ── industry mode (step1) ──────────────────────────────────────────────────

  describe('industry mode (step1)', () => {
    it('happy path: returns valid Step1Output and writes cost_log', async () => {
      const agent = makeAgent(makeGateway([VALID_STEP1_CONTENT]));
      const res = await agent.execute({ ...BASE_REQ, mode: 'industry', stepKey: 'step1' });

      expect(res.result).toMatchObject({
        industry: 'beauty',
        competitionLevel: 'high',
      });
      // AC-2 schema validation
      expect(Step1OutputSchema.safeParse(res.result).success).toBe(true);
      expect(res.isFallback).toBe(false);
      // AC-12: cost_log written once
      expect(mockCostLogCreate).toHaveBeenCalledOnce();
      expect(mockCostLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            agentId: 'PositioningAgent',
            callType: 'specialist_call',
          }),
        }),
      );
    });

    it('schema retry: throws SchemaValidationError after two invalid LLM responses', async () => {
      const badContent = { wrong_field: 'data' };
      const agent = makeAgent(makeGateway([badContent, badContent]));
      await expect(agent.execute({ ...BASE_REQ, mode: 'industry' })).rejects.toThrow(
        SchemaValidationError,
      );
    });

    it('cold start: succeeds with empty userInput (新用户 · 无历史 stepData)', async () => {
      const agent = makeAgent(makeGateway([VALID_STEP1_CONTENT]));
      const res = await agent.execute({
        ...BASE_REQ,
        mode: 'industry',
        userInput: {},
      });
      expect(res.result).toBeDefined();
      expect(Step1OutputSchema.safeParse(res.result).success).toBe(true);
    });
  });

  // ── execution mode (step4) ─────────────────────────────────────────────────

  describe('execution mode (step4)', () => {
    it('happy path: returns markdown starting with # 执行计划', async () => {
      const agent = makeAgent(makeGateway([VALID_STEP4_CONTENT]));
      const res = await agent.execute({ ...BASE_REQ, mode: 'execution', stepKey: 'step4' });

      const result = res.result as { markdown: string };
      expect(result.markdown).toMatch(/^# 执行计划/);
      expect(result.markdown.length).toBeGreaterThanOrEqual(1000);
      // AC-3 schema validation
      expect(Step4OutputSchema.safeParse(res.result).success).toBe(true);
      expect(mockCostLogCreate).toHaveBeenCalledOnce();
    });

    it('schema retry: throws SchemaValidationError when markdown missing # 执行计划 heading', async () => {
      // markdown present but wrong heading — fails refine
      const badContent = {
        markdown: '## 错误的标题\n\n' + '执行计划内容'.repeat(150),
      };
      const agent = makeAgent(makeGateway([badContent, badContent]));
      await expect(agent.execute({ ...BASE_REQ, mode: 'execution' })).rejects.toThrow(
        SchemaValidationError,
      );
    });

    it('cold start: succeeds with minimal input (无 step3 数据)', async () => {
      const agent = makeAgent(makeGateway([VALID_STEP4_CONTENT]));
      const res = await agent.execute({
        ...BASE_REQ,
        mode: 'execution',
        userInput: {},
      });
      expect(res.result).toBeDefined();
      expect(Step4OutputSchema.safeParse(res.result).success).toBe(true);
    });
  });

  // ── mode validation ────────────────────────────────────────────────────────

  it('throws on invalid mode (AC-8 runtime check)', async () => {
    const agent = makeAgent(makeGateway([VALID_STEP1_CONTENT]));
    await expect(agent.execute({ ...BASE_REQ, mode: 'invalid_mode' })).rejects.toThrow(
      /invalid mode/,
    );
  });

  it('config: has correct five-layer structure (AC-1)', () => {
    const agent = makeAgent();
    expect(agent.config.agentId).toBe('PositioningAgent');
    expect(agent.config.persona.role).toBe('PositioningAgent');
    expect(agent.config.memory.l2_read).toContain('stepData');
    expect(agent.config.knowledge.constants).toContain('industries');
    expect(agent.config.tools).toContain('llm.complete');
    expect(agent.config.execution.model_tier).toBe('reasoning');
    expect(agent.config.execution.timeout_ms).toBe(60_000);
    expect(agent.config.execution.retry).toBe(1);
  });
});
