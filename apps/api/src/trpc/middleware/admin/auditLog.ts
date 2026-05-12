// PRD-10 US-001 stub · US-004 真接 admin_audit_log append-only write
// Position: last in chain so upstream failures also get logged
import { middleware } from '@/trpc/trpc';

export const auditLogMiddleware = middleware(async ({ next }) => {
  return next();
});
