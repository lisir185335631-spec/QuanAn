/**
 * Account isolation middleware — PRD-2 US-001
 * Enforces RLS by setting app.current_account_id + app.current_user_id via set_config()
 * within a transaction-scoped Postgres parameter (equivalent to SET LOCAL).
 *
 * AC-2: every protected request runs set_config before resolver queries
 * AC-4: missing activeAccountId → FORBIDDEN + logs 'no_active_account'
 * AC-5: procedures with meta.isGlobal=true skip RLS (User/InviteCode/TrendingItem)
 * AC-6: sole location of prisma.$executeRaw in apps/api/src (LD-009 R-009)
 */

import { TRPCError } from '@trpc/server';

import { logger } from '@/lib/logger';
import { middleware, publicProcedure } from '@/trpc/trpc';

import type { PrismaClient } from '@prisma/client';

export const accountIsolationMiddleware = middleware(async ({ ctx, meta, next, type }) => {
  // AC-5: global procedures bypass RLS
  if (meta?.isGlobal) {
    return next();
  }

  const { activeAccountId, user } = ctx;

  // AC-4: no active account → FORBIDDEN
  if (activeAccountId === null || activeAccountId === undefined) {
    logger.warn({ traceId: ctx.traceId }, 'no_active_account');
    throw new TRPCError({ code: 'FORBIDDEN', message: 'no_active_account' });
  }

  // Subscriptions: $transaction commits as soon as the generator is returned (before it yields),
  // so subsequent DB writes inside the generator fail with "Transaction already closed".
  // Use connection-level SET (is_local=false) instead — safe because each SSE request is a
  // dedicated HTTP connection that is closed when the subscription ends.
  if (type === 'subscription') {
    await ctx.prisma.$executeRaw`SET ROLE quanan_app`;
    await ctx.prisma.$executeRaw`SELECT set_config('app.current_account_id', ${String(activeAccountId)}, false)`;
    if (user?.id !== null && user?.id !== undefined) {
      await ctx.prisma.$executeRaw`SELECT set_config('app.current_user_id', ${String(user.id)}, false)`;
    }
    return next();
  }

  // set_config(name, value, is_local=true) is transaction-scoped (equivalent to SET LOCAL).
  // Wrapping in $transaction ensures is_local applies correctly — parameters are cleared on commit.
  // SET LOCAL ROLE quanan_app ensures RLS policies apply even when the connection owner is a superuser.
  return ctx.prisma.$transaction(async (tx) => {
    // Switch to non-superuser role so RLS policies are enforced (superusers bypass RLS by default)
    await tx.$executeRaw`SET LOCAL ROLE quanan_app`;
    await tx.$executeRaw`SELECT set_config('app.current_account_id', ${String(activeAccountId)}, true)`;
    if (user?.id !== null && user?.id !== undefined) {
      await tx.$executeRaw`SELECT set_config('app.current_user_id', ${String(user.id)}, true)`;
    }
    // Pass the transaction client as prisma so resolver queries are inside the same transaction
    return next({ ctx: { ...ctx, prisma: tx as unknown as PrismaClient } });
  });
});

/**
 * Protected procedure: requires authenticated user with an active IP account.
 * RLS is enforced via set_config in a transaction scope.
 */
export const protectedProcedure = publicProcedure.use(accountIsolationMiddleware);

/**
 * Global procedure: skips RLS enforcement.
 * Use for procedures that access global tables (User, InviteCode, TrendingItem).
 */
export const globalProcedure = publicProcedure.meta({ isGlobal: true });
