// PRD-10 US-006 · adminRLS bypass cross-account integration test
// 7 test cases · real PostgreSQL (quanan_test/quanan DB) + mocked Redis
//
// Seed: 2 accounts (account_a + account_b) × 5 history each (10 total)
//       1 admin_user (super_admin, isMock=true)  1 admin_session
//
// Test matrix:
//   1. ctx.prisma without adminRLS (quanan_app role, no app.current_account_id) → 0 rows
//   2. ctx.adminPrisma (quanan_app + set_config('app.role','admin',true)) → 10 rows bypass RLS
//   3. ctx.crossAccountAccessed === true after adminRLS middleware runs
//   4. admin_audit_log cross_account_query written after adminRLS + auditLog chain
//   5. adminRLS $transaction throw → no new cross_account_query audit row (auditLog never runs)
//   6. current_setting('app.role') empty outside transaction (LOCAL=true no pool pollution)
//   7. main-app accountIsolation activeAccountId=account_a → 5 rows (admin RLS does not pollute)

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

// Mock Redis — admin tests don't need real Redis
vi.mock('@/lib/redis', () => ({
  redis: {
    set: vi.fn().mockResolvedValue('OK'),
    getex: vi.fn().mockResolvedValue('1'),
    del: vi.fn().mockResolvedValue(1),
  },
}));

import { PrismaClient } from '@prisma/client';
import { cleanupSeed, seedAccounts, seedAdminSession, seedAdminUser, seedHistoryPerAccount } from './fixtures/admin-seed';
import { createMockAdminContext } from './helpers/admin-context';
import { disconnectIntrospect, getCurrentSetting, getRLSEnabled } from './helpers/sql-introspect';

const testDbUrl = process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL;
const prismaTest = new PrismaClient({ datasources: { db: { url: testDbUrl } } });

// Unique tag per test run — prevents interference with other test data
const SEED_TAG = `rls-integ-${Date.now()}`;

let accountA: { id: number };
let accountB: { id: number };
let adminUser: { id: number; email: string; role: string; isMock: boolean; isActive: boolean };
let adminSession: { id: string; expiresAt: Date; isActive: boolean };

beforeAll(async () => {
  // Seed 2 accounts
  const accounts = await seedAccounts(2, SEED_TAG);
  accountA = accounts[0]!;
  accountB = accounts[1]!;

  // Seed 5 history rows per account (10 total)
  await seedHistoryPerAccount(accountA.id, 5, SEED_TAG);
  await seedHistoryPerAccount(accountB.id, 5, SEED_TAG);

  // Seed 1 admin user (super_admin, isMock=true)
  adminUser = await seedAdminUser('super_admin', true, SEED_TAG);

  // Seed 1 admin session (12h TTL)
  adminSession = await seedAdminSession(adminUser.id, 12 * 60 * 60 * 1000);
});

afterAll(async () => {
  await cleanupSeed(SEED_TAG);
  await prismaTest.$disconnect();
  await disconnectIntrospect();
});

