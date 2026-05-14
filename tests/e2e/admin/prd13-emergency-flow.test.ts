// PRD-13 US-012 · prd13-emergency-flow.test.ts
// AC-4: emergency approval E2E · emergencyApprove → postReviewRequired=true
//       12h cron → no alert · 24h+ cron → post_review_overdue alert
//       postReviewApprove → postReviewedAt + postReviewerAdminId
// SHIELD: vi.useFakeTimers() to simulate 12h/24h passage
// SHIELD: real DB (quanqn_test) · mock Redis + BullMQ + DingtalkService

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

// ── Service imports ───────────────────────────────────────────────────────────

import {
  requestApproval,
  emergencyApprove,
  postReviewApprove,
} from '@/services/admin/approval/approvalGateService';
import { scanEmergencyPostReviewOverdue } from '@/jobs/admin/emergency-post-review.job';
import { DingtalkService } from '@/services/admin/notifications/dingtalk.service';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const RUN_ID = `e2e-emergency-${Date.now()}`;

let superAdmin1: { id: number };
let superAdmin2: { id: number };

beforeAll(async () => {
  superAdmin1 = await testPrisma.adminUser.create({
    data: { email: `${RUN_ID}-sa1@test.com`, role: 'super_admin', isMock: true, isActive: true },
  });
  superAdmin2 = await testPrisma.adminUser.create({
    data: { email: `${RUN_ID}-sa2@test.com`, role: 'super_admin', isMock: true, isActive: true },
  });
});

afterAll(async () => {
  vi.useRealTimers();
  await testPrisma.adminAuditLog
    .deleteMany({ where: { actorAdminId: { in: [superAdmin1.id, superAdmin2.id, 0] } } })
    .catch(() => undefined);
  await testPrisma.approvalRequest
    .deleteMany({ where: { requesterAdminId: superAdmin1.id } })
    .catch(() => undefined);
  await testPrisma.adminUser.deleteMany({ where: { id: { in: [superAdmin1.id, superAdmin2.id] } } });
  await testPrisma.$disconnect();
});

// ── Mock DingtalkService ──────────────────────────────────────────────────────

class MockDingtalk extends DingtalkService {
  readonly sentMessages: string[] = [];
  override async send(msg: string): Promise<void> {
    this.sentMessages.push(msg);
  }
}

// ── E2E Steps ─────────────────────────────────────────────────────────────────

