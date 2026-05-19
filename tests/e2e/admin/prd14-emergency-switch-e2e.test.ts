// PRD-14 US-015 · prd14-emergency-switch-e2e.test.ts
// AC-4: ≥7 step · super_admin#1 emergencyToggleSystemConfig('stop_trending_scraper', true, 'INC-001')
//   + system_config updated + emergencyApprove + postReviewRequired=true
//   + TrendingScraper Worker bypass + 12h cron 不告警 + 24h+ cron 告警 post_review_overdue
//   + super_admin#2 postReviewApprove confirmed + reviewerAdminId !== firstApprover
// SHIELD: vi.useFakeTimers() for 24h simulation
// SHIELD: FORBIDDEN_SAME_APPROVER at postReviewApprove (reviewerId must differ from approver)

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const { testPrisma } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require('@prisma/client') as typeof import('@prisma/client');
  const TEST_DB =
    process.env.DATABASE_URL_TEST ?? 'postgresql://return@localhost:5432/quanan_test';
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

// Capture dingtalk messages for assertions
const mockDingtalkMessages: string[] = [];
vi.mock('@/services/admin/notifications/dingtalk.service', () => ({
  DingtalkService: vi.fn().mockReturnValue({
    send: vi.fn().mockImplementation((msg: string) => {
      mockDingtalkMessages.push(msg);
      return Promise.resolve(undefined);
    }),
  }),
}));

// ── Service imports (after mocks) ─────────────────────────────────────────────

import {
  emergencyToggleSystemConfig,
  getSystemConfigValue,
} from '@/services/admin/feature-flag/feature-flag.service';
import {
  postReviewApprove,
} from '@/services/admin/approval/approvalGateService';
import { scanEmergencyPostReviewOverdue } from '@/jobs/admin/emergency-post-review.job';
import { processTrendingScraperJob } from '@/workers/trending-scraper/worker';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const RUN_ID = `e2e-emg-${Date.now()}`;
const INCIDENT_ID = `INC-${RUN_ID}`;
const CONFIG_KEY = 'stop_trending_scraper';

let superAdmin1: { id: number };
let superAdmin2: { id: number };
let emergencyApprovalRequestId: number;
let systemConfigId: number;

beforeAll(async () => {
  superAdmin1 = await testPrisma.adminUser.create({
    data: { email: `${RUN_ID}-sa1@test.com`, role: 'super_admin', isMock: true, isActive: true },
  });
  superAdmin2 = await testPrisma.adminUser.create({
    data: { email: `${RUN_ID}-sa2@test.com`, role: 'super_admin', isMock: true, isActive: true },
  });

  // Ensure stop_trending_scraper system config exists (seed if not)
  const existing = await testPrisma.systemConfig.findUnique({ where: { configKey: CONFIG_KEY } });
  if (!existing) {
    const created = await testPrisma.systemConfig.create({
      data: {
        configKey: CONFIG_KEY,
        configValue: false as unknown as Parameters<typeof testPrisma.systemConfig.create>[0]['data']['configValue'],
        description: 'Emergency kill switch for trending scraper',
        updatedByAdminId: superAdmin1.id,
      },
    });
    systemConfigId = created.id;
  } else {
    systemConfigId = existing.id;
    // Reset to false before test
    await testPrisma.systemConfig.update({
      where: { configKey: CONFIG_KEY },
      data: {
        configValue: false as unknown as Parameters<typeof testPrisma.systemConfig.update>[0]['data']['configValue'],
      },
    });
  }
});

