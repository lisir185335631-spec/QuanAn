// PRD-11 US-003 · NSM router unit tests — 5 procedures × auth boundaries + data correctness
// AC-13: ≥ 15 tests

import { TRPCError } from '@trpc/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks (vi.mock factories cannot access outer variables) ────────

const mockLogAdminAction = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockComputeSnapshot = vi.hoisted(() => vi.fn());
const mockKpiSnapshotFindFirst = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockKpiSnapshotFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));

vi.mock('@/services/admin/admin-audit-service', () => ({
  logAdminAction: mockLogAdminAction,
}));

vi.mock('@/services/admin/nsm/kpi-snapshot.service', () => ({
  computeSnapshot: mockComputeSnapshot,
}));

vi.mock('@/lib/prisma', () => {
  // adminRLSMiddleware calls ctx.prisma.$transaction(cb) — cb receives tx with $executeRawUnsafe
  // We simulate: tx = prisma + $executeRawUnsafe, adminPrisma = tx (passed in next() by adminRLS)
  const txProxy: Record<string, unknown> = {
    $executeRawUnsafe: vi.fn().mockResolvedValue(undefined),
    kpiSnapshot: {
      findFirst: mockKpiSnapshotFindFirst,
      findMany: mockKpiSnapshotFindMany,
    },
    adminAuditLog: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
    },
  };

  return {
    prisma: {
      $transaction: vi.fn().mockImplementation((cb: (tx: unknown) => unknown) => cb(txProxy)),
      $executeRawUnsafe: vi.fn().mockResolvedValue(undefined),
      kpiSnapshot: {
        findFirst: mockKpiSnapshotFindFirst,
        findMany: mockKpiSnapshotFindMany,
      },
      adminAuditLog: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({}),
      },
    },
  };
});

// ── Imports (after mocks) ──────────────────────────────────────────────────
import type { AdminLuciaSession, AdminLuciaUser } from '@/lib/auth/lucia-admin';
import { prisma } from '@/lib/prisma';
import type { AdminTRPCContext } from '@/server/context-admin';
import { nsmRouter } from '@/trpc/routers/admin/nsm';



// ── Fixtures ──────────────────────────────────────────────────────────────

const SUPER_ADMIN: AdminLuciaUser = {
  id: 1,
  email: 'super@quanan.com',
  role: 'super_admin',
  isMock: true,
  isActive: true,
};

const ADMIN_USER: AdminLuciaUser = {
  id: 2,
  email: 'admin@quanan.com',
  role: 'admin',
  isMock: true,
  isActive: true,
};

const MOCK_SESSION = {
  id: 'sess-nsm-test',
  expiresAt: new Date(Date.now() + 3600_000),
  fresh: false,
} as AdminLuciaSession;

// Simulate Prisma Decimal with valueOf()
function dec(n: number) {
  return { toString: () => String(n), valueOf: () => n };
}

const SNAPSHOT_1 = {
  id: 1,
  snapshotDate: new Date('2026-05-10'),
  granularity: 'day',
  activeAccounts7d: 100,
  step9CompleteRate: dec(0.8),
  feedbackRate: dec(0.5),
  evolutionUpgradeRate: dec(0.3),
  d30Retention: dec(0.6),
  userPersonaDistribution: { ipBuilder: 40, opc: 30, traditional: 20, mcn: 10 },
  industryDistribution: { tech: 50, edu: 30, health: 20 },
  platformDistribution: { douyin: 60, bilibili: 40 },
  funnelData: [100, 90, 70, 60, 40, 25],
  computedAt: new Date('2026-05-10T00:01:00Z'),
};

const SNAPSHOT_2 = {
  id: 2,
  snapshotDate: new Date('2026-05-09'),
  granularity: 'day',
  activeAccounts7d: 120,
  step9CompleteRate: dec(0.9),
  feedbackRate: dec(0.6),
  evolutionUpgradeRate: dec(0.4),
  d30Retention: dec(0.7),
  userPersonaDistribution: { ipBuilder: 50, opc: 35, traditional: 10, mcn: 5 },
  industryDistribution: { tech: 55, edu: 25, health: 20 },
  platformDistribution: { douyin: 65, bilibili: 35 },
  funnelData: [120, 108, 90, 80, 55, 33],
  computedAt: new Date('2026-05-09T00:01:00Z'),
};

const SNAPSHOT_3 = {
  ...SNAPSHOT_2,
  id: 3,
  snapshotDate: new Date('2026-05-08'),
  activeAccounts7d: 130,
};

