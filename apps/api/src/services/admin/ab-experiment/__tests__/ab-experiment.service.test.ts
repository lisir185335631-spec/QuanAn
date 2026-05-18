// PRD-14 US-001 · ab-experiment.service unit tests
// AC-12: ≥ 3 new tests · pnpm test ≥ 1730 pass · 0 fail

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';

// ── Hoisted mocks ──────────────────────────────────────────────────────────

const mockLogAdminAction = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockRequestApproval = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ id: 99, requireDualApproval: true }),
);
const mockAbExperimentFindUnique = vi.hoisted(() => vi.fn());
const mockAbExperimentCreate = vi.hoisted(() => vi.fn());
const mockAbExperimentUpdate = vi.hoisted(() => vi.fn());
const mockAbAssignmentUpsert = vi.hoisted(() => vi.fn());
const mockTransaction = vi.hoisted(() =>
  vi.fn().mockImplementation((cb: (tx: unknown) => unknown) => cb({})),
);
const mockAuditFindFirst = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockAuditCreate = vi.hoisted(() => vi.fn().mockResolvedValue({}));

vi.mock('@/services/admin/admin-audit-service', () => ({
  logAdminAction: mockLogAdminAction,
}));

vi.mock('@/services/admin/approval/approvalGateService', () => ({
  requestApproval: mockRequestApproval,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: mockTransaction,
    abExperiment: {
      findUnique: mockAbExperimentFindUnique,
      create: mockAbExperimentCreate,
      update: mockAbExperimentUpdate,
    },
    abAssignment: {
      upsert: mockAbAssignmentUpsert,
    },
    adminAuditLog: {
      findFirst: mockAuditFindFirst,
      create: mockAuditCreate,
    },
  },
}));

// ── Imports (after mocks) ──────────────────────────────────────────────────

import {
  _startAbExperimentInTx,
  _stopAbExperimentInTx,
  createAbExperiment,
  startAbExperiment,
  assignUserToVariant,
} from '@/services/admin/ab-experiment/ab-experiment.service';

// ── Fixtures ──────────────────────────────────────────────────────────────

const DRAFT_EXPERIMENT = {
  id: 1,
  experimentKey: 'test-exp-001',
  name: 'Test Experiment',
  description: null,
  variantConfig: { control: {}, variant_a: {}, variant_b: {} },
  trafficAllocation: { control: 50, variant_a: 25, variant_b: 25 },
  status: 'draft',
  startedAt: null,
  stoppedAt: null,
  resultSummary: null,
  createdByAdminId: 1,
  createdAt: new Date(),
};

const RUNNING_EXPERIMENT = { ...DRAFT_EXPERIMENT, status: 'running', startedAt: new Date() };

// ── tx proxy ──────────────────────────────────────────────────────────────

const makeTxProxy = () => ({
  abExperiment: {
    findUnique: mockAbExperimentFindUnique,
    update: mockAbExperimentUpdate,
  },
  adminAuditLog: {
    findFirst: mockAuditFindFirst,
    create: mockAuditCreate,
  },
});

beforeEach(() => {
  vi.clearAllMocks();
  mockLogAdminAction.mockResolvedValue(undefined);
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe('_startAbExperimentInTx', () => {
  it('updates status to running and writes audit log', async () => {
    mockAbExperimentFindUnique.mockResolvedValueOnce(DRAFT_EXPERIMENT);
    const updatedExp = { ...DRAFT_EXPERIMENT, status: 'running', startedAt: new Date() };
    mockAbExperimentUpdate.mockResolvedValueOnce(updatedExp);

    const tx = makeTxProxy();
    const result = await _startAbExperimentInTx(tx as never, {
      experimentId: 1,
      adminId: 1,
      approvalRequestId: 99,
    });

    expect(result.status).toBe('running');
    expect(mockAbExperimentUpdate).toHaveBeenCalledWith({
      where: { id: 1 },
      data: expect.objectContaining({ status: 'running', startedAt: expect.any(Date) }),
    });
    expect(mockLogAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'ab_experiment_start',
        eventCategory: 'high_risk_action',
      }),
    );
  });

  it('throws NOT_FOUND when experiment does not exist', async () => {
    mockAbExperimentFindUnique.mockResolvedValueOnce(null);
    const tx = makeTxProxy();

    await expect(
      _startAbExperimentInTx(tx as never, { experimentId: 999, adminId: 1, approvalRequestId: 1 }),
    ).rejects.toThrow(TRPCError);
  });

  it('throws BAD_REQUEST when experiment is not in draft status', async () => {
    mockAbExperimentFindUnique.mockResolvedValueOnce(RUNNING_EXPERIMENT);
    const tx = makeTxProxy();

    await expect(
      _startAbExperimentInTx(tx as never, { experimentId: 1, adminId: 1, approvalRequestId: 1 }),
    ).rejects.toThrow(TRPCError);
  });
});

