// PRD-10 US-002 · adminAuth — session validation via Lucia (context-admin.ts)
// Session is validated in createAdminContext; this gate enforces ctx carries a live session.
// US-003: import fixed to use admin tRPC middleware (type-correctness with AdminTRPCContext)
import { TRPCError } from '@trpc/server';

import { middleware } from '@/trpc/trpc-admin';

export const adminAuthMiddleware = middleware(async ({ ctx, next }) => {
  if (!ctx.activeAdminUser || !ctx.adminSession) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'unauthenticated' });
  }
  return next();
});
