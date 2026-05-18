// PRD-10 US-002 · Admin tRPC context factory
// AC-7: reads admin_session_id cookie · validates via luciaAdmin + Redis idle check
// Injects ctx.adminSession + ctx.activeAdminUser
// US-003: adds adminPrisma / crossAccountAccessed / adminSessionMfaVerifiedAt fields

import { randomBytes } from 'node:crypto';

import type { AdminLuciaSession, AdminLuciaUser } from '@/lib/auth/lucia-admin';
import { luciaAdmin, validateAdminSession } from '@/lib/auth/lucia-admin';
import { prisma } from '@/lib/prisma';

import type { PrismaClient } from '@prisma/client';

export interface AdminTRPCContext {
  prisma: PrismaClient;
  /** Injected by adminRLS middleware — tx-scoped Prisma client with set_config('app.role','admin') */
  adminPrisma?: PrismaClient;
  /** Set to true by adminRLS middleware to flag cross-account access for audit logging */
  crossAccountAccessed?: boolean;
  /** mfaVerifiedAt from admin_sessions row — used by mfaCheck middleware */
  adminSessionMfaVerifiedAt?: Date | null;
  traceId: string;
  req: Request;
  resHeaders: Headers;
  adminSession: AdminLuciaSession | null;
  activeAdminUser: AdminLuciaUser | null;
}

export async function createAdminContext(opts: {
  req: Request;
  resHeaders: Headers;
}): Promise<AdminTRPCContext> {
  const { req, resHeaders } = opts;
  const cookieHeader = req.headers.get('cookie') ?? '';
  const sessionId = luciaAdmin.readSessionCookie(cookieHeader);

  let adminSession: AdminLuciaSession | null = null;
  let activeAdminUser: AdminLuciaUser | null = null;
  let adminSessionMfaVerifiedAt: Date | null = null;

  if (sessionId) {
    const result = await validateAdminSession(sessionId);
    adminSession = result.session;
    activeAdminUser = result.user;

    if (adminSession) {
      const dbSession = await prisma.adminSession
        .findUnique({ where: { id: adminSession.id }, select: { mfaVerifiedAt: true } })
        .catch(() => null);
      adminSessionMfaVerifiedAt = dbSession?.mfaVerifiedAt ?? null;
    }
  }

  const traceId =
    req.headers.get('x-trace-id') ??
    req.headers.get('X-Trace-Id') ??
    randomBytes(8).toString('hex');

  return {
    prisma,
    traceId,
    req,
    resHeaders,
    adminSession,
    activeAdminUser,
    adminSessionMfaVerifiedAt,
  };
}
