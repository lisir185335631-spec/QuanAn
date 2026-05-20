/**
 * tests/e2e/admin/_admin-seed.ts
 * PRD-26 US-003 · Shared admin seed helper for e2e tests.
 * Upserts admin_user + cleans stale sessions/audit logs for a clean test run.
 */

import { PrismaClient } from '@prisma/client';

export interface AdminSeedOptions {
  email: string;
  role: string;
  allowedDomains?: string[];
  isMock?: boolean;
  isActive?: boolean;
}

export interface SeededAdmin {
  id: number;
  email: string;
  role: string;
  allowedDomains: string[];
}

const DB_URL = process.env.DATABASE_URL ?? 'postgresql://return@localhost:5432/quanan';

export async function seedAdminUser(
  prisma: PrismaClient,
  opts: AdminSeedOptions,
): Promise<SeededAdmin> {
  const { email, role, allowedDomains = [], isMock = true, isActive = true } = opts;

  const user = await prisma.adminUser.upsert({
    where: { email },
    create: { email, role, allowedDomains, isMock, isActive },
    update: { role, allowedDomains, isMock, isActive },
  });

  // Clean stale sessions and audit logs from previous runs for a reproducible test
  await prisma.adminAuditLog.deleteMany({ where: { actorAdminId: user.id } }).catch(() => undefined);
  await prisma.adminSession.deleteMany({ where: { adminUserId: user.id } }).catch(() => undefined);

  return { id: user.id, email: user.email, role: user.role, allowedDomains: user.allowedDomains };
}

export function createPrismaClient(): PrismaClient {
  return new PrismaClient({ datasources: { db: { url: DB_URL } } });
}
