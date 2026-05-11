/**
 * App router — root tRPC router merging all sub-routers
 * PRD-3 US-001: removes step/account alias routers (TD-012) → canonical ipAccounts/stepData only
 */

import { acquisitionVideoRouter } from '@/trpc/routers/acquisitionVideo';
import { aiVideoRouter } from '@/trpc/routers/aiVideo';
import { analysisRouter } from '@/trpc/routers/analysis';
import { authRouter } from '@/trpc/routers/auth';
import { boomGenerateRouter } from '@/trpc/routers/boomGenerate';
import { copywritingRouter } from '@/trpc/routers/copywriting';
import { costLogRouter } from '@/trpc/routers/costLog';
import { dailyTasksRouter } from '@/trpc/routers/dailyTasks';
import { deepLearningRouter } from '@/trpc/routers/deepLearning';
import { diagnosisRouter } from '@/trpc/routers/diagnosis';
import { evolutionRouter } from '@/trpc/routers/evolution';
import { historyRouter } from '@/trpc/routers/history';
import { inviteRouter } from '@/trpc/routers/invite';
import { ipAccountsRouter } from '@/trpc/routers/ipAccounts';
import { knowledgeRouter } from '@/trpc/routers/knowledge';
import { monetizationRouter } from '@/trpc/routers/monetization';
import { privateDomainRouter } from '@/trpc/routers/privateDomain';
import { stepDataRouter } from '@/trpc/routers/stepData';
import { sttRouter } from '@/trpc/routers/stt';
import { ttsRouter } from '@/trpc/routers/tts';
import { trendingRouter } from '@/trpc/routers/trending';
import { videoAnalysisRouter } from '@/trpc/routers/videoAnalysis';
import { videoProductionRouter } from '@/trpc/routers/videoProduction';
import { voiceChatRouter } from '@/trpc/routers/voiceChat';
import { router } from '@/trpc/trpc';

export const appRouter = router({
  auth: authRouter,
  acquisitionVideo: acquisitionVideoRouter,
  aiVideo: aiVideoRouter,
  dailyTasks: dailyTasksRouter,
  evolution: evolutionRouter,
  ipAccounts: ipAccountsRouter,
  stepData: stepDataRouter,
  stt: sttRouter,
  tts: ttsRouter,
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
  costLog: costLogRouter,
  analysis: analysisRouter,
  history: historyRouter,
  voiceChat: voiceChatRouter,
});

export type AppRouter = typeof appRouter;
