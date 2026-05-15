/**
 * tRPC context factory — US-003 (extended in US-006, US-007, US-001/PRD-2)
 * AC-7: prisma + req/res + traceId(=X-Trace-Id header or generated nanoid-16)
 * US-006: adds `user` from lucia session cookie
 * US-007: reads X-Trace-Id from request header (replaces 'pending' placeholder)
 * PRD-2 US-001: adds `activeAccountId` for RLS enforcement
 */

import { randomBytes } from 'node:crypto';

import { lucia } from '@/lib/auth/lucia';
import { prisma } from '@/lib/prisma';
import { isDevOAuthMock, getDevMockUserAttrs } from '@/middleware/auth';

import type { PrismaClient } from '@prisma/client';
import type { Context as HonoCtx } from 'hono';
import type { User } from 'lucia';

export interface TRPCContext {
  prisma: PrismaClient;
  traceId: string;
  req: Request;
  user: User | null;
  sessionId: string | null;
  /** Active IP account for the current request — used by RLS middleware (PRD-2 US-001) */
  activeAccountId: number | null;
}

export async function createContext(c: HonoCtx): Promise<TRPCContext> {
  const cookieHeader = c.req.header('cookie') ?? '';
  const sessionId = lucia.readSessionCookie(cookieHeader);

  let user: User | null = null;
  let resolvedSessionId: string | null = null;

  if (isDevOAuthMock()) {
    // When a session cookie is present, validate it first so integration tests that
    // explicitly log in get the expected session user rather than the global mock.
    // Fall back to the mock user only when no valid session exists (dev convenience).
    if (sessionId) {
      const { session, user: sessionUser } = await lucia.validateSession(sessionId);
      if (session) {
        user = sessionUser;
        resolvedSessionId = session.id;
      }
    }
    if (!user) {
      const devAttrs = await getDevMockUserAttrs(prisma);
      if (devAttrs) {
        user = devAttrs as unknown as User;
      }
    }
  } else if (sessionId) {
    const { session, user: sessionUser } = await lucia.validateSession(sessionId);
    if (session) {
      user = sessionUser;
      resolvedSessionId = session.id;
    }
  }

  // Reads X-Trace-Id from Hono request; tRPC traceMiddleware will re-read from ctx.req
  // and run traceStore.run() to propagate into pino mixin.
  const traceId =
    c.req.header('x-trace-id') ??
    c.req.header('X-Trace-Id') ??
    randomBytes(8).toString('hex');

  return {
    prisma,
    traceId,
    req: c.req.raw,
    user,
    sessionId: resolvedSessionId,
    activeAccountId: user?.activeAccountId ?? null,
  };
}
