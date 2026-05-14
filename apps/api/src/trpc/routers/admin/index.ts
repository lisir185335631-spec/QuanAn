// PRD-10 · admin tRPC router root
// US-001: health stub · US-002: auth sub-router · US-003~007 fill remaining sub-trees
// US-005: real audit router (audit.listMine)
// PRD-11 US-003: real nsm router · US-006: real users router · US-010: real accounts router
// PRD-11 US-020: real inviteCodes router
import { adminTrpcRouter, publicAdminProcedure } from '@/trpc/trpc-admin';

import { accountsRouter } from './accounts';
import { adminAuditRouter } from './audit';
import { adminAuthRouter } from './auth';
import { costRouter } from './cost';
import { invitesRouter } from './invites';
import { nsmRouter } from './nsm';
import { reviewDeepLearnRouter } from './review-deep-learn';
import { reviewTrendingRouter } from './review-trending';
import { usersRouter } from './users';
import { evolutionHealthRouter } from './evolutionHealth';
import { quotaRouter } from './quota';

// Placeholder sub-routers (filled by PRD-12~14)
const promptsPlaceholder = adminTrpcRouter({});
const configPlaceholder = adminTrpcRouter({});
const abPlaceholder = adminTrpcRouter({});

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
  prompts: promptsPlaceholder,
  // PRD-13 US-005: real quota router
  quota: quotaRouter,
  // PRD-11 US-003: real nsm router
  nsm: nsmRouter,
  // PRD-11 US-012: real cost router
  cost: costRouter,
  // PRD-13 US-004: real evolutionHealth router
  evolution: evolutionHealthRouter,
  config: configPlaceholder,
  ab: abPlaceholder,
});

export type AdminRouter = typeof adminRouter;
