// PRD-10 · admin tRPC router root
// US-001: health stub · US-002: auth sub-router · US-003~007 fill remaining sub-trees
// US-005: real audit router (audit.listMine)
// PRD-11 US-003: real nsm router · US-006: real users router · US-010: real accounts router
// PRD-11 US-020: real inviteCodes router
import { adminTrpcRouter, publicAdminProcedure } from '@/trpc/trpc-admin';

import { abExperimentsRouter } from './abExperiments';
import { accountsRouter } from './accounts';
import { approvalsRouter } from './approvals';
import { adminAuditRouter } from './audit';
import { adminAuthRouter } from './auth';
import { complianceRouter } from './compliance';
import { constantsRouter } from './constants';
import { costRouter } from './cost';
import { dailyTasksAdminRouter } from './dailyTasks';
import { diagnosisRouter } from './diagnosis';
import { evaluationRouter } from './evaluation';
import { evolutionHealthRouter } from './evolutionHealth';
import { featureFlagsRouter } from './featureFlags';
import { historyAdminRouter } from './history';
import { invitesRouter } from './invites';
import { nsmRouter } from './nsm';
import { promptsRouter } from './prompts';
import { quotaRouter } from './quota';
import { reviewDeepLearnRouter } from './review-deep-learn';
import { reviewTrendingRouter } from './review-trending';
import { stepDataRouter } from './stepData';
import { topicsAdminRouter } from './topics';
import { usersRouter } from './users';

export const adminRouter = adminTrpcRouter({
  /** Health check — no auth required */
  health: publicAdminProcedure.query(() => ({ ok: true, service: 'admin', version: '0.1.0' })),

  // US-002: real auth router
  auth: adminAuthRouter,

  // US-005: real audit router
  audit: adminAuditRouter,

  // PRD-11 US-006: real users router
  users: usersRouter,

  // PRD-11 US-010: real accounts router
  ipAccounts: accountsRouter,
  // PRD-11 US-020: real inviteCodes router
  inviteCodes: invitesRouter,
  // PRD-12 US-004: real reviewTrending router
  reviewTrending: reviewTrendingRouter,
  // PRD-12 US-009: real reviewDeepLearn router
  reviewDeepLearn: reviewDeepLearnRouter,
  // PRD-13 US-007: real prompts router
  prompts: promptsRouter,
  // PRD-13 US-005: real quota router
  quota: quotaRouter,
  // PRD-13 US-010: real compliance router
  compliance: complianceRouter,
  // PRD-11 US-003: real nsm router
  nsm: nsmRouter,
  // PRD-11 US-012: real cost router
  cost: costRouter,
  // PRD-13 US-004: real evolutionHealth router
  evolution: evolutionHealthRouter,
  // PRD-13 US-011: real approvals router
  approvals: approvalsRouter,
  // PRD-14 US-004: real abExperiments router
  abExperiments: abExperimentsRouter,
  // PRD-14 US-009: real constants router
  constants: constantsRouter,
  // PRD-14 US-012: real featureFlags router
  featureFlags: featureFlagsRouter,
  // PRD-28 US-006: evaluation router
  evaluation: evaluationRouter,
  // PRD-29: diagnosis reports router
  diagnosis: diagnosisRouter,
  // PRD-29: step data (user generated content) router
  stepData: stepDataRouter,
  // PRD-29: history (core generation log) router
  history: historyAdminRouter,
  // PRD-29: topics (manual/ai topic library) router
  topics: topicsAdminRouter,
  // PRD-29: daily tasks (AI 每日任务表) router
  dailyTasks: dailyTasksAdminRouter,
});

export type AdminRouter = typeof adminRouter;
