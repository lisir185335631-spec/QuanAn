// PRD-10 US-001 stubs → US-003 real implementations
// Tests in this file verify default-pass-through behaviour when no special conditions trigger.
// Real implementation tests live in roleCheck/ipWhitelist/mfaCheck/adminRLS/approvalGateCheck.test.ts

import { describe, it, expect, vi } from 'vitest';

import {
  roleCheckMiddleware,
  ipWhitelistMiddleware,
  mfaCheckMiddleware,
  approvalGateCheckMiddleware,
  auditLogMiddleware,
} from '@/trpc/middleware/admin';

type RawFn = (opts: { ctx: unknown; meta?: unknown; next: () => Promise<unknown> }) => Promise<unknown>;

function extractFn(mw: unknown): RawFn {
  return (mw as { _middlewares: RawFn[] })._middlewares[0]!;
}

const minimalCtx = {
  activeAdminUser: null,
  adminSession: null,
  adminSessionMfaVerifiedAt: null,
  prisma: {},
  traceId: 'test',
  req: new Request('http://localhost'),
  resHeaders: new Headers(),
};

describe('admin middleware default pass-through (no triggering conditions)', () => {
  // roleCheck: no meta.requiredRole → pass
  it('roleCheck passes through when meta.requiredRole is absent', async () => {
    const next = vi.fn().mockResolvedValue({ ok: true });
    await extractFn(roleCheckMiddleware)({ ctx: minimalCtx, meta: {}, next });
    expect(next).toHaveBeenCalledOnce();
  });

  // ipWhitelist: ADMIN_IP_WHITELIST_ENABLED not 'true' → pass
  it('ipWhitelist passes through when ADMIN_IP_WHITELIST_ENABLED is not set', async () => {
    const next = vi.fn().mockResolvedValue({ ok: true });
    delete process.env.ADMIN_IP_WHITELIST_ENABLED;
    await extractFn(ipWhitelistMiddleware)({ ctx: minimalCtx, next });
    expect(next).toHaveBeenCalledOnce();
  });

  // mfaCheck: ADMIN_MFA_REQUIRED not 'true' → pass
  it('mfaCheck passes through when ADMIN_MFA_REQUIRED is not set', async () => {
    const next = vi.fn().mockResolvedValue({ ok: true });
    delete process.env.ADMIN_MFA_REQUIRED;
    await extractFn(mfaCheckMiddleware)({ ctx: minimalCtx, next });
    expect(next).toHaveBeenCalledOnce();
  });

  // approvalGateCheck: no meta.requiresApproval → pass
  it('approvalGateCheck passes through when meta.requiresApproval is absent', async () => {
    const next = vi.fn().mockResolvedValue({ ok: true });
    await extractFn(approvalGateCheckMiddleware)({ ctx: minimalCtx, meta: {}, next });
    expect(next).toHaveBeenCalledOnce();
  });

  // auditLog: still a stub → always passes through
  it('auditLog stub calls next()', async () => {
    const next = vi.fn().mockResolvedValue({ ok: true });
    await extractFn(auditLogMiddleware)({ ctx: minimalCtx, next });
    expect(next).toHaveBeenCalledOnce();
  });
});