describe('_stopAbExperimentInTx', () => {
  it('updates status to stopped with resultSummary and writes audit log', async () => {
    mockAbExperimentFindUnique.mockResolvedValueOnce(RUNNING_EXPERIMENT);
    const stoppedExp = { ...RUNNING_EXPERIMENT, status: 'stopped', stoppedAt: new Date() };
    mockAbExperimentUpdate.mockResolvedValueOnce(stoppedExp);

    const tx = makeTxProxy();
    const result = await _stopAbExperimentInTx(tx as never, {
      experimentId: 1,
      adminId: 1,
      stopReason: 'manual_stop',
      resultSummary: { conversionRate: 0.12 },
    });

    expect(result.status).toBe('stopped');
    expect(mockAbExperimentUpdate).toHaveBeenCalledWith({
      where: { id: 1 },
      data: expect.objectContaining({ status: 'stopped', stoppedAt: expect.any(Date) }),
    });
    expect(mockLogAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'ab_experiment_stop',
        eventCategory: 'high_risk_action',
        payload: expect.objectContaining({ stopReason: 'manual_stop' }),
      }),
    );
  });

  it('throws BAD_REQUEST when experiment is not running', async () => {
    mockAbExperimentFindUnique.mockResolvedValueOnce(DRAFT_EXPERIMENT);
    const tx = makeTxProxy();

    await expect(
      _stopAbExperimentInTx(tx as never, { experimentId: 1, adminId: 1, stopReason: 'test' }),
    ).rejects.toThrow(TRPCError);
  });
});

describe('createAbExperiment', () => {
  it('creates experiment with status draft', async () => {
    mockAbExperimentCreate.mockResolvedValueOnce({ ...DRAFT_EXPERIMENT, id: 42 });

    const result = await createAbExperiment({
      experimentKey: 'test-exp-001',
      name: 'Test Experiment',
      variantConfig: {},
      trafficAllocation: { control: 50, variant_a: 25, variant_b: 25 },
      createdByAdminId: 1,
    });

    expect(result.id).toBe(42);
    expect(mockAbExperimentCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ status: 'draft', experimentKey: 'test-exp-001' }),
    });
  });

  it('throws BAD_REQUEST when trafficAllocation does not sum to 100', async () => {
    await expect(
      createAbExperiment({
        experimentKey: 'bad-exp',
        name: 'Bad',
        variantConfig: {},
        trafficAllocation: { control: 50, variant_a: 30, variant_b: 30 },
        createdByAdminId: 1,
      }),
    ).rejects.toThrow(TRPCError);
  });
});

describe('startAbExperiment', () => {
  it('always routes through dual approval with actionType=start_ab_experiment', async () => {
    mockAbExperimentFindUnique.mockResolvedValueOnce(DRAFT_EXPERIMENT);
    mockRequestApproval.mockResolvedValueOnce({ id: 77, requireDualApproval: true });

    const result = await startAbExperiment({
      experimentId: 1,
      requesterAdminId: 1,
      requesterRole: 'admin',
    });

    expect(result.approvalRequestId).toBe(77);
    expect(result.needsApproval).toBe(true);
    expect(mockRequestApproval).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: 'start_ab_experiment',
        requireDualApproval: true,
        riskLevel: 'high',
      }),
    );
  });

  it('throws NOT_FOUND when experiment does not exist', async () => {
    mockAbExperimentFindUnique.mockResolvedValueOnce(null);

    await expect(
      startAbExperiment({ experimentId: 999, requesterAdminId: 1, requesterRole: 'admin' }),
    ).rejects.toThrow(TRPCError);
  });
});

describe('assignUserToVariant', () => {
  it('assigns deterministic variant via md5 hash and upserts', async () => {
    mockAbExperimentFindUnique.mockResolvedValueOnce(RUNNING_EXPERIMENT);
    const assignment = {
      id: 1,
      experimentId: 1,
      userId: 42,
      variant: 'control',
      assignedAt: new Date(),
    };
    mockAbAssignmentUpsert.mockResolvedValueOnce(assignment);

    const result = await assignUserToVariant(1, 42);

    expect(result.variant).toMatch(/^(control|variant_a|variant_b)$/);
    expect(mockAbAssignmentUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { experimentId_userId: { experimentId: 1, userId: 42 } },
        update: {},
      }),
    );
  });

  it('returns consistent variant for same userId × experimentKey (determinism)', async () => {
    // Call twice, verify upsert called with same variant
    mockAbExperimentFindUnique
      .mockResolvedValueOnce(RUNNING_EXPERIMENT)
      .mockResolvedValueOnce(RUNNING_EXPERIMENT);
    const assignment1 = { id: 1, experimentId: 1, userId: 7, variant: 'control', assignedAt: new Date() };
    const assignment2 = { id: 1, experimentId: 1, userId: 7, variant: 'control', assignedAt: new Date() };
    mockAbAssignmentUpsert.mockResolvedValueOnce(assignment1).mockResolvedValueOnce(assignment2);

    const r1 = await assignUserToVariant(1, 7);
    const r2 = await assignUserToVariant(1, 7);

    // Both calls pass same create.variant (deterministic)
    const call1 = (mockAbAssignmentUpsert.mock.calls[0] as [{ create: { variant: string } }])[0].create.variant;
    const call2 = (mockAbAssignmentUpsert.mock.calls[1] as [{ create: { variant: string } }])[0].create.variant;
    expect(call1).toBe(call2);
    expect(r1.variant).toBeDefined();
    expect(r2.variant).toBeDefined();
  });

  it('throws BAD_REQUEST when experiment is not running', async () => {
    mockAbExperimentFindUnique.mockResolvedValueOnce(DRAFT_EXPERIMENT);

    await expect(assignUserToVariant(1, 42)).rejects.toThrow(TRPCError);
  });
});
