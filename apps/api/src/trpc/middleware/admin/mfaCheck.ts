// PRD-10 US-001 stub · US-003 真接 ADMIN_MFA_REQUIRED env + super_admin 30d cache check
import { middleware } from '@/trpc/trpc';

export const mfaCheckMiddleware = middleware(async ({ next }) => {
  return next();
});
