/**
 * PRD-6 US-001, PRD-7 US-001 · 5 video schema 单元测试
 * 覆盖: happy path + boundary + rejection
 * TD-022: assertions updated for canonical SoT field tables
 */

import {
  videoProductionInput,
  acquisitionVideoInput,
  aiVideoInput,
  aiVideoOutput,
  acquisitionCopywritingInputSchema,
  imageGenJobPayload,
  imageGenJobResult,
} from '@quanan/schemas/specialist-io';

// ── videoProductionInput ──────────────────────────────────────────────────────

describe('videoProductionInput', () => {
  it('happy path: valid sourceCopy parses successfully', () => {
    const result = videoProductionInput.safeParse({
      sourceCopy: '这是一段测试文案，用于验证 videoProduction schema 的解析能力。',
      videoType: 'short_form',
      duration: '60s',
    });
    expect(result.success).toBe(true);
  });

  it('boundary: sourceCopy exactly 3000 chars passes', () => {
    const result = videoProductionInput.safeParse({
      sourceCopy: 'a'.repeat(3000),
    });
    expect(result.success).toBe(true);
  });

  it('reject: sourceCopy < 10 chars fails', () => {
    const result = videoProductionInput.safeParse({ sourceCopy: '短' });
    expect(result.success).toBe(false);
  });

  it('reject: sourceCopy > 3000 chars fails with 原始文案不能超过3000字符', () => {
    const result = videoProductionInput.safeParse({ sourceCopy: 'a'.repeat(3001) });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('原始文案不能超过3000字符');
    }
  });
});

// ── acquisitionVideoInput ─────────────────────────────────────────────────────

