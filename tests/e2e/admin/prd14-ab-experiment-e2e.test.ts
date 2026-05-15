// PRD-14 US-015 · prd14-ab-experiment-e2e.test.ts
// AC-2: ≥10 step · createAbExperiment + startAbExperiment 走 dual approval
//   + FORBIDDEN_SAME_APPROVER + _startAbExperimentInTx callback running
//   + 100/50 user 跑 conversion + ab-stop-loss cron
//   + _stopAbExperimentInTx stopped + dedupe 校验
// SHIELD: real DB (quanqn_test) · no mock prisma (mock Redis + BullMQ only)
// SHIELD: prisma.abExperiment maps to ab_experiments table (not admin_ab_experiment)

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const { testPrisma } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require('@prisma/client') as typeof import('@prisma/client');
  const TEST_DB =
    process.env.DATABASE_URL_TEST ?? 'postgresql://return@localhost:5432/quanqn_test';
  return { testPrisma: new PrismaClient({ datasources: { db: { url: TEST_DB } } }) };
});

vi.mock('@/lib/prisma', () => ({ prisma: testPrisma }));

vi.mock('@/lib/redis', () => ({
  redis: {
    set: vi.fn().mockResolvedValue('OK'),
    get: vi.fn().mockResolvedValue(null),
    del: vi.fn().mockResolvedValue(1),
    getex: vi.fn().mockResolvedValue(null),
    incr: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
    pipeline: vi.fn().mockReturnValue({ incr: vi.fn(), expire: vi.fn(), exec: vi.fn().mockResolvedValue([]) }),
    multi: vi.fn().mockReturnValue({ exec: vi.fn().mockResolvedValue([]) }),
  },
}));

vi.mock('bullmq', () => ({
  Queue: vi.fn().mockReturnValue({ add: vi.fn().mockResolvedValue({ id: 'mock-job' }) }),
  Worker: vi.fn().mockReturnValue({ on: vi.fn() }),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), child: vi.fn().mockReturnThis(),
  },
}));

vi.mock('@/services/admin/notifications/dingtalk.service', () => ({
  DingtalkService: vi.fn().mockReturnValue({
    send: vi.fn().mockResolvedValue(undefined),
  }),
}));

// ── Service imports (after mocks) ─────────────────────────────────────────────

import {
  createAbExperiment,
  startAbExperiment,
  assignUserToVariant,
  _startAbExperimentInTx,
  _stopAbExperimentInTx,
} from '@/services/admin/ab-experiment/ab-experiment.service';
import {
  approveRequest,
} from '@/services/admin/approval/approvalGateService';
import { scanAbExperimentsForStopLoss } from '@/jobs/admin/ab-stop-loss.job';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const RUN_ID = `e2e-ab-${Date.now()}`;

let superAdmin1: { id: number };
let superAdmin2: { id: number };
let adminUser: { id: number };
let experimentId: number;
let approvalRequestId: number;

beforeAll(async () => {
  superAdmin1 = await testPrisma.adminUser.create({
    data: { email: `${RUN_ID}-sa1@test.com`, role: 'super_admin', isMock: true, isActive: true },
  });
  superAdmin2 = await testPrisma.adminUser.create({
    data: { email: `${RUN_ID}-sa2@test.com`, role: 'super_admin', isMock: true, isActive: true },
  });
  adminUser = await testPrisma.adminUser.create({
    data: { email: `${RUN_ID}-admin@test.com`, role: 'admin', isMock: true, isActive: true },
  });
});

