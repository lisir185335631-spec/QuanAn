// PRD-10 US-003 · approvalGateCheck stub — NOT_IMPLEMENTED for high-risk procedures
// PRD-13 will complete the real approval workflow (approval_requests table + reviewer flow)
import { TRPCError } from '@trpc/server';

import { middleware } from '@/trpc/trpc-admin';

export const approvalGateCheckMiddleware = middleware(async ({ ctx, meta, next }) => {
  if (!meta?.requiresApproval) return next();

  // Write stub audit event so the approval intent is logged even in stub mode
  if (ctx.activeAdminUser) {
    await ctx.prisma.adminAuditLog
      .create({
        data: {
          actorAdminId: ctx.activeAdminUser.id,
          actorRole: ctx.activeAdminUser.role,
          eventCategory: 'approval',
          eventType: 'approval_request_create',
          payloadHash: '',
          payload: {
            actionType: meta.actionType ?? 'unknown',
            riskLevel: meta.riskLevel ?? 'unknown',
          },
          traceId: ctx.traceId,
          ip: ctx.req.headers.get('x-forwarded-for') ?? '0.0.0.0',
          userAgent: ctx.req.headers.get('user-agent') ?? '',
          sessionId: ctx.adminSession?.id ?? '',
          success: false,
          errorCode: 'NOT_IMPLEMENTED',
        },
      })
      .catch(() => undefined);
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
