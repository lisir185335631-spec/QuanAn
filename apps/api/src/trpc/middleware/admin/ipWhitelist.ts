// PRD-10 US-001 stub · US-003 真接 ADMIN_IP_WHITELIST env check
import { middleware } from '@/trpc/trpc';

export const ipWhitelistMiddleware = middleware(async ({ next }) => {
  return next();
});
