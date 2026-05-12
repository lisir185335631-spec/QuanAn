// PRD-10 · admin tRPC router root
// US-001: health stub only · US-002+ 逐步填充各子树
import { router, publicProcedure } from '@/trpc/trpc';

// Placeholder sub-routers (filled by US-002~US-007)
const authPlaceholder = router({});
const usersPlaceholder = router({});
const ipAccountsPlaceholder = router({});
const inviteCodesPlaceholder = router({});
const trendingPlaceholder = router({});
const deepLearnPlaceholder = router({});
const promptsPlaceholder = router({});
const quotaPlaceholder = router({});
const nsmPlaceholder = router({});
const evolutionPlaceholder = router({});
const auditPlaceholder = router({});
const configPlaceholder = router({});
const abPlaceholder = router({});

export const adminRouter = router({
  /** Health check — no auth required (US-001 stub) */
  health: publicProcedure.query(() => ({ ok: true, service: 'admin', version: '0.1.0' })),

  // 13 domain sub-trees (placeholder · filled by US-002~007 + PRD-11~14)
  auth: authPlaceholder,
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
