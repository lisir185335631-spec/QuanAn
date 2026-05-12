// PRD-10 US-004 · auditLog middleware — wrapNext + try-catch + admin_audit_log write
// Position: last in chain so upstream results and ctx mutations are visible
// 4 eventType branches:
//   1. cross_account_query  — ctx.crossAccountAccessed=true (set by adminRLS)
//   2. admin_login          — handled by auth.ts via logAdminAction directly
//   3. approval_request_create — handled by approvalGateCheck before throw
//   4. approval_request_resolve — PRD-13 placeholder
import { extractActionType } from '@/lib/admin/audit-helpers';
import { logAdminAction } from '@/services/admin/admin-audit-service';
import { middleware } from '@/trpc/trpc-admin';

export const auditLogMiddleware = middleware(async ({ ctx, path, next }) => {
  const start = Date.now();
  let thrownError: unknown = undefined;
  let result: Awaited<ReturnType<typeof next>> | undefined;

  try {
    result = await next();
  } catch (err) {
    thrownError = err;
  }

  const latencyMs = Date.now() - start;
  const ip =
    ctx.req.headers.get('x-forwarded-for') ??
    ctx.req.headers.get('x-real-ip') ??
    '0.0.0.0';
  const userAgent = ctx.req.headers.get('user-agent') ?? '';

  if (ctx.activeAdminUser) {
    // Branch 1: cross_account_query — adminRLS always sets crossAccountAccessed=true
    if (ctx.crossAccountAccessed === true) {
      await logAdminAction({
        actorAdminId: ctx.activeAdminUser.id,
        actorRole: ctx.activeAdminUser.role,
        eventCategory: 'cross_account_query',
        eventType: 'cross_account_query',
        payload: { path, actionType: extractActionType(path ?? '') },
        traceId: ctx.traceId,
        ip,
        userAgent,
        sessionId: ctx.adminSession?.id ?? '',
        success: thrownError === undefined,
        errorCode:
          thrownError !== undefined && thrownError instanceof Error && 'code' in thrownError
            ? (thrownError as { code: string }).code
            : thrownError !== undefined
              ? 'unknown'
              : null,
        errorMessage: thrownError instanceof Error ? thrownError.message : null,
        latencyMs,
      }).catch((err) => console.error('[ADMIN AUDIT WRITE FAILED]', err));
    }

    // Branch 2: admin_login — written by auth.ts · not auto-written here
    // Branch 3: approval_request_create — written by approvalGateCheck before throw
    // Branch 4: approval_request_resolve — PRD-13 placeholder
  }

  if (thrownError !== undefined) throw thrownError;
  return result!;
});
