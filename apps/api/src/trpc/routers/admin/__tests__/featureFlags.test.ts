// PRD-14 US-014 · featureFlagsRouter unit tests — ≥ 30 tests
// 8 procedures: getKpiStats / listEmergencySwitches / listFeatureFlags / listSystemConfig /
//               toggle / updateSystemConfig / listPostReview / emergencyToggleSystemConfig

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ──────────────────────────────────────────────────────────

const mockFeatureFlagCount = vi.hoisted(() => vi.fn().mockResolvedValue(0));
const mockAuditLogCount = vi.hoisted(() => vi.fn().mockResolvedValue(0));
const mockSystemConfigFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockSystemConfigFindUnique = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockFeatureFlagFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockAdminUserFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockApprovalRequestFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockExecuteRawUnsafe = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

const mockToggleFeatureFlag = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ approvalRequestId: 99 }),
);
const mockEmergencyToggleSystemConfig = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ approvalRequestId: 77 }),
);
const mockRequestApproval = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ id: 55 }),
);

vi.mock('@/services/admin/feature-flag/feature-flag.service', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('@/services/admin/feature-flag/feature-flag.service')
  >();
  return {
    ...actual,
    emergencyToggleSystemConfig: mockEmergencyToggleSystemConfig,
    toggleFeatureFlag: mockToggleFeatureFlag,
  };
});

vi.mock('@/services/admin/approval/approvalGateService', () => ({
  requestApproval: mockRequestApproval,
  emergencyApprove: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn().mockImplementation((cb: (tx: unknown) => unknown) =>
      cb({
        $executeRawUnsafe: mockExecuteRawUnsafe,
        systemConfig: {
          update: vi.fn().mockResolvedValue({}),
        },
        adminAuditLog: { create: vi.fn().mockResolvedValue({}) },
      }),
    ),
    featureFlag: {
      count: mockFeatureFlagCount,
      findMany: mockFeatureFlagFindMany,
    },
    systemConfig: {
      findMany: mockSystemConfigFindMany,
      findUnique: mockSystemConfigFindUnique,
    },
    adminAuditLog: {
      count: mockAuditLogCount,
    },
    adminUser: {
      findMany: mockAdminUserFindMany,
    },
    approvalRequest: {
      findMany: mockApprovalRequestFindMany,
    },
  },
}));

// ── Imports ────────────────────────────────────────────────────────────────

import type { AdminLuciaSession, AdminLuciaUser } from '@/lib/auth/lucia-admin';
import { prisma } from '@/lib/prisma';
import type { AdminTRPCContext } from '@/server/context-admin';
import { featureFlagsRouter } from '@/trpc/routers/admin/featureFlags';

import type { PrismaClient } from '@prisma/client';


// ── Fixtures ───────────────────────────────────────────────────────────────

const SUPER_ADMIN: AdminLuciaUser = {
  id: 1,
  email: 'super@quanan.com',
  role: 'super_admin',
  isMock: true,
  isActive: true,
  allowedDomains: [],
};

const ADMIN_USER: AdminLuciaUser = {
  id: 2,
  email: 'admin@quanan.com',
  role: 'admin',
  isMock: true,
  isActive: true,
  allowedDomains: [],
};

const READONLY_ADMIN: AdminLuciaUser = {
  id: 3,
  email: 'ro@quanan.com',
  role: 'readonly_admin',
  isMock: true,
  isActive: true,
  allowedDomains: [],
};

const SESSION: AdminLuciaSession = {
  id: 'sess-test',
  expiresAt: new Date(Date.now() + 3600_000),
  fresh: false,
};

function makeCtx(user: AdminLuciaUser): AdminTRPCContext {
  return {
    req: new Request('http://localhost', {
      headers: { 'x-forwarded-for': '10.0.0.1', 'user-agent': 'test-agent' },
    }),
    resHeaders: new Headers(),
    prisma: prisma as unknown as PrismaClient,
    adminPrisma: prisma as unknown as PrismaClient,
    activeAdminUser: user,
    adminSession: SESSION,
    traceId: 'trace-us014',
  };
}

function makeCaller(user: AdminLuciaUser) {
  return featureFlagsRouter.createCaller(makeCtx(user));
}

// ── Fixtures: data ─────────────────────────────────────────────────────────

