// PRD-10 US-003 · mfaCheck — ADMIN_MFA_REQUIRED + super_admin 30-day reverify window
import { TRPCError } from '@trpc/server';

import { middleware } from '@/trpc/trpc-admin';

const MFA_STALE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export const mfaCheckMiddleware = middleware(async ({ ctx, next }) => {
  if (process.env.ADMIN_MFA_REQUIRED !== 'true') return next();
  if (ctx.activeAdminUser?.role !== 'super_admin') return next();

  const mfaVerifiedAt = ctx.adminSessionMfaVerifiedAt;
  if (!mfaVerifiedAt) {
    throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'MFA_REQUIRED' });
  }

  const staleMs = Date.now() - new Date(mfaVerifiedAt).getTime();
  if (staleMs > MFA_STALE_MS) {
    throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'MFA_REQUIRED' });
  }

  return next();
});