function makeCtx(
  user: AdminLuciaUser | null = ADMIN_USER,
  overrides: Partial<AdminTRPCContext> = {},
): AdminTRPCContext {
  return {
    prisma: prisma,
    adminPrisma: prisma,
    traceId: 'trace-nsm-test',
    req: new Request('http://localhost/trpc/admin/nsm', {
      headers: {
        'x-forwarded-for': '10.0.0.1',
        'user-agent': 'test-agent/1.0',
      },
    }),
    resHeaders: new Headers(),
    adminSession: MOCK_SESSION,
    activeAdminUser: user,
    ...overrides,
  };
}

function makeCallerWith(user: AdminLuciaUser | null, overrides: Partial<AdminTRPCContext> = {}) {
  return nsmRouter.createCaller(makeCtx(user, overrides));
}

beforeEach(() => {
  vi.clearAllMocks();
  mockLogAdminAction.mockResolvedValue(undefined);
  mockKpiSnapshotFindFirst.mockResolvedValue(null);
  mockKpiSnapshotFindMany.mockResolvedValue([]);
});

// ── getOverview ────────────────────────────────────────────────────────────

describe('getOverview', () => {
  it('returns null when kpi_snapshots is empty (AC-9)', async () => {
    mockKpiSnapshotFindFirst.mockResolvedValue(null);
    const caller = makeCallerWith(ADMIN_USER);
    const result = await caller.getOverview();
    expect(result).toBeNull();
  });

  it('writes audit data_query/nsm_overview when table is empty', async () => {
    mockKpiSnapshotFindFirst.mockResolvedValue(null);
    const caller = makeCallerWith(ADMIN_USER);
    await caller.getOverview();
    expect(mockLogAdminAction).toHaveBeenCalled();
    const nsmCall = mockLogAdminAction.mock.calls.find((c) => c[0]?.eventType === 'nsm_overview');
    expect(nsmCall).toBeDefined();
    expect(nsmCall?.[0]?.eventCategory).toBe('data_query');
    expect(nsmCall?.[0]?.payload?.result).toBe('no_data');
  });

  it('returns latest + null previous when only one snapshot exists', async () => {
    mockKpiSnapshotFindFirst
      .mockResolvedValueOnce(SNAPSHOT_1) // latest
      .mockResolvedValueOnce(null); // no previous
    const caller = makeCallerWith(ADMIN_USER);
    const result = await caller.getOverview();
    expect(result).not.toBeNull();
    expect(result?.latest.id).toBe(1);
    expect(result?.previous).toBeNull();
    expect(result?.deltas).toBeNull();
  });

  it('returns latest + previous + deltas when 2 snapshots exist', async () => {
    mockKpiSnapshotFindFirst
      .mockResolvedValueOnce(SNAPSHOT_1) // latest
      .mockResolvedValueOnce(SNAPSHOT_2); // previous
    const caller = makeCallerWith(ADMIN_USER);
    const result = await caller.getOverview();
    expect(result?.latest.activeAccounts7d).toBe(100);
    expect(result?.previous?.activeAccounts7d).toBe(120);
    expect(result?.deltas?.activeAccounts7d).toBe(-20);
  });

  it('serializes Decimal fields to numbers', async () => {
    mockKpiSnapshotFindFirst
      .mockResolvedValueOnce(SNAPSHOT_1)
      .mockResolvedValueOnce(null);
    const caller = makeCallerWith(ADMIN_USER);
    const result = await caller.getOverview();
    expect(typeof result?.latest.step9CompleteRate).toBe('number');
    expect(typeof result?.latest.feedbackRate).toBe('number');
    expect(result?.latest.step9CompleteRate).toBeCloseTo(0.8);
  });

  it('writes audit data_query/nsm_overview on success with data', async () => {
    mockKpiSnapshotFindFirst
      .mockResolvedValueOnce(SNAPSHOT_1)
      .mockResolvedValueOnce(null);
    const caller = makeCallerWith(ADMIN_USER);
    await caller.getOverview();
    expect(mockLogAdminAction).toHaveBeenCalled();
    const nsmCall = mockLogAdminAction.mock.calls.find((c) => c[0]?.eventType === 'nsm_overview');
    expect(nsmCall).toBeDefined();
    expect(nsmCall?.[0]?.eventCategory).toBe('data_query');
    expect(nsmCall?.[0]?.success).toBe(true);
  });
});

// ── getFunnel ──────────────────────────────────────────────────────────────

