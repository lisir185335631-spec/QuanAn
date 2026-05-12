// PRD-10 · admin tRPC router root
// US-001: health stub · US-002: auth sub-router · US-003~007 fill remaining sub-trees
import { adminTrpcRouter, publicAdminProcedure } from '@/trpc/trpc-admin';

import { adminAuthRouter } from './auth';

// Placeholder sub-routers (filled by US-003~007 + PRD-11~14)
const usersPlaceholder = adminTrpcRouter({});
const ipAccountsPlaceholder = adminTrpcRouter({});
const inviteCodesPlaceholder = adminTrpcRouter({});
const trendingPlaceholder = adminTrpcRouter({});
const deepLearnPlaceholder = adminTrpcRouter({});
const promptsPlaceholder = adminTrpcRouter({});
const quotaPlaceholder = adminTrpcRouter({});
const nsmPlaceholder = adminTrpcRouter({});
const evolutionPlaceholder = adminTrpcRouter({});
const auditPlaceholder = adminTrpcRouter({});
const configPlaceholder = adminTrpcRouter({});
const abPlaceholder = adminTrpcRouter({});

export const adminRouter = adminTrpcRouter({
  /** Health check — no auth required */
  health: publicAdminProcedure.query(() => ({ ok: true, service: 'admin', version: '0.1.0' })),

  // US-002: real auth router
  auth: adminAuthRouter,

  // US-003~007 + PRD-11~14 sub-trees (placeholder)
  users: usersPlaceholder,
  ipAccounts: ipAccountsPlaceholder,
  inviteCodes: inviteCodesPlaceholder,
  trending: trendingPlaceholder,
  deepLearn: deepLearnPlaceholder,
  prompts: promptsPlaceholder,
  quota: quotaPlaceholder,
  nsm: nsmPlaceholder,
  evolution: evolutionPlaceholder,
  audit: auditPlaceholder,
  config: configPlaceholder,
  ab: abPlaceholder,
});

export type AdminRouter = typeof adminRouter;
