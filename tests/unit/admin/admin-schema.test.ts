/**
 * admin schema unit tests — PRD-10 US-001 AC-12
 * Verifies 6 admin models exist in prisma schema and RLS is DISABLED
 * Uses main dev DB (quanqn) — tables created by migration
 */

import { describe, it, expect, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL ?? 'postgresql://return@localhost:5432/quanqn' } },
});

const RUN_ID = Date.now();

afterAll(async () => {
  // Clean up test records created by this test run
  await prisma.adminUser.deleteMany({ where: { email: { contains: `schema-test-${RUN_ID}` } } });
  await prisma.adminAuditLog.deleteMany({ where: { traceId: `schema-test-${RUN_ID}` } });
  await prisma.userQuota.deleteMany({ where: { userId: -(RUN_ID % 10000) } });
  await prisma.trendingReviewQueue.deleteMany({ where: { sourceItemId: `schema-test-${RUN_ID}` } });
  await prisma.$disconnect();
});

describe('admin schema models exist and are writable', () => {
  it('admin_audit_log: can create record', async () => {
    const rec = await prisma.adminAuditLog.create({
      data: {
        actorAdminId: 1,
        actorRole: 'super_admin',
        eventCategory: 'auth',
        eventType: 'admin_login',
        payloadHash: 'aaaa' + RUN_ID,
        traceId: `schema-test-${RUN_ID}`,
        ip: '127.0.0.1',
        userAgent: 'test',
        sessionId: `sess-${RUN_ID}`,
      },
    });
    expect(rec.id).toBeGreaterThan(0);
    await prisma.adminAuditLog.delete({ where: { id: rec.id } });
  });

  it('approval_requests: can create record', async () => {
    const rec = await prisma.approvalRequest.create({
      data: {
        requesterAdminId: 1,
        requesterRole: 'admin',
        actionType: 'test_action',
        actionPayload: { test: true },
        riskLevel: 'low',
        requesterReason: 'schema test',
        status: 'pending',
        expiresAt: new Date(Date.now() + 3600000),
      },
    });
    expect(rec.id).toBeGreaterThan(0);
    await prisma.approvalRequest.delete({ where: { id: rec.id } });
  });

  it('admin_users: can create record', async () => {
    const rec = await prisma.adminUser.create({
      data: {
        email: `schema-test-${RUN_ID}@quanqn.test`,
        role: 'super_admin',
        isMock: true,
        isActive: true,
      },
    });
    expect(rec.id).toBeGreaterThan(0);
    expect(rec.email).toContain(`schema-test-${RUN_ID}`);
  });

  it('admin_sessions: can create record (linked to admin_users)', async () => {
    const user = await prisma.adminUser.findFirst({
      where: { email: { contains: `schema-test-${RUN_ID}` } },
    });
    expect(user).not.toBeNull();

    const rec = await prisma.adminSession.create({
      data: {
        adminUserId: user!.id,
        expiresAt: new Date(Date.now() + 12 * 3600 * 1000),
        isActive: true,
      },
    });
    expect(rec.id).toBeTruthy();
    await prisma.adminSession.delete({ where: { id: rec.id } });
  });

  it('user_quota: can create record', async () => {
    const userId = -(RUN_ID % 10000);
    const rec = await prisma.userQuota.create({
      data: {
        userId,
        plan: 'free',
        dailyQuota: 10,
        monthlyQuota: 100,
        dailyResetAt: new Date(),
        monthlyResetAt: new Date(),
      },
    });
    expect(rec.id).toBeGreaterThan(0);
  });

  it('trending_review_queue: can create record', async () => {
    const rec = await prisma.trendingReviewQueue.create({
      data: {
        sourcePlatform: 'test',
        sourceItemId: `schema-test-${RUN_ID}`,
        sourceUrl: 'https://test.local',
        rawContent: { test: true },
        autoScanResult: { score: 0 },
        autoVerdict: 'needs_review',
        status: 'pending',
      },
    });
    expect(rec.id).toBeGreaterThan(0);
  });
});

describe('admin tables RLS DISABLED verification', () => {
  const ADMIN_TABLES = [
    'admin_audit_log',
    'approval_requests',
    'admin_users',
    'admin_sessions',
    'user_quota',
    'trending_review_queue',
  ];

  for (const tbl of ADMIN_TABLES) {
    it(`${tbl}: relrowsecurity = false (RLS DISABLED)`, async () => {
      const rows = await prisma.$queryRawUnsafe<{ relrowsecurity: boolean }[]>(
        `SELECT relrowsecurity FROM pg_class WHERE relname = $1 AND relkind = 'r'`,
        tbl,
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]!.relrowsecurity).toBe(false);
    });
  }
});
