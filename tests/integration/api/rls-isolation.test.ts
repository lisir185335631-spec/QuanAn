/**
 * Integration tests — RLS account isolation — PRD-2 US-001
 * AC-3: userA sees stepData from accountA · userB sees 0 rows
 * AC-4: no set_config (missing activeAccountId) → 0 rows (RLS default-deny)
 *
 * Requires: PostgreSQL running. Tables created via Prisma migrations.
 * Test DB: quanan_test (DATABASE_URL_TEST env or falls back to quanan_test local).
 *
 * RLS superuser note: the `return` Postgres role is a superuser (BYPASSRLS=true).
 * Superusers always bypass RLS even with FORCE ROW LEVEL SECURITY.
 * Solution: use `SET LOCAL ROLE quanan_app` inside each test transaction to test as a
 * non-superuser role. quanan_app must be created (see beforeAll) and granted table access.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const TEST_DB =
  process.env.DATABASE_URL_TEST ?? 'postgresql://return@localhost:5432/quanan_test';

const prisma = new PrismaClient({ datasources: { db: { url: TEST_DB } } });

const RUN_ID = `rls_${Date.now()}`;

let userAId: number;
let accountAId: number;
let userBId: number;
let accountBId: number;

beforeAll(async () => {
  // ── 1. Ensure quanan_app role exists (idempotent) ─────────────────────────
  await prisma.$executeRaw`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'quanan_app') THEN
        CREATE ROLE quanan_app;
      END IF;
    END $$
  `;
  await prisma.$executeRaw`GRANT SELECT, INSERT, UPDATE, DELETE ON step_data TO quanan_app`;
  await prisma.$executeRaw`GRANT quanan_app TO return`;

  // ── 2. Ensure step_data RLS policy exists (idempotent) ────────────────────
  await prisma.$executeRaw`ALTER TABLE step_data ENABLE ROW LEVEL SECURITY`;
  await prisma.$executeRaw`DROP POLICY IF EXISTS step_data_account_isolation ON step_data`;
  await prisma.$executeRaw`
    CREATE POLICY step_data_account_isolation ON step_data
    FOR ALL
    USING (account_id = NULLIF(current_setting('app.current_account_id', true), '')::int)
    WITH CHECK (account_id = NULLIF(current_setting('app.current_account_id', true), '')::int)
  `;

  // ── 3. Create test users and IP accounts ─────────────────────────────────
  const userA = await prisma.user.create({
    data: {
      openId: `${RUN_ID}_a`,
      name: 'User A',
      email: `${RUN_ID}_a@rls.test`,
      loginMethod: 'mock',
    },
  });
  userAId = userA.id;

  const accountA = await prisma.ipAccount.create({
    data: { userId: userAId, name: 'Account A', industry: 'tech', platform: 'wechat' },
  });
  accountAId = accountA.id;

  const userB = await prisma.user.create({
    data: {
      openId: `${RUN_ID}_b`,
      name: 'User B',
      email: `${RUN_ID}_b@rls.test`,
      loginMethod: 'mock',
    },
  });
  userBId = userB.id;

  const accountB = await prisma.ipAccount.create({
    data: { userId: userBId, name: 'Account B', industry: 'finance', platform: 'douyin' },
  });
  accountBId = accountB.id;

  // ── 4. Insert step_data for account A (as superuser, bypasses RLS) ────────
  await prisma.$executeRaw`
    INSERT INTO step_data (account_id, step_key, inputs, status, agent_id, created_at, updated_at)
    VALUES (${accountAId}, 'rls_test_step', '{}', 'pending', 'test', NOW(), NOW())
  `;
});

afterAll(async () => {
  // Superuser can delete without RLS
  await prisma.$executeRaw`DELETE FROM step_data WHERE account_id = ${accountAId} OR account_id = ${accountBId}`;
  await prisma.ipAccount.deleteMany({ where: { id: { in: [accountAId, accountBId] } } });
  await prisma.user.deleteMany({ where: { id: { in: [userAId, userBId] } } });

  // Restore step_data to no-policy state (manual_rls.sql will set it up in production)
  await prisma.$executeRaw`DROP POLICY IF EXISTS step_data_account_isolation ON step_data`;
  await prisma.$executeRaw`ALTER TABLE step_data DISABLE ROW LEVEL SECURITY`;

  await prisma.$disconnect();
});

describe('[Integration] RLS account isolation via set_config', () => {
  it('AC-3: user A (correct account) sees their own step_data rows', async () => {
    const rows = await prisma.$transaction(async (tx) => {
      // Switch to non-superuser role so RLS is enforced
      await tx.$executeRaw`SET LOCAL ROLE quanan_app`;
      await tx.$executeRaw`SELECT set_config('app.current_account_id', ${String(accountAId)}, true)`;
      await tx.$executeRaw`SELECT set_config('app.current_user_id', ${String(userAId)}, true)`;
      return tx.$queryRaw<Array<{ account_id: number }>>`SELECT account_id FROM step_data`;
    });
    expect(rows.length).toBeGreaterThanOrEqual(1);
    rows.forEach((r) => expect(r.account_id).toBe(accountAId));
  });

  it('AC-3: user B (different account) sees 0 rows from step_data', async () => {
    const rows = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SET LOCAL ROLE quanan_app`;
      await tx.$executeRaw`SELECT set_config('app.current_account_id', ${String(accountBId)}, true)`;
      await tx.$executeRaw`SELECT set_config('app.current_user_id', ${String(userBId)}, true)`;
      return tx.$queryRaw<Array<{ account_id: number }>>`SELECT account_id FROM step_data`;
    });
    // RLS filters: account_id = accountBId → 0 rows (account A's data is invisible)
    expect(rows.length).toBe(0);
  });

  it('AC-4: no set_config → 0 rows (RLS default-deny via NULL::int)', async () => {
    const rows = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SET LOCAL ROLE quanan_app`;
      // current_setting returns NULL when not set → NULL::int → account_id = NULL → false
      return tx.$queryRaw<Array<{ account_id: number }>>`SELECT account_id FROM step_data`;
    });
    expect(rows.length).toBe(0);
  });

  it('AC-7: set_config round-trip overhead < 50ms on localhost', async () => {
    const start = Date.now();
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SET LOCAL ROLE quanan_app`;
      await tx.$executeRaw`SELECT set_config('app.current_account_id', ${String(accountAId)}, true)`;
      await tx.$executeRaw`SELECT set_config('app.current_user_id', ${String(userAId)}, true)`;
    });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(50);
  });
});
