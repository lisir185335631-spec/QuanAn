// PRD-14 US-004 + US-005 · adminRouter.abExperiments unit tests
// AC-14: ≥ 8 tests · covers getKpiStats, list, getDetail, create (sum=100),
//        create (sum≠100 BAD_REQUEST), start, stop (super_admin), stop (forbidden)
// US-005: +5 tests · getDetailByKey, getVariantMetrics, getCumulativeTimeline,
//         promoteWinner (running), promoteWinner (non-running BAD_REQUEST)

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';

// ── Hoisted mocks ─────────────────────────────────────────────────────────

const mockCreateAbExperiment = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ id: 1, experimentKey: 'test-key' }),
);
const mockStartAbExperiment = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ approvalRequestId: 10, needsApproval: true }),
);
const mockStopAbExperimentManual = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockComputeExperimentSignificance = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockRequestApproval = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ id: 99 }),
);

const mockExecuteRawUnsafe = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockQueryRaw = vi.hoisted(() => vi.fn().mockResolvedValue([]));

const mockAbExperimentCount = vi.hoisted(() => vi.fn().mockResolvedValue(0));
const mockAbExperimentFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockAbExperimentFindUniqueOrThrow = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    id: 1,
    experimentKey: 'test-key',
    name: 'Test',
    description: null,
    status: 'running',
    variantConfig: {},
    trafficAllocation: { control: 50, variant_a: 30, variant_b: 20 },
    startedAt: new Date(),
    stoppedAt: null,
    resultSummary: null,
    createdAt: new Date(),
    _count: { abAssignments: 100 },
  }),
);
const mockAbAssignmentCount = vi.hoisted(() => vi.fn().mockResolvedValue(50));
const mockAdminAuditLogCount = vi.hoisted(() => vi.fn().mockResolvedValue(2));

const mockTransaction = vi.hoisted(() =>
  vi.fn().mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
    const txProxy = { $executeRawUnsafe: mockExecuteRawUnsafe };
    return fn(txProxy);
  }),
);

vi.mock('@/services/admin/ab-experiment/ab-experiment.service', () => ({
  createAbExperiment: mockCreateAbExperiment,
  startAbExperiment: mockStartAbExperiment,
}));

vi.mock('@/jobs/admin/ab-stop-loss.job', () => ({
  stopAbExperimentManual: mockStopAbExperimentManual,
}));

vi.mock('@/services/admin/ab-experiment/significance.service', () => ({
  computeExperimentSignificance: mockComputeExperimentSignificance,
}));

vi.mock('@/services/admin/approval/approvalGateService', () => ({
  requestApproval: mockRequestApproval,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: mockQueryRaw,
    $transaction: mockTransaction,
    abExperiment: {
      count: mockAbExperimentCount,
      findMany: mockAbExperimentFindMany,
      findUniqueOrThrow: mockAbExperimentFindUniqueOrThrow,
    },
    abAssignment: {
      count: mockAbAssignmentCount,
    },
    adminAuditLog: {
      count: mockAdminAuditLogCount,
    },
  },
}));

// ── Router imports (after mocks) ──────────────────────────────────────────

