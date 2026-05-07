/**
 * App router — root tRPC router merging all sub-routers
 * US-003 baseline: auth only · P1 will add remaining 12 routers
 */

import { router } from '@/trpc/trpc';
import { authRouter } from '@/trpc/routers/auth';

export const appRouter = router({
  auth: authRouter,
});

export type AppRouter = typeof appRouter;
