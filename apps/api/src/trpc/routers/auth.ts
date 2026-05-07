/**
 * auth router — US-006
 * auth.me: returns authenticated user from lucia session, or unauthenticated stub.
 */

import { router, publicProcedure } from '@/trpc/trpc';

export const authRouter = router({
  me: publicProcedure.query(({ ctx }) => {
    if (!ctx.user) {
      return { ok: false as const, error: 'unauthenticated' as const };
    }
    return {
      ok: true as const,
      user: {
        id: ctx.user.id,
        email: ctx.user.email,
        name: ctx.user.name,
      },
    };
  }),
});
