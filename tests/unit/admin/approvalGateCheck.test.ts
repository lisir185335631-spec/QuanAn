// PRD-10 US-003 · approvalGateCheck middleware unit tests (AC-11: 5 tests)
import { describe, it, expect, vi } from 'vitest';
import { TRPCError } from '@trpc/server';

import { approvalGateCheckMiddleware } from '@/trpc/middleware/admin/approvalGateCheck';

type RawFn = (opts: { ctx: unknown; meta?: unknown; next: () => Promise<unknown> }) => Promise<unknown>;

function extractFn(mw: unknown): RawFn {
  return (mw as { _middlewares: RawFn[] })._middlewares[0]!;
}

function makeCtx() {
  return {
    activeAdminUser: { id: 1, email: 'super@quanqn.com', role: 'super_admin', isMock: true, isActive: true },
    adminSession: { id: 'sess-1', expiresAt: new Date(), fresh: false },
    prisma: { adminAuditLog: { create: vi.fn().mockResolvedValue({}) } },
    traceId: 'trace-1',
    req: new Request('http://localhost'),
    resHeaders: new Headers(),
  };
}

describe('approvalGateCheckMiddleware', () => {
  it('passes through when meta.requiresApproval is undefined', async () => {
    const next = vi.fn().mockResolvedValue({ ok: true });
    await extractFn(approvalGateCheckMiddleware)({ ctx: makeCtx(), meta: {}, next });
    expect(next).toHaveBeenCalledOnce();
  });

  it('passes through when meta.requiresApproval is false', async () => {
    const next = vi.fn().mockResolvedValue({ ok: true });
    await extractFn(approvalGateCheckMiddleware)({
      ctx: makeCtx(),
      meta: { requiresApproval: false },
      next,
    });
    expect(next).toHaveBeenCalledOnce();
  });

  it('throws NOT_IMPLEMENTED when meta.requiresApproval is true', async () => {
    const next = vi.fn();
    await expect(
      extractFn(approvalGateCheckMiddleware)({
        ctx: makeCtx(),
        meta: { requiresApproval: true, actionType: 'ban_user', riskLevel: 'high' },
        next,
      }),
    ).rejects.toThrow(TRPCError);
    expect(next).not.toHaveBeenCalled();
  });

  it('error message contains PRD-13 真闭环', async () => {
    const next = vi.fn();
    let err: TRPCError | undefined;
    try {
      await extractFn(approvalGateCheckMiddleware)({
        ctx: makeCtx(),
        meta: { requiresApproval: true },
        next,
      });
    } catch (e) {
      err = e as TRPCError;
    }
    expect(err?.message).toBe('PRD-13 真闭环');
    expect(err?.code).toBe('NOT_IMPLEMENTED');
  });

  it('error cause contains actionType + riskLevel', async () => {
    const next = vi.fn();
    let err: TRPCError | undefined;
    try {
      await extractFn(approvalGateCheckMiddleware)({
        ctx: makeCtx(),
        meta: { requiresApproval: true, actionType: 'change_user_plan', riskLevel: 'high' },
        next,
      });
    } catch (e) {
      err = e as TRPCError;
    }
    const cause = err?.cause as { actionType: string; riskLevel: string } | undefined;
    expect(cause?.actionType).toBe('change_user_plan');
    expect(cause?.riskLevel).toBe('high');
  });
});
