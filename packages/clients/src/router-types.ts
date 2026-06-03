/**
 * Shared AppRouter type for tRPC client packages — US-006
 * Lives here so apps/web can import it via 'import type' and keep @trpc/server
 * out of the browser bundle.
 *
 * AppRouter 现由 scripts/codegen-shadow.cjs 从真 router【自动生成】(见文件末 re-export);本文件只保留
 * 少量手写【辅助类型】(AuthMeOutput 等,供 UI 直接消费的便捷别名)。
 *
 * 背景:手写 shadow 曾 LOAD-BEARING —— 直接 import 真 router 类型会:① api 的 @/ 自引用被前端重编译成
 * TS2307 串扰;② 真 AdminRouter(adminProcedure 7 道中间件)喂 createTRPCReact 超 TS 实例化上限、类型被毒化。
 * codegen 生成【扁平 + 自包含】的 shadow 同时解掉这两点,且永与后端同步(改后端跑 `pnpm codegen:shadow`,
 * CI regen-diff 兜底)—— 既根治了手写镜像的漂移(如 cost/judgeScore/rating 等真 bug 即由它照出),
 * 又无需后端去 @/ 或上 project references。
 */


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
  direction: string | null;
  content: unknown;
  levelBefore: string | null;
  levelAfter: string | null;
  createdAt: string;
};

export type FeedbackLogItem = {
  id: number;
  rating: 'good' | 'bad';
  agentId: string;
  comment: string | null;
  traceId: string | null;
  createdAt: string;
};

export type EvolutionConfigOutput = {
  autoEvolutionEnabled: boolean;
  currentDirection: string;
  level: string;
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


export type { AppRouter } from './router-types.generated';
