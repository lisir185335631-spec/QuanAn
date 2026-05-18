/**
 * Unit tests — PRD-4 US-008 + PRD-6 US-002
 * VideoAgent: 4 mode (shooting / production / acquisition / storyboard)
 * PRD-4 AC-9: ≥ 4 tests
 * PRD-6 AC-8: +9 unit (production 3 + acquisition 3 + storyboard 3)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  VideoAgent,
  ShootingOutputSchema,
  ProductionOutputSchema,
  VideoAcquisitionOutputSchema,
  StoryboardOutputSchema,
} from '@/specialists/VideoAgent';
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

// PRD-20 US-005 upgraded shooting to 8-column schema (Storyboard8ColItemSchema)
const VALID_SHOT_8COL = {
  duration: '3s',
  scene: '开场镜头',
  shotType: '近景',
  angle: '正面',
  movement: '固定',
  emotion: '自然',
  dialogue: '大家好，今天给大家分享一款护肤神器',
  action: '博主正面对镜头微笑',
};

// Production mode still uses 13-column ShotItemSchema
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
  shotList: [VALID_SHOT_8COL],
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
      shotList: [VALID_SHOT_8COL, { ...VALID_SHOT_8COL, scene: '产品特写' }],
    };
    const agent = new VideoAgent(makeGateway([multiShotContent]));
    const res = await agent.execute(BASE_REQ);

    const result = res.result as typeof multiShotContent;
    expect(result.shotList.length).toBeGreaterThanOrEqual(1);
    expect(result.shotList[0]).toMatchObject({
      scene: expect.any(String),
      duration: expect.any(String),
      angle: expect.any(String),   // PRD-20 US-005: 8-col schema uses 'angle' not 'cameraAngle'
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

  it('fallback: empty shotList → schema fails → fallback (US-015 AC-1)', async () => {
    // US-015: with fallbackTemplate.shooting, schema errors trigger fallback instead of throw
    const badContent = { ...VALID_SHOOTING_CONTENT, shotList: [] };
    const agent = new VideoAgent(makeGateway([badContent, badContent]));
    const res = await agent.execute(BASE_REQ);
    expect(res.isFallback).toBe(true);
    expect(ShootingOutputSchema.safeParse(res.result).success).toBe(true);
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

  // ── PRD-6 US-002: production mode (+3) ───────────────────────────────────

  it('production happy: returns valid ProductionOutput (shotList + equipment + schedule)', async () => {
    const productionContent = {
      shotList: [{ ...VALID_SHOT, scene: '制作开场', action: '三点布光调试' }],
      equipment: ['专业相机', '三点布光套装', '稳定器', '收音麦克风'],
      schedule: '制作拍摄 2 小时，后期剪辑 1 小时',
    };
    const agent = new VideoAgent(makeGateway([productionContent]));
    const res = await agent.execute({ ...BASE_REQ, mode: 'production' });

    expect(ProductionOutputSchema.safeParse(res.result).success).toBe(true);
    const result = res.result as typeof productionContent;
    expect(result.shotList.length).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(result.equipment)).toBe(true);
    expect(typeof result.schedule).toBe('string');
    expect(res.isFallback).toBe(false);
  });

  it('production outputSchema getter: result validates against ProductionOutputSchema', async () => {
    const productionContent = {
      shotList: [VALID_SHOT, { ...VALID_SHOT, scene: '主体拍摄' }],
      equipment: ['手机', '三脚架'],
      schedule: '上午9点开始，共2小时',
    };
    const agent = new VideoAgent(makeGateway([productionContent]));
    const res = await agent.execute({ ...BASE_REQ, mode: 'production' });
    expect(ProductionOutputSchema.safeParse(res.result).success).toBe(true);
    // PRD-20 US-005: ShootingOutputSchema now uses 8-col (Storyboard8ColItemSchema), different from production 13-col
  });

  it('production schema fail: empty shotList → fallback (US-015 AC-1)', async () => {
    const badContent = { shotList: [], equipment: [], schedule: '' };
    const agent = new VideoAgent(makeGateway([badContent, badContent]));
    const res = await agent.execute({ ...BASE_REQ, mode: 'production' });
    expect(res.isFallback).toBe(true);
    expect(ProductionOutputSchema.safeParse(res.result).success).toBe(true);
  });

  // ── PRD-6 US-002: acquisition mode (+3) ──────────────────────────────────

  it('acquisition happy: returns valid VideoAcquisitionOutput (script + cta + conversionPath + keyMessages)', async () => {
    const acquisitionContent = {
      // script must be >= 100 chars (VideoAcquisitionOutputSchema.min(100))
      script: '你是否还在为内容没有粉丝而烦恼？今天分享一个经过验证的涨粉方法，帮助创作者实现精准增长，真正建立属于自己的内容影响力。我们的系统已帮助超过 500 位创作者成功起号，从 0 粉到万粉的突破，现在这个机会也属于你。立即扫码，免费获取你的专属涨粉方案。',
      cta: '立即扫描下方二维码，免费获取你的专属涨粉方案',
      conversionPath: '视频引流→扫码→咨询群→成交',
      keyMessages: ['经验证的涨粉方法', '500+ 创作者见证', '免费专属方案'],
    };
    const agent = new VideoAgent(makeGateway([acquisitionContent]));
    const res = await agent.execute({ ...BASE_REQ, mode: 'acquisition' });

    expect(VideoAcquisitionOutputSchema.safeParse(res.result).success).toBe(true);
    const result = res.result as typeof acquisitionContent;
    expect(result.script.length).toBeGreaterThanOrEqual(100);
    expect(result.cta.length).toBeGreaterThanOrEqual(10);
    expect(result.keyMessages.length).toBeGreaterThanOrEqual(1);
    expect(res.isFallback).toBe(false);
  });

  it('acquisition outputSchema getter: mode switch returns VideoAcquisitionOutputSchema', async () => {
    const acquisitionContent = {
      script: 'x'.repeat(100),
      cta: 'y'.repeat(10),
      conversionPath: '视频→扫码→成交',
      keyMessages: ['卖点A', '卖点B'],
    };
    const agent = new VideoAgent(makeGateway([acquisitionContent]));
    const res = await agent.execute({ ...BASE_REQ, mode: 'acquisition' });
    expect(VideoAcquisitionOutputSchema.safeParse(res.result).success).toBe(true);
  });

  it('acquisition schema fail: missing keyMessages → fallback (US-015 AC-1)', async () => {
    const badContent = { script: 'x'.repeat(100), cta: 'y'.repeat(10), conversionPath: '视频→成交', keyMessages: [] };
    const agent = new VideoAgent(makeGateway([badContent, badContent]));
    const res = await agent.execute({ ...BASE_REQ, mode: 'acquisition' });
    expect(res.isFallback).toBe(true);
    expect(VideoAcquisitionOutputSchema.safeParse(res.result).success).toBe(true);
  });

  // ── PRD-6 US-002: storyboard mode (+3 + 1 schema-level test) ────────────

  // AC-4: 4-field format matches packages/schemas aiVideoSceneSchema exactly
  const VALID_STORYBOARD_SCENE = {
    index: 1,
    duration: '5s',
    description: '创作者面向镜头自信介绍，展示专业形象与内容价值',
    imagePromptEn: 'Professional content creator facing camera in modern studio, warm lighting, cinematic style',
  };

  it('storyboard happy: 5 scenes all ASCII imagePromptEn → valid StoryboardOutput', async () => {
    const storyboardContent = {
      title: 'IP 起号成长故事',
      totalDuration: '60s',
      scenes: Array.from({ length: 5 }, (_, i) => ({
        ...VALID_STORYBOARD_SCENE,
        index: i + 1,
        imagePromptEn: `Scene ${i + 1}: Professional creator in modern studio, bright lighting, cinematic portrait`,
      })),
    };
    const agent = new VideoAgent(makeGateway([storyboardContent]));
    const res = await agent.execute({ ...BASE_REQ, mode: 'storyboard' });

    expect(StoryboardOutputSchema.safeParse(res.result).success).toBe(true);
    const result = res.result as typeof storyboardContent;
    expect(result.scenes.length).toBeGreaterThanOrEqual(5);
    expect(result.scenes.length).toBeLessThanOrEqual(8);
    expect(typeof result.title).toBe('string');
    expect(res.isFallback).toBe(false);
  });

  it('storyboard non-ASCII imagePromptEn: schema regex rejects Chinese → BaseSpecialist retry → fallback (AC-4)', async () => {
    const nonAsciiContent = {
      title: '故事板测试',
      totalDuration: '60s',
      scenes: Array.from({ length: 5 }, (_, i) => ({
        ...VALID_STORYBOARD_SCENE,
        index: i + 1,
        imagePromptEn: `场景${i + 1}：专业创作者在现代摄影棚展示内容 professional creator cinematic`, // contains Chinese
      })),
    };
    // Both attempts return non-ASCII → schema regex fails → BaseSpecialist retry → SchemaValidationError → fallback
    const agent = new VideoAgent(makeGateway([nonAsciiContent, nonAsciiContent]));
    const res = await agent.execute({ ...BASE_REQ, mode: 'storyboard' });
    expect(res.isFallback).toBe(true);
    expect(StoryboardOutputSchema.safeParse(res.result).success).toBe(true);
  });

  it('storyboard outputSchema getter: result validates against StoryboardOutputSchema', async () => {
    const storyboardContent = {
      title: 'Test Storyboard',
      totalDuration: '45s',
      scenes: Array.from({ length: 5 }, (_, i) => ({
        ...VALID_STORYBOARD_SCENE,
        index: i + 1,
        imagePromptEn: `Scene ${i + 1} in bright modern studio, professional lighting, cinematic portrait`,
      })),
    };
    const agent = new VideoAgent(makeGateway([storyboardContent]));
    const res = await agent.execute({ ...BASE_REQ, mode: 'storyboard' });
    expect(StoryboardOutputSchema.safeParse(res.result).success).toBe(true);
  });

  it('storyboard schema-level: Chinese imagePromptEn fails StoryboardSceneSchema regex (not post-validate)', () => {
    // Schema-level validation: regex /^[\x00-\x7F]+$/ rejects Chinese chars
    const chineseImagePrompt = '专业创作者在现代摄影棚展示内容制作流程 cinematic portrait style lighting';
    const parsed = StoryboardOutputSchema.safeParse({
      title: '测试故事板',
      totalDuration: '30s',
      scenes: Array.from({ length: 5 }, (_, i) => ({
        index: i + 1,
        duration: '5s',
        description: '创作者面向镜头自信介绍，展示专业形象与内容价值',
        imagePromptEn: chineseImagePrompt,
      })),
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const errorPaths = parsed.error.issues.map((issue) => issue.path.join('.'));
      expect(errorPaths.some((p) => p.includes('imagePromptEn'))).toBe(true);
    }
  });
});
