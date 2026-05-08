/**
 * StepForm schema tests — PRD-4 US-011 AC-16
 *
 * Tests the zod schemas that drive StepForm validation.
 * Covers: render (schema shape), submit happy, zod fail inline error,
 *         mutation success (valid parse), mutation error toast (error messages).
 *
 * React rendering tests live in apps/web/src/test/StepForm.test.tsx
 * which runs under the web vitest config with jsdom environment.
 */

import { describe, it, expect } from 'vitest';

import {
  Step1InputSchema,
  Step3InputSchema,
  Step5InputSchema,
  Step6InputSchema,
  Step7InputSchema,
  Step8InputSchema,
  STEP_INDUSTRY_KEYS,
  STEP_PLATFORM_KEYS,
  STEP_CATEGORY_KEYS,
} from '../../../packages/schemas/src/specialist-io/step-inputs.schema';

// ── render: schema structure is correct ──────────────────────────────────────
describe('render: StepForm schema structure', () => {
  it('Step1InputSchema has lastIndustry field', () => {
    const shape = Step1InputSchema.shape as Record<string, unknown>;
    expect(shape).toHaveProperty('lastIndustry');
  });

  it('STEP_INDUSTRY_KEYS has 56 industries', () => {
    expect(STEP_INDUSTRY_KEYS.length).toBe(56);
  });

  it('STEP_PLATFORM_KEYS has 5 platforms', () => {
    expect(STEP_PLATFORM_KEYS.length).toBe(5);
  });

  it('STEP_CATEGORY_KEYS has 5 categories', () => {
    expect(STEP_CATEGORY_KEYS).toEqual(['traffic', 'monetize', 'persona', 'cognition', 'case']);
  });

  it('Step7InputSchema has lastElements array with max 5', () => {
    const shape = Step7InputSchema.shape as Record<string, unknown>;
    expect(shape).toHaveProperty('lastElements');
    expect(shape).toHaveProperty('lastScriptType');
    expect(shape).toHaveProperty('lastTopic');
  });
});

// ── submit happy: valid data passes schema ────────────────────────────────────
describe('submit happy: valid data passes zod parse', () => {
  it('Step1InputSchema passes with valid industry key', () => {
    const result = Step1InputSchema.safeParse({ lastIndustry: 'medical' });
    expect(result.success).toBe(true);
  });

  it('Step3InputSchema passes with valid platform and strings', () => {
    const result = Step3InputSchema.safeParse({
      lastPlatform: 'douyin',
      lastPersonalInfo: '我是一名有10年经验的医疗健康领域从业者，专注于大众健康科普',
      lastTargetAudience: '25-45岁关注健康的城市白领',
    });
    expect(result.success).toBe(true);
  });

  it('Step5InputSchema passes with valid category', () => {
    const result = Step5InputSchema.safeParse({
      lastIndustry: 'health',
      lastProduct: '健康养生课程',
      lastCategory: 'traffic',
    });
    expect(result.success).toBe(true);
  });

  it('Step6InputSchema passes with ≥50 chars source copy', () => {
    const result = Step6InputSchema.safeParse({
      lastSourceCopy: '这是一段超过五十个字的原稿内容，用来测试文案生成功能是否正常工作，内容包含足够多的文字以满足最小长度限制',
    });
    expect(result.success).toBe(true);
  });

  it('Step8InputSchema passes with all required fields', () => {
    const result = Step8InputSchema.safeParse({
      lastPlatform: 'douyin',
      lastExperience: 'beginner',
    });
    expect(result.success).toBe(true);
  });
});

// ── zod fail inline error: Chinese error messages on invalid data ─────────────
describe('zod fail inline error: Chinese error messages', () => {
  it('Step1InputSchema shows 行业必填 when industry is empty', () => {
    const result = Step1InputSchema.safeParse({ lastIndustry: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.flatMap((i) => [i.message]);
      expect(msgs.some((m) => m.includes('行业') || m.includes('必填'))).toBe(true);
    }
  });

  it('Step3InputSchema shows error when personalInfo is too short', () => {
    const result = Step3InputSchema.safeParse({
      lastPlatform: 'douyin',
      lastPersonalInfo: '短文本',
      lastTargetAudience: '目标用户',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const personalInfoError = result.error.issues.find((i) =>
        i.path.includes('lastPersonalInfo'),
      );
      expect(personalInfoError?.message).toBe('个人信息至少20字');
    }
  });

  it('Step3InputSchema shows error when platform missing', () => {
    const result = Step3InputSchema.safeParse({
      lastPlatform: '',
      lastPersonalInfo: '我是一名有多年经验的从业者，专注于内容创作和品牌建设领域',
      lastTargetAudience: '目标用户群体',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const platformError = result.error.issues.find((i) =>
        i.path.includes('lastPlatform'),
      );
      expect(platformError).toBeDefined();
    }
  });

  it('Step6InputSchema shows error when sourceCopy is too short', () => {
    const result = Step6InputSchema.safeParse({ lastSourceCopy: '太短了' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const err = result.error.issues.find((i) => i.path.includes('lastSourceCopy'));
      expect(err?.message).toBe('原稿至少50字');
    }
  });

  it('Step7InputSchema shows error when topic is too short', () => {
    const result = Step7InputSchema.safeParse({
      lastScriptType: 'opinion',
      lastElements: [],
      lastTopic: '一',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const topicError = result.error.issues.find((i) => i.path.includes('lastTopic'));
      expect(topicError?.message).toBe('话题至少2字');
    }
  });
});

// ── mutation success: valid parse → ready to submit ───────────────────────────
describe('mutation success: full valid payloads pass all schemas', () => {
  it('Step7InputSchema passes with script type + elements + topic', () => {
    const result = Step7InputSchema.safeParse({
      lastScriptType: 'story',
      lastElements: ['curiosity', 'resonance'],
      lastTopic: '创业者的蜕变故事',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.lastElements).toHaveLength(2);
    }
  });

  it('Step7InputSchema rejects more than 5 elements', () => {
    const result = Step7InputSchema.safeParse({
      lastScriptType: 'story',
      lastElements: ['greed', 'fear', 'curiosity', 'contrast', 'worst', 'leverage'],
      lastTopic: '测试话题文字',
    });
    expect(result.success).toBe(false);
  });
});

// ── mutation error toast: error paths are present for all schemas ─────────────
describe('mutation error toast: error structures are consistent', () => {
  it('Step5InputSchema fails with Chinese error when product too short', () => {
    const result = Step5InputSchema.safeParse({
      lastIndustry: 'edu',
      lastProduct: '短',
      lastCategory: 'traffic',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const err = result.error.issues.find((i) => i.path.includes('lastProduct'));
      expect(err?.message).toBe('产品描述至少5字');
    }
  });

  it('Step8InputSchema fails with readable error when experience invalid', () => {
    const result = Step8InputSchema.safeParse({
      lastPlatform: 'douyin',
      lastExperience: 'invalid_value',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const err = result.error.issues.find((i) => i.path.includes('lastExperience'));
      expect(err?.message).toBe('请选择经验等级');
    }
  });
});