describe('getFunnel', () => {
  it('returns empty array when no snapshot found', async () => {
    mockKpiSnapshotFindFirst.mockResolvedValue(null);
    const caller = makeCallerWith(ADMIN_USER);
    const result = await caller.getFunnel({ granularity: 'day' });
    expect(result).toEqual([]);
  });

  it('returns funnelData from latest snapshot when no date filter', async () => {
    mockKpiSnapshotFindFirst.mockResolvedValue({ funnelData: [100, 90, 70, 60, 40, 25] });
    const caller = makeCallerWith(ADMIN_USER);
    const result = await caller.getFunnel({ granularity: 'day' });
    expect(result).toEqual([100, 90, 70, 60, 40, 25]);
    expect(result).toHaveLength(6);
  });

  it('passes date + granularity filter when date is provided', async () => {
    mockKpiSnapshotFindFirst.mockResolvedValue({ funnelData: [80, 72, 60, 50, 30, 18] });
    const caller = makeCallerWith(ADMIN_USER);
    await caller.getFunnel({ date: '2026-05-10T00:00:00.000Z', granularity: 'week' });
    const callArgs = mockKpiSnapshotFindFirst.mock.calls[0]?.[0];
    expect(callArgs?.where?.granularity).toBe('week');
    expect(callArgs?.where?.snapshotDate).toBeInstanceOf(Date);
  });
});

// ── getDistributions ───────────────────────────────────────────────────────

describe('getDistributions', () => {
  it('returns null when no snapshot found', async () => {
    mockKpiSnapshotFindFirst.mockResolvedValue(null);
    const caller = makeCallerWith(ADMIN_USER);
    const result = await caller.getDistributions();
    expect(result).toBeNull();
  });

  it('returns all 3 distributions from latest snapshot', async () => {
    mockKpiSnapshotFindFirst.mockResolvedValue({
      industryDistribution: { tech: 50, edu: 30 },
      platformDistribution: { douyin: 60 },
      userPersonaDistribution: { ipBuilder: 40, opc: 30, traditional: 20, mcn: 10 },
    });
    const caller = makeCallerWith(ADMIN_USER);
    const result = await caller.getDistributions();
    expect(result?.industryDistribution).toEqual({ tech: 50, edu: 30 });
    expect(result?.platformDistribution).toEqual({ douyin: 60 });
    expect(result?.userPersonaDistribution).toHaveProperty('ipBuilder');
    expect(result?.userPersonaDistribution).toHaveProperty('opc');
  });

  it('uses daily granularity for the latest snapshot query', async () => {
    mockKpiSnapshotFindFirst.mockResolvedValue(null);
    const caller = makeCallerWith(ADMIN_USER);
    await caller.getDistributions();
    const callArgs = mockKpiSnapshotFindFirst.mock.calls[0]?.[0];
    expect(callArgs?.where?.granularity).toBe('day');
  });
});

// ── getAlerts ──────────────────────────────────────────────────────────────

describe('getAlerts', () => {
  it('returns empty array when fewer than 2 snapshots', async () => {
    mockKpiSnapshotFindMany.mockResolvedValue([SNAPSHOT_1]);
    const caller = makeCallerWith(ADMIN_USER);
    const result = await caller.getAlerts();
    expect(result).toEqual([]);
  });

  it('returns empty array when metrics are not deteriorating', async () => {
    const improving = { ...SNAPSHOT_1, activeAccounts7d: 150 };
    mockKpiSnapshotFindMany.mockResolvedValue([improving, SNAPSHOT_2]);
    const caller = makeCallerWith(ADMIN_USER);
    const result = await caller.getAlerts();
    const activeAlert = result.find((a) => a.metric === 'activeAccounts7d');
    expect(activeAlert).toBeUndefined();
  });

  it('detects consecutive deterioration across 3 snapshots', async () => {
    // s0(100) < s1(120) < s2(130) — consecutive decline in activeAccounts7d
    mockKpiSnapshotFindMany.mockResolvedValue([SNAPSHOT_1, SNAPSHOT_2, SNAPSHOT_3]);
    const caller = makeCallerWith(ADMIN_USER);
    const result = await caller.getAlerts();
    const activeAlert = result.find((a) => a.metric === 'activeAccounts7d');
    expect(activeAlert).toBeDefined();
    expect(activeAlert?.deltaPct).toBeLessThan(0);
    expect(['high', 'medium', 'low']).toContain(activeAlert?.severity);
  });

  it('alert includes metric, severity, and deltaPct', async () => {
    mockKpiSnapshotFindMany.mockResolvedValue([SNAPSHOT_1, SNAPSHOT_2, SNAPSHOT_3]);
    const caller = makeCallerWith(ADMIN_USER);
    const result = await caller.getAlerts();
    if (result.length > 0) {
      const a = result[0]!;
      expect(a).toHaveProperty('metric');
      expect(a).toHaveProperty('severity');
      expect(a).toHaveProperty('deltaPct');
      expect(typeof a.deltaPct).toBe('number');
    }
  });

  it('writes audit data_query/nsm_alerts', async () => {
    mockKpiSnapshotFindMany.mockResolvedValue([SNAPSHOT_1, SNAPSHOT_2, SNAPSHOT_3]);
    const caller = makeCallerWith(ADMIN_USER);
    await caller.getAlerts();
    expect(mockLogAdminAction).toHaveBeenCalled();
    const alertCall = mockLogAdminAction.mock.calls.find((c) => c[0]?.eventType === 'nsm_alerts');
    expect(alertCall).toBeDefined();
    expect(alertCall?.[0]?.eventCategory).toBe('data_query');
  });
});