const EMERGENCY_CONFIG = {
  id: 1,
  configKey: 'stop_trending_scraper',
  configValue: false,
  description: '停止 trending 爬虫',
  isEmergency: true,
  updatedByAdminId: 1,
  updatedAt: new Date('2026-05-15T10:00:00Z'),
};

const NORMAL_CONFIG = {
  id: 2,
  configKey: 'max_concurrent_agents',
  configValue: 10,
  description: '最大并发 agent 数',
  isEmergency: false,
  updatedByAdminId: 1,
  updatedAt: new Date('2026-05-15T09:00:00Z'),
};

const FEATURE_FLAG = {
  id: 1,
  flagKey: 'new_dashboard',
  description: '新仪表盘',
  flagType: 'boolean',
  defaultValue: false,
  rolloutConfig: null,
  enabled: true,
  updatedByAdminId: 1,
  updatedAt: new Date('2026-05-15T08:00:00Z'),
};

const ADMIN_USER_RECORD = { id: 1, email: 'super@quanan.com' };

const POST_REVIEW_ROW = {
  id: 10,
  actionType: 'update_system_config',
  actionPayload: { configKey: 'stop_trending_scraper' },
  decidedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
  postReviewRequired: true,
  postReviewedAt: null,
  approverAdminId: 1,
  requesterAdminId: 1,
  riskLevel: 'high',
  requireDualApproval: false,
  emergencyMode: true,
  emergencyIncidentId: 'INCIDENT-001',
  status: 'approved',
  displayStatus: 'approved',
  firstApproverEmail: null,
  secondApproverEmail: null,
  secondApproverAdminId: null,
  secondApprovedAt: null,
  decisionReason: null,
  secondDecisionReason: null,
  requesterReason: '',
  requesterRole: 'super_admin',
  createdAt: new Date(Date.now() - 9 * 60 * 60 * 1000),
  expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  postReviewResult: null,
  postReviewerAdminId: null,
  approvalRequestId: null,
};

// ── Tests: getKpiStats ────────────────────────────────────────────────────

describe('featureFlagsRouter.getKpiStats', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 4 KPI numbers', async () => {
    mockFeatureFlagCount.mockResolvedValueOnce(10).mockResolvedValueOnce(7);
    mockAuditLogCount.mockResolvedValueOnce(5).mockResolvedValueOnce(3);

    const result = await makeCaller(SUPER_ADMIN).getKpiStats();

    expect(result).toEqual({
      totalFlags: 10,
      enabledFlags: 7,
      recentChanges: 5,
      emergencyActivations: 3,
    });
  });

  it('returns zeros when no data', async () => {
    mockFeatureFlagCount.mockResolvedValue(0);
    mockAuditLogCount.mockResolvedValue(0);

    const result = await makeCaller(ADMIN_USER).getKpiStats();

    expect(result.totalFlags).toBe(0);
    expect(result.enabledFlags).toBe(0);
    expect(result.recentChanges).toBe(0);
    expect(result.emergencyActivations).toBe(0);
  });

  it('allows readonly_admin to view KPI stats', async () => {
    mockFeatureFlagCount.mockResolvedValue(5);
    mockAuditLogCount.mockResolvedValue(2);

    const result = await makeCaller(READONLY_ADMIN).getKpiStats();
    expect(result.totalFlags).toBe(5);
  });

  it('queries featureFlag.count twice (total and enabled)', async () => {
    mockFeatureFlagCount.mockResolvedValue(0);
    mockAuditLogCount.mockResolvedValue(0);

    await makeCaller(SUPER_ADMIN).getKpiStats();

    expect(mockFeatureFlagCount).toHaveBeenCalledTimes(2);
    expect(mockAuditLogCount).toHaveBeenCalledTimes(2);
  });
});

// ── Tests: listEmergencySwitches ──────────────────────────────────────────

