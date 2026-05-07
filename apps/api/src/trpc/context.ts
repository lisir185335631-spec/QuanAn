/**
 * tRPC context factory — US-003 (extended in US-006)
 * AC-7: prisma + req/res + traceId(='pending' until US-007 trace middleware lands)
 * US-006: adds `user` from lucia session cookie
 */

import type { PrismaClient } from '@prisma/client';
import type { Context as HonoCtx } from 'hono';
import type { User } from 'lucia';
import { prisma } from '@/lib/prisma';
import { lucia } from '@/lib/auth/lucia';

export interface TRPCContext {
  prisma: PrismaClient;
  traceId: string;
  req: Request;
  user: User | null;
  sessionId: string | null;
}

export async function createContext(c: HonoCtx): Promise<TRPCContext> {
  const cookieHeader = c.req.header('cookie') ?? '';
  const sessionId = lucia.readSessionCookie(cookieHeader);

  let user: User | null = null;
  let resolvedSessionId: string | null = null;

  if (sessionId) {
    const { session, user: sessionUser } = await lucia.validateSession(sessionId);
    if (session) {
      user = sessionUser;
      resolvedSessionId = session.id;
    }
  }

  return {
    prisma,
    traceId: 'pending',
    req: c.req.raw,
    user,
    sessionId: resolvedSessionId,
  };
}
