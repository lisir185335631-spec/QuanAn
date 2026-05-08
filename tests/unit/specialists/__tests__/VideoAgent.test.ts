/**
 * Unit tests — PRD-4 US-008
 * VideoAgent: shooting mode · 4 场景(happy / fallback / edge(sourceCopy过长) / 4 mode 接口预留)
 * AC-9: ≥ 4 tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VideoAgent, ShootingOutputSchema } from '@/specialists/VideoAgent';
import { SchemaValidationError } from '@/specialists/base/errors';
import type { ILLMGateway, InvokeLLMResult } from '@/specialists/base/types';

// ── Hoisted shared state ──────────────────────────────────────────────────────

const { mockAssemble, mockCostLogCreate } = vi.hoisted(() => ({
  mockAssemble: vi.fn().mockResolvedValue({
    systemPrompt: '- step7: {"copywriting":"产品功能介绍文案"}\n- step1: {"industry":"beauty"}',
    userPrompt: '<user_input>{}</user_input>',
    tools: [],
    metadata: { contextTokens: 0, layersUsed: ['L2_step_data'], ragHits: [] },
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

const VALID_SHOT = {
  scene: '开场镜头',
  duration: '3s',
  action: '博主正面对镜头微笑',
  dialogue: '大家好，今天给大家分享一款护肤神器',
  cameraAngle: '近景',
  prop: '产品瓶',
  lighting: '柔光灯正面打光',
  transition: '切换',
  sfx: '无',
  voiceover: '无',
  subtitle: '护肤神器来了',
  costume: '白色简约T恤',
  location: '家居书桌场景',
};

const VALID_SHOOTING_CONTENT = {
  shotList: [VALID_SHOT],
  equipment: ['手机支架', '补光灯', '麦克风'],
  schedule: '上午10点开始，预计2小时完成拍摄',
};

function makeGateway(contents: unknown[]): ILLMGateway {
  let callIdx = 0;
  return {
    complete: vi.fn().mockImplementation(async () => {
      const content = contents[callIdx] ?? contents[contents.length - 1];
      callIdx++;
      return {
        content,
        tokens: { prompt: 500, completion: 2000, total: 2500 },
        model: 'claude-sonnet-4-6',
      } satisfies InvokeLLMResult;
    }),
  };
}

const BASE_REQ = {
  accountId: 42,
  mode: 'shooting' as const,
  userInput: {
    sourceCopy: '这是一款美白精华，主打成分是烟酰胺，适合暗沉肤色',
    targetPlatform: 'douyin',
  },
  traceId: 'trace-video-001',
  stepKey: 'step6',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('VideoAgent', () => {
  beforeEach(() => {
    mockCostLogCreate.mockClear();
    mockAssemble.mockResolvedValue({
      systemPrompt: '- step7: {"copywriting":"产品功能介绍文案"}\n- step1: {"industry":"beauty"}',
      userPrompt: '<user_input>{}</user_input>',
      tools: [],
      metadata: { contextTokens: 0, layersUsed: ['L2_step_data'], ragHits: [] },
    });
  });

  // ── happy path ────────────────────────────────────────────────────────────

  it('happy path: returns valid ShootingOutput with shotList[1+], equipment[], schedule, writes cost_log', async () => {
    const multiShotContent = {
      ...VALID_SHOOTING_CONTENT,
      shotList: [VALID_SHOT, { ...VALID_SHOT, scene: '产品特写' }],
    };
    const agent = new VideoAgent(makeGateway([multiShotContent]));
    const res = await agent.execute(BASE_REQ);

    const result = res.result as typeof multiShotContent;
    expect(result.shotList.length).toBeGreaterThanOrEqual(1);
    expect(result.shotList[0]).toMatchObject({
      scene: expect.any(String),
      duration: expect.any(String),
      cameraAngle: expect.any(String),
    });
    expect(Array.isArray(result.equipment)).toBe(true);
    expect(typeof result.schedule).toBe('string');
    expect(ShootingOutputSchema.safeParse(res.result).success).toBe(true);
    expect(res.isFallback).toBe(false);
    expect(mockCostLogCreate).toHaveBeenCalledOnce();
    expect(mockCostLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          agentId: 'VideoAgent',
          callType: 'specialist_call',
        }),
      }),
    );
  });

  // ── fallback / schema retry (AC-3) ───────────────────────────────────────

  it('fallback: throws SchemaValidationError when shotList is empty (min(1) violated)', async () => {
    const badContent = { ...VALID_SHOOTING_CONTENT, shotList: [] };
    const agent = new VideoAgent(makeGateway([badContent, badContent]));
    await expect(agent.execute(BASE_REQ)).rejects.toThrow(SchemaValidationError);
  });

  // ── edge: sourceCopy > 5000 chars (AC-6) ─────────────────────────────────

  it('edge: sourceCopy exceeding 5000 chars → ZodError before LLM call (AC-6)', async () => {
    const gateway = makeGateway([VALID_SHOOTING_CONTENT]);
    const agent = new VideoAgent(gateway);
    const longCopy = 'x'.repeat(5001);
    await expect(
      agent.execute({ ...BASE_REQ, userInput: { sourceCopy: longCopy } }),
    ).rejects.toThrow();
    // LLM gateway should NOT have been called
    expect((gateway.complete as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(0);
  });

  // ── 4 mode interface reserved (AC-5) ─────────────────────────────────────

  it('mode interface reserved: production / acquisition / storyboard throw "Not implemented · PRD-6" (AC-5)', async () => {
    const reservedModes = ['production', 'acquisition', 'storyboard'] as const;

    for (const mode of reservedModes) {
      const agent = new VideoAgent(makeGateway([VALID_SHOOTING_CONTENT]));
      await expect(
        agent.execute({ ...BASE_REQ, mode }),
      ).rejects.toThrow('Not implemented · PRD-6');
    }
  });

  // ── config validation (AC-8) ─────────────────────────────────────────────

  it('config: five-layer structure, model_tier=reasoning, timeout_ms=45000 (AC-8)', () => {
    const agent = new VideoAgent();
    expect(agent.config.agentId).toBe('VideoAgent');
    expect(agent.config.memory.l2_read).toContain('stepData');
    expect(agent.config.tools).toContain('llm.complete');
    expect(agent.config.execution.model_tier).toBe('reasoning');
    expect(agent.config.execution.timeout_ms).toBe(45_000);
    expect(agent.config.execution.streaming).toBe(false);
  });
});
