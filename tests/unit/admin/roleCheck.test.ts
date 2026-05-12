// PRD-10 US-003 · roleCheck middleware unit tests (AC-7: 6 tests)
import { describe, it, expect, vi } from 'vitest';
import { TRPCError } from '@trpc/server';

import { ADMIN_ROLE_HIERARCHY, roleCheckMiddleware } from '@/trpc/middleware/admin/roleCheck';

type RawFn = (opts: { ctx: unknown; meta?: unknown; next: (o?: unknown) => Promise<unknown> }) => Promise<unknown>;

function extractFn(mw: unknown): RawFn {
  return (mw as { _middlewares: RawFn[] })._middlewares[0]!;
}

function makeCtx(role: string) {
  return { activeAdminUser: { id: 1, email: 'a@b.com', role, isMock: true, isActive: true } };
}

describe('roleCheckMiddleware', () => {
  it('passes through when no requiredRole in meta', async () => {
    const next = vi.fn().mockResolvedValue({ ok: true });
    await extractFn(roleCheckMiddleware)({ ctx: makeCtx('readonly_admin'), meta: {}, next });
    expect(next).toHaveBeenCalledOnce();
  });

  it('super_admin (3) passes requiredRole=super_admin', async () => {
    const next = vi.fn().mockResolvedValue({ ok: true });
    await extractFn(roleCheckMiddleware)({
      ctx: makeCtx('super_admin'),
      meta: { requiredRole: 'super_admin' },
      next,
    });
    expect(next).toHaveBeenCalledOnce();
  });

  it('super_admin (3) passes requiredRole=admin', async () => {
    const next = vi.fn().mockResolvedValue({ ok: true });
    await extractFn(roleCheckMiddleware)({
      ctx: makeCtx('super_admin'),
      meta: { requiredRole: 'admin' },
      next,
    });
    expect(next).toHaveBeenCalledOnce();
  });

  it('admin (2) fails requiredRole=super_admin → FORBIDDEN', async () => {
    const next = vi.fn();
    await expect(
      extractFn(roleCheckMiddleware)({
        ctx: makeCtx('admin'),
        meta: { requiredRole: 'super_admin' },
        next,
      }),
    ).rejects.toThrow(TRPCError);
    expect(next).not.toHaveBeenCalled();
  });

  it('readonly_admin (1) fails requiredRole=admin → FORBIDDEN', async () => {
    const next = vi.fn();
    await expect(
      extractFn(roleCheckMiddleware)({
        ctx: makeCtx('readonly_admin'),
        meta: { requiredRole: 'admin' },
        next,
      }),
    ).rejects.toThrow(TRPCError);
  });

  it('ADMIN_ROLE_HIERARCHY has correct ordering', () => {
    expect(ADMIN_ROLE_HIERARCHY.super_admin).toBeGreaterThan(ADMIN_ROLE_HIERARCHY.admin);
    expect(ADMIN_ROLE_HIERARCHY.admin).toBeGreaterThan(ADMIN_ROLE_HIERARCHY.readonly_admin);
    expect(ADMIN_ROLE_HIERARCHY.super_admin).toBe(3);
    expect(ADMIN_ROLE_HIERARCHY.admin).toBe(2);
    expect(ADMIN_ROLE_HIERARCHY.readonly_admin).toBe(1);
  });
});
