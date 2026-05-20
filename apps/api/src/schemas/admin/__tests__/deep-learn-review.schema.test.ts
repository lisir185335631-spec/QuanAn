import { describe, it, expect } from 'vitest';

import {
  deepLearnReviewQueueSchema,
  deepLearnReviewStatusEnum,
  deepLearnAutoVerdictEnum,
} from '../deep-learn-review.schema';
import {
  userViolationLogSchema,
  upsertUserViolationSchema,
  violationTypeEnum,
} from '../user-violation.schema';

// ── DeepLearnReviewQueue ─────────────────────────────────────────────────────

describe('deepLearnReviewQueueSchema', () => {
  const validBase = {
    userId: 1,
    accountId: 2,
    fileName: 'photo.jpg',
    fileMime: 'image/jpeg',
    fileSize: 204800,
    fileUrl: 'https://cdn.example.com/uploads/photo.jpg',
    autoScanResult: { piiHits: [], bannedWords: [], score: 0.05 },
    autoVerdict: 'needs_review' as const,
    status: 'pending' as const,
  };

  it('accepts valid pending item', () => {
    expect(deepLearnReviewQueueSchema.safeParse(validBase).success).toBe(true);
  });

  it('rejects unknown status value', () => {
    const result = deepLearnReviewQueueSchema.safeParse({ ...validBase, status: 'unknown' });
    expect(result.success).toBe(false);
  });

  it('rejects unknown autoVerdict value', () => {
    const result = deepLearnReviewQueueSchema.safeParse({ ...validBase, autoVerdict: 'maybe' });
    expect(result.success).toBe(false);
  });

  it('accepts all valid status values', () => {
    const statuses = ['pending', 'approved', 'rejected', 'auto_approved', 'auto_rejected'] as const;
    for (const status of statuses) {
      expect(deepLearnReviewQueueSchema.safeParse({ ...validBase, status }).success).toBe(true);
    }
  });

  it('accepts all valid autoVerdict values', () => {
    const verdicts = ['auto_approved', 'auto_rejected', 'needs_review'] as const;
    for (const autoVerdict of verdicts) {
      expect(deepLearnReviewQueueSchema.safeParse({ ...validBase, autoVerdict }).success).toBe(true);
    }
  });

  it('rejects non-URL fileUrl', () => {
    const result = deepLearnReviewQueueSchema.safeParse({ ...validBase, fileUrl: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('rejects empty fileName', () => {
    const result = deepLearnReviewQueueSchema.safeParse({ ...validBase, fileName: '' });
    expect(result.success).toBe(false);
  });

  it('accepts optional fields as undefined', () => {
    const result = deepLearnReviewQueueSchema.safeParse({
      ...validBase,
      reviewerAdminId: undefined,
      reviewedAt: undefined,
      rejectReason: undefined,
      archiveId: undefined,
    });
    expect(result.success).toBe(true);
  });

  it('accepts archiveId when provided', () => {
    const result = deepLearnReviewQueueSchema.safeParse({ ...validBase, archiveId: 42 });
    expect(result.success).toBe(true);
  });
});

describe('deepLearnReviewStatusEnum', () => {
  it('rejects invalid enum value', () => {
    expect(deepLearnReviewStatusEnum.safeParse('draft').success).toBe(false);
  });
});

describe('deepLearnAutoVerdictEnum', () => {
  it('rejects invalid enum value', () => {
    expect(deepLearnAutoVerdictEnum.safeParse('uncertain').success).toBe(false);
  });
});

// ── UserViolationLog ─────────────────────────────────────────────────────────

describe('userViolationLogSchema', () => {
  const validBase = {
    userId: 10,
    violationType: 'pii_upload' as const,
  };

  it('accepts valid violation log entry', () => {
    expect(userViolationLogSchema.safeParse(validBase).success).toBe(true);
  });

  it('accepts all valid violationType values', () => {
    const types = ['pii_upload', 'banned_content', 'trending_abuse', 'other'] as const;
    for (const violationType of types) {
      expect(userViolationLogSchema.safeParse({ ...validBase, violationType }).success).toBe(true);
    }
  });

  it('rejects unknown violationType value', () => {
    const result = userViolationLogSchema.safeParse({ ...validBase, violationType: 'hack_attempt' });
    expect(result.success).toBe(false);
  });

  it('rejects negative count', () => {
    const result = userViolationLogSchema.safeParse({ ...validBase, count: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects negative warningCount', () => {
    const result = userViolationLogSchema.safeParse({ ...validBase, warningCount: -5 });
    expect(result.success).toBe(false);
  });

  it('accepts optional suspension fields', () => {
    const result = userViolationLogSchema.safeParse({
      ...validBase,
      suspendedAt: new Date(),
      suspendedByAdminId: 99,
      suspendedReason: 'repeated pii violations',
    });
    expect(result.success).toBe(true);
  });

  it('accepts all optional fields as undefined', () => {
    const result = userViolationLogSchema.safeParse({
      ...validBase,
      lastReviewItemId: undefined,
      suspendedAt: undefined,
      suspendedByAdminId: undefined,
      suspendedReason: undefined,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing userId', () => {
    const { userId: _omit, ...missing } = validBase;
    expect(userViolationLogSchema.safeParse(missing).success).toBe(false);
  });
});

describe('upsertUserViolationSchema', () => {
  it('accepts valid upsert input', () => {
    const result = upsertUserViolationSchema.safeParse({
      userId: 5,
      violationType: 'banned_content',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid violationType in upsert', () => {
    const result = upsertUserViolationSchema.safeParse({
      userId: 5,
      violationType: 'spam',
    });
    expect(result.success).toBe(false);
  });
});

describe('violationTypeEnum', () => {
  it('rejects invalid enum value', () => {
    expect(violationTypeEnum.safeParse('copyright').success).toBe(false);
  });
});