describe('acquisitionVideoInput', () => {
  it('happy path: valid acquisition video input parses successfully', () => {
    const result = acquisitionVideoInput.safeParse({
      sourceCopy: '这是一段获客型视频文案，需要引导用户关注我们的微信。',
      conversionGoal: '关注微信公众号',
    });
    expect(result.success).toBe(true);
  });

  it('reject: empty conversionGoal fails with 转化目标必填', () => {
    const result = acquisitionVideoInput.safeParse({
      sourceCopy: '这是一段获客型视频文案，测试空转化目标。',
      conversionGoal: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('转化目标必填');
    }
  });

  it('happy path: platform and duration optional fields pass', () => {
    const result = acquisitionVideoInput.safeParse({
      sourceCopy: '这是一段获客型视频文案，包含平台和时长字段。',
      conversionGoal: '私信咨询',
      platform: 'douyin',
      duration: '30s',
    });
    expect(result.success).toBe(true);
  });
});

// ── aiVideoInput + boundary ───────────────────────────────────────────────────

describe('aiVideoInput', () => {
  it('happy path: scenesCount=6 + imageStyle=vivid parses', () => {
    const result = aiVideoInput.safeParse({
      sourceCopy: '这是 AI 视频分镜文案，共六个镜头，生动风格。',
      scenesCount: 6,
      imageStyle: 'vivid',
    });
    expect(result.success).toBe(true);
  });

  it('boundary: scenesCount=5 min passes', () => {
    const result = aiVideoInput.safeParse({
      sourceCopy: '最少五个镜头的分镜文案，测试边界情况。',
      scenesCount: 5,
      imageStyle: 'natural',
    });
    expect(result.success).toBe(true);
  });

  it('boundary: scenesCount=8 max passes', () => {
    const result = aiVideoInput.safeParse({
      sourceCopy: '最多八个镜头的分镜文案，测试边界情况。',
      scenesCount: 8,
      imageStyle: 'vivid',
    });
    expect(result.success).toBe(true);
  });

  it('reject: scenesCount=9 fails with 镜头数应在 5-8 之间', () => {
    const result = aiVideoInput.safeParse({
      sourceCopy: '超出镜头数上限的测试文案。',
      scenesCount: 9,
      imageStyle: 'vivid',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('镜头数应在 5-8 之间');
    }
  });

  it('reject: scenesCount=4 below min fails', () => {
    const result = aiVideoInput.safeParse({
      sourceCopy: '低于镜头数下限的测试文案。',
      scenesCount: 4,
      imageStyle: 'natural',
    });
    expect(result.success).toBe(false);
  });

  it('happy path: imageStyle defaults to vivid when omitted', () => {
    const result = aiVideoInput.safeParse({
      sourceCopy: '未指定 imageStyle 的分镜文案，测试默认值。',
      scenesCount: 5,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.imageStyle).toBe('vivid');
    }
  });
});

// ── aiVideoOutput · imagePromptEn ASCII validation ────────────────────────────

describe('aiVideoOutput · imagePromptEn', () => {
  const validScene = {
    index: 1,
    description: 'A young woman walking in a sunlit park, looking peaceful and happy.',
    imagePromptEn: 'Young woman eating a healthy salad in bright sunlight, photorealistic',
    duration: '3s',
  };

  it('pass: imagePromptEn=English ASCII passes', () => {
    const result = aiVideoOutput.safeParse({
      scenes: [validScene, { ...validScene, index: 2 }, { ...validScene, index: 3 },
               { ...validScene, index: 4 }, { ...validScene, index: 5 }],
      title: 'Test Video Title',
      totalDuration: '15s',
    });
    expect(result.success).toBe(true);
  });

  it('pass: output includes title field', () => {
    const result = aiVideoOutput.safeParse({
      scenes: Array.from({ length: 5 }, (_, i) => ({ ...validScene, index: i + 1 })),
      title: 'IP 起号成长故事',
      totalDuration: '60s',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('IP 起号成长故事');
    }
  });

  it('reject: missing title fails', () => {
    const result = aiVideoOutput.safeParse({
      scenes: Array.from({ length: 5 }, (_, i) => ({ ...validScene, index: i + 1 })),
      totalDuration: '15s',
    });
    expect(result.success).toBe(false);
  });

  it('reject: imagePromptEn contains Chinese fails with 必须是英文 ASCII', () => {
    const result = aiVideoOutput.safeParse({
      scenes: [
        { ...validScene, imagePromptEn: '美女吃饭 eating in the park' },
        { ...validScene, index: 2 }, { ...validScene, index: 3 },
        { ...validScene, index: 4 }, { ...validScene, index: 5 },
      ],
      title: 'Test Title',
      totalDuration: '15s',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.message.includes('ASCII'));
      expect(issue).toBeDefined();
    }
  });
});

// ── acquisitionCopywritingInputSchema ─────────────────────────────────────────

describe('acquisitionCopywritingInputSchema', () => {
  it('happy path: valid acquisition copywriting input parses', () => {
    const result = acquisitionCopywritingInputSchema.safeParse({
      scriptType: 'tutorial',
      elements: ['curiosity', 'contrast'],
      conversionGoal: '关注公众号',
      topic: '内容创作方法论',
    });
    expect(result.success).toBe(true);
  });

  it('reject: empty conversionGoal fails with 转化目标必填', () => {
    const result = acquisitionCopywritingInputSchema.safeParse({
      scriptType: 'tutorial',
      elements: ['curiosity'],
      conversionGoal: '',
      topic: '内容创作',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.message.includes('转化目标'));
      expect(issue).toBeDefined();
    }
  });

  it('reject: empty elements array fails', () => {
    const result = acquisitionCopywritingInputSchema.safeParse({
      scriptType: 'review',
      elements: [],
      conversionGoal: '私信咨询',
      topic: '产品测评',
    });
    expect(result.success).toBe(false);
  });
});

// ── imageGenJobPayload ────────────────────────────────────────────────────────

describe('imageGenJobPayload', () => {
  it('happy path: valid job payload parses', () => {
    const result = imageGenJobPayload.safeParse({
      sceneIndex: 1,
      imagePromptEn: 'A beautiful sunset over mountains with vibrant orange sky',
      accountId: 42,
      traceId: 'trace-abc-123',
      historyId: 999,
      imageStyle: 'vivid',
    });
    expect(result.success).toBe(true);
  });

  it('reject: invalid imageStyle fails', () => {
    const result = imageGenJobPayload.safeParse({
      sceneIndex: 0,
      imagePromptEn: 'Some prompt text here for testing purposes',
      accountId: 1,
      traceId: 'trace-001',
      historyId: 1,
      imageStyle: 'artistic',
    });
    expect(result.success).toBe(false);
  });
});

// ── imageGenJobResult (union) ─────────────────────────────────────────────────

describe('imageGenJobResult', () => {
  it('success variant: valid success result parses', () => {
    const result = imageGenJobResult.safeParse({
      sceneImageUrl: 'https://oaidalleapiprodscus.blob.core.windows.net/scene-1.png',
      costUsd: 0.04,
      durationMs: 8500,
    });
    expect(result.success).toBe(true);
  });

  it('error variant: error result with placeholder parses', () => {
    const result = imageGenJobResult.safeParse({
      error: 'DALL-E 3 API timeout',
      sceneImageUrl: 'https://placeholder.quanan.com/scene-error.png',
    });
    expect(result.success).toBe(true);
  });
});