import { abExperimentsRouter } from '../abExperiments';
import type { AdminTRPCContext } from '@/server/context-admin';
import type { AdminLuciaSession, AdminLuciaUser } from '@/lib/auth/lucia-admin';
import type { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// ── Context helpers ───────────────────────────────────────────────────────

function makeCtx(role: string = 'admin'): AdminTRPCContext {
  return {
    req: new Request('http://localhost/trpc/admin'),
    resHeaders: new Headers(),
    adminSession: {
      id: 'sess-1',
      userId: 'user-1',
      expiresAt: new Date(Date.now() + 3600 * 1000),
      fresh: false,
    } as AdminLuciaSession,
    activeAdminUser: {
      id: 1,
      email: `${role}@test.com`,
      role,
      isActive: true,
      createdAt: new Date(),
      mfaEnabled: false,
      mfaSecret: null,
      allowedIps: [],
      updatedAt: new Date(),
      lastLoginAt: null,
      lastLoginIp: null,
      name: null,
    } as unknown as AdminLuciaUser,
    adminPrisma: prisma as PrismaClient,
    prisma: prisma as PrismaClient,
    traceId: 'trace-test',
  };
}

async function callQuery<T>(
  router: typeof abExperimentsRouter,
  path: string,
  input: unknown,
  ctx: AdminTRPCContext,
): Promise<T> {
  const caller = router.createCaller(ctx);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (caller as any)[path](input) as Promise<T>;
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe('abExperimentsRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAbExperimentCount.mockResolvedValue(0);
    mockAbExperimentFindMany.mockResolvedValue([]);
    mockAbAssignmentCount.mockResolvedValue(50);
    mockAdminAuditLogCount.mockResolvedValue(0);
    mockQueryRaw.mockResolvedValue([]);
  });

  // ── getKpiStats ──────────────────────────────────────────────────────────

  it('getKpiStats: returns 4 KPI fields', async () => {
    mockAbExperimentCount
      .mockResolvedValueOnce(3)   // running
      .mockResolvedValueOnce(2)   // recentStarted
      .mockResolvedValueOnce(1);  // stoppedLast30
    mockAbExperimentFindMany.mockResolvedValueOnce([{ id: 1 }, { id: 2 }, { id: 3 }]);
    mockAbAssignmentCount.mockResolvedValue(100);
    mockAdminAuditLogCount.mockResolvedValue(1);

    const ctx = makeCtx('admin');
    const result = await callQuery<{
      runningCount: number;
      recentStarted: number;
      avgSampleSize: number;
      autoStopRate: number;
    }>(abExperimentsRouter, 'getKpiStats', undefined, ctx);

    expect(result.runningCount).toBe(3);
    expect(result.recentStarted).toBe(2);
    expect(result.avgSampleSize).toBe(100);
    expect(result.autoStopRate).toBe(100); // 1/1 stopped was auto
  });

  it('getKpiStats: avgSampleSize=0 when no running experiments', async () => {
    mockAbExperimentCount.mockResolvedValue(0);
    mockAbExperimentFindMany.mockResolvedValueOnce([]); // running list empty

    const result = await callQuery<{ avgSampleSize: number }>(
      abExperimentsRouter,
      'getKpiStats',
      undefined,
      makeCtx(),
    );
    expect(result.avgSampleSize).toBe(0);
  });

  // ── list ─────────────────────────────────────────────────────────────────

  it('list: returns paginated items', async () => {
    const fakeItems = [
      {
        id: 5,
        experimentKey: 'exp-1',
        name: 'Exp 1',
        status: 'running',
        startedAt: new Date(),
        stoppedAt: null,
        createdAt: new Date(),
        trafficAllocation: { control: 50, variant_a: 30, variant_b: 20 },
        _count: { abAssignments: 200 },
      },
    ];
    mockAbExperimentFindMany.mockResolvedValueOnce(fakeItems);

    const result = await callQuery<{ items: unknown[]; nextCursor: number | undefined }>(
      abExperimentsRouter,
      'list',
      {},
      makeCtx(),
    );

    expect(result.items).toHaveLength(1);
    expect(result.nextCursor).toBeUndefined();
  });

  it('list: cursor-based pagination returns nextCursor when hasMore', async () => {
    const fakeItems = Array.from({ length: 21 }, (_, i) => ({
      id: 100 - i,
      experimentKey: `exp-${i}`,
      name: `Exp ${i}`,
      status: 'draft',
      startedAt: null,
      stoppedAt: null,
      createdAt: new Date(),
      trafficAllocation: null,
      _count: { abAssignments: 0 },
    }));
    mockAbExperimentFindMany.mockResolvedValueOnce(fakeItems);

    const result = await callQuery<{ items: unknown[]; nextCursor: number | undefined }>(
      abExperimentsRouter,
      'list',
      {},
      makeCtx(),
    );

    expect(result.items).toHaveLength(20);
    expect(result.nextCursor).toBeDefined();
  });

  // ── getDetail ────────────────────────────────────────────────────────────

  it('getDetail: returns experiment with timeline', async () => {
    mockAbAssignmentCount.mockResolvedValueOnce(100);
    mockQueryRaw.mockResolvedValueOnce([
      { day: new Date('2026-05-01'), count: BigInt(10) },
      { day: new Date('2026-05-02'), count: BigInt(15) },
    ]);

    const result = await callQuery<{ sampleSize: number; timeline: { day: Date; count: number }[] }>(
      abExperimentsRouter,
      'getDetail',
      { experimentId: 1 },
      makeCtx(),
    );

    expect(result.sampleSize).toBe(100);
    expect(result.timeline).toHaveLength(2);
    expect(result.timeline[0]?.count).toBe(10);
  });

  // ── create ───────────────────────────────────────────────────────────────

  it('create: creates experiment when trafficAllocation sums to 100', async () => {
    const result = await callQuery<{ id: number; experimentKey: string }>(
      abExperimentsRouter,
      'create',
      {
        experimentKey: 'new-exp',
        name: 'New Experiment',
        variantConfig: { control: {}, variant_a: {}, variant_b: {} },
        trafficAllocation: { control: 50, variant_a: 30, variant_b: 20 },
      },
      makeCtx(),
    );

    expect(result.id).toBe(1);
    expect(result.experimentKey).toBe('test-key');
    expect(mockCreateAbExperiment).toHaveBeenCalledOnce();
  });

  it('create: throws BAD_REQUEST when trafficAllocation does not sum to 100', async () => {
    await expect(
      callQuery(
        abExperimentsRouter,
        'create',
        {
          experimentKey: 'bad-exp',
          name: 'Bad',
          variantConfig: {},
          trafficAllocation: { control: 40, variant_a: 30, variant_b: 20 }, // sum=90
        },
        makeCtx(),
      ),
    ).rejects.toThrow(TRPCError);
    expect(mockCreateAbExperiment).not.toHaveBeenCalled();
  });

  // ── start ────────────────────────────────────────────────────────────────

  it('start: creates dual approval request', async () => {
    const result = await callQuery<{ approvalRequestId: number; needsApproval: boolean }>(
      abExperimentsRouter,
      'start',
      { experimentId: 1, reason: 'Launch test' },
      makeCtx('admin'),
    );

    expect(result.approvalRequestId).toBe(10);
    expect(result.needsApproval).toBe(true);
    expect(mockStartAbExperiment).toHaveBeenCalledWith(
      expect.objectContaining({ experimentId: 1, requesterRole: 'admin' }),
    );
  });

  // ── stop ─────────────────────────────────────────────────────────────────

  it('stop: super_admin can stop experiment without approval', async () => {
    const result = await callQuery<{ ok: boolean }>(
      abExperimentsRouter,
      'stop',
      {
        experimentId: 1,
        stopReason: '实验指标恶化超过阈值，紧急停损处理中需立刻回滚',
      },
      makeCtx('super_admin'),
    );

    expect(result.ok).toBe(true);
    expect(mockStopAbExperimentManual).toHaveBeenCalledWith(
      expect.objectContaining({ experimentId: 1, adminId: 1 }),
    );
  });

  it('stop: admin (non-super_admin) gets FORBIDDEN', async () => {
    await expect(
      callQuery(
        abExperimentsRouter,
        'stop',
        {
          experimentId: 1,
          stopReason: '实验指标恶化超过阈值，紧急停损处理中需立刻回滚',
        },
        makeCtx('admin'),
      ),
    ).rejects.toThrow(TRPCError);
    expect(mockStopAbExperimentManual).not.toHaveBeenCalled();
  });

  // ── getMultiMetric ───────────────────────────────────────────────────────

  it('getMultiMetric: returns significance results', async () => {
    const fakeResults = [
      {
        metric: 'conversion',
        testType: 'chi_square',
        pValue: 0.03,
        isSignificant: true,
        effect: 0.12,
        sampleSize: 500,
        confidence: 0.95,
        recommendation: 'stop_winner',
      },
    ];
    mockComputeExperimentSignificance.mockResolvedValueOnce(fakeResults);

    const result = await callQuery<{ results: typeof fakeResults }>(
      abExperimentsRouter,
      'getMultiMetric',
      { experimentId: 1 },
      makeCtx(),
    );

    expect(result.results).toHaveLength(1);
    expect(result.results[0]?.metric).toBe('conversion');
    expect(mockComputeExperimentSignificance).toHaveBeenCalledWith(1);
  });

  // ── US-005 new endpoints ─────────────────────────────────────────────────

  it('getDetailByKey: returns experiment by experimentKey', async () => {
    mockAbAssignmentCount.mockResolvedValueOnce(120);

    const result = await callQuery<{ id: number; experimentKey: string; sampleSize: number }>(
      abExperimentsRouter,
      'getDetailByKey',
      { experimentKey: 'test-key' },
      makeCtx(),
    );

    expect(result.id).toBe(1);
    expect(result.experimentKey).toBe('test-key');
    expect(result.sampleSize).toBe(120);
    expect(mockAbExperimentFindUniqueOrThrow).toHaveBeenCalledWith(
      expect.objectContaining({ where: { experimentKey: 'test-key' } }),
    );
  });

  it('getVariantMetrics: returns per-variant metrics with correct structure', async () => {
    // queryRaw called 3 times: convRows, retRows, costRows
    mockQueryRaw
      .mockResolvedValueOnce([
        { variant: 'control', total: BigInt(100), conversions: BigInt(20) },
        { variant: 'variant_a', total: BigInt(80), conversions: BigInt(20) },
      ])
      .mockResolvedValueOnce([
        { variant: 'control', total: BigInt(100), d1: BigInt(60), d2: BigInt(50), d3: BigInt(45), d4: BigInt(40), d5: BigInt(35), d6: BigInt(30), d7: BigInt(25) },
      ])
      .mockResolvedValueOnce([
        { variant: 'control', total: BigInt(100), avgCost: 0.0012 },
        { variant: 'variant_a', total: BigInt(80), avgCost: 0.0015 },
      ]);

    const result = await callQuery<{ variants: Record<string, { sampleSize: number; conversion: { rate: number; ciLow: number; ciHigh: number }; retention: Array<{ day: number; rate: number }>; avgCost: number }> }>(
      abExperimentsRouter,
      'getVariantMetrics',
      { experimentId: 1 },
      makeCtx(),
    );

    expect(result.variants).toHaveProperty('control');
    expect(result.variants).toHaveProperty('variant_a');
    expect(result.variants).toHaveProperty('variant_b');
    expect(result.variants['control']?.sampleSize).toBe(100);
    expect(result.variants['control']?.conversion.rate).toBeCloseTo(0.2);
    expect(result.variants['control']?.retention).toHaveLength(7);
    expect(result.variants['control']?.retention[0]?.day).toBe(1);
  });

  it('getCumulativeTimeline: returns cumulative timeline per variant', async () => {
    mockQueryRaw.mockResolvedValueOnce([
      { day: new Date('2026-05-10'), variant: 'control', count: BigInt(30) },
      { day: new Date('2026-05-10'), variant: 'variant_a', count: BigInt(20) },
      { day: new Date('2026-05-11'), variant: 'control', count: BigInt(10) },
      { day: new Date('2026-05-11'), variant: 'variant_a', count: BigInt(15) },
    ]);

    const result = await callQuery<{ timeline: Array<{ day: string; control: number; variant_a: number; variant_b: number }> }>(
      abExperimentsRouter,
      'getCumulativeTimeline',
      { experimentId: 1 },
      makeCtx(),
    );

    expect(result.timeline).toHaveLength(2);
    // Day 1: control=30, variant_a=20
    expect(result.timeline[0]?.control).toBe(30);
    expect(result.timeline[0]?.variant_a).toBe(20);
    // Day 2: cumulative control=40, variant_a=35
    expect(result.timeline[1]?.control).toBe(40);
    expect(result.timeline[1]?.variant_a).toBe(35);
  });

  it('promoteWinner: creates approval request for running experiment', async () => {
    const result = await callQuery<{ approvalRequestId: number; needsApproval: boolean }>(
      abExperimentsRouter,
      'promoteWinner',
      { experimentId: 1, winnerVariant: 'variant_a', reason: 'Variant A wins on conversion' },
      makeCtx('admin'),
    );

    expect(result.approvalRequestId).toBe(99);
    expect(result.needsApproval).toBe(true);
    expect(mockRequestApproval).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: 'promote_ab_experiment_winner',
        requireDualApproval: true,
      }),
    );
  });

  it('promoteWinner: throws BAD_REQUEST when experiment is not running', async () => {
    mockAbExperimentFindUniqueOrThrow.mockResolvedValueOnce({
      id: 2, experimentKey: 'stopped-exp', name: 'Stopped', status: 'stopped',
      variantConfig: {}, trafficAllocation: {}, startedAt: null, stoppedAt: new Date(),
      resultSummary: null, createdAt: new Date(),
    });

    await expect(
      callQuery(
        abExperimentsRouter,
        'promoteWinner',
        { experimentId: 2, winnerVariant: 'variant_a' },
        makeCtx('admin'),
      ),
    ).rejects.toThrow(TRPCError);
    expect(mockRequestApproval).not.toHaveBeenCalled();
  });
});
