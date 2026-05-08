/**
 * App router — root tRPC router merging all sub-routers
 * PRD-3 US-001: removes step/account alias routers (TD-012) → canonical ipAccounts/stepData only
 */

import { router } from '@/trpc/trpc';
import { authRouter } from '@/trpc/routers/auth';
import { evolutionRouter } from '@/trpc/routers/evolution';
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
  evolution: evolutionRouter,
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
