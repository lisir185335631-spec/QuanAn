// PRD-10 US-003 · adminProcedure — 6-gate chain (order is a hard constraint per LD-A-chain)
// Gate order: adminAuth → roleCheck → ipWhitelist → mfaCheck → adminRLS → approvalGateCheck → auditLog
import { publicAdminProcedure } from '@/trpc/trpc-admin';
import {
  adminAuthMiddleware,
  auditLogMiddleware,
  approvalGateCheckMiddleware,
  adminRLSMiddleware,
  mfaCheckMiddleware,
  ipWhitelistMiddleware,
  roleCheckMiddleware,
} from '@/trpc/middleware/admin';

export const adminProcedure = publicAdminProcedure
  .use(adminAuthMiddleware)
  .use(roleCheckMiddleware)
  .use(ipWhitelistMiddleware)
  .use(mfaCheckMiddleware)
  .use(adminRLSMiddleware)
  .use(approvalGateCheckMiddleware)
  .use(auditLogMiddleware);
