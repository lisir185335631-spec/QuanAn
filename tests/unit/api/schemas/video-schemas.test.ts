/**
 * PRD-6 US-001 · 5 video schema 单元测试
 * 覆盖: happy path + boundary + rejection
 * AC-10: ≥10 unit · AC-11: boundary 场景全覆盖
 */

import {
  videoProductionInput,
  acquisitionVideoInput,
  aiVideoInput,
  aiVideoOutput,
  acquisitionCopywritingInput,
  imageGenJobPayload,
  imageGenJobResult,
} from '@quanqn/schemas/specialist-io';

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
      conversionGoal: 'wechat',
      ctaText: '扫码加微信',
    });
    expect(result.success).toBe(true);
  });

  it('reject: invalid conversionGoal fails', () => {
    const result = acquisitionVideoInput.safeParse({
      sourceCopy: '这是一段获客型视频文案，测试无效的转化目标。',
      conversionGoal: 'invalid_goal',
    });
    expect(result.success).toBe(false);
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
      totalDuration: '15s',
    });
    expect(result.success).toBe(true);
  });

  it('reject: imagePromptEn contains Chinese fails with 必须是英文 ASCII', () => {
    const result = aiVideoOutput.safeParse({
      scenes: [
        { ...validScene, imagePromptEn: '美女吃饭 eating in the park' },
        { ...validScene, index: 2 }, { ...validScene, index: 3 },
        { ...validScene, index: 4 }, { ...validScene, index: 5 },
      ],
      totalDuration: '15s',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.message.includes('ASCII'));
      expect(issue).toBeDefined();
    }
  });
});

// ── acquisitionCopywritingInput ───────────────────────────────────────────────

describe('acquisitionCopywritingInput', () => {
  it('happy path: valid acquisition copywriting input parses', () => {
    const result = acquisitionCopywritingInput.safeParse({
      productInfo: '我们的产品是一款 AI 内容创作助手，帮助创作者提高效率。',
      conversionGoal: 'comment',
    });
    expect(result.success).toBe(true);
  });

  it('reject: productInfo < 10 chars fails', () => {
    const result = acquisitionCopywritingInput.safeParse({
      productInfo: '短产品',
      conversionGoal: 'wechat',
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
      sceneImageUrl: 'https://placeholder.quanqn.com/scene-error.png',
    });
    expect(result.success).toBe(true);
  });
});