describe('featureFlagsRouter.listEmergencySwitches', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns emergency configs with admin emails', async () => {
    mockSystemConfigFindMany.mockResolvedValue([EMERGENCY_CONFIG]);
    mockAdminUserFindMany.mockResolvedValue([ADMIN_USER_RECORD]);

    const result = await makeCaller(SUPER_ADMIN).listEmergencySwitches();

    expect(result).toHaveLength(1);
    expect(result[0]!.configKey).toBe('stop_trending_scraper');
    expect(result[0]!.isEmergency).toBe(true);
    expect(result[0]!.updatedByEmail).toBe('super@quanan.com');
  });

  it('queries with isEmergency=true filter', async () => {
    mockSystemConfigFindMany.mockResolvedValue([]);
    mockAdminUserFindMany.mockResolvedValue([]);

    await makeCaller(ADMIN_USER).listEmergencySwitches();

    expect(mockSystemConfigFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isEmergency: true } }),
    );
  });

  it('returns empty array when no emergency configs', async () => {
    mockSystemConfigFindMany.mockResolvedValue([]);
    mockAdminUserFindMany.mockResolvedValue([]);

    const result = await makeCaller(READONLY_ADMIN).listEmergencySwitches();
    expect(result).toHaveLength(0);
  });

  it('handles null admin email gracefully', async () => {
    mockSystemConfigFindMany.mockResolvedValue([{ ...EMERGENCY_CONFIG, updatedByAdminId: 999 }]);
    mockAdminUserFindMany.mockResolvedValue([]);

    const result = await makeCaller(SUPER_ADMIN).listEmergencySwitches();
    expect(result[0]!.updatedByEmail).toBeNull();
  });
});

// ── Tests: listFeatureFlags ───────────────────────────────────────────────

describe('featureFlagsRouter.listFeatureFlags', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns feature flags with admin emails', async () => {
    mockFeatureFlagFindMany.mockResolvedValue([FEATURE_FLAG]);
    mockAdminUserFindMany.mockResolvedValue([ADMIN_USER_RECORD]);

    const result = await makeCaller(SUPER_ADMIN).listFeatureFlags();

    expect(result).toHaveLength(1);
    expect(result[0]!.flagKey).toBe('new_dashboard');
    expect(result[0]!.updatedByEmail).toBe('super@quanan.com');
  });

  it('orders by updatedAt desc', async () => {
    mockFeatureFlagFindMany.mockResolvedValue([]);
    mockAdminUserFindMany.mockResolvedValue([]);

    await makeCaller(ADMIN_USER).listFeatureFlags();

    expect(mockFeatureFlagFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { updatedAt: 'desc' } }),
    );
  });

  it('allows readonly_admin to list feature flags', async () => {
    mockFeatureFlagFindMany.mockResolvedValue([FEATURE_FLAG]);
    mockAdminUserFindMany.mockResolvedValue([ADMIN_USER_RECORD]);

    const result = await makeCaller(READONLY_ADMIN).listFeatureFlags();
    expect(result).toHaveLength(1);
  });

  it('returns rolloutConfig when present', async () => {
    const flagWithRollout = {
      ...FEATURE_FLAG,
      flagType: 'percentage',
      rolloutConfig: { flagType: 'percentage', percentage: 50 },
    };
    mockFeatureFlagFindMany.mockResolvedValue([flagWithRollout]);
    mockAdminUserFindMany.mockResolvedValue([]);

    const result = await makeCaller(SUPER_ADMIN).listFeatureFlags();
    expect(result[0]!.rolloutConfig).toEqual({ flagType: 'percentage', percentage: 50 });
  });
});

// ── Tests: listSystemConfig ───────────────────────────────────────────────

describe('featureFlagsRouter.listSystemConfig', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns non-emergency system configs', async () => {
    mockSystemConfigFindMany.mockResolvedValue([NORMAL_CONFIG]);
    mockAdminUserFindMany.mockResolvedValue([ADMIN_USER_RECORD]);

    const result = await makeCaller(SUPER_ADMIN).listSystemConfig();

    expect(result).toHaveLength(1);
    expect(result[0]!.configKey).toBe('max_concurrent_agents');
    expect(result[0]!.isEmergency).toBe(false);
  });

  it('queries with isEmergency=false filter', async () => {
    mockSystemConfigFindMany.mockResolvedValue([]);
    mockAdminUserFindMany.mockResolvedValue([]);

    await makeCaller(ADMIN_USER).listSystemConfig();

    expect(mockSystemConfigFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isEmergency: false } }),
    );
  });

  it('allows readonly_admin to list system config', async () => {
    mockSystemConfigFindMany.mockResolvedValue([]);
    mockAdminUserFindMany.mockResolvedValue([]);

    const result = await makeCaller(READONLY_ADMIN).listSystemConfig();
    expect(result).toHaveLength(0);
  });
});

// ── Tests: toggle (feature flag) ─────────────────────────────────────────

