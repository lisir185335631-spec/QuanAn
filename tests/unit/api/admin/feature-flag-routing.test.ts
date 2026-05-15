// PRD-14 US-013 · feature-flag-routing.test.ts
// AC-5: ≥ 8 it · percentage 0%/50%/100% · targeted user/plan · boolean toggle · unknown flagKey upsert+dual
// SHIELD: hash 用 userId:flagKey (非 flagKey:userId) · 与 US-013 AC-1 一致
// SHIELD: rolloutConfig 用 discriminatedUnion 严格校验 · 非 Record<string, unknown>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHash } from 'node:crypto';

// ── Hoisted mocks ──────────────────────────────────────────────────────────

const mockLogAdminAction = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockRequestApproval = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ id: 42, requireDualApproval: true }),
);
const mockEmergencyApprove = vi.hoisted(() => vi.fn().mockResolvedValue({ id: 42 }));

const mockFeatureFlagFindUnique = vi.hoisted(() => vi.fn());
const mockFeatureFlagUpsert = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const mockSystemConfigUpdate = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const mockTransaction = vi.hoisted(() =>
  vi.fn().mockImplementation((cb: (tx: unknown) => unknown) =>
    cb({
      featureFlag: { upsert: mockFeatureFlagUpsert },
      systemConfig: { update: mockSystemConfigUpdate },
    }),
  ),
);

vi.mock('@/services/admin/admin-audit-service', () => ({
  logAdminAction: mockLogAdminAction,
}));

vi.mock('@/services/admin/approval/approvalGateService', () => ({
  requestApproval: mockRequestApproval,
  emergencyApprove: mockEmergencyApprove,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: mockTransaction,
    featureFlag: {
      findUnique: mockFeatureFlagFindUnique,
      upsert: mockFeatureFlagUpsert,
    },
    systemConfig: {
      update: mockSystemConfigUpdate,
    },
  },
}));

// ── Imports (after mocks) ──────────────────────────────────────────────────

import {
  getFeatureFlagValue,
  toggleFeatureFlag,
  rolloutConfigSchema,
  _clearAllCachesForTesting,
} from '@/services/admin/feature-flag/feature-flag.service';

// ── Helpers ────────────────────────────────────────────────────────────────

function computeBucket(userId: number, flagKey: string): number {
  const hash = createHash('md5').update(`${userId}:${flagKey}`).digest('hex');
  return parseInt(hash.slice(0, 8), 16) % 100;
}

// ── Fixtures ───────────────────────────────────────────────────────────────

const mkPctFlag = (pct: number) => ({
  id: 20,
  flagKey: 'pct_flag',
  flagType: 'percentage',
  defaultValue: false,
  enabled: true,
  rolloutConfig: { percentage: pct },
  updatedByAdminId: 1,
  updatedAt: new Date(),
});

const targetedFlag = {
  id: 30,
  flagKey: 'targeted_flag',
  flagType: 'targeted',
  defaultValue: false,
  enabled: true,
  rolloutConfig: { target_users: [101], target_plans: ['pro', 'enterprise'] },
  updatedByAdminId: 1,
  updatedAt: new Date(),
};

