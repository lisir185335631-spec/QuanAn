/**
 * Integration test — PRD-6 US-002 AC-10
 * VideoAgent invokeLLM: nock SDK 拦截 Anthropic API · real DB cost_log · < 3s
 * 默认 skip · 设 RUN_REAL_LLM=1 且有有效 LLM key 才真跑 (CI safe · cost controlled)
 *
 * Pattern: specialist-llm.test.ts (不 mock llmGateway · nock 拦截真实 HTTP)
 * - vi.mock rate-limiter + contextAssembler only
 * - nock.disableNetConnect() + nock intercept /v1/messages
 * - VideoAgent.execute({ mode: 'production' }) → nock.isDone() + schema 验证
 * - Real test DB: cost_log.create via BaseSpecialist
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import nock from 'nock';
import { prisma } from '@/lib/prisma';
import { VideoAgent } from '@/specialists/VideoAgent';
import { ProductionOutputSchema } from '@/specialists/VideoAgent';

// ── Mocks (rate-limiter + contextAssembler only, NOT llmGateway) ──────────────

vi.mock('@/workers/llm-gateway/rate-limiter', () => ({
  checkRateLimit: vi.fn(async () => undefined),
  RateLimitError: class extends Error {
    readonly code = 'RATE_LIMIT_EXCEEDED' as const;
    constructor(public readonly userId: number) {
      super(`Rate limit for user ${userId}`);
    }
  },
}));

vi.mock('@/services/context-assembler/ContextAssembler', () => ({
  contextAssembler: {
    assemble: vi.fn().mockResolvedValue({
      systemPrompt: 'You are a video production specialist. Return JSON.',
      userPrompt: '制作视频拍摄计划：宠物博主教程内容',
      tools: [],
      metadata: { contextTokens: 60, layersUsed: ['L2'], ragHits: [] },
    }),
    assembleStep: vi.fn(),
  },
}));

// ── Test fixtures ─────────────────────────────────────────────────────────────

let testAccountId = 0;
let testTraceId = '';

async function createTestFixtures(): Promise<void> {
  const user = await prisma.user.create({
    data: {
      openId: `test-video-agent-llm-${Date.now()}`,
      name: 'Test VideoAgent LLM User',
      email: `video-agent-llm-${Date.now()}@test.internal`,
      loginMethod: 'google',
    },
  });
  const account = await prisma.ipAccount.create({
    data: {
      userId: user.id,
      name: 'Test VideoAgent Account',
      industry: '宠物',
      platform: 'douyin',
    },
  });
  testAccountId = account.id;
}

async function cleanupTestFixtures(): Promise<void> {
  if (testTraceId) {
    await prisma.costLog.deleteMany({ where: { traceId: testTraceId } });
  }
  if (testAccountId) {
    const account = await prisma.ipAccount.findUnique({ where: { id: testAccountId } });
    if (account) {
      await prisma.ipAccount.delete({ where: { id: testAccountId } });
      await prisma.user.delete({ where: { id: account.userId } });
    }
  }
}

// ── nock setup ────────────────────────────────────────────────────────────────

const ANTHROPIC_API = 'https://api.anthropic.com';

const MOCK_PRODUCTION_OUTPUT = {
  shotList: [
    {
      scene: '开场介绍',
      duration: '5s',
      action: '主持人面向镜头，展示宠物',
      dialogue: '大家好，今天教大家如何拍出吸睛的宠物视频',
      cameraAngle: '正面中景',
      prop: '宠物玩具',
      lighting: '柔光灯补光',
      transition: '切入',
      sfx: '轻快背景音乐',
      voiceover: '欢迎来到今天的教程',
      subtitle: '宠物视频制作技巧',
      costume: '休闲舒适服装',
      location: '家庭客厅或宠物友好场景',
    },
    {
      scene: '技巧讲解',
      duration: '30s',
      action: '演示拍摄角度与逗猫技巧',
      dialogue: '选好角度是成功的关键，低角度能让宠物更可爱',
      cameraAngle: '低角度仰拍',
      prop: '猫条逗猫棒',
      lighting: '自然光为主，补光灯辅助',
      transition: '淡出淡入',
      sfx: '轻柔背景音乐',
      voiceover: '低机位拍出萌感',
      subtitle: '关键拍摄技巧',
      costume: '同开场',
      location: '同开场',
    },
    {
      scene: '结尾引导',
      duration: '5s',
      action: '面向镜头，引导关注',
      dialogue: '觉得有用请点关注，下期分享更多宠物拍摄秘技',
      cameraAngle: '正面中景',
      prop: '无',
      lighting: '同开场',
      transition: '淡出',
      sfx: '结尾提示音',
      voiceover: '点赞关注不迷路',
      subtitle: '关注获取更多技巧',
      costume: '同开场',
      location: '同开场',
    },
  ],
  equipment: ['手机或入门相机', '三脚架', '柔光灯一盏', '领夹麦克风', '逗猫道具若干'],
  schedule: '建议在宠物活跃期（上午10-11点或傍晚17-18点）拍摄，预留1.5小时含调试时间',
};

function mockAnthropicProductionResponse(): void {
  nock(ANTHROPIC_API)
    .post('/v1/messages')
    .reply(200, {
      id: 'msg_nock_video_agent_001',
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'tool_use',
          id: 'tool_va_001',
          name: 'structured_output',
          input: MOCK_PRODUCTION_OUTPUT,
        },
      ],
      model: 'claude-sonnet-4-6',
      stop_reason: 'tool_use',
      usage: { input_tokens: 120, output_tokens: 450 },
    });
}

beforeAll(async () => {
  nock.disableNetConnect();
  process.env.ANTHROPIC_API_KEY = 'sk-ant-nock-video-agent-test';
  process.env.OPENAI_API_KEY = 'sk-openai-nock-video-agent-test';
  await createTestFixtures();
});

afterAll(async () => {
  nock.enableNetConnect();
  nock.cleanAll();
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.OPENAI_API_KEY;
  await cleanupTestFixtures();
});

beforeEach(() => {
  nock.cleanAll();
  testTraceId = `tr_video_agent_int_${Date.now()}`;
});

// ── Integration test (skipped unless RUN_REAL_LLM=1) ─────────────────────────

const skipRealLlm = process.env.RUN_REAL_LLM !== '1';

describe.skipIf(skipRealLlm)('US-002 AC-10: VideoAgent invokeLLM integration — nock Anthropic SDK + real DB cost_log', () => {
  it('execute(mode=production): nock intercepts Anthropic call, returns valid ProductionOutput, writes cost_log to DB within 3s', async () => {
    mockAnthropicProductionResponse();

    const agent = new VideoAgent();
    const start = Date.now();

    const result = await agent.execute({
      accountId: testAccountId,
      mode: 'production',
      userInput: { sourceCopy: '宠物博主视频制作入门教程，手把手教你拍出高质量宠物内容' },
      traceId: testTraceId,
      stepKey: 'step_video_production',
    });

    const elapsed = Date.now() - start;

    // AC-10: invokeLLM真调 LLM < 3s
    expect(elapsed).toBeLessThan(3000);

    // nock interceptor was consumed (real HTTP call was intercepted)
    expect(nock.isDone()).toBe(true);

    // Result is not fallback
    expect(result.isFallback).toBe(false);

    // Schema validation: result matches ProductionOutputSchema
    const parsed = ProductionOutputSchema.safeParse(result.result);
    expect(parsed.success).toBe(true);

    if (parsed.success) {
      expect(parsed.data.shotList).toHaveLength(3);
      expect(parsed.data.shotList[0]).toMatchObject({
        scene: '开场介绍',
        cameraAngle: '正面中景',
      });
      expect(parsed.data.equipment).toContain('三脚架');
      expect(parsed.data.schedule).toContain('宠物活跃期');
    }

    // Tokens and model
    expect(result.tokensUsed.prompt).toBe(120);
    expect(result.tokensUsed.completion).toBe(450);
    expect(result.tokensUsed.total).toBe(570);
    expect(result.modelUsed).toBe('claude-sonnet-4-6');
    expect(result.traceId).toBe(testTraceId);

    // cost_log written to real DB by BaseSpecialist
    const costRow = await prisma.costLog.findFirst({ where: { traceId: testTraceId } });
    expect(costRow).not.toBeNull();
    expect(costRow?.callType).toBe('specialist_call');
    expect(costRow?.agentId).toBe('VideoAgent');
    expect(costRow?.promptTokens).toBe(120);
    expect(costRow?.completionTokens).toBe(450);
    expect(costRow?.durationMs).toBeGreaterThan(0);
    const target = costRow?.target as { stepKey?: string; agentId?: string } | null;
    expect(target?.agentId).toBe('VideoAgent');
    expect(target?.stepKey).toBe('step_video_production');
  });
});
