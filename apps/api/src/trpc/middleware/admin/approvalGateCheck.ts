// PRD-10 US-003 · approvalGateCheck stub — NOT_IMPLEMENTED for high-risk procedures
// PRD-13 will complete the real approval workflow (approval_requests table + reviewer flow)
// US-004: writes audit log via logAdminAction service before throw (AC-6)
import { TRPCError } from '@trpc/server';

import { logAdminAction } from '@/services/admin/admin-audit-service';
import { middleware } from '@/trpc/trpc-admin';

export const approvalGateCheckMiddleware = middleware(async ({ ctx, meta, next }) => {
  if (!meta?.requiresApproval) return next();

  // Write stub audit event before throw (AC-6)
  if (ctx.activeAdminUser) {
    await logAdminAction({
      actorAdminId: ctx.activeAdminUser.id,
      actorRole: ctx.activeAdminUser.role,
      eventCategory: 'approval',
      eventType: 'approval_request_create',
      payload: {
        actionType: meta.actionType ?? 'unknown',
        riskLevel: meta.riskLevel ?? 'unknown',
        status: 'stub_rejected',
      },
      traceId: ctx.traceId,
      ip: ctx.req.headers.get('x-forwarded-for') ?? '0.0.0.0',
      userAgent: ctx.req.headers.get('user-agent') ?? '',
      sessionId: ctx.adminSession?.id ?? '',
      success: false,
      errorCode: 'NOT_IMPLEMENTED',
    });
  }

  throw new TRPCError({
    code: 'NOT_IMPLEMENTED',
    message: 'PRD-13 真闭环',
    cause: {
      actionType: meta.actionType,
      riskLevel: meta.riskLevel,
    },
  });
});
