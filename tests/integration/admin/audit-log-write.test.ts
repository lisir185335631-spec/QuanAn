// PRD-10 US-004 · audit log write integration test (AC-12)
// seed → admin_login → cross_account_query → approval_request_create → admin_audit_log ≥ 3 rows
// Hits real DB (quanan_test) to verify logAdminAction service end-to-end

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { vi } from 'vitest';

// Mock Redis so integration test doesn't need a Redis connection
vi.mock('@/lib/redis', () => ({
  redis: {
    set: vi.fn().mockResolvedValue('OK'),
    getex: vi.fn().mockResolvedValue('1'),
    del: vi.fn().mockResolvedValue(1),
  },
}));

const testDbUrl = process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL;
const prismaTest = new PrismaClient({ datasources: { db: { url: testDbUrl } } });

const TRACE_ID = `audit-integ-${Date.now()}`;
const TEST_EMAIL = `audit-write-test-${Date.now()}@quanan.test`;

beforeAll(async () => {
  // Seed admin user for the integration test
  await prismaTest.adminUser.upsert({
    where: { email: TEST_EMAIL },
    create: { email: TEST_EMAIL, role: 'super_admin', isMock: true, isActive: true },
    update: { isMock: true, isActive: true, role: 'super_admin' },
  });
});

afterAll(async () => {
  await prismaTest.adminAuditLog.deleteMany({ where: { traceId: TRACE_ID } });
  await prismaTest.adminUser.deleteMany({ where: { email: TEST_EMAIL } });
  await prismaTest.$disconnect();
});

describe('audit-log-write integration (real DB)', () => {
  it('writes admin_login + cross_account_query + approval_request_create rows (≥ 3)', async () => {
    const { logAdminAction } = await import('@/services/admin/admin-audit-service');

    const baseFields = {
      traceId: TRACE_ID,
      ip: '127.0.0.1',
      userAgent: 'integration-test',
      sessionId: 'sess-integ',
    };

    // 1. admin_login (simulates auth.login calling logAdminAction)
    await logAdminAction({
      actorAdminId: 1,
      actorRole: 'super_admin',
      eventCategory: 'auth',
      eventType: 'admin_login',
      payload: { email: TEST_EMAIL, oauthProvider: 'mock' },
      success: true,
      ...baseFields,
    });

    // 2. cross_account_query (simulates auditLog middleware after adminRLS)
    await logAdminAction({
      actorAdminId: 1,
      actorRole: 'super_admin',
      eventCategory: 'cross_account_query',
      eventType: 'cross_account_query',
      payload: { path: 'admin.user.list', actionType: 'list', latencyMs: 12 },
      success: true,
      ...baseFields,
    });

    // 3. approval_request_create (simulates approvalGateCheck before throw)
    await logAdminAction({
      actorAdminId: 1,
      actorRole: 'super_admin',
      eventCategory: 'approval',
      eventType: 'approval_request_create',
      payload: { actionType: 'ban_user', riskLevel: 'high', status: 'stub_rejected' },
      success: false,
      errorCode: 'NOT_IMPLEMENTED',
      ...baseFields,
    });

    // Verify: ≥ 3 rows with this traceId
    const rows = await prismaTest.adminAuditLog.findMany({ where: { traceId: TRACE_ID } });
    expect(rows.length).toBeGreaterThanOrEqual(3);

    const eventTypes = rows.map((r) => r.eventType);
    expect(eventTypes).toContain('admin_login');
    expect(eventTypes).toContain('cross_account_query');
    expect(eventTypes).toContain('approval_request_create');
  });
});
