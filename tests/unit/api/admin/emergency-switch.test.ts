// PRD-14 US-012 · emergency-switch.test.ts
// AC-9: ≥ 8 it · 3 开关 toggle + bypass + emergencyApprove + TTL cache + flagType 路由 + 钉钉 isMock + manual stop 走单点

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';

// ── Hoisted mocks ──────────────────────────────────────────────────────────

const mockLogAdminAction = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockRequestApproval = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ id: 99 }),
);
const mockEmergencyApprove = vi.hoisted(() => vi.fn().mockResolvedValue({ id: 99 }));
const mockDingtalkSend = vi.hoisted(() => vi.fn().mockResolvedValue({ ok: true, mock: true }));

const mockFeatureFlagFindUnique = vi.hoisted(() => vi.fn());
const mockSystemConfigFindUnique = vi.hoisted(() => vi.fn());
const mockSystemConfigUpdate = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const mockTransaction = vi.hoisted(() =>
  vi.fn().mockImplementation((cb: (tx: unknown) => unknown) =>
    cb({
      featureFlag: { update: vi.fn() },
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

vi.mock('@/services/admin/notifications/dingtalk.service', () => ({
  DingtalkService: vi.fn().mockImplementation(() => ({
    send: mockDingtalkSend,
  })),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: mockTransaction,
    featureFlag: {
      findUnique: mockFeatureFlagFindUnique,
      update: vi.fn().mockResolvedValue({}),
    },
    systemConfig: {
      findUnique: mockSystemConfigFindUnique,
      update: mockSystemConfigUpdate,
    },
  },
}));

// ── Imports (after mocks) ──────────────────────────────────────────────────

import {
  emergencyToggleSystemConfig,
  getFeatureFlagValue,
  getSystemConfigValue,
  _clearAllCachesForTesting,
} from '@/services/admin/feature-flag/feature-flag.service';

// ── Fixtures ──────────────────────────────────────────────────────────────

const stopTrendingConfig = {
  id: 1,
  configKey: 'stop_trending_scraper',
  configValue: false,
  isEmergency: true,
  updatedByAdminId: 1,
  updatedAt: new Date(),
};

const stopEvolutionConfig = {
  id: 2,
  configKey: 'stop_evolution_agent',
  configValue: false,
  isEmergency: true,
  updatedByAdminId: 1,
  updatedAt: new Date(),
};

const enableFallbackConfig = {
  id: 3,
  configKey: 'enable_fallback_prompt',
  configValue: false,
  isEmergency: true,
  updatedByAdminId: 1,
  updatedAt: new Date(),
};

const booleanFlag = {
  id: 10,
  flagKey: 'stop_trending_scraper',
  flagType: 'boolean',
  defaultValue: true,
  enabled: true,
  rolloutConfig: null,
  updatedByAdminId: 1,
  updatedAt: new Date(),
};

const percentageFlag = {
  id: 11,
  flagKey: 'feature_pct',
  flagType: 'percentage',
  defaultValue: false,
  enabled: true,
  rolloutConfig: { percentage: 100 },
  updatedByAdminId: 1,
  updatedAt: new Date(),
};

const targetedFlag = {
  id: 12,
  flagKey: 'feature_targeted',
  flagType: 'targeted',
  defaultValue: false,
  enabled: true,
  rolloutConfig: { target_users: [42], target_plans: ['pro'] },
  updatedByAdminId: 1,
  updatedAt: new Date(),
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe('emergencyToggleSystemConfig — 3 关键紧急开关 + emergencyApprove + postReviewRequired', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _clearAllCachesForTesting();
  });

  it('stop_trending_scraper: 触发 emergencyApprove + 写 security_alert audit + 钉钉 isMock', async () => {
    mockSystemConfigFindUnique.mockResolvedValue(stopTrendingConfig);

    const result = await emergencyToggleSystemConfig(
      'stop_trending_scraper',
      true,
      1,
      'INC-001',
    );

    // AC-5: emergencyApprove called (postReviewRequired=true 由 emergencyApprove 写)
    expect(mockEmergencyApprove).toHaveBeenCalledWith(99, 1, 'INC-001');
    expect(result.approvalRequestId).toBe(99);

    // AC-6: security_alert audit with configKey + incidentId
    const auditCall = mockLogAdminAction.mock.calls.find(
      ([params]: [{ eventType: string }][]) => params.eventType === 'emergency_switch_triggered',
    );
    expect(auditCall).toBeDefined();
    const [auditParams] = auditCall as [{ eventCategory: string; payload: Record<string, unknown> }][];
    expect(auditParams.eventCategory).toBe('security_alert');
    expect(auditParams.payload.configKey).toBe('stop_trending_scraper');
    expect(auditParams.payload.incidentId).toBe('INC-001');

    // AC-7: 钉钉 isMock=true (send called, mock mode)
    expect(mockDingtalkSend).toHaveBeenCalledOnce();
  });

  it('stop_evolution_agent: 触发 emergencyToggleSystemConfig · _updateSystemConfigInTx 走单点', async () => {
    mockSystemConfigFindUnique.mockResolvedValue(stopEvolutionConfig);

    await emergencyToggleSystemConfig('stop_evolution_agent', true, 1, 'INC-002');

    // LD-A11: _updateSystemConfigInTx 通过 $transaction 调用 · 不直接更新
    expect(mockTransaction).toHaveBeenCalledOnce();
    expect(mockSystemConfigUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { configKey: 'stop_evolution_agent' } }),
    );
  });

  it('enable_fallback_prompt: 触发 requestApproval with emergencyMode + incidentId', async () => {
    mockSystemConfigFindUnique.mockResolvedValue(enableFallbackConfig);

    await emergencyToggleSystemConfig('enable_fallback_prompt', true, 1, 'INC-003');

    expect(mockRequestApproval).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: 'update_system_config',
        emergencyMode: true,
        emergencyIncidentId: 'INC-003',
        riskLevel: 'high',
      }),
    );
  });

  it('incidentId 为空 → throw BAD_REQUEST', async () => {
    await expect(
      emergencyToggleSystemConfig('stop_trending_scraper', true, 1, ''),
    ).rejects.toThrow(TRPCError);
  });

  it('configKey 不存在 → throw NOT_FOUND', async () => {
    mockSystemConfigFindUnique.mockResolvedValue(null);

    await expect(
      emergencyToggleSystemConfig('stop_trending_scraper', true, 1, 'INC-004'),
    ).rejects.toThrow(TRPCError);
  });
});

