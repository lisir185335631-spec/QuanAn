/**
 * App router — root tRPC router merging all sub-routers
 * US-003 baseline: auth only · P1 will add remaining 12 routers
 * PRD-2 US-002: adds step, evolution, account routers (LS↔DB dual-write foundation)
 * PRD-2 US-003: adds ipAccounts, stepData routers (full CRUD + RLS procedures)
 */

import { router } from '@/trpc/trpc';
import { authRouter } from '@/trpc/routers/auth';
import { stepRouter } from '@/trpc/routers/step';
import { evolutionRouter } from '@/trpc/routers/evolution';
import { accountRouter } from '@/trpc/routers/account';
import { ipAccountsRouter } from '@/trpc/routers/ipAccounts';
import { stepDataRouter } from '@/trpc/routers/stepData';

export const appRouter = router({
  auth: authRouter,
  step: stepRouter,
  evolution: evolutionRouter,
  account: accountRouter,
  ipAccounts: ipAccountsRouter,
  stepData: stepDataRouter,
});

export type AppRouter = typeof appRouter;