describe('featureFlagsRouter.toggle', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls toggleFeatureFlag service and returns approvalRequestId', async () => {
    mockToggleFeatureFlag.mockResolvedValue({ approvalRequestId: 42 });

    const result = await makeCaller(ADMIN_USER).toggle({
      flagKey: 'new_dashboard',
      enabled: true,
    });

    expect(result.approvalRequestId).toBe(42);
    expect(mockToggleFeatureFlag).toHaveBeenCalledWith(
      'new_dashboard',
      true,
      2,
      undefined,
    );
  });

  it('passes rolloutConfig to toggleFeatureFlag', async () => {
    mockToggleFeatureFlag.mockResolvedValue({ approvalRequestId: 43 });

    await makeCaller(SUPER_ADMIN).toggle({
      flagKey: 'new_feature',
      enabled: true,
      rolloutConfig: { flagType: 'percentage', percentage: 30 },
    });

    expect(mockToggleFeatureFlag).toHaveBeenCalledWith(
      'new_feature',
      true,
      1,
      { flagType: 'percentage', percentage: 30 },
    );
  });

  it('allows admin to toggle feature flags', async () => {
    mockToggleFeatureFlag.mockResolvedValue({ approvalRequestId: 44 });

    const result = await makeCaller(ADMIN_USER).toggle({
      flagKey: 'test_flag',
      enabled: false,
    });

    expect(result.approvalRequestId).toBeDefined();
  });

  it('rejects input without flagKey', async () => {
    await expect(
      makeCaller(SUPER_ADMIN).toggle({ flagKey: '', enabled: true }),
    ).rejects.toThrow();
  });
});

// ── Tests: updateSystemConfig ─────────────────────────────────────────────

describe('featureFlagsRouter.updateSystemConfig', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates approval request for system config update', async () => {
    mockSystemConfigFindUnique.mockResolvedValue(NORMAL_CONFIG);
    mockRequestApproval.mockResolvedValue({ id: 88 });

    const result = await makeCaller(SUPER_ADMIN).updateSystemConfig({
      configKey: 'max_concurrent_agents',
      configValue: 20,
    });

    expect(result.approvalRequestId).toBe(88);
    expect(mockRequestApproval).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: 'update_system_config',
        requireDualApproval: true,
        riskLevel: 'medium',
      }),
    );
  });

  it('throws NOT_FOUND for unknown configKey', async () => {
    mockSystemConfigFindUnique.mockResolvedValue(null);

    await expect(
      makeCaller(ADMIN_USER).updateSystemConfig({
        configKey: 'nonexistent_key',
        configValue: 'value',
      }),
    ).rejects.toThrow('not found');
  });

  it('includes configKey and configValue in approval payload', async () => {
    mockSystemConfigFindUnique.mockResolvedValue(NORMAL_CONFIG);
    mockRequestApproval.mockResolvedValue({ id: 89 });

    await makeCaller(SUPER_ADMIN).updateSystemConfig({
      configKey: 'max_concurrent_agents',
      configValue: { limit: 15 },
    });

    expect(mockRequestApproval).toHaveBeenCalledWith(
      expect.objectContaining({
        actionPayload: { configKey: 'max_concurrent_agents', configValue: { limit: 15 } },
      }),
    );
  });

  it('rejects empty configKey', async () => {
    await expect(
      makeCaller(SUPER_ADMIN).updateSystemConfig({ configKey: '', configValue: 'value' }),
    ).rejects.toThrow();
  });
});

// ── Tests: listPostReview ─────────────────────────────────────────────────

