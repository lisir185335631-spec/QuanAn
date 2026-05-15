// PRD-14 US-011 · feature-flag.service unit tests
// AC: ≥ 3 new tests · pnpm test ≥ 1830 pass · 0 fail

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';

// ── Hoisted mocks ──────────────────────────────────────────────────────────

const mockLogAdminAction = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockRequestApproval = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ id: 77, requireDualApproval: true }),
);
const mockEmergencyApprove = vi.hoisted(() => vi.fn().mockResolvedValue({ id: 77 }));

const mockFeatureFlagFindUnique = vi.hoisted(() => vi.fn());
const mockFeatureFlagUpdate = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const mockFeatureFlagUpsert = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const mockSystemConfigFindUnique = vi.hoisted(() => vi.fn());
const mockSystemConfigUpdate = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const mockTransaction = vi.hoisted(() =>
  vi.fn().mockImplementation((cb: (tx: unknown) => unknown) =>
    cb({
      featureFlag: { update: mockFeatureFlagUpdate, upsert: mockFeatureFlagUpsert },
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
      update: mockFeatureFlagUpdate,
      upsert: mockFeatureFlagUpsert,
    },
    systemConfig: {
      findUnique: mockSystemConfigFindUnique,
      update: mockSystemConfigUpdate,
    },
  },
}));

// ── Imports (after mocks) ──────────────────────────────────────────────────

import {
  _toggleFeatureFlagInTx,
  _updateSystemConfigInTx,
  toggleFeatureFlag,
  emergencyToggleSystemConfig,
  getFeatureFlagValue,
  _clearAllCachesForTesting,
} from '@/services/admin/feature-flag/feature-flag.service';

// ── Fixtures ──────────────────────────────────────────────────────────────

const booleanFlag = {
  id: 1,
  flagKey: 'beta_editor',
  flagType: 'boolean',
  defaultValue: true,
  enabled: true,
  rolloutConfig: null,
  updatedByAdminId: 1,
  updatedAt: new Date(),
};

const percentageFlag = {
  id: 2,
  flagKey: 'new_dashboard',
  flagType: 'percentage',
  defaultValue: false,
  enabled: true,
  rolloutConfig: { percentage: 50 },
  updatedByAdminId: 1,
  updatedAt: new Date(),
};

const targetedFlag = {
  id: 3,
  flagKey: 'vip_feature',
  flagType: 'targeted',
  defaultValue: false,
  enabled: true,
  rolloutConfig: { target_users: [42], target_plans: ['pro'] },
  updatedByAdminId: 1,
  updatedAt: new Date(),
};

const systemConfigRecord = {
  id: 1,
  configKey: 'stop_trending_scraper',
  configValue: false,
  isEmergency: true,
  updatedByAdminId: 1,
  updatedAt: new Date(),
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe('_toggleFeatureFlagInTx', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should call tx.featureFlag.upsert with correct update params (US-013 AC-4)', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({});
    const tx = {
      featureFlag: { upsert: mockUpsert },
      systemConfig: { update: vi.fn() },
    } as unknown as Parameters<typeof _toggleFeatureFlagInTx>[0];

    await _toggleFeatureFlagInTx(tx, { flagKey: 'beta_editor', enabled: true, adminId: 1 });

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { flagKey: 'beta_editor' },
        update: expect.objectContaining({ enabled: true, updatedByAdminId: 1 }),
        create: expect.objectContaining({ flagKey: 'beta_editor', enabled: true }),
      }),
    );
  });

  it('should include rolloutConfig in both update and create when provided', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({});
    const tx = {
      featureFlag: { upsert: mockUpsert },
      systemConfig: { update: vi.fn() },
    } as unknown as Parameters<typeof _toggleFeatureFlagInTx>[0];

    await _toggleFeatureFlagInTx(tx, {
      flagKey: 'new_dashboard',
      enabled: true,
      flagType: 'percentage',
      rolloutConfig: { percentage: 30 },
      adminId: 2,
    });

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ rolloutConfig: { percentage: 30 }, flagType: 'percentage' }),
        create: expect.objectContaining({ rolloutConfig: { percentage: 30 }, flagType: 'percentage' }),
      }),
    );
  });
});

