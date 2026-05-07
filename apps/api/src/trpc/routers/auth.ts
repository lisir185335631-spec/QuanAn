/**
 * auth router — US-003
 * auth.me: stub unauthenticated response until US-006 Google OAuth lands
 */

import { router, publicProcedure } from '@/trpc/trpc';

export const authRouter = router({
  me: publicProcedure.query(() => ({
    ok: false as const,
    error: 'unauthenticated' as const,
  })),
});
