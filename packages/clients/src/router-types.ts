/**
 * Shared AppRouter type for tRPC client packages — US-006
 * Lives here so apps/web can import it via 'import type' and keep @trpc/server
 * out of the browser bundle. Mirrors apps/api/src/trpc/routers/_app.ts.
 * PRD-3 US-001: removed step/account alias shadow routes (TD-012).
 * PRD-8 US-012: added stt / tts / voiceChat shadow types.
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
  latestInsight?: unknown | null;
  lastEvolvedAt: string | null;
  lastUpgradedAt: string | null;
  updatedAt: string;
} | null;

export type FeedbackTrendItem = {
  date: string;
  total: number;
  good: number;
  satisfactionRate: number;
};

export type ModuleRankingItem = {
  agentId: string;
  goodCount: number;
  badCount: number;
  totalCalls: number;
  satisfactionRate: number;
};

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
  personalInfo?: string | null;
  ipPositioning?: string | null;
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

// US-007 AC-5/AC-6: smartRecommend output
export type SmartRecommendOutput = {
  platform: string;
  followersRange: string;
  ipPositioning: string;
  rationale: string;
  isFallback: boolean;
};

export type PrivateDomainGenerateOutput = {
  id: number;
  content: string;
  agentId: string;
  agentMode: string | null;
  traceId: string | null;
  isFallback: boolean;
  tokensUsed: number | null;
  modelUsed: string | null;
  durationMs: number | null;
  createdAt: Date;
};

export type MonetizationGenerateOutput = {
  id: number;
  content: string;
  agentId: string;
  agentMode: string | null;
  traceId: string | null;
  isFallback: boolean;
  tokensUsed: number | null;
  modelUsed: string | null;
  durationMs: number | null;
  createdAt: Date;
};

export type PresentationRecommendOutput = {
  id: number;
  content: string;
  agentId: string;
  agentMode: string | null;
  traceId: string | null;
  isFallback: boolean;
  tokensUsed: number | null;
  modelUsed: string | null;
  durationMs: number | null;
  createdAt: Date;
};

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
  isFallback: boolean;
  modelUsed: string | null;
  tokensUsed: number | null;
  durationMs: number | null;
  createdAt: string;
} | null;

export type DiagnosisGenerateOutput = NonNullable<DiagnosisReportOutput>;

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

/** PRD-9 US-004: public knowledge chunk shape (mirrors KnowledgeChunkContent from @quanan/schemas) */
export type KnowledgeChunkContent = {
  id: number;
  type: 'case' | 'formula' | 'element';
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  tokens: number;
  similarity?: number;
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

export type TrendingListItem = TrendingItem & {
  sourceUrl: string | null;
  collectCount: number;
  isFavorited: boolean;
  rank: number;
};

export type TrendingDetailItem = TrendingItem & {
  sourceUrl: string | null;
  contentText: string | null;
  authorName: string | null;
};

export type TrendingKpiStats = {
  total: number;
  weekNew: number;
  myFavorites: number;
  lastUpdatedAt: Date | null;
};

export type MyTopicSource = 'step5' | 'trending' | 'manual';

export type MyTopicItem = {
  id: string;
  title: string;
  source: MyTopicSource;
  industry: string | null;
  platform: string | null;
  createdAt: Date | string;
  topicId?: number;
  trendingItemId?: number;
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

// US-013: storyboard scene item returned by history.detail
export type HistoryDetailScene = {
  index: number;
  description: string;
  imagePromptEn: string;
  duration: string;
  status: 'pending' | 'completed' | 'failed';
  sceneImageUrl: string | null;
};

export type HistoryDetailOutput = (HistoryListRow & { scenes?: HistoryDetailScene[] }) | null;

export type HistoryListRow = {
  id: number;
  agentId: string;
  agentMode: string | null;
  sourceType: string;
  inputSummary: string;
  content: string;
  contentType: string;
  scriptType: string | null;
  elements: string[];
  isFallback: boolean;
  traceId: string | null;
  createdAt: Date | string;
};

export type HistoryListOutput = HistoryListRow[];

export type BoomGenerateHistoryRow = FreeGenerateHistoryRow;

export type AnalysisHistoryRow = FreeGenerateHistoryRow;

export type VideoAnalysisHistoryRow = FreeGenerateHistoryRow;

export type VideoProductionHistoryRow = FreeGenerateHistoryRow;

export type AcquisitionVideoHistoryRow = FreeGenerateHistoryRow;

export type DailyUsageOutput = { count: number; limit: number };

// PRD-8 US-008: daily tasks
export type DailyTaskItem = {
  id: string;
  title: string;
  description: string;
  type: string;
  ctaUrl: string;
  ctaText: string;
  expectedOutcome: string;
  estimatedMinutes: number;
  difficulty: 'easy' | 'medium' | 'hard';
  completed: boolean;
};

export type DailyTaskRow = {
  id: number;
  accountId: number;
  taskDate: Date | string;
  tasks: DailyTaskItem[];
  completedCount: number;
  totalCount: number;
  agentId: string;
  modelUsed: string | null;
  isFallback: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
} | null;

export type DailyTaskHistoryRow = NonNullable<DailyTaskRow>;
export type DailyTaskListOutput = DailyTaskHistoryRow[];

// ── Voice Chat types (PRD-8 US-012) ───────────────────────────────────────────

export type VoiceChatStreamChunk =
  | { type: 'meta'; meta: { model: string } }
  | { type: 'delta'; delta: string }
  | { type: 'tool_call'; toolName: string; args: Record<string, unknown> }
  | { type: 'tool_result'; toolName: string; result: string }
  | { type: 'done'; sessionId: string; modelUsed: string; turns: number; tokensUsed: { prompt: number; completion: number; total: number } }
  | { type: 'error'; error: string };

export type SttTranscribeOutput = {
  transcript: string;
  durationSec: number | null;
  costUsd: number;
};

export type TtsSynthesizeOutput = {
  publicUrl: string;
  sizeBytes: number;
  costUsd: number;
};

export type GenerateStoryboardOutput = {
  historyId: number;
  jobIds: string[];
  scenesPlaceholder: Array<{
    index: number;
    description: string;
    imagePromptEn: string;
    sceneImageUrl: null;
    status: 'pending';
  }>;
};

export type JobStatusOutput = {
  total: number;
  completed: number;
  pending: number;
  failed: number;
  scenes: Array<{
    index: number;
    status: 'pending' | 'completed' | 'failed';
    sceneImageUrl?: string;
    error?: string;
  }>;
};

export type DeepLearningQueueItem = {
  id: number;
  sample: string;
  sourcePlatform: string;
  coreFormula: string;
  status: string;
  createdAt: Date;
};

export type DeepLearningParseAnalysis = {
  coreFormula: string;
  hookType: string;
  structurePattern: string;
  emotionalArc: string;
  keywords: string[];
};

export type DeepLearningParseResult = {
  queueId: number;
  analysis: DeepLearningParseAnalysis;
};

export type DeepLearnDimensions = {
  tone: string;
  structure: string;
  hook: string;
  transition: string;
  closing: string;
};

export type DeepLearnResult = {
  summary: string;
  dimensions: DeepLearnDimensions;
  isFallback: boolean;
  tokensUsed: number;
  modelUsed: string;
  durationMs: number;
};

export type DeepLearnLearnOutput = { jobId: string; status: 'queued' };

export type DeepLearnStatusOutput = {
  status: 'queued' | 'processing' | 'completed' | 'failed';
  result: DeepLearnResult | null;
};

const _t = initTRPC.create();

// Shadow router — never invoked; exists solely for type inference.
const _shadowRouter = _t.router({
  auth: _t.router({
    me: _t.procedure.query((): AuthMeOutput => {
      return { ok: false, error: 'unauthenticated' };
    }),
  }),
  diagnosis: _t.router({
    generate: _t.procedure
      .input(
        (x: unknown) =>
          x as {
            answers: Array<{ dimension: string; score: number; comment?: string }>;
            inferredStage?: string;
          },
      )
      .mutation((): DiagnosisGenerateOutput => ({
        id: 0,
        answers: [],
        dimensions: {},
        overallScore: 0,
        inferredStage: 'starter',
        topPriority: '',
        recommendedSteps: [],
        agentId: 'DiagnosisAgent',
        traceId: null,
        isFallback: false,
        modelUsed: null,
        tokensUsed: null,
        durationMs: null,
        createdAt: new Date().toISOString(),
      })),
    latest: _t.procedure.query((): DiagnosisReportOutput => null),
  }),
  evolution: _t.router({
    getProfile: _t.procedure.query((): EvolutionProfileOutput => null),
    evolve: _t.procedure
      .input((x: unknown) => x as { rating: 'good' | 'bad'; agentId: string; rateableType?: string; rateableId: number; historyId?: number; comment?: string })
      .mutation((): { ok: boolean; feedbackId: number } => ({ ok: true, feedbackId: 0 })),
    updateConfig: _t.procedure
      .input((x: unknown) => x as { autoEvolutionEnabled?: boolean; currentDirection?: string })
      .mutation((): { ok: boolean; config: { autoEvolutionEnabled: boolean; currentDirection: string; level: string } } => ({ ok: true, config: { autoEvolutionEnabled: false, currentDirection: '综合', level: 'L1' } })),
    history: _t.procedure
      .input((x: unknown) => x as { limit?: number; offset?: number } | undefined)
      .query((): EvolutionInsightItem[] => []),
    getInsightHistory: _t.procedure.query((): EvolutionInsightItem[] => []),
    getFeedbackTrend: _t.procedure
      .input((x: unknown) => x as { days?: number } | undefined)
      .query((): FeedbackTrendItem[] => []),
    getModuleRanking: _t.procedure
      .input((x: unknown) => x as { limit?: number } | undefined)
      .query((): { ranking: ModuleRankingItem[] } => ({ ranking: [] })),
  }),
  knowledge: _t.router({
    getRecommendations: _t.procedure
      .input((x: unknown) => x as { limit?: number } | undefined)
      .query((): KnowledgeRecommendationItem[] => []),
    list: _t.procedure
      .input((x: unknown) => x as { type?: 'case' | 'formula' | 'element'; limit?: number; offset?: number } | undefined)
      .query((): KnowledgeChunkContent[] => []),
    search: _t.procedure
      .input((x: unknown) => x as { query: string; topK?: number; type?: 'case' | 'formula' | 'element' })
      .mutation((): KnowledgeChunkContent[] => []),
    getById: _t.procedure
      .input((x: unknown) => x as { id: number })
      .query((): KnowledgeChunkContent | null => null),
  }),
  trending: _t.router({
    fetch: _t.procedure
      .input((x: unknown) => x as { platform?: string; limit?: number } | undefined)
      .query((): TrendingItem[] => []),
    list: _t.procedure
      .input((x: unknown) => x as { platforms?: string[]; industry?: string; timeRange?: string; sort?: string; search?: string; page?: number; pageSize?: number } | undefined)
      .query((): { items: TrendingListItem[]; total: number; page: number; pageSize: number; totalPages: number } => ({ items: [], total: 0, page: 1, pageSize: 20, totalPages: 1 })),
    listWithFavorites: _t.procedure
      .input((x: unknown) => x as { platforms?: string[]; industry?: string; timeRange?: string; sort?: string; search?: string; page?: number; pageSize?: number } | undefined)
      .query((): { items: TrendingListItem[]; total: number; page: number; pageSize: number; totalPages: number } => ({ items: [], total: 0, page: 1, pageSize: 20, totalPages: 1 })),
    favorite: _t.procedure
      .input((x: unknown) => x as { trendingItemId: number; action: 'add' | 'remove' })
      .mutation((): { favorited: boolean } => ({ favorited: false })),
    detail: _t.procedure
      .input((x: unknown) => x as { id: number })
      .query((): TrendingDetailItem | null => null),
    kpiStats: _t.procedure
      .query((): TrendingKpiStats => ({ total: 0, weekNew: 0, myFavorites: 0, lastUpdatedAt: null })),
  }),
  ipAccounts: _t.router({
    list: _t.procedure.query((): IpAccountListOutput => []),
    active: _t.procedure.query((): ActiveAccountOutput => null),
    create: _t.procedure
      .input((x: unknown) => x as { name: string; industry: string; platform: string; stage?: string; personalInfo?: string; followersRange?: string; ipPositioning?: string })
      .mutation((): NonNullable<IpAccountOutput> => ({
        id: 0,
        name: '',
        industry: '',
        platform: '',
        stage: 'starter',
        isActive: true,
        followersRange: '0-1000',
        personalInfo: null,
        ipPositioning: null,
      })),
    update: _t.procedure
      .input((x: unknown) => x as Partial<{ name: string; industry: string; platform: string; stage: string; personalInfo?: string }>)
      .mutation((): NonNullable<IpAccountOutput> => ({
        id: 0,
        name: '',
        industry: '',
        platform: '',
        stage: 'starter',
        isActive: true,
        followersRange: '0-1000',
        personalInfo: null,
        ipPositioning: null,
      })),
    delete: _t.procedure
      .input((x: unknown) => x as { accountId: number })
      .mutation((): { ok: boolean } => ({ ok: true })),
    switchActive: _t.procedure
      .input((x: unknown) => x as SwitchActiveInput)
      .mutation((): IpAccountSwitchOutput => ({ ok: true, activeAccountId: 0 })),
    // US-007 AC-5: smartRecommend — protectedProcedure (requires auth · not public)
    smartRecommend: _t.procedure
      .input((x: unknown) => x as { industry: string })
      .mutation((): SmartRecommendOutput => ({
        platform: 'douyin',
        followersRange: '0-1k',
        ipPositioning: '',
        rationale: '',
        isFallback: false,
      })),
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
    saveStream: _t.procedure
      .input(
        (x: unknown) =>
          x as
            | { stepKey: 'step5'; category: 'traffic' | 'monetize' | 'persona' | 'cognition' | 'case'; inputs: Record<string, unknown> }
            | { stepKey: 'step7'; inputs: Record<string, unknown> },
      )
      // eslint-disable-next-line require-yield
      .subscription(async function* () {
        yield {} as
          | { type: 'started'; traceId: string }
          | { type: 'done'; result: Record<string, unknown> }
          | { type: 'error'; message: string };
      }),
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
    acquisitionGenerate: _t.procedure
      .input(
        (x: unknown) =>
          x as { scriptType: string; elements: string[]; conversionGoal: string; topic: string },
      )
      .mutation((): FreeGenerateHistoryRow => ({
        id: 0,
        content: '',
        contentType: 'markdown',
        agentId: 'CopywritingAgent',
        agentMode: 'acquisition',
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
    list: _t.procedure
      .input(
        (x: unknown) =>
          x as {
            agentId?: string;
            agentMode?: string;
            sourceType?: string;
            tools?: string[];
            dateRange?: 'last_7d' | 'last_30d' | 'all' | 'today' | 'week' | 'month' | 'custom';
            dateFrom?: string;
            dateTo?: string;
            limit?: number;
            offset?: number;
          },
      )
      .query((): HistoryListOutput => []),
    detail: _t.procedure
      .input((x: unknown) => x as { id: number })
      .query((): HistoryDetailOutput => null), // US-013: may include scenes[] for storyboard rows
    delete: _t.procedure
      .input((x: unknown) => x as { id: number })
      .mutation((): { ok: true } => ({ ok: true })),
    stats: _t.procedure
      .input(
        (x: unknown) =>
          x as {
            dateRange?: 'today' | 'week' | 'month' | 'all' | 'custom';
            tools?: string[];
            dateFrom?: string;
            dateTo?: string;
          },
      )
      .query(
        (): {
          totalCalls: number;
          failureRate: number;
          avgDurationMs: number;
          topTools: Array<{ agentId: string; count: number }>;
          dailyTrend: Array<{ date: string; count: number }>;
          durationHistogram: Array<{ label: string; count: number }>;
          modelDistribution: Array<{ model: string; count: number }>;
        } => ({
          totalCalls: 0,
          failureRate: 0,
          avgDurationMs: 0,
          topTools: [],
          dailyTrend: [],
          durationHistogram: [],
          modelDistribution: [],
        }),
      ),
  }),
  analysis: _t.router({
    analyze: _t.procedure
      .input((x: unknown) => x as { copy: string })
      .mutation((): AnalysisHistoryRow => ({
        id: 0,
        content: '',
        contentType: 'json',
        agentId: 'AnalysisAgent',
        agentMode: 'structural',
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
  videoProduction: _t.router({
    generate: _t.procedure
      .input(
        (x: unknown) =>
          x as {
            sourceCopy: string;
            videoType?: 'short_form' | 'long_form';
            duration?: '15s' | '30s' | '60s' | '180s';
            additionalContext?: string;
          },
      )
      .mutation((): VideoProductionHistoryRow => ({
        id: 0,
        content: '',
        contentType: 'json',
        agentId: 'VideoAgent',
        agentMode: 'production',
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
  acquisitionVideo: _t.router({
    generate: _t.procedure
      .input(
        (x: unknown) =>
          x as {
            sourceCopy: string;
            conversionGoal: string;
            platform?: string;
            duration?: '15s' | '30s' | '60s' | '180s';
          },
      )
      .mutation((): AcquisitionVideoHistoryRow => ({
        id: 0,
        content: '',
        contentType: 'json',
        agentId: 'VideoAgent',
        agentMode: 'acquisition',
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
  videoAnalysis: _t.router({
    analyze: _t.procedure
      .input((x: unknown) => x as { lastCopy: string; lastTitle?: string })
      .mutation((): VideoAnalysisHistoryRow => ({
        id: 0,
        content: '',
        contentType: 'json',
        agentId: 'AnalysisAgent',
        agentMode: 'viral',
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
  dailyTasks: _t.router({
    getToday: _t.procedure.query((): DailyTaskRow => null),
    getHistory: _t.procedure
      .input((x: unknown) => x as { limit?: number; offset?: number } | undefined)
      .query((): DailyTaskListOutput => []),
    markCompleted: _t.procedure
      .input((x: unknown) => x as { dailyTaskId: number; taskId: string })
      .mutation((): { ok: boolean; completedCount: number; totalCount: number } => ({ ok: true, completedCount: 0, totalCount: 0 })),
    regenerateToday: _t.procedure
      .mutation((): { ok: boolean; scheduledDate: string; jobId: string } => ({ ok: true, scheduledDate: '', jobId: '' })),
    debugSeedTasks: _t.procedure
      .input((x: unknown) => x as { count: number; accountId: number })
      .mutation((): { ok: boolean; id: number; totalCount: number } => ({ ok: true, id: 0, totalCount: 0 })),
  }),
  aiVideo: _t.router({
    generateStoryboard: _t.procedure
      .input(
        (x: unknown) =>
          x as {
            sourceCopy: string;
            scenesCount?: number;
            imageStyle?: 'vivid' | 'natural';
          },
      )
      .mutation((): GenerateStoryboardOutput => ({
        historyId: 0,
        jobIds: [],
        scenesPlaceholder: [],
      })),
    jobStatus: _t.procedure
      .input((x: unknown) => x as { historyId: number })
      .query((): JobStatusOutput => ({
        total: 0,
        completed: 0,
        pending: 0,
        failed: 0,
        scenes: [],
      })),
    dailyUsage: _t.procedure
      .query((): DailyUsageOutput => ({ count: 0, limit: 10 })),
  }),
  stt: _t.router({
    transcribe: _t.procedure
      .input((x: unknown) => x as { audioBase64: string; mimeType?: string; traceId?: string })
      .mutation((): SttTranscribeOutput => ({ transcript: '', durationSec: null, costUsd: 0 })),
  }),
  tts: _t.router({
    synthesize: _t.procedure
      .input((x: unknown) => x as { text: string; voice?: string; traceId?: string })
      .mutation((): TtsSynthesizeOutput => ({ publicUrl: '', sizeBytes: 0, costUsd: 0 })),
  }),
  voiceChat: _t.router({
    start: _t.procedure
      .input((x: unknown) => x as { userMessage: string; sessionId?: string; traceId?: string })
      // eslint-disable-next-line require-yield
      .subscription(async function* () {
        yield {} as VoiceChatStreamChunk;
      }),
    clearSession: _t.procedure.mutation((): { ok: boolean } => ({ ok: true })),
  }),
  privateDomain: _t.router({
    generate: _t.procedure
      .input(
        (x: unknown) =>
          x as {
            phase: 'welcome' | 'warmup' | 'trust' | 'discover' | 'close' | 'follow';
            productDescription: string;
            productPrice: number;
            targetAudience: string;
            ipPositioning: string;
            currentChannel: 'wechat' | 'douyin' | 'xiaohongshu' | 'weibo' | 'other';
            monthlyTraffic: number;
            scene?: string;
          },
      )
      .mutation((): PrivateDomainGenerateOutput => ({
        id: 0,
        content: '',
        agentId: 'PrivateDomainAgent',
        agentMode: 'phase-generate',
        traceId: null,
        isFallback: false,
        tokensUsed: null,
        modelUsed: null,
        durationMs: null,
        createdAt: new Date(),
      })),
    generateStream: _t.procedure
      .input(
        (x: unknown) =>
          x as {
            phase: 'welcome' | 'warmup' | 'trust' | 'discover' | 'close' | 'follow';
            productDescription: string;
            productPrice: number;
            targetAudience: string;
            ipPositioning: string;
            currentChannel: 'wechat' | 'douyin' | 'xiaohongshu' | 'weibo' | 'other';
            monthlyTraffic: number;
            scene?: string;
          },
      )
      // eslint-disable-next-line require-yield
      .subscription(async function* () {
        yield {} as
          | { type: 'meta'; meta: { model: string } }
          | { type: 'delta'; delta: string }
          | { type: 'done'; result: { phaseScript: string; variants: { professional: string; friendly: string; sales: string } } | null };
      }),
  }),
  monetization: _t.router({
    generate: _t.procedure
      .input(
        (x: unknown) =>
          x as { industryContext?: string; audienceProfile?: string; ipPositioning?: string; productDescription?: string },
      )
      .mutation((): MonetizationGenerateOutput => ({
        id: 0,
        content: '',
        agentId: 'MonetizationAgent',
        agentMode: 'monetization-tool',
        traceId: null,
        isFallback: false,
        tokensUsed: null,
        modelUsed: null,
        durationMs: null,
        createdAt: new Date(),
      })),
  }),
  presentStyles: _t.router({
    recommend: _t.procedure
      .input((x: unknown) => x as { text: string; platform: string })
      .mutation((): PresentationRecommendOutput => ({
        id: 0,
        content: '',
        agentId: 'PresentationAgent',
        agentMode: 'recommend',
        traceId: null,
        isFallback: false,
        tokensUsed: null,
        modelUsed: null,
        durationMs: null,
        createdAt: new Date(),
      })),
  }),
  myTopics: _t.router({
    list: _t.procedure
      .input(
        (x: unknown) =>
          x as { source?: 'all' | 'step5' | 'trending' | 'manual'; industry?: string; search?: string; page?: number; pageSize?: number } | undefined,
      )
      .query((): { items: MyTopicItem[]; total: number; page: number; pageSize: number; totalPages: number } => ({
        items: [], total: 0, page: 1, pageSize: 20, totalPages: 1,
      })),
    add: _t.procedure
      .input((x: unknown) => x as { title: string; industry?: string; platform?: string })
      .mutation((): MyTopicItem => ({ id: '', title: '', source: 'manual', industry: null, platform: null, createdAt: new Date() })),
    update: _t.procedure
      .input((x: unknown) => x as { topicId: number; title?: string; industry?: string; platform?: string })
      .mutation((): MyTopicItem | null => null),
    delete: _t.procedure
      .input((x: unknown) => x as { id: string })
      .mutation((): { ok: boolean } => ({ ok: true })),
    countBySource: _t.procedure
      .query((): { step5: number; trending: number; manual: number } => ({ step5: 0, trending: 0, manual: 0 })),
  }),
  deepLearning: _t.router({
    list: _t.procedure
      .input(
        (x: unknown) =>
          x as { limit?: number; offset?: number; onlyActive?: boolean },
      )
      .query((): DeepLearningQueueItem[] => []),
    create: _t.procedure
      .input((x: unknown) => x as { sample: string; userTitle?: string; userTags?: string[] })
      .mutation((): { ok: true; queueId: number; status: string } => ({
        ok: true,
        queueId: 0,
        status: 'pending',
      })),
    delete: _t.procedure
      .input((x: unknown) => x as { archiveId: number })
      .mutation((): { ok: boolean } => ({ ok: true })),
    parse: _t.procedure
      .input((x: unknown) => x as { sample: string; sourcePlatform: string })
      .mutation((): DeepLearningParseResult => ({
        queueId: 0,
        analysis: {
          coreFormula: '',
          hookType: '',
          structurePattern: '',
          emotionalArc: '',
          keywords: [],
        },
      })),
    applyFormula: _t.procedure
      .input((x: unknown) => x as { queueId: number; newTopic: string })
      .mutation((): { content: string } => ({ content: '' })),
    learn: _t.procedure
      .input(
        (x: unknown) =>
          x as {
            samples: Array<{ text: string; source: string }>;
          },
      )
      .mutation((): DeepLearnLearnOutput => ({ jobId: '', status: 'queued' })),
    learnStatus: _t.procedure
      .input((x: unknown) => x as { jobId: string })
      .query((): DeepLearnStatusOutput => ({ status: 'queued', result: null })),
  }),
});

export type AppRouter = typeof _shadowRouter;
