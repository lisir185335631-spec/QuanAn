// PRD-10 US-001 stub · US-003 真接 ApprovalRequest workflow check for high-risk actions
import { middleware } from '@/trpc/trpc';

export const approvalGateCheckMiddleware = middleware(async ({ next }) => {
  return next();
});