const booleanFlag = {
  id: 10,
  flagKey: 'bool_flag',
  flagType: 'boolean',
  defaultValue: true,
  enabled: true,
  rolloutConfig: null,
  updatedByAdminId: 1,
  updatedAt: new Date(),
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe('getFeatureFlagValue — percentage flagType routing (AC-1)', () => {
  beforeEach(() => { vi.clearAllMocks(); _clearAllCachesForTesting(); });

  it('percentage 0% → 所有 userId 返回 false', async () => {
    mockFeatureFlagFindUnique.mockResolvedValue(mkPctFlag(0));
    // bucket 0-99 < 0 is always false
    for (const uid of [1, 2, 3, 42, 999]) {
      _clearAllCachesForTesting();
      mockFeatureFlagFindUnique.mockResolvedValue(mkPctFlag(0));
      expect(await getFeatureFlagValue('pct_flag', uid)).toBe(false);
    }
  });

  it('percentage 100% → 所有 userId 返回 true', async () => {
    for (const uid of [1, 2, 3, 42, 999]) {
      _clearAllCachesForTesting();
      mockFeatureFlagFindUnique.mockResolvedValue(mkPctFlag(100));
      expect(await getFeatureFlagValue('pct_flag', uid)).toBe(true);
    }
  });

  it('percentage 50% → deterministic · 同 userId×flagKey 多次一致 (AC-1)', async () => {
    mockFeatureFlagFindUnique.mockResolvedValue(mkPctFlag(50));
    const uid = 77;
    const expected = computeBucket(uid, 'pct_flag') < 50;
    expect(await getFeatureFlagValue('pct_flag', uid)).toBe(expected);
    // 第二次命中缓存 · 仍一致
    expect(await getFeatureFlagValue('pct_flag', uid)).toBe(expected);
    // DB 只查了一次(第二次是缓存)
    expect(mockFeatureFlagFindUnique).toHaveBeenCalledTimes(1);
  });

  it('percentage: userId 缺失 → false (无 userId 无法分流)', async () => {
    mockFeatureFlagFindUnique.mockResolvedValue(mkPctFlag(100));
    expect(await getFeatureFlagValue('pct_flag')).toBe(false);
  });
});

describe('getFeatureFlagValue — targeted flagType routing (AC-2)', () => {
  beforeEach(() => { vi.clearAllMocks(); _clearAllCachesForTesting(); });

  it('targeted: userId in target_users → true', async () => {
    mockFeatureFlagFindUnique.mockResolvedValue(targetedFlag);
    expect(await getFeatureFlagValue('targeted_flag', 101)).toBe(true);
  });

  it('targeted: plan in target_plans → true', async () => {
    mockFeatureFlagFindUnique.mockResolvedValue(targetedFlag);
    expect(await getFeatureFlagValue('targeted_flag', 999, 'pro')).toBe(true);
  });

  it('targeted: userId 不在 + plan 不在 → false', async () => {
    mockFeatureFlagFindUnique.mockResolvedValue(targetedFlag);
    expect(await getFeatureFlagValue('targeted_flag', 999, 'free')).toBe(false);
  });
});

describe('getFeatureFlagValue — boolean flagType routing', () => {
  beforeEach(() => { vi.clearAllMocks(); _clearAllCachesForTesting(); });

  it('boolean flagType: defaultValue=true → true', async () => {
    mockFeatureFlagFindUnique.mockResolvedValue(booleanFlag);
    expect(await getFeatureFlagValue('bool_flag')).toBe(true);
  });

  it('boolean flagType: defaultValue=false → false', async () => {
    mockFeatureFlagFindUnique.mockResolvedValue({ ...booleanFlag, defaultValue: false });
    expect(await getFeatureFlagValue('bool_flag')).toBe(false);
  });
});

describe('toggleFeatureFlag — 任意 flagKey upsert + dual approval (AC-4)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('未知 flagKey → 不抛 NOT_FOUND · 创建 dual approval request', async () => {
    const result = await toggleFeatureFlag('brand_new_feature_xyz', true, 5);
    expect(result.approvalRequestId).toBe(42);
    expect(mockRequestApproval).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: 'toggle_feature_flag',
        requireDualApproval: true,
        actionPayload: expect.objectContaining({ flagKey: 'brand_new_feature_xyz' }),
      }),
    );
  });

  it('已知 flagKey + valid rolloutConfig(percentage) → approval request', async () => {
    const rolloutConfig = { flagType: 'percentage' as const, percentage: 50 };
    const result = await toggleFeatureFlag('pct_flag', true, 1, rolloutConfig);
    expect(result.approvalRequestId).toBe(42);
    expect(mockRequestApproval).toHaveBeenCalledWith(
      expect.objectContaining({ actionPayload: expect.objectContaining({ rolloutConfig }) }),
    );
  });

  it('invalid rolloutConfig (非 discriminatedUnion) → zod 校验抛错 (AC-3)', async () => {
    // anti-pattern: Record<string, unknown> 任意 JSON 不能通过
    const badConfig = { someRandomKey: 'value' };
    await expect(toggleFeatureFlag('pct_flag', true, 1, badConfig as never)).rejects.toThrow();
  });
});

describe('rolloutConfigSchema — discriminatedUnion 严格校验 (AC-3)', () => {
  it('boolean: { flagType: "boolean" } → valid', () => {
    expect(() => rolloutConfigSchema.parse({ flagType: 'boolean' })).not.toThrow();
  });

  it('percentage: { flagType: "percentage", percentage: 50 } → valid', () => {
    expect(() => rolloutConfigSchema.parse({ flagType: 'percentage', percentage: 50 })).not.toThrow();
  });

  it('targeted: { flagType: "targeted", target_users: [1,2], target_plans: ["pro"] } → valid', () => {
    expect(() =>
      rolloutConfigSchema.parse({ flagType: 'targeted', target_users: [1, 2], target_plans: ['pro'] }),
    ).not.toThrow();
  });

  it('percentage out of range: percentage=101 → zod 抛错', () => {
    expect(() => rolloutConfigSchema.parse({ flagType: 'percentage', percentage: 101 })).toThrow();
  });

  it('targeted: 非法 plan → zod 抛错', () => {
    expect(() =>
      rolloutConfigSchema.parse({ flagType: 'targeted', target_plans: ['unknown_plan'] }),
    ).toThrow();
  });
});