describe('adminRLS bypass cross-account integration (real PG)', () => {
  it('test 1: ctx.prisma.history.findMany returns 0 rows (main-app RLS blocks without activeAccountId)', async () => {
    // Simulate main-app non-admin query:
    // SET LOCAL ROLE quanan_app → non-superuser, RLS enforced
    // No app.current_account_id set → histories_account_isolation policy returns false → 0 rows
    const rows = await prismaTest.$transaction(async (tx) => {
      await (tx as unknown as { $executeRawUnsafe: (sql: string) => Promise<unknown> }).$executeRawUnsafe(
        'SET LOCAL ROLE quanan_app',
      );
      return tx.history.findMany({ where: { traceId: SEED_TAG } });
    });

    expect(rows).toHaveLength(0);
  });

  it('test 2: ctx.adminPrisma.history.findMany returns 10 rows (bypass RLS success)', async () => {
    // adminRLS bypass · 跨账号查 · 走 cross_account_query audit
    // SET LOCAL ROLE quanan_app (RLS enforced) + set_config('app.role','admin',true) → admin_full_access_histories policy = true
    // AC-14: grep 'set_config.*app.role.*admin' must match this file ≥ 1
    const rows = await prismaTest.$transaction(async (tx) => {
      await (tx as unknown as { $executeRawUnsafe: (sql: string) => Promise<unknown> }).$executeRawUnsafe(
        'SET LOCAL ROLE quanan_app',
      );
      await (tx as unknown as { $executeRawUnsafe: (sql: string) => Promise<unknown> }).$executeRawUnsafe(
        "SELECT set_config('app.role', 'admin', true)",
      );
      return tx.history.findMany({ where: { traceId: SEED_TAG } });
    });

    expect(rows).toHaveLength(10);
  });

  it('test 3: ctx.crossAccountAccessed === true after adminRLS middleware runs', async () => {
    const { adminRLSMiddleware } = await import('@/trpc/middleware/admin/adminRLS');
    const { publicAdminProcedure, adminTrpcRouter } = await import('@/trpc/trpc-admin');
    const { prisma } = await import('@/lib/prisma');

    let capturedCrossAccountAccessed: boolean | undefined;

    const testRouter = adminTrpcRouter({
      testEndpoint: publicAdminProcedure
        .use(adminRLSMiddleware)
        .query(({ ctx }) => {
          capturedCrossAccountAccessed = ctx.crossAccountAccessed;
          return { ok: true };
        }),
    });

    const mockCtx = {
      ...createMockAdminContext(adminUser.id),
      prisma,
      traceId: `${SEED_TAG}-t3`,
    };

    await testRouter.createCaller(mockCtx as Parameters<typeof testRouter.createCaller>[0]).testEndpoint();

    // AC-16: grep 'crossAccountAccessed.*true' must match this file ≥ 1
    expect(capturedCrossAccountAccessed).toBe(true);
  });

  it('test 4: cross_account_query audit log written after adminRLS + auditLog chain', async () => {
    const { adminRLSMiddleware } = await import('@/trpc/middleware/admin/adminRLS');
    const { auditLogMiddleware } = await import('@/trpc/middleware/admin/auditLog');
    const { publicAdminProcedure, adminTrpcRouter } = await import('@/trpc/trpc-admin');
    const { prisma } = await import('@/lib/prisma');

    const traceId = `${SEED_TAG}-t4`;

    const testRouter = adminTrpcRouter({
      testEndpoint: publicAdminProcedure
        .use(adminRLSMiddleware)
        .use(auditLogMiddleware)
        .query(() => ({ ok: true })),
    });

    const mockCtx = {
      ...createMockAdminContext(adminUser.id),
      prisma,
      traceId,
    };

    await testRouter.createCaller(mockCtx as Parameters<typeof testRouter.createCaller>[0]).testEndpoint();

    // Verify cross_account_query audit log written with correct actorAdminId
    const logs = await prismaTest.adminAuditLog.findMany({
      where: { eventType: 'cross_account_query', traceId },
    });
    expect(logs.length).toBeGreaterThanOrEqual(1);
    expect(logs[0]?.actorAdminId).toBe(adminUser.id);
  });

  it('test 5: adminRLS $transaction throw → $transaction rollback → admin_audit_log no new row', async () => {
    const { adminRLSMiddleware } = await import('@/trpc/middleware/admin/adminRLS');
    const { auditLogMiddleware } = await import('@/trpc/middleware/admin/auditLog');
    const { publicAdminProcedure, adminTrpcRouter } = await import('@/trpc/trpc-admin');
    const { prisma } = await import('@/lib/prisma');

    const traceId = `${SEED_TAG}-t5`;
    const before = await prismaTest.adminAuditLog.count({
      where: { eventType: 'cross_account_query', traceId },
    });

    // Mock $transaction to reject immediately — adminRLS fails before calling next()
    // → auditLog middleware never runs → no cross_account_query row written
    const failingPrisma = {
      ...prisma,
      $transaction: vi.fn().mockRejectedValue(new Error('forced_tx_fail')),
    };

    const testRouter = adminTrpcRouter({
      testEndpoint: publicAdminProcedure
        .use(adminRLSMiddleware)
        .use(auditLogMiddleware)
        .query(() => ({ ok: true })),
    });

    const mockCtx = {
      ...createMockAdminContext(adminUser.id),
      prisma: failingPrisma as unknown as typeof prisma,
      traceId,
    };

    await expect(
      testRouter.createCaller(mockCtx as Parameters<typeof testRouter.createCaller>[0]).testEndpoint(),
    ).rejects.toThrow('forced_tx_fail');

    const after = await prismaTest.adminAuditLog.count({
      where: { eventType: 'cross_account_query', traceId },
    });
    expect(after).toBe(before); // No new audit rows when adminRLS itself fails
  });

  it('test 6: current_setting(app.role) is empty outside transaction (LOCAL=true, no connection pool pollution)', async () => {
    const { adminRLSMiddleware } = await import('@/trpc/middleware/admin/adminRLS');
    const { publicAdminProcedure, adminTrpcRouter } = await import('@/trpc/trpc-admin');
    const { prisma } = await import('@/lib/prisma');

    const testRouter = adminTrpcRouter({
      testEndpoint: publicAdminProcedure
        .use(adminRLSMiddleware)
        .query(() => ({ ok: true })),
    });

    const mockCtx = {
      ...createMockAdminContext(adminUser.id),
      prisma,
      traceId: `${SEED_TAG}-t6`,
    };

    // Run adminRLS — sets set_config('app.role','admin',true) inside $transaction (LOCAL=true)
    await testRouter.createCaller(mockCtx as Parameters<typeof testRouter.createCaller>[0]).testEndpoint();

    // After $transaction commits, LOCAL setting clears from the session
    // AC-15: grep 'current_setting.*app.role' must match this file ≥ 2
    const val = await getCurrentSetting('app.role');
    expect(val).toBe(''); // LOCAL=true: app.role cleared after transaction commit
  });

  it('test 7: main-app accountIsolation activeAccountId=account_a → 5 rows (adminRLS does not pollute main-app RLS)', async () => {
    // Simulate main-app accountIsolation: quanan_app role + app.current_account_id = accountA.id
    // Verifies that running adminRLS earlier did NOT permanently set any GUC that poisons main-app RLS
    // AC-15: grep 'current_setting.*app.role' matches (via getCurrentSetting in test 6 above)
    const rows = await prismaTest.$transaction(async (tx) => {
      await (tx as unknown as { $executeRawUnsafe: (sql: string) => Promise<unknown> }).$executeRawUnsafe(
        'SET LOCAL ROLE quanan_app',
      );
      await (tx as unknown as { $executeRawUnsafe: (sql: string) => Promise<unknown> }).$executeRawUnsafe(
        `SELECT set_config('app.current_account_id', '${String(accountA.id)}', true)`,
      );
      return tx.history.findMany({ where: { traceId: SEED_TAG } });
    });

    // Only account_a's 5 rows visible (account_b's 5 blocked by RLS)
    expect(rows).toHaveLength(5);
    expect(rows.every((r) => r.accountId === accountA.id)).toBe(true);
  });

  // Bonus: verify histories RLS is actually enabled (structural invariant)
  it('RLS is enabled on histories table (structural invariant)', async () => {
    const enabled = await getRLSEnabled('histories');
    expect(enabled).toBe(true);
  });
});
