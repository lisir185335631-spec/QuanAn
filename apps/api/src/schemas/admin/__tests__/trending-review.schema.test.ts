import { describe, it, expect } from 'vitest';
import {
  trendingReviewQueueSchema,
  trendingTakedownSchema,
  autoReviewRuleSchema,
  trendingReviewStatusEnum,
  autoVerdictEnum,
  takedownReasonEnum,
  appealResolutionEnum,
  ruleTypeEnum,
} from '../trending-review.schema';

// ── TrendingReviewQueue ──────────────────────────────────────────────────────

describe('trendingReviewQueueSchema', () => {
  const validBase = {
    sourcePlatform: 'douyin',
    sourceItemId: 'abc123',
    sourceUrl: 'https://example.com/item/1',
    rawContent: { title: 'test', views: 1000 },
    autoScanResult: { hitWords: [], piiHits: [], score: 0.1 },
    autoVerdict: 'needs_review' as const,
    status: 'pending' as const,
  };

  it('accepts valid pending item', () => {
    expect(trendingReviewQueueSchema.safeParse(validBase).success).toBe(true);
  });

  it('rejects unknown status value', () => {
    const result = trendingReviewQueueSchema.safeParse({ ...validBase, status: 'unknown_status' });
    expect(result.success).toBe(false);
  });

  it('rejects unknown autoVerdict value', () => {
    const result = trendingReviewQueueSchema.safeParse({ ...validBase, autoVerdict: 'maybe' });
    expect(result.success).toBe(false);
  });

  it('accepts all valid status values', () => {
    const statuses = ['pending', 'approved', 'rejected', 'auto_approved', 'auto_rejected'] as const;
    for (const status of statuses) {
      expect(trendingReviewQueueSchema.safeParse({ ...validBase, status }).success).toBe(true);
    }
  });

  it('accepts all valid autoVerdict values', () => {
    const verdicts = ['auto_approved', 'auto_rejected', 'needs_review'] as const;
    for (const autoVerdict of verdicts) {
      expect(trendingReviewQueueSchema.safeParse({ ...validBase, autoVerdict }).success).toBe(true);
    }
  });

  it('accepts JSON object for rawContent and autoScanResult', () => {
    const result = trendingReviewQueueSchema.safeParse({
      ...validBase,
      rawContent: { nested: { a: 1 }, arr: [1, 2] },
      autoScanResult: { hitWords: ['bad'], score: 0.9 },
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const { sourcePlatform: _omit, ...missing } = validBase;
    expect(trendingReviewQueueSchema.safeParse(missing).success).toBe(false);
  });

  it('accepts optional fields as undefined', () => {
    const result = trendingReviewQueueSchema.safeParse({
      ...validBase,
      reviewerAdminId: undefined,
      reviewedAt: undefined,
      rejectReason: undefined,
      trendingItemId: undefined,
    });
    expect(result.success).toBe(true);
  });
});

// ── TrendingTakedown ─────────────────────────────────────────────────────────

describe('trendingTakedownSchema', () => {
  const validBase = {
    trendingItemId: 42,
    reason: 'reported' as const,
  };

  it('accepts valid takedown with required fields only', () => {
    expect(trendingTakedownSchema.safeParse(validBase).success).toBe(true);
  });

  it('rejects unknown reason value', () => {
    const result = trendingTakedownSchema.safeParse({ ...validBase, reason: 'other' });
    expect(result.success).toBe(false);
  });

  it('accepts all valid reason values', () => {
    const reasons = ['reported', 'auto_rule', 'admin_judgment'] as const;
    for (const reason of reasons) {
      expect(trendingTakedownSchema.safeParse({ ...validBase, reason }).success).toBe(true);
    }
  });

  it('accepts valid appealResolution values', () => {
    for (const appealResolution of ['restored', 'final_takedown'] as const) {
      expect(
        trendingTakedownSchema.safeParse({ ...validBase, hasAppeal: true, appealResolution }).success,
      ).toBe(true);
    }
  });

  it('rejects unknown appealResolution', () => {
    const result = trendingTakedownSchema.safeParse({
      ...validBase,
      appealResolution: 'dismissed',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer trendingItemId', () => {
    const result = trendingTakedownSchema.safeParse({ ...validBase, trendingItemId: 1.5 });
    expect(result.success).toBe(false);
  });
});

// ── AutoReviewRule ───────────────────────────────────────────────────────────

describe('autoReviewRuleSchema', () => {
  const validBase = {
    ruleType: 'banned_word' as const,
    ruleKey: 'violence_level_1',
    ruleValue: { threshold: 0.8 },
    updatedByAdminId: 1,
  };

  it('accepts valid rule', () => {
    expect(autoReviewRuleSchema.safeParse(validBase).success).toBe(true);
  });

  it('rejects unknown ruleType', () => {
    const result = autoReviewRuleSchema.safeParse({ ...validBase, ruleType: 'custom_type' });
    expect(result.success).toBe(false);
  });

  it('accepts all valid ruleType values', () => {
    const types = ['banned_word', 'sampling_rate', 'industry_quota'] as const;
    for (const ruleType of types) {
      expect(autoReviewRuleSchema.safeParse({ ...validBase, ruleType }).success).toBe(true);
    }
  });

  it('accepts JSON object for ruleValue', () => {
    const result = autoReviewRuleSchema.safeParse({
      ...validBase,
      ruleValue: { keywords: ['word1', 'word2'], weight: 1 },
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty ruleKey', () => {
    const result = autoReviewRuleSchema.safeParse({ ...validBase, ruleKey: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing updatedByAdminId', () => {
    const { updatedByAdminId: _omit, ...missing } = validBase;
    expect(autoReviewRuleSchema.safeParse(missing).success).toBe(false);
  });

  it('defaults enabled to true when not provided', () => {
    const result = autoReviewRuleSchema.safeParse(validBase);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.enabled).toBe(true);
    }
  });
});

// ── Enum exports sanity checks ────────────────────────────────────────────────

describe('enum exports', () => {
  it('trendingReviewStatusEnum has 5 values', () => {
    expect(trendingReviewStatusEnum.options).toHaveLength(5);
  });

  it('autoVerdictEnum has 3 values', () => {
    expect(autoVerdictEnum.options).toHaveLength(3);
  });

  it('takedownReasonEnum has 3 values', () => {
    expect(takedownReasonEnum.options).toHaveLength(3);
  });

  it('appealResolutionEnum has 2 values', () => {
    expect(appealResolutionEnum.options).toHaveLength(2);
  });

  it('ruleTypeEnum has 3 values', () => {
    expect(ruleTypeEnum.options).toHaveLength(3);
  });
});
