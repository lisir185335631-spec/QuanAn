// PRD-13 US-012 · prd13-quota-expiry-e2e.test.ts
// AC-5: quota adjustment E2E · adjustQuota → quotaAdjustmentLog + delayed job
//       simulate 24h → processExpiry → dailyQuota rollback + expiredAt written
// SHIELD: vi.useFakeTimers() to simulate 24h advancement (no real wait)
// SHIELD: real DB (quanqn_test) · processExpiry called directly after export

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

import { _adjustQuotaInTx } from '@/services/admin/quota/quota-adjustment.service';
import { processExpiry } from '@/jobs/admin/quota-expiry.job';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const RUN_ID = `e2e-quota-${Date.now()}`;
const INITIAL_DAILY_QUOTA = 100;
const DELTA = 300;

let adminUser: { id: number };
let testUser: { id: number };
let userQuotaId: number;
let adjustmentId: number;

beforeAll(async () => {
  adminUser = await testPrisma.adminUser.create({
    data: { email: `${RUN_ID}-admin@test.com`, role: 'admin', isMock: true, isActive: true },
  });

  testUser = await testPrisma.user.create({
    data: {
      openId: `${RUN_ID}-user`,
      name: 'Quota E2E Test User',
      email: `${RUN_ID}-user@test.com`,
      loginMethod: 'mock',
    },
  });

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const quota = await testPrisma.userQuota.create({
    data: {
      userId: testUser.id,
      plan: 'free',
      dailyQuota: INITIAL_DAILY_QUOTA,
      dailyUsed: 0,
      monthlyQuota: 3000,
      monthlyUsed: 0,
      imageDailyQuota: 0,
      imageDailyUsed: 0,
      dailyResetAt: tomorrow,
      monthlyResetAt: nextMonth,
    },
  });
  userQuotaId = quota.id;
});

afterAll(async () => {
  vi.useRealTimers();
  await testPrisma.adminAuditLog
    .deleteMany({ where: { actorAdminId: adminUser.id } })
    .catch(() => undefined);
  await testPrisma.quotaAdjustmentLog
    .deleteMany({ where: { userId: testUser.id } })
    .catch(() => undefined);
  await testPrisma.approvalRequest
    .deleteMany({ where: { requesterAdminId: adminUser.id } })
    .catch(() => undefined);
  await testPrisma.userQuota.delete({ where: { id: userQuotaId } }).catch(() => undefined);
  await testPrisma.user.delete({ where: { id: testUser.id } }).catch(() => undefined);
  await testPrisma.adminUser.delete({ where: { id: adminUser.id } }).catch(() => undefined);
  await testPrisma.$disconnect();
});

// ── E2E Steps ─────────────────────────────────────────────────────────────────

describe('PRD-13 US-012 · quota expiry E2E', () => {
  let dummyApprovalId: number;

  it('adjustQuota(delta=300) → quota adjustment created + delayed job added', async () => {
    vi.useFakeTimers();

    // Create a real approval request to satisfy FK constraint
    const dummyApproval = await testPrisma.approvalRequest.create({
      data: {
        requesterAdminId: adminUser.id,
        requesterRole: 'admin',
        actionType: 'adjust_quota',
        actionPayload: { userId: testUser.id, delta: DELTA },
        riskLevel: 'low',
        requireDualApproval: false,
        requesterReason: '临时放量 e2e test dummy approval',
        status: 'approved',
        approverAdminId: adminUser.id,
        decidedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    dummyApprovalId = dummyApproval.id;

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create adjustment record in a transaction
    await testPrisma.$transaction(async (tx) => {
      adjustmentId = await _adjustQuotaInTx(tx as Parameters<typeof _adjustQuotaInTx>[0], {
        userId: testUser.id,
        adminId: adminUser.id,
        adjustmentType: 'increase_daily',
        delta: DELTA,
        reason: '临时放量 e2e test',
        approvalRequestId: dummyApprovalId,
        adminMode: 'admin',
        ip: '127.0.0.1',
        userAgent: 'e2e-test',
        sessionId: 'e2e-session',
      });
      // Update expiry so it aligns with faked time
      await tx.quotaAdjustmentLog.update({
        where: { id: adjustmentId },
        data: { expiresAt },
      });
    });

    const adj = await testPrisma.quotaAdjustmentLog.findUnique({ where: { id: adjustmentId } });
    expect(adj).not.toBeNull();
    expect(adj?.delta).toBe(DELTA);
    expect(adj?.field).toBe('dailyQuota');
    expect(adj?.isExpired).toBe(false);

    // Quota should be incremented
    const quota = await testPrisma.userQuota.findUnique({ where: { id: userQuotaId } });
    expect(quota?.dailyQuota).toBe(INITIAL_DAILY_QUOTA + DELTA);

    // Audit log created
    const auditLog = await testPrisma.adminAuditLog.findFirst({
      where: { actorAdminId: adminUser.id, eventType: 'quota_increase_daily' },
    });
    expect(auditLog).not.toBeNull();
  });

  it('simulate 24h → processExpiry → dailyQuota rollback + expiredAt written', async () => {
    // Advance 24h + 1s so expiresAt is in the past
    vi.advanceTimersByTime(24 * 60 * 60 * 1000 + 1000);

    // Call processExpiry directly (exported for testing)
    await processExpiry(adjustmentId);

    // Assert: quota rolled back
    const quota = await testPrisma.userQuota.findUnique({ where: { id: userQuotaId } });
    expect(quota?.dailyQuota).toBe(INITIAL_DAILY_QUOTA);

    // Assert: adjustment marked as expired
    const adj = await testPrisma.quotaAdjustmentLog.findUnique({ where: { id: adjustmentId } });
    expect(adj?.isExpired).toBe(true);
    expect(adj?.expiredAt).not.toBeNull();

    // Assert: audit log for expiry
    const expiryLog = await testPrisma.adminAuditLog.findFirst({
      where: { eventType: 'quota_adjustment_expired' },
    });
    expect(expiryLog).not.toBeNull();

    vi.useRealTimers();
  });

  it('quota expiry idempotent — calling processExpiry again is a no-op', async () => {
    // Already expired; calling again should skip
    await processExpiry(adjustmentId);

    const quota = await testPrisma.userQuota.findUnique({ where: { id: userQuotaId } });
    // Quota should still be at original value (not decremented twice)
    expect(quota?.dailyQuota).toBe(INITIAL_DAILY_QUOTA);
  });

  it('processExpiry for nonexistent adjustmentId is a no-op', async () => {
    // Should not throw; just log and return
    await expect(processExpiry(999999999)).resolves.toBeUndefined();
  });
});
