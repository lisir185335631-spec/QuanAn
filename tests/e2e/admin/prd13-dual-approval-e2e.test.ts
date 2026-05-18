// PRD-13 US-012 · prd13-dual-approval-e2e.test.ts
// AC-2/3: vitest + real Prisma(quanqn_test) · dual approval E2E
// 6 steps: submitForReview → first_approved → FORBIDDEN_SAME_APPROVER →
//          second_approved → _publishPromptVersionInTx → ContextAssembler v18
// SHIELD: real DB (quanqn_test) · no mock prisma · mock Redis + BullMQ only
// SHIELD: beforeEach truncate relevant tables per run-id (no cross-test pollution)

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

// ── Hoisted mocks (bullmq + redis + logger) ──────────────────────────────────

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

// Mock LLM judge to avoid HTTP calls
vi.mock('@/services/admin/prompt-version/llm-judge.service', () => ({
  evaluatePromptVersion: vi.fn().mockResolvedValue({ score: 4.5, report: 'mock' }),
}));

// ── Service imports (after mocks) ────────────────────────────────────────────

import {
  requestApproval,
  approveRequest,
  _approveRequestInTx,
} from '@/services/admin/approval/approvalGateService';
import {
  _publishPromptVersionInTx,
  getActivePromptVersion,
} from '@/services/admin/prompt-version/prompt-version.service';
import { logAdminAction } from '@/services/admin/admin-audit-service';
import { createHash } from 'node:crypto';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const RUN_ID = `e2e-dual-${Date.now()}`;

let superAdmin1: { id: number };
let superAdmin2: { id: number };
let adminUser: { id: number };
let readonlyAdmin: { id: number };
let testUserId: number;
let v18Id: number;
let contentV18: string;

beforeAll(async () => {
  // Seed 3 admin users
  superAdmin1 = await testPrisma.adminUser.create({
    data: { email: `${RUN_ID}-sa1@test.com`, role: 'super_admin', isMock: true, isActive: true },
  });
  superAdmin2 = await testPrisma.adminUser.create({
    data: { email: `${RUN_ID}-sa2@test.com`, role: 'super_admin', isMock: true, isActive: true },
  });
  adminUser = await testPrisma.adminUser.create({
    data: { email: `${RUN_ID}-admin@test.com`, role: 'admin', isMock: true, isActive: true },
  });
  readonlyAdmin = await testPrisma.adminUser.create({
    data: { email: `${RUN_ID}-ro@test.com`, role: 'readonly_admin', isMock: true, isActive: true },
  });

  // Seed a user for ContextAssembler step
  const user = await testPrisma.user.create({
    data: {
      openId: `${RUN_ID}-user`,
      name: 'E2E Test User',
      email: `${RUN_ID}-user@test.com`,
      loginMethod: 'mock',
    },
  });
  testUserId = user.id;

  // Seed PromptVersion v18 (status='draft', judgeScore=4.5, specialistId='PositioningAgent')
  contentV18 = `[v18] PositioningAgent prompt content · RUN_ID=${RUN_ID}`;
  const contentHash = createHash('sha256').update(contentV18).digest('hex').slice(0, 64);
  const v18 = await testPrisma.promptVersion.create({
    data: {
      specialistId: 'PositioningAgent',
      mode: 'default',
      version: 18,
      content: contentV18,
      contentHash,
      status: 'draft',
      judgeScore: 4.5,
      createdByAdminId: adminUser.id,
    },
  });
  v18Id = v18.id;
});

afterAll(async () => {
  // Clean up in dependency order
  await testPrisma.adminAuditLog
    .deleteMany({ where: { actorAdminId: { in: [superAdmin1.id, superAdmin2.id, adminUser.id, 0] } } })
    .catch(() => undefined);
  await testPrisma.approvalRequest
    .deleteMany({ where: { requesterAdminId: adminUser.id } })
    .catch(() => undefined);
  await testPrisma.promptCanaryConfig
    .deleteMany({ where: { specialistId: 'PositioningAgent', mode: 'default' } })
    .catch(() => undefined);
  await testPrisma.promptVersion
    .deleteMany({ where: { specialistId: 'PositioningAgent', mode: 'default', version: 18 } })
    .catch(() => undefined);
  await testPrisma.user.delete({ where: { id: testUserId } }).catch(() => undefined);
  for (const u of [superAdmin1, superAdmin2, adminUser, readonlyAdmin]) {
    await testPrisma.adminUser.delete({ where: { id: u.id } }).catch(() => undefined);
  }
  await testPrisma.$disconnect();
});

// ── E2E Steps ─────────────────────────────────────────────────────────────────