afterAll(async () => {
  vi.useRealTimers();
  // Reset stop_trending_scraper to false
  await testPrisma.systemConfig.update({
    where: { configKey: CONFIG_KEY },
    data: {
      configValue: false as unknown as Parameters<typeof testPrisma.systemConfig.update>[0]['data']['configValue'],
    },
  }).catch(() => undefined);

  await testPrisma.adminAuditLog
    .deleteMany({ where: { actorAdminId: { in: [superAdmin1.id, superAdmin2.id] } } })
    .catch(() => undefined);
  await testPrisma.approvalRequest
    .deleteMany({ where: { requesterAdminId: superAdmin1.id } })
    .catch(() => undefined);
  await testPrisma.adminUser.deleteMany({ where: { id: { in: [superAdmin1.id, superAdmin2.id] } } });
  await testPrisma.$disconnect();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PRD-14 Emergency Switch E2E · stop_trending_scraper + post-review', () => {

  it('Step 1: emergencyToggleSystemConfig(stop_trending_scraper, true, INC-XXX) → config updated + postReviewRequired=true', async () => {
    const result = await emergencyToggleSystemConfig(
      CONFIG_KEY,
      true,
      superAdmin1.id,
      INCIDENT_ID,
      'E2E test: emergency stop trending scraper',
    );

    expect(result.approvalRequestId).toBeGreaterThan(0);
    emergencyApprovalRequestId = result.approvalRequestId;

    // system_config updated to true
    const config = await testPrisma.systemConfig.findUnique({ where: { configKey: CONFIG_KEY } });
    expect(config?.configValue).toBe(true);

    // Approval request has postReviewRequired=true (emergency approval pattern)
    const approvalReq = await testPrisma.approvalRequest.findUnique({
      where: { id: emergencyApprovalRequestId },
    });
    expect(approvalReq?.postReviewRequired).toBe(true);
    expect(approvalReq?.status).toBe('approved');
    expect(approvalReq?.emergencyIncidentId).toBe(INCIDENT_ID);
  });

  it('Step 2: security_alert audit log contains emergency_switch_triggered', async () => {
    const auditLog = await testPrisma.adminAuditLog.findFirst({
      where: {
        eventCategory: 'security_alert',
        eventType: 'emergency_switch_triggered',
        actorAdminId: superAdmin1.id,
      },
      orderBy: { createdAt: 'desc' },
    });

    expect(auditLog).not.toBeNull();
    const payload = auditLog?.payload as Record<string, unknown>;
    expect(payload.configKey).toBe(CONFIG_KEY);
    expect(payload.incidentId).toBe(INCIDENT_ID);
  });

  it('Step 3: TrendingScraper Worker bypassed when stop_trending_scraper=true', async () => {
    const loggerWarnSpy = vi.mocked(
      (await import('@/lib/logger')).logger.warn,
    );

    await processTrendingScraperJob({
      sourcePlatform: 'weibo',
      sourceItemId: `test-item-${RUN_ID}`,
      sourceUrl: 'https://example.com/test',
      rawContent: { text: 'test content' },
    });

    // Should warn and return early without writing to review queue
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      expect.objectContaining({ sourcePlatform: 'weibo' }),
      'trending_scraper.emergency_stopped',
    );

    // No trendingReviewQueue entry should be created
    const queueEntry = await testPrisma.trendingReviewQueue.findFirst({
      where: { sourceItemId: `test-item-${RUN_ID}` },
    });
    expect(queueEntry).toBeNull();
  });

  it('Step 4: 12h cron — no post_review_overdue alert (within 24h window)', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date());

    // Advance 12h — still within 24h window, no alert
    vi.advanceTimersByTime(12 * 60 * 60 * 1000);

    const result = await scanEmergencyPostReviewOverdue();
    // Our specific approval request should NOT be in overdue (< 24h)
    const overdueLog = await testPrisma.adminAuditLog.findFirst({
      where: {
        eventType: 'post_review_overdue',
        payload: { path: ['requestId'], equals: emergencyApprovalRequestId },
      },
    });
    expect(overdueLog).toBeNull();
    expect(result.notified).toBeGreaterThanOrEqual(0);

    vi.useRealTimers();
  });

  it('Step 5: 24h+ cron — post_review_overdue alert triggered', async () => {
    // Back-date the decidedAt to 25h ago so the cron picks it up
    const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);
    await testPrisma.approvalRequest.update({
      where: { id: emergencyApprovalRequestId },
      data: { decidedAt: twentyFiveHoursAgo },
    });

    const result = await scanEmergencyPostReviewOverdue();
    expect(result.notified).toBeGreaterThanOrEqual(1);

    // post_review_overdue audit log created
    const overdueLog = await testPrisma.adminAuditLog.findFirst({
      where: {
        eventType: 'post_review_overdue',
        payload: { path: ['requestId'], equals: emergencyApprovalRequestId },
      },
    });
    expect(overdueLog).not.toBeNull();
  });

  it('Step 6: FORBIDDEN_SAME_APPROVER at postReviewApprove — first approver cannot post-review', async () => {
    // The emergency approver was superAdmin1 (same person) — should be FORBIDDEN
    await expect(
      postReviewApprove(emergencyApprovalRequestId, superAdmin1.id, 'confirmed'),
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: expect.stringContaining('FORBIDDEN_SAME_APPROVER'),
    });
  });

  it('Step 7: super_admin#2 postReviewApprove → confirmed + reviewerAdminId !== firstApprover', async () => {
    const reviewed = await postReviewApprove(
      emergencyApprovalRequestId,
      superAdmin2.id,
      'confirmed',
    );

    expect(reviewed.postReviewedAt).not.toBeNull();
    expect(reviewed.postReviewerAdminId).toBe(superAdmin2.id);
    expect(reviewed.postReviewResult).toBe('confirmed');

    // Verify reviewer differs from approver (D-095)
    const req = await testPrisma.approvalRequest.findUnique({ where: { id: emergencyApprovalRequestId } });
    expect(req?.postReviewerAdminId).not.toBe(req?.approverAdminId);

    // post_review_completed audit log
    const reviewLog = await testPrisma.adminAuditLog.findFirst({
      where: { eventType: 'post_review_completed', actorAdminId: superAdmin2.id },
    });
    expect(reviewLog).not.toBeNull();
  });
});
