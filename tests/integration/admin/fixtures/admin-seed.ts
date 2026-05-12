// PRD-10 US-006 · admin integration test seed helpers
// Seeds 2 accounts + N history-per-account + 1 admin user + 1 admin session
// All seeded rows tagged with a caller-supplied `tag` for deterministic cleanup

import { PrismaClient } from '@prisma/client';

const testDbUrl = process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL;
export const prismaTest = new PrismaClient({ datasources: { db: { url: testDbUrl } } });

/** Create N (user + ip_account) pairs; all ip_accounts tagged with `tag` for cleanup. */
export async function seedAccounts(n: number, tag: string) {
  const accounts: Array<{ id: number }> = [];
  for (let i = 0; i < n; i++) {
    const user = await prismaTest.user.create({
      data: {
        openId: `${tag}-u${i}`,
        name: `Seed User ${i}`,
        email: `${tag}-u${i}@seed.test`,
        loginMethod: 'mock',
        isActivated: true,
      },
    });
    const account = await prismaTest.ipAccount.create({
      data: {
        userId: user.id,
        name: `Seed Account ${i}`,
        industry: 'tech',
        platform: 'xiaohongshu',
        traceId: tag,
      },
    });
    accounts.push(account);
  }
  return accounts;
}

/** Create M history rows for a given accountId; rows tagged with `tag`. */
export async function seedHistoryPerAccount(accountId: number, m: number, tag: string) {
  for (let i = 0; i < m; i++) {
    await prismaTest.history.create({
      data: {
        accountId,
        agentId: 'seed-agent',
        sourceType: 'test',
        inputSummary: `seed-${i}`,
        content: `seed-content-${i}`,
        traceId: tag,
      },
    });
  }
}

/** Upsert an admin user with the given role. Returns the created/updated row. */
export async function seedAdminUser(role: string, isMock: boolean, tag: string) {
  return prismaTest.adminUser.upsert({
    where: { email: `${tag}-admin@seed.test` },
    create: { email: `${tag}-admin@seed.test`, role, isMock, isActive: true },
    update: { role, isMock, isActive: true },
  });
}

/** Create an admin session for the given adminUserId with a TTL (ms). */
export async function seedAdminSession(adminUserId: number, ttl: number) {
  return prismaTest.adminSession.create({
    data: {
      adminUserId,
      expiresAt: new Date(Date.now() + ttl),
      isActive: true,
    },
  });
}

/** Delete all seeded rows in FK-safe order. */
export async function cleanupSeed(tag: string) {
  await prismaTest.adminAuditLog
    .deleteMany({ where: { traceId: { startsWith: tag } } })
    .catch(() => undefined);
  await prismaTest.adminSession
    .deleteMany({ where: { adminUser: { email: `${tag}-admin@seed.test` } } })
    .catch(() => undefined);
  await prismaTest.adminUser
    .deleteMany({ where: { email: `${tag}-admin@seed.test` } })
    .catch(() => undefined);
  await prismaTest.history
    .deleteMany({ where: { traceId: tag } })
    .catch(() => undefined);
  await prismaTest.ipAccount
    .deleteMany({ where: { traceId: tag } })
    .catch(() => undefined);
  // Delete seed users by pattern-matching email suffix
  const seedEmails = [];
  for (let i = 0; i < 20; i++) {
    seedEmails.push(`${tag}-u${i}@seed.test`);
  }
  await prismaTest.user
    .deleteMany({ where: { email: { in: seedEmails } } })
    .catch(() => undefined);
}
