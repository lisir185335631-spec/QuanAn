// PRD-13 US-012 · prd13-evolution-rebuild-e2e.test.ts
// AC-6: forceRebuildEvolution E2E · requestApproval(dual=true) → 2 super_admin approvals
//       → _forceRebuildEvolutionInTx callback → evolution_profile cleared
//       → evolution_insights all isFallback=true+levelAfter='rebuild'
//       → BullMQ EvolutionAgent batch job enqueued
// SHIELD: real DB (quanqn_test) · mock BullMQ to capture queue.add calls

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const { testPrisma, mockBullmqQueueAdd } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require('@prisma/client') as typeof import('@prisma/client');
  const TEST_DB =
    process.env.DATABASE_URL_TEST ?? 'postgresql://return@localhost:5432/quanqn_test';
  const mockBullmqQueueAdd = vi.fn().mockResolvedValue({ id: 'evo-rebuild-job' });
  return {
    testPrisma: new PrismaClient({ datasources: { db: { url: TEST_DB } } }),
    mockBullmqQueueAdd,
  };
});

vi.mock('@/lib/prisma', () => ({ prisma: testPrisma }));

vi.mock('@/lib/redis', () => ({
  redis: {
    set: vi.fn().mockResolvedValue('OK'),
    get: vi.fn().mockResolvedValue(null),
    del: vi.fn().mockResolvedValue(1),
    getex: vi.fn().mockResolvedValue(null),
  },
}));

// Mock bullmq Queue at module level + for dynamic import in enqueueEvolutionRebuildJob
vi.mock('bullmq', () => ({
  Queue: vi.fn().mockReturnValue({ add: mockBullmqQueueAdd }),
  Worker: vi.fn().mockReturnValue({ on: vi.fn() }),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), child: vi.fn().mockReturnThis(),
  },
}));

// ── Service imports ───────────────────────────────────────────────────────────

import { requestApproval, approveRequest } from '@/services/admin/approval/approvalGateService';
import {
  _forceRebuildEvolutionInTx,
  enqueueEvolutionRebuildJob,
} from '@/services/admin/evolution-health/evolution-rebuild.service';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const RUN_ID = `e2e-evo-${Date.now()}`;

let superAdmin1: { id: number };
let superAdmin2: { id: number };
let adminUser: { id: number };
let testUserId: number;
let accountId: number;

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

  // Create User + IpAccount + EvolutionProfile + EvolutionInsights
  const user = await testPrisma.user.create({
    data: {
      openId: `${RUN_ID}-user`,
      name: 'Evolution Rebuild E2E User',
      email: `${RUN_ID}-user@test.com`,
      loginMethod: 'mock',
    },
  });
  testUserId = user.id;

  const account = await testPrisma.ipAccount.create({
    data: {
      userId: user.id,
      name: `E2E Account ${RUN_ID}`,
      industry: 'tech',
      platform: 'xiaohongshu',
    },
  });
  accountId = account.id;

  await testPrisma.evolutionProfile.create({
    data: {
      accountId,
      level: 'L3',
      latestInsight: { type: 'test', content: 'some insight' },
      latestInsightId: 1,
    },
  });

  // Create 2 evolution insights
  for (let i = 0; i < 2; i++) {
    await testPrisma.evolutionInsight.create({
      data: {
        accountId,
        triggerType: 'threshold',
        direction: 'growth',
        content: { insight: `test insight ${i}` },
        isFallback: false,
        levelBefore: 'L2',
        levelAfter: 'L3',
      },
    });
  }
});

afterAll(async () => {
  await testPrisma.adminAuditLog
    .deleteMany({ where: { actorAdminId: { in: [superAdmin1.id, superAdmin2.id, adminUser.id] } } })
    .catch(() => undefined);
  await testPrisma.adminAuditLog
    .deleteMany({ where: { targetAccountId: accountId } })
    .catch(() => undefined);
  await testPrisma.approvalRequest
    .deleteMany({ where: { requesterAdminId: adminUser.id } })
    .catch(() => undefined);
  await testPrisma.evolutionInsight.deleteMany({ where: { accountId } }).catch(() => undefined);
  await testPrisma.evolutionProfile.delete({ where: { accountId } }).catch(() => undefined);
  await testPrisma.ipAccount.delete({ where: { id: accountId } }).catch(() => undefined);
  await testPrisma.user.delete({ where: { id: testUserId } }).catch(() => undefined);
  await testPrisma.adminUser
    .deleteMany({ where: { id: { in: [superAdmin1.id, superAdmin2.id, adminUser.id] } } })
    .catch(() => undefined);
  await testPrisma.$disconnect();
});