describe('featureFlagsRouter.listPostReview', () => {
  beforeEach(() => vi.clearAllMocks());

  it('super_admin can list post-review items', async () => {
    mockApprovalRequestFindMany.mockResolvedValue([POST_REVIEW_ROW]);
    mockAdminUserFindMany.mockResolvedValue([ADMIN_USER_RECORD]);

    const result = await makeCaller(SUPER_ADMIN).listPostReview();

    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe(10);
    expect(result[0]!.postReviewRequired).toBe(true);
    expect(result[0]!.postReviewedAt).toBeNull();
  });

  it('throws FORBIDDEN for non-super_admin', async () => {
    await expect(makeCaller(ADMIN_USER).listPostReview()).rejects.toThrow('super_admin only');
  });

  it('throws FORBIDDEN for readonly_admin', async () => {
    await expect(makeCaller(READONLY_ADMIN).listPostReview()).rejects.toThrow('super_admin only');
  });

  it('queries with correct filters', async () => {
    mockApprovalRequestFindMany.mockResolvedValue([]);
    mockAdminUserFindMany.mockResolvedValue([]);

    await makeCaller(SUPER_ADMIN).listPostReview();

    expect(mockApprovalRequestFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          postReviewRequired: true,
          postReviewedAt: null,
        }),
      }),
    );
  });

  it('includes firstApproverEmail in result', async () => {
    mockApprovalRequestFindMany.mockResolvedValue([POST_REVIEW_ROW]);
    mockAdminUserFindMany.mockResolvedValue([{ id: 1, email: 'super@quanan.com' }]);

    const result = await makeCaller(SUPER_ADMIN).listPostReview();
    expect(result[0]!.firstApproverEmail).toBe('super@quanan.com');
  });

  it('limits to 50 results', async () => {
    mockApprovalRequestFindMany.mockResolvedValue([]);
    mockAdminUserFindMany.mockResolvedValue([]);

    await makeCaller(SUPER_ADMIN).listPostReview();

    expect(mockApprovalRequestFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 50 }),
    );
  });
});

// ── Tests: emergencyToggleSystemConfig ────────────────────────────────────

describe('featureFlagsRouter.emergencyToggleSystemConfig', () => {
  beforeEach(() => vi.clearAllMocks());

  it('super_admin can trigger emergency toggle', async () => {
    mockEmergencyToggleSystemConfig.mockResolvedValue({ approvalRequestId: 77 });

    const result = await makeCaller(SUPER_ADMIN).emergencyToggleSystemConfig({
      configKey: 'stop_trending_scraper',
      incidentId: 'INCIDENT-2026-05-15-001',
      reason: '系统异常需要紧急停止',
    });

    expect(result.approvalRequestId).toBe(77);
    expect(mockEmergencyToggleSystemConfig).toHaveBeenCalledWith(
      'stop_trending_scraper',
      true,
      1,
      'INCIDENT-2026-05-15-001',
      '系统异常需要紧急停止',
    );
  });

  it('throws FORBIDDEN for admin role', async () => {
    await expect(
      makeCaller(ADMIN_USER).emergencyToggleSystemConfig({
        configKey: 'stop_trending_scraper',
        incidentId: 'INCIDENT-001',
        reason: '测试理由',
      }),
    ).rejects.toThrow('super_admin only');
  });

  it('throws FORBIDDEN for readonly_admin', async () => {
    await expect(
      makeCaller(READONLY_ADMIN).emergencyToggleSystemConfig({
        configKey: 'stop_evolution_agent',
        incidentId: 'INCIDENT-002',
        reason: '测试理由',
      }),
    ).rejects.toThrow('super_admin only');
  });

  it('rejects non-emergency configKey', async () => {
    await expect(
      makeCaller(SUPER_ADMIN).emergencyToggleSystemConfig({
        configKey: 'invalid_key' as 'stop_trending_scraper',
        incidentId: 'INCIDENT-003',
        reason: '测试理由',
      }),
    ).rejects.toThrow();
  });

  it('rejects empty incidentId', async () => {
    await expect(
      makeCaller(SUPER_ADMIN).emergencyToggleSystemConfig({
        configKey: 'stop_trending_scraper',
        incidentId: '',
        reason: '测试理由',
      }),
    ).rejects.toThrow();
  });

  it('rejects empty reason', async () => {
    await expect(
      makeCaller(SUPER_ADMIN).emergencyToggleSystemConfig({
        configKey: 'stop_trending_scraper',
        incidentId: 'INCIDENT-004',
        reason: '',
      }),
    ).rejects.toThrow();
  });

  it('supports all 3 emergency switch keys', async () => {
    mockEmergencyToggleSystemConfig.mockResolvedValue({ approvalRequestId: 1 });

    for (const key of ['stop_trending_scraper', 'stop_evolution_agent', 'enable_fallback_prompt'] as const) {
      await expect(
        makeCaller(SUPER_ADMIN).emergencyToggleSystemConfig({
          configKey: key,
          incidentId: `INCIDENT-${key}`,
          reason: `紧急原因-${key}`,
        }),
      ).resolves.toBeDefined();
    }
  });
});
