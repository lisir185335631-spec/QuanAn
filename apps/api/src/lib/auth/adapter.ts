/**
 * Lucia v3 Prisma adapter — US-006
 * Implements the Adapter interface using @prisma/client Session model.
 */

import type { Adapter, DatabaseSession, DatabaseUser } from 'lucia';
import { prisma } from '@/lib/prisma';

export const prismaAdapter: Adapter = {
  async getSessionAndUser(
    sessionId: string,
  ): Promise<[DatabaseSession | null, DatabaseUser | null]> {
    const row = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });
    if (!row) return [null, null];
    const session: DatabaseSession = {
      id: row.id,
      userId: row.userId,
      expiresAt: row.expiresAt,
      attributes: {},
    };
    const user: DatabaseUser = {
      id: row.userId,
      attributes: {
        email: row.user.email,
        name: row.user.name,
        activeAccountId: row.user.activeAccountId,
      },
    };
    return [session, user];
  },

  async getUserSessions(userId: number): Promise<DatabaseSession[]> {
    const rows = await prisma.session.findMany({ where: { userId } });
    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      expiresAt: r.expiresAt,
      attributes: {},
    }));
  },

  async setSession(session: DatabaseSession): Promise<void> {
    await prisma.session.create({
      data: {
        id: session.id,
        userId: session.userId as number,
        expiresAt: session.expiresAt,
      },
    });
  },

  async updateSessionExpiration(sessionId: string, expiresAt: Date): Promise<void> {
    await prisma.session.update({ where: { id: sessionId }, data: { expiresAt } });
  },

  async deleteSession(sessionId: string): Promise<void> {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => undefined);
  },

  async deleteUserSessions(userId: number): Promise<void> {
    await prisma.session.deleteMany({ where: { userId: userId as number } });
  },

  async deleteExpiredSessions(): Promise<void> {
    await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  },
};
