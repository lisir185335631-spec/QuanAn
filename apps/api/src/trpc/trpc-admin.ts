// PRD-10 US-002 · Admin tRPC init (separate instance from main app tRPC)
// US-003: adds AdminMeta type + exports middleware for 6-gate chain

import { initTRPC } from '@trpc/server';

import type { AdminTRPCContext } from '@/server/context-admin';

/** Admin procedure metadata — consumed by 6-gate middleware chain */
export interface AdminMeta {
  requiredRole?: 'super_admin' | 'admin' | 'readonly_admin';
  requiresApproval?: boolean;
  actionType?: string;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
}

const t = initTRPC.context<AdminTRPCContext>().meta<AdminMeta>().create();

export const adminTrpcRouter = t.router;
export const middleware = t.middleware;
export const publicAdminProcedure = t.procedure;
