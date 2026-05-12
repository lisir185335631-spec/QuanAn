import { describe, it, expect, vi } from 'vitest';

import {
  adminAuthMiddleware,
  roleCheckMiddleware,
  ipWhitelistMiddleware,
  mfaCheckMiddleware,
  adminRLSMiddleware,
  approvalGateCheckMiddleware,
  auditLogMiddleware,
} from '@/trpc/middleware/admin';

type MiddlewareFn = (opts: { next: () => Promise<unknown> }) => Promise<unknown>;

function extractFn(mw: unknown): MiddlewareFn {
  return (mw as { _middlewares: MiddlewareFn[] })._middlewares[0]!;
}

describe('admin middleware stubs — US-001 all pass-through', () => {
  it('adminAuth stub calls next()', async () => {
    const next = vi.fn().mockResolvedValue({ ok: true });
    await extractFn(adminAuthMiddleware)({ next });
    expect(next).toHaveBeenCalledOnce();
  });

  it('roleCheck stub calls next()', async () => {
    const next = vi.fn().mockResolvedValue({ ok: true });
    await extractFn(roleCheckMiddleware)({ next });
    expect(next).toHaveBeenCalledOnce();
  });

  it('ipWhitelist stub calls next()', async () => {
    const next = vi.fn().mockResolvedValue({ ok: true });
    await extractFn(ipWhitelistMiddleware)({ next });
    expect(next).toHaveBeenCalledOnce();
  });

  it('mfaCheck stub calls next()', async () => {
    const next = vi.fn().mockResolvedValue({ ok: true });
    await extractFn(mfaCheckMiddleware)({ next });
    expect(next).toHaveBeenCalledOnce();
  });

  it('adminRLS stub calls next()', async () => {
    const next = vi.fn().mockResolvedValue({ ok: true });
    await extractFn(adminRLSMiddleware)({ next });
    expect(next).toHaveBeenCalledOnce();
  });

  it('approvalGateCheck stub calls next()', async () => {
    const next = vi.fn().mockResolvedValue({ ok: true });
    await extractFn(approvalGateCheckMiddleware)({ next });
    expect(next).toHaveBeenCalledOnce();
  });

  it('auditLog stub calls next()', async () => {
    const next = vi.fn().mockResolvedValue({ ok: true });
    await extractFn(auditLogMiddleware)({ next });
    expect(next).toHaveBeenCalledOnce();
  });
});
