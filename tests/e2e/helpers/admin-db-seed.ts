/**
 * tests/e2e/helpers/admin-db-seed.ts
 * AC-7(US-007): seedAdminUser via direct Prisma (test DB)
 * Used in e2e setup to ensure admin user exists before running browser tests
 */

import { PrismaClient } from '@prisma/client';

const DB_URL = process.env.DATABASE_URL ?? 'postgresql://return@localhost:5432/quanqn';

let prisma: PrismaClient | null = null;

function getClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({ datasources: { db: { url: DB_URL } } });
  }
  return prisma;
}

export interface SeedAdminUserOptions {
  email: string;
  role?: 'super_admin' | 'admin' | 'readonly_admin';
}

/**
 * Ensures an admin user with the given email exists in the database.
 * Uses upsert so it's safe to call multiple times.
 */
export async function seedAdminUser(opts: SeedAdminUserOptions): Promise<{ id: number; email: string; role: string }> {
  const { email, role = 'super_admin' } = opts;
  const db = getClient();

  const user = await db.adminUser.upsert({
    where: { email },
    create: { email, role, isMock: true, isActive: true },
    update: { role, isMock: true, isActive: true },
    select: { id: true, email: true, role: true },
  });

  return user;
}

/**
 * Clean up admin sessions and audit logs for the given email after tests.
 */
export async function cleanupAdminUser(email: string): Promise<void> {
  const db = getClient();
  try {
    const user = await db.adminUser.findUnique({ where: { email }, select: { id: true } });
    if (!user) return;
    await db.adminAuditLog.deleteMany({ where: { actorAdminId: user.id } }).catch(() => undefined);
    await db.adminSession.deleteMany({ where: { adminUserId: user.id } }).catch(() => undefined);
  } catch {
    // Best-effort cleanup — don't fail the test suite
  }
}

export async function disconnectDb(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}
