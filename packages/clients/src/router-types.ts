/**
 * Shared AppRouter type for tRPC client packages — US-006
 * Lives here so apps/web can import it via 'import type' and keep @trpc/server
 * out of the browser bundle. Mirrors apps/api/src/trpc/routers/_app.ts.
 * PRD-3 US-001: removed step/account alias shadow routes (TD-012).
 * TD: replace with TypeScript project references in P1.
 */

import { initTRPC } from '@trpc/server';

export type AuthMeOutput =
  | { ok: false; error: 'unauthenticated' }
  | { ok: true; user: { id: number; email: string; name: string } };

export type ActiveAccountOutput = {
  id: number;
  name: string;
  platform: string;
  stage: string;
  industry: string;
  followersRange: string;
} | null;

export type EvolutionProfileOutput = {
  id: number;
  level: string;
  feedbackCountGood: number;
  feedbackCountBad: number;
  feedbackCountTotal: number;
  satisfactionRate: number | null;
  currentDirection: string;
  autoEvolutionEnabled: boolean;
  deepLearningCount: number;
  lastEvolvedAt: string | null;
  lastUpgradedAt: string | null;
  updatedAt: string;
} | null;

export type SaveStepDataInput = { stepKey: string; inputs: Record<string, unknown> };
export type SwitchActiveInput = { accountId: number };

export type IpAccountOutput = {
  id: number;
  name: string;
  industry: string;
  platform: string;
  stage: string;
  isActive: boolean;
  followersRange: string;
} | null;

export type StepDataOutput = {
  stepKey: string;
  inputs: Record<string, unknown>;
  result: Record<string, unknown> | null;
  isFallback: boolean;
  version: number;
  updatedAt: string;
} | null;

export type StepProgressOutput = {
  completed: number;
  total: number;
  completedSteps: string[];
};

export type IpAccountSwitchOutput = { ok: boolean; activeAccountId: number };
export type IpAccountListOutput = NonNullable<IpAccountOutput>[];
export type StepDataListOutput = NonNullable<StepDataOutput>[];

export type DiagnosisReportOutput = {
  id: number;
  answers: unknown;
  dimensions: unknown;
  overallScore: number;
  inferredStage: string;
  topPriority: string;
  recommendedSteps: unknown[];
  agentId: string;
  traceId: string | null;
  createdAt: string;
} | null;

export type EvolutionInsightItem = {
  id: number;
  triggerType: string;
  direction: string;
  content: string;
  levelBefore: string;
  levelAfter: string;
  createdAt: string;
};

export type KnowledgeRecommendationItem = {
  itemType: string;
  itemKey: string;
  title: string;
};

export type TrendingItem = {
  id: number;
  platform: string;
  title: string;
  industry: string | null;
  presentStyle: string | null;
  likeCount: number;
  shareCount: number;
  commentCount: number;
  crawledAt: Date;
};

export type FreeGenerateHistoryRow = {
  id: number;
  content: string;
  contentType: string | null;
  agentId: string;
  agentMode: string | null;
  scriptType: string | null;
  elements: string[];
  isFallback: boolean;
  tokensUsed: number | null;
  modelUsed: string | null;
  durationMs: number | null;
  traceId: string | null;
  createdAt: Date;
};

export type HistoryDetailOutput = FreeGenerateHistoryRow | null;

export type BoomGenerateHistoryRow = FreeGenerateHistoryRow;

const _t = initTRPC.create();