describe('PRD-13 US-012 · emergency approval flow E2E', () => {
  let approvalRequestId: number;
  const INCIDENT_ID = 'INCIDENT-2026-05-14-001';
  let mockDingtalk: MockDingtalk;

  it('emergencyApprove → status=approved, emergencyMode=true, postReviewRequired=true', async () => {
    vi.useFakeTimers();
    mockDingtalk = new MockDingtalk();

    // Create a pending approval request to emergency-approve
    const req = await requestApproval({
      actionType: 'force_rebuild_evolution',
      requesterAdminId: superAdmin1.id,
      requesterRole: 'super_admin',
      actionPayload: { accountId: 999, reason: 'emergency test' },
      riskLevel: 'high',
      requireDualApproval: true,
    });
    approvalRequestId = req.id;

    const approved = await emergencyApprove(
      approvalRequestId,
      superAdmin1.id,
      INCIDENT_ID,
      'super_admin',
    );

    expect(approved.status).toBe('approved');
    expect(approved.emergencyMode).toBe(true);
    expect(approved.emergencyIncidentId).toBe(INCIDENT_ID);
    expect(approved.postReviewRequired).toBe(true);
    expect(approved.approverAdminId).toBe(superAdmin1.id);

    // Audit log: emergency_approval written
    const auditLog = await testPrisma.adminAuditLog.findFirst({
      where: { eventType: 'emergency_approval', actorAdminId: superAdmin1.id },
    });
    expect(auditLog).not.toBeNull();
  });

  it('12h later: scanEmergencyPostReviewOverdue → no overdue alert (< 24h threshold)', async () => {
    // Advance 12h — decidedAt was set at T0, now T = T0 + 12h
    // twentyFourHoursAgo = T0+12h - 24h = T0-12h → decidedAt(T0) is NOT older than 24h
    vi.advanceTimersByTime(12 * 60 * 60 * 1000);

    const result = await scanEmergencyPostReviewOverdue(mockDingtalk);
    expect(result.notified).toBe(0);
    expect(mockDingtalk.sentMessages).toHaveLength(0);
  });

  it('24h+ later: scanEmergencyPostReviewOverdue → overdue alert + audit_log post_review_overdue', async () => {
    // Advance another 13h (total 25h from decidedAt)
    // Now T = T0 + 25h
    // twentyFourHoursAgo = T0+25h - 24h = T0+1h → decidedAt(T0) < T0+1h → overdue
    vi.advanceTimersByTime(13 * 60 * 60 * 1000);

    const result = await scanEmergencyPostReviewOverdue(mockDingtalk);
    expect(result.notified).toBeGreaterThanOrEqual(1);
    expect(mockDingtalk.sentMessages.length).toBeGreaterThanOrEqual(1);

    // Check audit log: post_review_overdue written
    const overdueLog = await testPrisma.adminAuditLog.findFirst({
      where: {
        eventType: 'post_review_overdue',
        payload: { path: ['requestId'], equals: approvalRequestId },
      },
    });
    expect(overdueLog).not.toBeNull();

    vi.useRealTimers();
  });

  it('postReviewApprove → postReviewedAt + postReviewerAdminId written', async () => {
    const reviewed = await postReviewApprove(
      approvalRequestId,
      superAdmin2.id,
      'confirmed',
    );

    expect(reviewed.postReviewedAt).not.toBeNull();
    expect(reviewed.postReviewerAdminId).toBe(superAdmin2.id);
    expect(reviewed.postReviewResult).toBe('confirmed');

    // Audit log: post_review_completed written
    const auditLog = await testPrisma.adminAuditLog.findFirst({
      where: { eventType: 'post_review_completed', actorAdminId: superAdmin2.id },
    });
    expect(auditLog).not.toBeNull();
  });

  it('Edge: postReviewApprove on already-reviewed request throws BAD_REQUEST', async () => {
    // Already reviewed in previous test
    await expect(
      postReviewApprove(approvalRequestId, superAdmin1.id, 'confirmed'),
    ).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: expect.stringContaining('already been post-reviewed'),
    });
  });

  it('Edge: emergencyApprove requires super_admin role — non-super_admin rejected', async () => {
    const req2 = await requestApproval({
      actionType: 'adjust_quota',
      requesterAdminId: superAdmin1.id,
      requesterRole: 'super_admin',
      actionPayload: { userId: 1 },
      riskLevel: 'medium',
      requireDualApproval: false,
    });
    await expect(
      emergencyApprove(req2.id, superAdmin2.id, 'INC-FAKE', 'admin'),
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: expect.stringContaining('FORBIDDEN_EMERGENCY_NOT_SUPER_ADMIN'),
    });
    // Cleanup
    await testPrisma.approvalRequest.delete({ where: { id: req2.id } }).catch(() => undefined);
  });

  it('Edge: emergencyApprove requires emergencyIncidentId', async () => {
    const req3 = await requestApproval({
      actionType: 'adjust_quota',
      requesterAdminId: superAdmin1.id,
      requesterRole: 'super_admin',
      actionPayload: { userId: 1 },
      riskLevel: 'medium',
      requireDualApproval: false,
    });
    // requestApproval with emergencyMode=true but no incidentId should fail
    await expect(
      requestApproval({
        actionType: 'adjust_quota',
        requesterAdminId: superAdmin1.id,
        requesterRole: 'super_admin',
        actionPayload: { userId: 1 },
        riskLevel: 'high',
        emergencyMode: true,
        // emergencyIncidentId omitted
      }),
    ).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: expect.stringContaining('emergencyIncidentId'),
    });
    // Cleanup
    await testPrisma.approvalRequest.delete({ where: { id: req3.id } }).catch(() => undefined);
  });
});
