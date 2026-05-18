// PRD-10 US-003 · mfaCheck middleware unit tests (AC-9: 6 tests)
import { describe, it, expect, vi, afterEach } from 'vitest';
import { TRPCError } from '@trpc/server';

import { mfaCheckMiddleware } from '@/trpc/middleware/admin/mfaCheck';

type RawFn = (opts: { ctx: unknown; meta?: unknown; next: () => Promise<unknown> }) => Promise<unknown>;

function extractFn(mw: unknown): RawFn {
  return (mw as { _middlewares: RawFn[] })._middlewares[0]!;
}

const now = Date.now();
const FRESH = new Date(now - 5 * 24 * 60 * 60 * 1000);   // 5 days ago — still valid
const STALE = new Date(now - 31 * 24 * 60 * 60 * 1000);  // 31 days ago — stale

function makeCtx(role: string, mfaVerifiedAt: Date | null = null) {
  return {
    activeAdminUser: { id: 1, email: 'a@b.com', role, isMock: false, isActive: true },
    adminSessionMfaVerifiedAt: mfaVerifiedAt,
  };
}

afterEach(() => {
  delete process.env.ADMIN_MFA_REQUIRED;
});

describe('mfaCheckMiddleware', () => {
  it('passes through when ADMIN_MFA_REQUIRED is not set', async () => {
    const next = vi.fn().mockResolvedValue({ ok: true });
    await extractFn(mfaCheckMiddleware)({ ctx: makeCtx('super_admin', null), next });
    expect(next).toHaveBeenCalledOnce();
  });

  it('passes through when ENABLED=true but role is admin (not super_admin)', async () => {
    process.env.ADMIN_MFA_REQUIRED = 'true';
    const next = vi.fn().mockResolvedValue({ ok: true });
    await extractFn(mfaCheckMiddleware)({ ctx: makeCtx('admin', null), next });
    expect(next).toHaveBeenCalledOnce();
  });

  it('passes through when ENABLED=true but role is readonly_admin', async () => {
    process.env.ADMIN_MFA_REQUIRED = 'true';
    const next = vi.fn().mockResolvedValue({ ok: true });
    await extractFn(mfaCheckMiddleware)({ ctx: makeCtx('readonly_admin', null), next });
    expect(next).toHaveBeenCalledOnce();
  });

  it('passes when ENABLED=true + super_admin + mfaVerifiedAt is fresh (< 30d)', async () => {
    process.env.ADMIN_MFA_REQUIRED = 'true';
    const next = vi.fn().mockResolvedValue({ ok: true });
    await extractFn(mfaCheckMiddleware)({ ctx: makeCtx('super_admin', FRESH), next });
    expect(next).toHaveBeenCalledOnce();
  });

  it('throws PRECONDITION_FAILED when ENABLED=true + super_admin + mfaVerifiedAt is stale (> 30d)', async () => {
    process.env.ADMIN_MFA_REQUIRED = 'true';
    const next = vi.fn();
    await expect(
      extractFn(mfaCheckMiddleware)({ ctx: makeCtx('super_admin', STALE), next }),
    ).rejects.toThrow(TRPCError);
    expect(next).not.toHaveBeenCalled();
  });

  it('throws PRECONDITION_FAILED when ENABLED=true + super_admin + mfaVerifiedAt is null', async () => {
    process.env.ADMIN_MFA_REQUIRED = 'true';
    const next = vi.fn();
    await expect(
      extractFn(mfaCheckMiddleware)({ ctx: makeCtx('super_admin', null), next }),
    ).rejects.toThrow(TRPCError);
  });
});
