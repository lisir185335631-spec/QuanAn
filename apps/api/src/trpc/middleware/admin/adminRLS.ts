// PRD-10 US-003 · adminRLS — $transaction + set_config('app.role','admin',true)
// AC-14 (LD-A3): grep 'set_config.*app.role.*admin' MUST match this file
// Injects ctx.adminPrisma (tx-scoped client) and sets ctx.crossAccountAccessed=true
import { middleware } from '@/trpc/trpc-admin';

import type { PrismaClient } from '@prisma/client';

export const adminRLSMiddleware = middleware(async ({ ctx, next }) => {
  return ctx.prisma.$transaction(async (tx) => {
    // set_config(name, value, is_local=true) — transaction-scoped, clears on commit/rollback
    await (tx as unknown as { $executeRawUnsafe: (sql: string) => Promise<unknown> }).$executeRawUnsafe(
      "SELECT set_config('app.role', 'admin', true)",
    );
    return next({
      ctx: {
        ...ctx,
        adminPrisma: tx as unknown as PrismaClient,
        crossAccountAccessed: true,
      },
    });
  });
});