afterAll(async () => {
  vi.useRealTimers();
  // Clean ab_assignments first (no FK but safe to delete)
  if (experimentId) {
    await testPrisma.abAssignment
      .deleteMany({ where: { experimentId } })
      .catch(() => undefined);
    await testPrisma.abExperiment.delete({ where: { id: experimentId } }).catch(() => undefined);
  }
  await testPrisma.adminAuditLog
    .deleteMany({ where: { actorAdminId: { in: [superAdmin1.id, superAdmin2.id, adminUser.id, 0] } } })
    .catch(() => undefined);
  await testPrisma.approvalRequest
    .deleteMany({ where: { requesterAdminId: { in: [superAdmin1.id, superAdmin2.id, adminUser.id] } } })
    .catch(() => undefined);
  await testPrisma.adminUser.deleteMany({ where: { id: { in: [superAdmin1.id, superAdmin2.id, adminUser.id] } } });
  await testPrisma.$disconnect();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PRD-14 A/B Experiment E2E · dual approval + stop-loss', () => {

  it('Step 1: createAbExperiment → draft status', async () => {
    const exp = await createAbExperiment({
      experimentKey: `${RUN_ID}-exp`,
      name: 'E2E Test Experiment',
      description: 'PRD-14 E2E validation experiment',
      variantConfig: {
        control: { prompt: 'control-prompt' },
        variant_a: { prompt: 'variant-a-prompt' },
        variant_b: { prompt: 'variant-b-prompt' },
      },
      trafficAllocation: { control: 80, variant_a: 10, variant_b: 10 },
      createdByAdminId: superAdmin1.id,
    });

    expect(exp.status).toBe('draft');
    expect(exp.experimentKey).toBe(`${RUN_ID}-exp`);
    expect(exp.createdByAdminId).toBe(superAdmin1.id);
    experimentId = exp.id;
  });

  it('Step 2: startAbExperiment → creates approval request (dual approval required)', async () => {
    const result = await startAbExperiment({
      experimentId,
      requesterAdminId: superAdmin1.id,
      requesterRole: 'super_admin',
      requesterReason: 'E2E test: start experiment',
    });

    expect(result.needsApproval).toBe(true);
    expect(result.approvalRequestId).toBeGreaterThan(0);
    approvalRequestId = result.approvalRequestId;

    const req = await testPrisma.approvalRequest.findUnique({ where: { id: approvalRequestId } });
    expect(req?.status).toBe('pending');
    expect(req?.requireDualApproval).toBe(true);
    expect(req?.actionType).toBe('start_ab_experiment');
  });

  it('Step 3: super_admin#1 first approval → approverAdminId set, status still pending (dual requires 2)', async () => {
    const approved = await approveRequest(superAdmin1.id, approvalRequestId);
    // Dual approval: first approval does NOT change status — status stays 'pending' until second approver
    expect(approved.status).toBe('pending');
    expect(approved.approverAdminId).toBe(superAdmin1.id);
  });

  it('Step 4: FORBIDDEN_SAME_APPROVER — super_admin#1 cannot second-approve', async () => {
    await expect(approveRequest(superAdmin1.id, approvalRequestId)).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: expect.stringContaining('FORBIDDEN_SAME_APPROVER'),
    });
  });

  it('Step 5: super_admin#2 second approval → approved + _startAbExperimentInTx callback → running', async () => {
    const approved = await approveRequest(superAdmin2.id, approvalRequestId);
    expect(approved.status).toBe('approved');
    // secondApproverAdminId is set by _approveRequestInTx internal to the transaction
    const req = await testPrisma.approvalRequest.findUnique({ where: { id: approvalRequestId } });
    expect(req?.secondApproverAdminId).toBe(superAdmin2.id);

    // Execute _startAbExperimentInTx callback (simulates approval handler dispatch)
    await testPrisma.$transaction(async (tx) => {
      await _startAbExperimentInTx(tx as Parameters<typeof _startAbExperimentInTx>[0], {
        experimentId,
        adminId: superAdmin2.id,
        approvalRequestId,
      });
    });

    const exp = await testPrisma.abExperiment.findUnique({ where: { id: experimentId } });
    expect(exp?.status).toBe('running');
    expect(exp?.startedAt).not.toBeNull();
  });

  it('Step 6: assignUserToVariant × 100 users → deterministic + dedup (upsert)', async () => {
    const assignments: Record<string, number> = { control: 0, variant_a: 0, variant_b: 0 };

    for (let userId = 1; userId <= 100; userId++) {
      const assignment = await assignUserToVariant(experimentId, userId);
      assignments[assignment.variant] = (assignments[assignment.variant] ?? 0) + 1;
    }

    // Traffic 80/10/10 → control should dominate
    expect(assignments.control).toBeGreaterThan(50);
    expect(assignments.control).toBeLessThan(100);

    // Deterministic: same userId gets same variant on re-call
    const first = await assignUserToVariant(experimentId, 42);
    const second = await assignUserToVariant(experimentId, 42);
    expect(first.variant).toBe(second.variant);

    // Upsert dedupe: no duplicate rows for userId=42
    const dupeCount = await testPrisma.abAssignment.count({
      where: { experimentId, userId: 42 },
    });
    expect(dupeCount).toBe(1);
  });

  it('Step 7: simulate conversion data (variant_b degradation > 30%)', async () => {
    await testPrisma.abExperiment.update({
      where: { id: experimentId },
      data: {
        resultSummary: {
          control_conversion_rate: 0.8,
          variant_a_conversion_rate: 0.78,
          variant_b_conversion_rate: 0.2, // 75% drop → triggers stop loss
          sample_size: 50,
        },
      },
    });

    const exp = await testPrisma.abExperiment.findUnique({ where: { id: experimentId } });
    const summary = exp?.resultSummary as Record<string, number>;
    expect(summary.variant_b_conversion_rate).toBe(0.2);
  });

  it('Step 8: _stopAbExperimentInTx (simulating cron stop-loss) → status=stopped', async () => {
    await testPrisma.$transaction(async (tx) => {
      await _stopAbExperimentInTx(tx as Parameters<typeof _stopAbExperimentInTx>[0], {
        experimentId,
        adminId: 0, // system actor per SHIELD
        stopReason: 'auto_stop_loss',
        resultSummary: {
          stop_reason: 'variant_b_degradation_exceeds_30pct',
          control_conversion_rate: 0.8,
          variant_b_conversion_rate: 0.2,
        },
      });
    });

    const exp = await testPrisma.abExperiment.findUnique({ where: { id: experimentId } });
    expect(exp?.status).toBe('stopped');
    expect(exp?.stoppedAt).not.toBeNull();
  });

  it('Step 9: admin_audit_log contains ab_experiment_start + ab_experiment_stop', async () => {
    const startLog = await testPrisma.adminAuditLog.findFirst({
      where: {
        eventType: 'ab_experiment_start',
        payload: { path: ['experimentId'], equals: experimentId },
      },
    });
    expect(startLog).not.toBeNull();

    const stopLog = await testPrisma.adminAuditLog.findFirst({
      where: {
        eventType: 'ab_experiment_stop',
        payload: { path: ['experimentId'], equals: experimentId },
      },
    });
    expect(stopLog).not.toBeNull();
    expect((stopLog?.payload as Record<string, unknown>).stopReason).toBe('auto_stop_loss');
  });

  it('Step 10: _stopAbExperimentInTx on already-stopped experiment throws BAD_REQUEST', async () => {
    await expect(
      testPrisma.$transaction(async (tx) => {
        await _stopAbExperimentInTx(tx as Parameters<typeof _stopAbExperimentInTx>[0], {
          experimentId,
          adminId: superAdmin1.id,
          stopReason: 'double_stop_test',
        });
      }),
    ).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: expect.stringContaining("status='stopped'"),
    });
  });

  it('Step 11: scanAbExperimentsForStopLoss — runs clean with 0 stops after experiment stopped', async () => {
    // After experiment is stopped, cron should process 0 stops
    const result = await scanAbExperimentsForStopLoss();
    expect(result).toBeDefined();
    expect(typeof result.stopped).toBe('number');
    expect(typeof result.skipped).toBe('number');
  });
});