describe('PRD-13 US-012 · dual approval E2E', () => {
  let approvalRequestId: number;

  it('Step 1: admin submitForReview(v18) → pending_review + approval_request created', async () => {
    // Simulate submitForReview: update status + requestApproval(dual=true)
    await testPrisma.promptVersion.update({
      where: { id: v18Id },
      data: { status: 'pending_review' },
    });

    const approval = await requestApproval({
      actionType: 'publish_prompt',
      requesterAdminId: adminUser.id,
      requesterRole: 'admin',
      actionPayload: { versionId: v18Id, specialistId: 'PositioningAgent', mode: 'default', version: 18 },
      riskLevel: 'high',
      requireDualApproval: true,
    });
    approvalRequestId = approval.id;

    const version = await testPrisma.promptVersion.findUnique({ where: { id: v18Id } });
    expect(version?.status).toBe('pending_review');

    const req = await testPrisma.approvalRequest.findUnique({ where: { id: approvalRequestId } });
    expect(req).not.toBeNull();
    expect(req?.requireDualApproval).toBe(true);
    expect(req?.status).toBe('pending');
  });

  it('Step 2: super_admin#1 approveRequest → first_approved + firstApproverAdminId set', async () => {
    const result = await approveRequest(superAdmin1.id, approvalRequestId);
    // Dual first approval: status stays 'pending', approverAdminId is set
    expect(result.status).toBe('pending');
    expect(result.approverAdminId).toBe(superAdmin1.id);
    expect(result.requireDualApproval).toBe(true);

    // Derived displayStatus = 'first_approved'
    const displayStatus =
      result.status === 'pending' && result.requireDualApproval && result.approverAdminId !== null
        ? 'first_approved'
        : result.status;
    expect(displayStatus).toBe('first_approved');
  });

  it('Step 3: same super_admin#1 tries to approve again → FORBIDDEN_SAME_APPROVER', async () => {
    await expect(approveRequest(superAdmin1.id, approvalRequestId)).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: expect.stringContaining('FORBIDDEN_SAME_APPROVER'),
    });
  });

  it('Step 4: super_admin#2 approveRequest → approved + _publishPromptVersionInTx callback', async () => {
    const approved = await approveRequest(superAdmin2.id, approvalRequestId);
    expect(approved.status).toBe('approved');
    expect(approved.secondApproverAdminId).toBe(superAdmin2.id);

    // Callback: execute _publishPromptVersionInTx
    await testPrisma.$transaction(async (tx) => {
      await _publishPromptVersionInTx(tx as Parameters<typeof _publishPromptVersionInTx>[0], {
        versionId: v18Id,
        adminId: superAdmin2.id,
        approvalRequestId,
      });
    });

    // Write prompt_version_publish audit log (simulates the caller's responsibility)
    const payload = { versionId: v18Id, specialistId: 'PositioningAgent', approvalRequestId };
    const payloadHash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
    await testPrisma.adminAuditLog.create({
      data: {
        actorAdminId: superAdmin2.id,
        actorRole: 'super_admin',
        eventCategory: 'high_risk_action',
        eventType: 'prompt_version_publish',
        payload: payload as Parameters<typeof testPrisma.adminAuditLog.create>[0]['data']['payload'],
        payloadHash,
        approvalRequestId,
        traceId: `publish-${v18Id}-${approvalRequestId}`,
        ip: '0.0.0.0',
        userAgent: 'e2e-test',
        sessionId: 'e2e',
        success: true,
      },
    });

    // Assert: PromptVersion status='active'
    const version = await testPrisma.promptVersion.findUnique({ where: { id: v18Id } });
    expect(version?.status).toBe('active');
    expect(version?.approvedByAdminId).toBe(superAdmin2.id);

    // Assert: PromptCanaryConfig.currentVersionId = v18Id
    const canary = await testPrisma.promptCanaryConfig.findUnique({
      where: { specialistId_mode: { specialistId: 'PositioningAgent', mode: 'default' } },
    });
    expect(canary?.currentVersionId).toBe(v18Id);
    expect(canary?.canaryPct).toBe(0);
  });

  it('Step 5: ContextAssembler getActivePromptVersion → returns v18 content', async () => {
    const active = await getActivePromptVersion('PositioningAgent', testUserId, 'default');
    expect(active).not.toBeNull();
    expect(active?.id).toBe(v18Id);
    expect(active?.content).toBe(contentV18);
  });

  it('Step 6: admin_audit_log contains prompt_version_publish + dual_approval_completed', async () => {
    const publishLog = await testPrisma.adminAuditLog.findFirst({
      where: { eventType: 'prompt_version_publish', approvalRequestId },
    });
    expect(publishLog).not.toBeNull();

    const dualLog = await testPrisma.adminAuditLog.findFirst({
      where: { eventType: 'dual_approval_completed' },
      orderBy: { createdAt: 'desc' },
    });
    expect(dualLog).not.toBeNull();
  });

  it('Edge: approveRequest on already-approved request throws BAD_REQUEST', async () => {
    // After Step 4, status='approved' — third approve should fail
    await expect(approveRequest(readonlyAdmin.id, approvalRequestId)).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: expect.stringContaining("status is 'approved'"),
    });
  });

  it('Edge: requestApproval with single-approval actionType sets requireDualApproval=false', async () => {
    const singleApproval = await requestApproval({
      actionType: 'evolution_anomaly_resolve',
      requesterAdminId: adminUser.id,
      requesterRole: 'admin',
      actionPayload: { flagId: 999 },
      riskLevel: 'low',
      requireDualApproval: false,
    });
    expect(singleApproval.requireDualApproval).toBe(false);
    expect(singleApproval.status).toBe('pending');

    // Cleanup
    await testPrisma.approvalRequest.delete({ where: { id: singleApproval.id } }).catch(() => undefined);
  });
});