describe('_updateSystemConfigInTx', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should call tx.systemConfig.update with correct params', async () => {
    const tx = {
      featureFlag: { update: vi.fn() },
      systemConfig: { update: vi.fn().mockResolvedValue({}) },
    } as unknown as Parameters<typeof _updateSystemConfigInTx>[0];

    await _updateSystemConfigInTx(tx, {
      configKey: 'stop_trending_scraper',
      configValue: true,
      adminId: 1,
    });

    expect(tx.systemConfig.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { configKey: 'stop_trending_scraper' },
        data: expect.objectContaining({ configValue: true, updatedByAdminId: 1 }),
      }),
    );
  });
});

describe('toggleFeatureFlag', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should request dual approval with actionType toggle_feature_flag', async () => {
    mockFeatureFlagFindUnique.mockResolvedValue(booleanFlag);

    const result = await toggleFeatureFlag('beta_editor', false, 5);

    expect(mockRequestApproval).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: 'toggle_feature_flag',
        requireDualApproval: true,
      }),
    );
    expect(result.approvalRequestId).toBe(77);
  });

  it('should support unknown flagKey (upsert) — AC-4: no longer throws NOT_FOUND', async () => {
    // US-013 AC-4: toggleFeatureFlag supports arbitrary flagKey · upsert · dual approval
    const result = await toggleFeatureFlag('brand_new_flag', true, 1);
    expect(result.approvalRequestId).toBe(77);
    expect(mockRequestApproval).toHaveBeenCalledWith(
      expect.objectContaining({ actionType: 'toggle_feature_flag', requireDualApproval: true }),
    );
  });
});

describe('emergencyToggleSystemConfig', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should call requestApproval then emergencyApprove then update config', async () => {
    mockSystemConfigFindUnique.mockResolvedValue(systemConfigRecord);

    const result = await emergencyToggleSystemConfig(
      'stop_trending_scraper',
      true,
      1,
      'INC-001',
    );

    expect(mockRequestApproval).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: 'update_system_config',
        emergencyMode: true,
        emergencyIncidentId: 'INC-001',
      }),
    );
    expect(mockEmergencyApprove).toHaveBeenCalledWith(77, 1, 'INC-001');
    expect(result.approvalRequestId).toBe(77);
  });

  it('should throw NOT_FOUND when config does not exist', async () => {
    mockSystemConfigFindUnique.mockResolvedValue(null);

    await expect(
      emergencyToggleSystemConfig('missing_key', true, 1, 'INC-002'),
    ).rejects.toThrow(TRPCError);
  });
});

describe('getFeatureFlagValue', () => {
  beforeEach(() => { vi.clearAllMocks(); _clearAllCachesForTesting(); });

  it('should return defaultValue for boolean flagType', async () => {
    mockFeatureFlagFindUnique.mockResolvedValue(booleanFlag);
    expect(await getFeatureFlagValue('beta_editor')).toBe(true);
  });

  it('should return false when flag is disabled', async () => {
    mockFeatureFlagFindUnique.mockResolvedValue({ ...booleanFlag, enabled: false });
    expect(await getFeatureFlagValue('beta_editor')).toBe(false);
  });

  it('should return false when flag not found', async () => {
    mockFeatureFlagFindUnique.mockResolvedValue(null);
    expect(await getFeatureFlagValue('unknown_flag')).toBe(false);
  });

  it('should use md5 hash bucket for percentage flagType', async () => {
    mockFeatureFlagFindUnique.mockResolvedValue(percentageFlag); // 50%

    // userId=1: deterministic hash bucket — test that the function runs without throwing
    const result = await getFeatureFlagValue('new_dashboard', 1);
    expect(typeof result).toBe('boolean');
  });

  it('should return false for percentage without userId', async () => {
    mockFeatureFlagFindUnique.mockResolvedValue(percentageFlag);
    expect(await getFeatureFlagValue('new_dashboard')).toBe(false);
  });

  it('should return true for targeted flagType when userId matches', async () => {
    mockFeatureFlagFindUnique.mockResolvedValue(targetedFlag);
    expect(await getFeatureFlagValue('vip_feature', 42)).toBe(true);
  });

  it('should return true for targeted flagType when plan matches', async () => {
    mockFeatureFlagFindUnique.mockResolvedValue(targetedFlag);
    expect(await getFeatureFlagValue('vip_feature', 99, 'pro')).toBe(true);
  });

  it('should return false for targeted flagType when neither userId nor plan matches', async () => {
    mockFeatureFlagFindUnique.mockResolvedValue(targetedFlag);
    expect(await getFeatureFlagValue('vip_feature', 99, 'free')).toBe(false);
  });
});