// ── E2E Steps ─────────────────────────────────────────────────────────────────

describe('PRD-13 US-012 · evolution rebuild E2E', () => {
  let approvalRequestId: number;

  it('admin forceRebuildEvolution → requestApproval(dual=true)', async () => {
    const req = await requestApproval({
      actionType: 'force_rebuild_evolution',
      requesterAdminId: adminUser.id,
      requesterRole: 'admin',
      actionPayload: { accountId, reason: 'E2E force rebuild test — at least 10 chars' },
      riskLevel: 'high',
      requireDualApproval: true,
    });
    approvalRequestId = req.id;

    expect(req.requireDualApproval).toBe(true);
    expect(req.status).toBe('pending');
  });

  it('super_admin#1 first approval → first_approved state', async () => {
    const result = await approveRequest(superAdmin1.id, approvalRequestId);
    expect(result.status).toBe('pending');
    expect(result.approverAdminId).toBe(superAdmin1.id);
  });

  it('super_admin#2 second approval → status=approved', async () => {
    const result = await approveRequest(superAdmin2.id, approvalRequestId);
    expect(result.status).toBe('approved');
    expect(result.secondApproverAdminId).toBe(superAdmin2.id);
  });

  it('_forceRebuildEvolutionInTx callback → evolution_profile cleared + insights resolved', async () => {
    await testPrisma.$transaction(async (tx) => {
      await _forceRebuildEvolutionInTx(tx as Parameters<typeof _forceRebuildEvolutionInTx>[0], {
        accountId,
        adminId: superAdmin2.id,
        adminRole: 'super_admin',
        approvalRequestId,
        reason: 'E2E force rebuild test — at least 10 chars',
        ip: '127.0.0.1',
        sessionId: 'e2e-session',
      });
    });

    // Assert: evolution_profile cleared (latestInsight=null, latestInsightId=null, lastEvolvedAt=null)
    const profile = await testPrisma.evolutionProfile.findUnique({ where: { accountId } });
    expect(profile?.latestInsight).toBeNull();
    expect(profile?.latestInsightId).toBeNull();
    expect(profile?.lastEvolvedAt).toBeNull();

    // Assert: all insights marked isFallback=true + levelAfter='rebuild'
    const insights = await testPrisma.evolutionInsight.findMany({ where: { accountId } });
    expect(insights.length).toBeGreaterThanOrEqual(2);
    for (const insight of insights) {
      expect(insight.isFallback).toBe(true);
      expect(insight.levelAfter).toBe('rbld');
    }

    // Assert: admin_audit_log eventType='evolution_force_rebuild'
    const auditLog = await testPrisma.adminAuditLog.findFirst({
      where: { eventType: 'evolution_force_rebuild', targetAccountId: accountId },
    });
    expect(auditLog).not.toBeNull();
    expect(auditLog?.approvalRequestId).toBe(approvalRequestId);
  });

  it('Edge: same super_admin cannot approve twice in dual-approval', async () => {
    const req2 = await requestApproval({
      actionType: 'force_rebuild_evolution',
      requesterAdminId: adminUser.id,
      requesterRole: 'admin',
      actionPayload: { accountId: accountId + 1, reason: 'second dual approval test' },
      riskLevel: 'high',
      requireDualApproval: true,
    });
    await approveRequest(superAdmin1.id, req2.id);
    await expect(approveRequest(superAdmin1.id, req2.id)).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: expect.stringContaining('FORBIDDEN_SAME_APPROVER'),
    });
    // Cleanup
    await testPrisma.approvalRequest.delete({ where: { id: req2.id } }).catch(() => undefined);
  });

  it('enqueueEvolutionRebuildJob → BullMQ queue.add called with rebuild payload', async () => {
    mockBullmqQueueAdd.mockClear();
    await enqueueEvolutionRebuildJob(accountId);
    // BullMQ Queue is mocked; verify add was called with correct payload
    expect(mockBullmqQueueAdd).toHaveBeenCalledWith(
      'rebuild-account',
      expect.objectContaining({ accountId, triggerType: 'force_rebuild:admin' }),
      expect.objectContaining({ delay: 5000 }),
    );
  });
});
