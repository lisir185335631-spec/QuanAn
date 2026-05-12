// PRD-10 · admin tRPC router root
// US-001: health stub · US-002: auth sub-router · US-003~007 fill remaining sub-trees
// US-005: real audit router (audit.listMine)
// PRD-11 US-003: real nsm router · US-006: real users router · US-010: real accounts router
import { adminTrpcRouter, publicAdminProcedure } from '@/trpc/trpc-admin';

import { accountsRouter } from './accounts';
import { adminAuditRouter } from './audit';
import { adminAuthRouter } from './auth';
import { costRouter } from './cost';
import { nsmRouter } from './nsm';
import { usersRouter } from './users';

// Placeholder sub-routers (filled by PRD-11~14)
const inviteCodesPlaceholder = adminTrpcRouter({});
const trendingPlaceholder = adminTrpcRouter({});
const deepLearnPlaceholder = adminTrpcRouter({});
const promptsPlaceholder = adminTrpcRouter({});
const quotaPlaceholder = adminTrpcRouter({});
const evolutionPlaceholder = adminTrpcRouter({});
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
  inviteCodes: inviteCodesPlaceholder,
  trending: trendingPlaceholder,
  deepLearn: deepLearnPlaceholder,
  prompts: promptsPlaceholder,
  quota: quotaPlaceholder,
  // PRD-11 US-003: real nsm router
  nsm: nsmRouter,
  // PRD-11 US-012: real cost router
  cost: costRouter,
  evolution: evolutionPlaceholder,
  config: configPlaceholder,
  ab: abPlaceholder,
});

export type AdminRouter = typeof adminRouter;
