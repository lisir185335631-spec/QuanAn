/**
 * App router — root tRPC router merging all sub-routers
 * US-003 baseline: auth only · P1 will add remaining 12 routers
 * PRD-2 US-002: adds step, evolution, account routers (LS↔DB dual-write foundation)
 * PRD-2 US-003: adds ipAccounts, stepData routers (full CRUD + RLS procedures)
 * PRD-2 US-004: adds 5 Specialist mock routers (copywriting/videoAnalysis/videoProduction/boomGenerate/monetization)
 * PRD-2 US-005: adds 4 Specialist mock routers (privateDomain/diagnosis/deepLearning) + extends evolution
 * PRD-2 US-006: adds knowledge(7p) + trending(3p) + invite(1p) routers → 15 routers total
 */

import { router } from '@/trpc/trpc';
import { authRouter } from '@/trpc/routers/auth';
import { stepRouter } from '@/trpc/routers/step';
import { evolutionRouter } from '@/trpc/routers/evolution';
import { accountRouter } from '@/trpc/routers/account';
import { ipAccountsRouter } from '@/trpc/routers/ipAccounts';
import { stepDataRouter } from '@/trpc/routers/stepData';
import { copywritingRouter } from '@/trpc/routers/copywriting';
import { videoAnalysisRouter } from '@/trpc/routers/videoAnalysis';
import { videoProductionRouter } from '@/trpc/routers/videoProduction';
import { boomGenerateRouter } from '@/trpc/routers/boomGenerate';
import { monetizationRouter } from '@/trpc/routers/monetization';
import { privateDomainRouter } from '@/trpc/routers/privateDomain';
import { diagnosisRouter } from '@/trpc/routers/diagnosis';
import { deepLearningRouter } from '@/trpc/routers/deepLearning';
import { knowledgeRouter } from '@/trpc/routers/knowledge';
import { trendingRouter } from '@/trpc/routers/trending';
import { inviteRouter } from '@/trpc/routers/invite';

export const appRouter = router({
  auth: authRouter,
  step: stepRouter,
  evolution: evolutionRouter,
  account: accountRouter,
  ipAccounts: ipAccountsRouter,
  stepData: stepDataRouter,
  copywriting: copywritingRouter,
  videoAnalysis: videoAnalysisRouter,
  videoProduction: videoProductionRouter,
  boomGenerate: boomGenerateRouter,
  monetization: monetizationRouter,
  privateDomain: privateDomainRouter,
  diagnosis: diagnosisRouter,
  deepLearning: deepLearningRouter,
  knowledge: knowledgeRouter,
  trending: trendingRouter,
  invite: inviteRouter,
});

export type AppRouter = typeof appRouter;
