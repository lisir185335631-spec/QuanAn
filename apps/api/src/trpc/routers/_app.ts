/**
 * App router — root tRPC router merging all sub-routers
 * PRD-3 US-001: removes step/account alias routers (TD-012) → canonical ipAccounts/stepData only
 */

import { acquisitionVideoRouter } from '@/trpc/routers/app/acquisitionVideo';
import { aiVideoRouter } from '@/trpc/routers/app/aiVideo';
import { analysisRouter } from '@/trpc/routers/app/analysis';
import { authRouter } from '@/trpc/routers/app/auth';
import { boomGenerateRouter } from '@/trpc/routers/app/boomGenerate';
import { copywritingRouter } from '@/trpc/routers/app/copywriting';
import { costLogRouter } from '@/trpc/routers/app/costLog';
import { dailyTasksRouter } from '@/trpc/routers/app/dailyTasks';
import { deepLearningRouter } from '@/trpc/routers/app/deepLearning';
import { diagnosisRouter } from '@/trpc/routers/app/diagnosis';
import { evolutionRouter } from '@/trpc/routers/app/evolution';
import { historyRouter } from '@/trpc/routers/app/history';
import { inviteRouter } from '@/trpc/routers/app/invite';
import { ipAccountsRouter } from '@/trpc/routers/app/ipAccounts';
import { knowledgeRouter } from '@/trpc/routers/app/knowledge';
import { monetizationRouter } from '@/trpc/routers/app/monetization';
import { myTopicsRouter } from '@/trpc/routers/app/myTopics';
import { presentStylesRouter } from '@/trpc/routers/app/presentStyles';
import { privateDomainRouter } from '@/trpc/routers/app/privateDomain';
import { stepDataRouter } from '@/trpc/routers/app/stepData';
import { sttRouter } from '@/trpc/routers/app/stt';
import { trendingRouter } from '@/trpc/routers/app/trending';
import { ttsRouter } from '@/trpc/routers/app/tts';
import { videoAnalysisRouter } from '@/trpc/routers/app/videoAnalysis';
import { videoProductionRouter } from '@/trpc/routers/app/videoProduction';
import { voiceChatRouter } from '@/trpc/routers/app/voiceChat';
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
  myTopics: myTopicsRouter,
  presentStyles: presentStylesRouter,
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
