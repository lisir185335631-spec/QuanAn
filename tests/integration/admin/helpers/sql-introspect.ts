// PRD-10 US-006 · SQL introspection helpers for integration test assertions
// getCurrentSetting: reads a Postgres GUC (session-level, outside any transaction)
// getRLSEnabled: checks pg_tables.rowsecurity for a given table

import { PrismaClient } from '@prisma/client';

const testDbUrl = process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL;
const introspectPrisma = new PrismaClient({ datasources: { db: { url: testDbUrl } } });

/**
 * Read a Postgres session-level GUC using current_setting(name, missing_ok=true).
 * Returns '' if the setting has never been set (missing_ok suppresses error).
 * Must be called OUTSIDE any transaction to verify LOCAL=true cleared the value.
 */
export async function getCurrentSetting(name: string): Promise<string> {
  const rows = await introspectPrisma.$queryRawUnsafe<Array<{ val: string }>>(
    `SELECT current_setting($1, true) AS val`,
    name,
  );
  return rows[0]?.val ?? '';
}

/**
 * Check whether RLS is enabled on a table (pg_tables.rowsecurity).
 */
export async function getRLSEnabled(tableName: string): Promise<boolean> {
  const rows = await introspectPrisma.$queryRawUnsafe<Array<{ rowsecurity: boolean }>>(
    `SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = $1`,
    tableName,
  );
  return rows[0]?.rowsecurity ?? false;
}

export async function disconnectIntrospect() {
  await introspectPrisma.$disconnect();
}