describe('getFeatureFlagValue — 5s TTL cache + 3 flagType 路由', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _clearAllCachesForTesting();
  });

  it('boolean flagType: stop_trending_scraper=true → getFeatureFlagValue returns true', async () => {
    mockFeatureFlagFindUnique.mockResolvedValue(booleanFlag);

    const result = await getFeatureFlagValue('stop_trending_scraper');
    expect(result).toBe(true);
  });

  it('5s TTL cache: 第二次调用不再查 DB', async () => {
    mockFeatureFlagFindUnique.mockResolvedValue(booleanFlag);

    await getFeatureFlagValue('stop_trending_scraper');
    await getFeatureFlagValue('stop_trending_scraper'); // should hit cache
    // DB should only be called once despite 2 function calls
    expect(mockFeatureFlagFindUnique).toHaveBeenCalledTimes(1);
  });

  it('percentage flagType: 100% → 所有 userId 都命中', async () => {
    mockFeatureFlagFindUnique.mockResolvedValue(percentageFlag);
    const result = await getFeatureFlagValue('feature_pct', 42);
    expect(result).toBe(true);
  });

  it('targeted flagType: target_users 命中 → true', async () => {
    mockFeatureFlagFindUnique.mockResolvedValue(targetedFlag);
    expect(await getFeatureFlagValue('feature_targeted', 42)).toBe(true);
  });

  it('targeted flagType: target_plans 命中 → true', async () => {
    mockFeatureFlagFindUnique.mockResolvedValue(targetedFlag);
    expect(await getFeatureFlagValue('feature_targeted', 99, 'pro')).toBe(true);
  });
});

describe('getSystemConfigValue — 5s TTL cache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _clearAllCachesForTesting();
  });

  it('stop_evolution_agent=true → EvolutionAgent bypass 依赖此值', async () => {
    mockSystemConfigFindUnique.mockResolvedValue({ ...stopEvolutionConfig, configValue: true });
    const val = await getSystemConfigValue('stop_evolution_agent');
    expect(val).toBe(true);
  });

  it('5s TTL cache: getSystemConfigValue 第二次调用不再查 DB', async () => {
    mockSystemConfigFindUnique.mockResolvedValue(stopTrendingConfig);

    await getSystemConfigValue('stop_trending_scraper');
    await getSystemConfigValue('stop_trending_scraper');
    expect(mockSystemConfigFindUnique).toHaveBeenCalledTimes(1);
  });
});
