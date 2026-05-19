// PRD-10 US-002 · admin auth e2e integration test
// AC-12: seed → login → me → logout using real DB (quanan_test)
// Requires DATABASE_URL_TEST to be set + admin tables migrated

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

// ─── Redis mock for integration (avoid real Redis dep in test) ───────────────
import { vi } from 'vitest';
vi.mock('@/lib/redis', () => ({
  redis: {
    set: vi.fn().mockResolvedValue('OK'),
    getex: vi.fn().mockResolvedValue('1'),
    del: vi.fn().mockResolvedValue(1),
  },
}));

const testDbUrl = process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL;
const prismaTest = new PrismaClient({ datasources: { db: { url: testDbUrl } } });

const TEST_EMAIL = 'auth-flow-test@quanan.com';

beforeAll(async () => {
  process.env.OAUTH_PROVIDER = 'mock';
  // Seed mock admin user
  await prismaTest.adminUser.upsert({
    where: { email: TEST_EMAIL },
    create: { email: TEST_EMAIL, role: 'super_admin', isMock: true, isActive: true },
    update: { isMock: true, isActive: true, role: 'super_admin' },
  });
});

afterAll(async () => {
  // Clean both seeded actor entries AND failed-login entries (actorAdminId=0) with our traceId
  await prismaTest.adminAuditLog.deleteMany({
    where: {
      OR: [{ actorAdminId: { gt: 0 } }, { traceId: 'integration-test', actorAdminId: 0 }],
    },
  }).catch(() => undefined);
  await prismaTest.adminSession.deleteMany({ where: { adminUser: { email: TEST_EMAIL } } });
  await prismaTest.adminUser.delete({ where: { email: TEST_EMAIL } }).catch(() => undefined);
  await prismaTest.$disconnect();
});

describe('admin auth flow integration (seed → login → me → logout)', () => {
  it('completes the full auth lifecycle', async () => {
    // Re-import after vi.mock is in place
    const { mockOAuthCallback } = await import('@/lib/auth/oauth-admin-mock');
    const { luciaAdmin, createAdminIdleKey } = await import('@/lib/auth/lucia-admin');
    const { adminAuthRouter } = await import('@/trpc/routers/admin/auth');

    const { prisma } = await import('@/lib/prisma');
    const resHeaders = new Headers();
    const ctx = {
      prisma,
      traceId: 'integration-test',
      req: new Request('http://localhost/trpc/admin'),
      resHeaders,
      adminSession: null,
      activeAdminUser: null,
    };

    const caller = adminAuthRouter.createCaller(ctx as Parameters<typeof adminAuthRouter.createCaller>[0]);

    // 1. Login
    const loginResult = await caller.login({ email: TEST_EMAIL });
    expect(loginResult.sessionId).toBeTruthy();
    expect(loginResult.user.email).toBe(TEST_EMAIL);
    expect(loginResult.user.role).toBe('super_admin');

    const setCookieHeader = resHeaders.get('Set-Cookie') ?? '';
    expect(setCookieHeader).toContain('admin_session_id=');
    expect(setCookieHeader).toContain('HttpOnly');

    // Verify session exists in DB
    const dbSession = await prismaTest.adminSession.findUnique({
      where: { id: loginResult.sessionId },
    });
    expect(dbSession).not.toBeNull();
    expect(dbSession?.isActive).toBe(true);

    // 2. me — simulate session validation
    const meResHeaders = new Headers();
    const { session: validatedSession, user: validatedUser } = await import('@/lib/auth/lucia-admin').then(
      (m) => m.validateAdminSession(loginResult.sessionId),
    );
    const meCtx = {
      ...ctx,
      resHeaders: meResHeaders,
      adminSession: validatedSession,
      activeAdminUser: validatedUser,
    };
    const meCaller = adminAuthRouter.createCaller(meCtx as Parameters<typeof adminAuthRouter.createCaller>[0]);
    const meResult = await meCaller.me();
    expect(meResult.email).toBe(TEST_EMAIL);
    expect(meResult.sessionId).toBe(loginResult.sessionId);

    // 3. Logout
    const logoutCtx = { ...meCtx };
    const logoutCaller = adminAuthRouter.createCaller(logoutCtx as Parameters<typeof adminAuthRouter.createCaller>[0]);
    const logoutResult = await logoutCaller.logout();
    expect(logoutResult.ok).toBe(true);
    expect(meResHeaders.get('Set-Cookie') ?? logoutCtx.resHeaders.get('Set-Cookie')).toContain('Max-Age=0');

    // Verify session marked inactive
    const dbSessionAfterLogout = await prismaTest.adminSession.findUnique({
      where: { id: loginResult.sessionId },
    });
    expect(dbSessionAfterLogout?.isActive).toBe(false);

    // Verify audit log entries
    const auditLogs = await prismaTest.adminAuditLog.findMany({
      where: { eventType: 'admin_login', traceId: 'integration-test' },
    });
    expect(auditLogs.length).toBeGreaterThanOrEqual(1);
    expect(auditLogs.some((l) => l.success)).toBe(true);
  });
});
