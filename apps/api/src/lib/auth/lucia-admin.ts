// PRD-10 US-002 · Lucia admin session manager
// sessionCookie name='admin_session_id' (LD-A1: separate from 'app_session')
// sessionExpiresIn: 12h absolute TTL (admin_sessions table)
// Redis idle timeout: 'admin:session:{id}' with 30min TTL

import { Lucia, TimeSpan } from 'lucia';

import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

import type { Adapter, DatabaseSession, DatabaseUser } from 'lucia';

const IDLE_PREFIX = 'admin:session:';
const IDLE_TTL_SEC = 30 * 60;

/** Admin-specific user attrs stored in admin_users. Not part of main-app Register augmentation. */
interface AdminDatabaseAttrs {
  email: string;
  role: string;
  allowedDomains: string[];
  isMock: boolean;
  isActive: boolean;
}

const adminPrismaAdapter: Adapter = {
  async getSessionAndUser(
    sessionId: string,
  ): Promise<[DatabaseSession | null, DatabaseUser | null]> {
    const row = await prisma.adminSession.findUnique({
      where: { id: sessionId },
      include: { adminUser: true },
    });
    if (!row || !row.isActive) return [null, null];
    const session: DatabaseSession = {
      id: row.id,
      userId: row.adminUserId,
      expiresAt: row.expiresAt,
      attributes: {},
    };
    // Admin attrs don't match the global Register.DatabaseUserAttributes (main-app attrs).
    // Double cast via `unknown` is intentional — luciaAdmin is a separate Lucia instance.
    const adminAttrs: AdminDatabaseAttrs = {
      email: row.adminUser.email,
      role: row.adminUser.role,
      allowedDomains: row.adminUser.allowedDomains,
      isMock: row.adminUser.isMock,
      isActive: row.adminUser.isActive,
    };
    const user: DatabaseUser = {
      id: row.adminUserId,
      attributes: adminAttrs as unknown as DatabaseUser['attributes'],
    };
    return [session, user];
  },

  async getUserSessions(userId: number): Promise<DatabaseSession[]> {
    const rows = await prisma.adminSession.findMany({
      where: { adminUserId: userId, isActive: true },
    });
    return rows.map((r) => ({
      id: r.id,
      userId: r.adminUserId,
      expiresAt: r.expiresAt,
      attributes: {},
    }));
  },

  async setSession(session: DatabaseSession): Promise<void> {
    await prisma.adminSession.create({
      data: {
        id: session.id,
        adminUserId: session.userId,
        expiresAt: session.expiresAt,
      },
    });
  },

  async updateSessionExpiration(sessionId: string, expiresAt: Date): Promise<void> {
    await prisma.adminSession.update({ where: { id: sessionId }, data: { expiresAt } });
  },

  async deleteSession(sessionId: string): Promise<void> {
    await prisma.adminSession
      .update({ where: { id: sessionId }, data: { isActive: false } })
      .catch(() => undefined);
  },

  async deleteUserSessions(userId: number): Promise<void> {
    await prisma.adminSession.updateMany({
      where: { adminUserId: userId },
      data: { isActive: false },
    });
  },

  async deleteExpiredSessions(): Promise<void> {
    await prisma.adminSession.updateMany({
      where: { expiresAt: { lt: new Date() } },
      data: { isActive: false },
    });
  },
};

const isProduction = process.env.NODE_ENV === 'production';

export const luciaAdmin = new Lucia(adminPrismaAdapter, {
  sessionExpiresIn: new TimeSpan(12, 'h'),
  sessionCookie: {
    name: 'admin_session_id',
    attributes: {
      secure: isProduction,
      sameSite: 'lax',
    },
  },
  getUserAttributes(attrs) {
    // Cast via unknown: luciaAdmin uses AdminDatabaseAttrs at runtime, not main-app Register.
    const a = attrs as unknown as AdminDatabaseAttrs;
    return { email: a.email, role: a.role, allowedDomains: a.allowedDomains, isMock: a.isMock, isActive: a.isActive };
  },
});

export interface AdminLuciaUser {
  id: number;
  email: string;
  role: string;
  allowedDomains: string[];
  isMock: boolean;
  isActive: boolean;
}

export interface AdminLuciaSession {
  id: string;
  expiresAt: Date;
  fresh: boolean;
}

/** Create Redis idle-timeout key with 30min TTL after a new session is created. */
export async function createAdminIdleKey(sessionId: string): Promise<void> {
  await redis.set(`${IDLE_PREFIX}${sessionId}`, '1', 'EX', IDLE_TTL_SEC);
}

/**
 * Touch idle key — refreshes TTL to 30min, returns true if still active.
 * Returns false when the idle key has expired (session idle >30min).
 */
export async function touchAdminIdleKey(sessionId: string): Promise<boolean> {
  const result = await redis.getex(`${IDLE_PREFIX}${sessionId}`, 'EX', IDLE_TTL_SEC);
  return result !== null;
}

/** Delete idle key on logout or forced invalidation. */
export async function deleteAdminIdleKey(sessionId: string): Promise<void> {
  await redis.del(`${IDLE_PREFIX}${sessionId}`);
}

/**
 * Validate admin session: absolute TTL via Lucia + idle TTL via Redis.
 * Returns null for expired, not-found, or idle-timed-out sessions.
 */
export async function validateAdminSession(sessionId: string): Promise<{
  session: AdminLuciaSession | null;
  user: AdminLuciaUser | null;
}> {
  const { session, user } = await luciaAdmin.validateSession(sessionId);
  if (!session || !user) return { session: null, user: null };

  const idleAlive = await touchAdminIdleKey(session.id);
  if (!idleAlive) {
    await luciaAdmin.invalidateSession(session.id);
    return { session: null, user: null };
  }

  const u = user as unknown as AdminDatabaseAttrs;
  const adminUser: AdminLuciaUser = {
    id: user.id,
    email: u.email,
    role: u.role,
    allowedDomains: u.allowedDomains,
    isMock: u.isMock,
    isActive: u.isActive,
  };
  return {
    session: { id: session.id, expiresAt: session.expiresAt, fresh: session.fresh },
    user: adminUser,
  };
}
