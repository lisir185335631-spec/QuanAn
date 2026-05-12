// PRD-10 US-001 stub · US-002 真接 lucia-admin.validateSession + ctx.activeAdminUser 注入
import { middleware } from '@/trpc/trpc';

export const adminAuthMiddleware = middleware(async ({ next }) => {
  return next();
});
