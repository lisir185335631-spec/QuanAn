/**
 * tRPC init — v11 · US-003
 * US-007: adds traceMiddleware (reads X-Trace-Id / generates nanoid-16) + AsyncLocalStorage
 * PRD-2 US-001: adds Meta type for isGlobal · exports protectedProcedure + globalProcedure
 */

import { initTRPC } from '@trpc/server';
import { randomBytes } from 'node:crypto';
import type { TRPCContext } from '@/trpc/context';
import { traceStore } from '@/lib/logger';

/** Procedure metadata — used by accountIsolationMiddleware to skip RLS on global procedures */
interface Meta {
  isGlobal?: boolean;
}

const t = initTRPC.context<TRPCContext>().meta<Meta>().create();

export const router = t.router;
export const middleware = t.middleware;

/** Generate a 16-char hex trace ID (equivalent to nanoid(16)) */
export function generateTraceId(): string {
  return randomBytes(8).toString('hex');
}

/**
 * tRPC trace middleware — AC-5 (US-007)
 * Reads X-Trace-Id from request header; generates 16-char ID if absent.
 * Writes to ctx.traceId and propagates via AsyncLocalStorage for pino auto-injection.
 */
export const traceMiddleware = t.middleware(async ({ ctx, next }) => {
  const headers = ctx.req.headers;
  const traceId =
    headers.get('x-trace-id') ?? headers.get('X-Trace-Id') ?? generateTraceId();
  return traceStore.run({ traceId }, () => next({ ctx: { ...ctx, traceId } }));
});

/** Public procedures: no auth required, carries trace middleware only */
export const publicProcedure = t.procedure.use(traceMiddleware);

// protectedProcedure and globalProcedure are built on top of publicProcedure in account-isolation.ts
// to avoid circular imports. Consumers import them from @/trpc/middleware/account-isolation.
