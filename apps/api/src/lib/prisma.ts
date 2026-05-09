/**
 * Prisma client singleton
 * AC-3: instantiation < 100ms · AC-5: DB failure → graceful exit code 1
 * AC-6: import { PrismaClient } from '@prisma/client' — pnpm hoisted via .npmrc
 */

import { PrismaClient } from '@prisma/client';

import { logger } from '@/lib/logger';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  globalThis.__prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? [{ emit: 'event', level: 'query' }]
        : [],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

/**
 * Verify DB connectivity at startup.
 * Exits with code 1 on failure (AC-5).
 */
export async function checkDbConnection(): Promise<void> {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    logger.info('db.connected');
  } catch (err) {
    logger.error({ err }, 'DB connection failed');
    await prisma.$disconnect().catch(() => undefined);
    process.exit(1);
  }
}