// Shadow router — never invoked; exists solely for type inference.
const _shadowRouter = _t.router({
  auth: _t.router({
    me: _t.procedure.query((): AuthMeOutput => {
      return { ok: false, error: 'unauthenticated' };
    }),
  }),
  diagnosis: _t.router({
    latest: _t.procedure.query((): DiagnosisReportOutput => null),
  }),
  evolution: _t.router({
    getProfile: _t.procedure.query((): EvolutionProfileOutput => null),
    history: _t.procedure
      .input((x: unknown) => x as { limit?: number; offset?: number } | undefined)
      .query((): EvolutionInsightItem[] => []),
  }),
  knowledge: _t.router({
    getRecommendations: _t.procedure
      .input((x: unknown) => x as { limit?: number } | undefined)
      .query((): KnowledgeRecommendationItem[] => []),
  }),
  trending: _t.router({
    fetch: _t.procedure
      .input((x: unknown) => x as { platform?: string; limit?: number } | undefined)
      .query((): TrendingItem[] => []),
  }),
  ipAccounts: _t.router({
    list: _t.procedure.query((): IpAccountListOutput => []),
    active: _t.procedure.query((): ActiveAccountOutput => null),
    create: _t.procedure
      .input((x: unknown) => x as { name: string; industry: string; platform: string; stage: string })
      .mutation((): NonNullable<IpAccountOutput> => ({
        id: 0,
        name: '',
        industry: '',
        platform: '',
        stage: '',
        isActive: true,
        followersRange: '0-1000',
      })),
    update: _t.procedure
      .input((x: unknown) => x as Partial<{ name: string; industry: string; platform: string; stage: string }>)
      .mutation((): NonNullable<IpAccountOutput> => ({
        id: 0,
        name: '',
        industry: '',
        platform: '',
        stage: '',
        isActive: true,
        followersRange: '0-1000',
      })),
    delete: _t.procedure
      .input((x: unknown) => x as { accountId: number })
      .mutation((): { ok: boolean } => ({ ok: true })),
    switchActive: _t.procedure
      .input((x: unknown) => x as SwitchActiveInput)
      .mutation((): IpAccountSwitchOutput => ({ ok: true, activeAccountId: 0 })),
  }),
  stepData: _t.router({
    get: _t.procedure
      .input((x: unknown) => x as { stepKey: string })
      .query((): StepDataOutput => null),
    getAll: _t.procedure.query((): NonNullable<StepDataOutput>[] => []),
    save: _t.procedure
      .input((x: unknown) => x as SaveStepDataInput)
      .mutation((): { ok: boolean; data: NonNullable<StepDataOutput> } => ({
        ok: true,
        data: { stepKey: '', inputs: {}, result: null, isFallback: false, version: 0, updatedAt: '' },
      })),
    progress: _t.procedure.query((): StepProgressOutput => ({
      completed: 0,
      total: 9,
      completedSteps: [],
    })),
  }),
  costLog: _t.router({
    logFeedback: _t.procedure
      .input(
        (x: unknown) =>
          x as { stepKey: string; agentId: string; type: 'good' | 'bad'; traceId?: string },
      )
      .mutation((): { ok: boolean } => ({ ok: true })),
  }),
  copywriting: _t.router({
    freeGenerate: _t.procedure
      .input(
        (x: unknown) =>
          x as { scriptType: string; elements: string[]; topic: string },
      )
      .mutation((): FreeGenerateHistoryRow => ({
        id: 0,
        content: '',
        contentType: 'markdown',
        agentId: 'CopywritingAgent',
        agentMode: 'free',
        scriptType: null,
        elements: [],
        isFallback: false,
        tokensUsed: null,
        modelUsed: null,
        durationMs: null,
        traceId: null,
        createdAt: new Date(),
      })),
  }),
  boomGenerate: _t.router({
    generate: _t.procedure
      .input(
        (x: unknown) =>
          x as { elements: string[]; industry?: string; theme?: string },
      )
      .mutation((): BoomGenerateHistoryRow => ({
        id: 0,
        content: '',
        contentType: 'markdown',
        agentId: 'CopywritingAgent',
        agentMode: 'boom',
        scriptType: null,
        elements: [],
        isFallback: false,
        tokensUsed: null,
        modelUsed: null,
        durationMs: null,
        traceId: null,
        createdAt: new Date(),
      })),
  }),
  history: _t.router({
    detail: _t.procedure
      .input((x: unknown) => x as { id: number })
      .query((): HistoryDetailOutput => null),
  }),
});

export type AppRouter = typeof _shadowRouter;
