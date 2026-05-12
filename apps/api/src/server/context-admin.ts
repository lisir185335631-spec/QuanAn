// PRD-10 US-002 · Admin tRPC context factory
// AC-7: reads admin_session_id cookie · validates via luciaAdmin + Redis idle check
// Injects ctx.adminSession + ctx.activeAdminUser

import { randomBytes } from 'node:crypto';

import type { AdminLuciaSession, AdminLuciaUser } from '@/lib/auth/lucia-admin';
import { luciaAdmin, validateAdminSession } from '@/lib/auth/lucia-admin';
import { prisma } from '@/lib/prisma';

import type { PrismaClient } from '@prisma/client';

export interface AdminTRPCContext {
  prisma: PrismaClient;
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

  if (sessionId) {
    const result = await validateAdminSession(sessionId);
    adminSession = result.session;
    activeAdminUser = result.user;
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
  };
}
