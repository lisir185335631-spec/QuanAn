// PRD-10 US-001 stub · US-003 真接 ADMIN_ROLE_HIERARCHY + meta.requiredRole check
import { middleware } from '@/trpc/trpc';

export const roleCheckMiddleware = middleware(async ({ next }) => {
  return next();
});
