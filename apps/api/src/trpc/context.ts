/**
 * tRPC context factory — US-003
 * AC-7: prisma + req/res + traceId(='pending' until US-007 trace middleware lands)
 */

import type { PrismaClient } from '@prisma/client';
import type { Context as HonoCtx } from 'hono';
import { prisma } from '@/lib/prisma';

export interface TRPCContext {
  prisma: PrismaClient;
  // US-007 will inject real trace_id via middleware; stub here keeps contract stable
  traceId: string;
  req: Request;
}

export function createContext(c: HonoCtx): TRPCContext {
  return {
    prisma,
    traceId: 'pending', // replaced by US-007 pino trace middleware
    req: c.req.raw,
  };
}