// ── triggerSnapshot ────────────────────────────────────────────────────────

describe('triggerSnapshot', () => {
  it('returns 403 TRPCError when caller is not super_admin (AC-8)', async () => {
    const caller = makeCallerWith(ADMIN_USER);
    await expect(caller.triggerSnapshot()).rejects.toThrow(TRPCError);
  });

  it('403 error has code FORBIDDEN for non-super_admin (AC-8)', async () => {
    const caller = makeCallerWith(ADMIN_USER);
    try {
      await caller.triggerSnapshot();
      expect.fail('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(TRPCError);
      expect((e as TRPCError).code).toBe('FORBIDDEN');
    }
  });

  it('writes privilege_escalation audit for non-super_admin (AC-8)', async () => {
    const caller = makeCallerWith(ADMIN_USER);
    await expect(caller.triggerSnapshot()).rejects.toThrow(TRPCError);
    expect(mockLogAdminAction).toHaveBeenCalled();
    const call = mockLogAdminAction.mock.calls[0]?.[0];
    expect(call?.eventType).toBe('privilege_escalation');
    expect(call?.eventCategory).toBe('security_alert');
    expect(call?.success).toBe(false);
    expect(call?.payload?.attemptedAction).toBe('manual_snapshot_trigger');
  });

  it('calls computeSnapshot when caller is super_admin (AC-6)', async () => {
    const snapshotResult = {
      snapshotDate: new Date('2026-05-12'),
      granularity: 'day' as const,
      activeAccounts7d: 100,
      step9CompleteRate: 0.8,
      feedbackRate: 0.5,
      evolutionUpgradeRate: 0.3,
      d30Retention: 0.6,
      userPersonaDistribution: {},
      industryDistribution: {},
      platformDistribution: {},
      funnelData: [100, 90, 70, 60, 40, 25] as [number, number, number, number, number, number],
    };
    mockComputeSnapshot.mockResolvedValue(snapshotResult);
    const caller = makeCallerWith(SUPER_ADMIN);
    const result = await caller.triggerSnapshot();
    expect(mockComputeSnapshot).toHaveBeenCalledOnce();
    expect(result.success).toBe(true);
    expect(result.granularity).toBe('day');
  });

  it('writes high_risk_action/manual_snapshot_trigger audit on super_admin success (AC-6)', async () => {
    const snapshotResult = {
      snapshotDate: new Date('2026-05-12'),
      granularity: 'day' as const,
      activeAccounts7d: 100,
      step9CompleteRate: 0.8,
      feedbackRate: 0.5,
      evolutionUpgradeRate: 0.3,
      d30Retention: 0.6,
      userPersonaDistribution: {},
      industryDistribution: {},
      platformDistribution: {},
      funnelData: [100, 90, 70, 60, 40, 25] as [number, number, number, number, number, number],
    };
    mockComputeSnapshot.mockResolvedValue(snapshotResult);
    const caller = makeCallerWith(SUPER_ADMIN);
    await caller.triggerSnapshot();
    expect(mockLogAdminAction).toHaveBeenCalled();
    const snapshotCall = mockLogAdminAction.mock.calls.find(
      (c) => c[0]?.eventType === 'manual_snapshot_trigger',
    );
    expect(snapshotCall).toBeDefined();
    expect(snapshotCall?.[0]?.eventCategory).toBe('high_risk_action');
    expect(snapshotCall?.[0]?.success).toBe(true);
    expect(snapshotCall?.[0]?.actorAdminId).toBe(SUPER_ADMIN.id);
  });

  it('does NOT call computeSnapshot when caller is readonly_admin', async () => {
    const readonlyUser: AdminLuciaUser = { ...ADMIN_USER, id: 3, role: 'readonly_admin' };
    const caller = makeCallerWith(readonlyUser);
    await expect(caller.triggerSnapshot()).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(mockComputeSnapshot).not.toHaveBeenCalled();
  });
});
