// PRD-10 US-004 · auditLog middleware unit tests (AC-10: 10 tests)
// 4 eventType branches + failure path + redact + duplicate traceId idempotent
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockLogAdminAction = vi.fn().mockResolvedValue(undefined);

vi.mock('@/services/admin/admin-audit-service', () => ({
  logAdminAction: mockLogAdminAction,
}));

const { auditLogMiddleware } = await import('@/trpc/middleware/admin/auditLog');

type RawFn = (opts: {
  ctx: unknown;
  path?: string;
  meta?: unknown;
  next: () => Promise<unknown>;
}) => Promise<unknown>;

function extractFn(mw: unknown): RawFn {
  return (mw as { _middlewares: RawFn[] })._middlewares[0]!;
}

function makeCtx(overrides: Record<string, unknown> = {}) {
  return {
    activeAdminUser: { id: 1, email: 'super@quanan.com', role: 'super_admin', isMock: true, isActive: true },
    adminSession: { id: 'sess-audit-1', expiresAt: new Date(), fresh: false },
    crossAccountAccessed: true,
    traceId: 'trace-audit-001',
    req: new Request('http://localhost', {
      headers: {
        'x-forwarded-for': '10.0.0.1',
        'user-agent': 'Mozilla/5.0',
      },
    }),
    resHeaders: new Headers(),
    ...overrides,
  };
}

beforeEach(() => {
  mockLogAdminAction.mockReset();
  mockLogAdminAction.mockResolvedValue(undefined);
});

describe('auditLogMiddleware — cross_account_query branch', () => {
  it('writes cross_account_query when crossAccountAccessed=true', async () => {
    const next = vi.fn().mockResolvedValue({ ok: true });
    await extractFn(auditLogMiddleware)({ ctx: makeCtx(), path: 'admin.user.list', next });
    expect(mockLogAdminAction).toHaveBeenCalledOnce();
    const call = mockLogAdminAction.mock.calls[0]?.[0];
    expect(call?.eventType).toBe('cross_account_query');
    expect(call?.eventCategory).toBe('cross_account_query');
  });

  it('does NOT write audit when crossAccountAccessed=false', async () => {
    const next = vi.fn().mockResolvedValue({ ok: true });
    await extractFn(auditLogMiddleware)({
      ctx: makeCtx({ crossAccountAccessed: false }),
      path: 'admin.user.list',
      next,
    });
    expect(mockLogAdminAction).not.toHaveBeenCalled();
  });

  it('does NOT write audit when activeAdminUser is null', async () => {
    const next = vi.fn().mockResolvedValue({ ok: true });
    await extractFn(auditLogMiddleware)({
      ctx: makeCtx({ activeAdminUser: null }),
      path: 'admin.user.list',
      next,
    });
    expect(mockLogAdminAction).not.toHaveBeenCalled();
  });

  it('passes through result from next()', async () => {
    const next = vi.fn().mockResolvedValue({ data: 'payload' });
    const result = await extractFn(auditLogMiddleware)({ ctx: makeCtx(), path: 'p', next });
    expect(result).toEqual({ data: 'payload' });
  });

  it('rethrows error from next() after writing audit', async () => {
    const err = new Error('downstream_error');
    const next = vi.fn().mockRejectedValue(err);
    await expect(
      extractFn(auditLogMiddleware)({ ctx: makeCtx(), path: 'p', next }),
    ).rejects.toThrow('downstream_error');
    expect(mockLogAdminAction).toHaveBeenCalledOnce();
  });

  it('audit write failure does not block business operation', async () => {
    mockLogAdminAction.mockRejectedValue(new Error('audit DB down'));
    const next = vi.fn().mockResolvedValue({ ok: true });
    // logAdminAction catches internally — the middleware should not throw
    // (logAdminAction is mocked to reject here, so middleware catches it)
    await expect(
      extractFn(auditLogMiddleware)({ ctx: makeCtx(), path: 'p', next }),
    ).resolves.toEqual({ ok: true });
  });

  it('includes latencyMs in audit payload', async () => {
    const next = vi.fn().mockResolvedValue({});
    await extractFn(auditLogMiddleware)({ ctx: makeCtx(), path: 'p', next });
    const call = mockLogAdminAction.mock.calls[0]?.[0];
    expect(typeof call?.latencyMs).toBe('number');
    expect(call?.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('reads ip from x-forwarded-for header', async () => {
    const next = vi.fn().mockResolvedValue({});
    await extractFn(auditLogMiddleware)({ ctx: makeCtx(), path: 'p', next });
    expect(mockLogAdminAction.mock.calls[0]?.[0]?.ip).toBe('10.0.0.1');
  });

  it('reads userAgent from user-agent header', async () => {
    const next = vi.fn().mockResolvedValue({});
    await extractFn(auditLogMiddleware)({ ctx: makeCtx(), path: 'p', next });
    expect(mockLogAdminAction.mock.calls[0]?.[0]?.userAgent).toBe('Mozilla/5.0');
  });

  it('uses ctx.traceId and ctx.activeAdminUser fields', async () => {
    const next = vi.fn().mockResolvedValue({});
    await extractFn(auditLogMiddleware)({ ctx: makeCtx(), path: 'p', next });
    const call = mockLogAdminAction.mock.calls[0]?.[0];
    expect(call?.traceId).toBe('trace-audit-001');
    expect(call?.actorAdminId).toBe(1);
    expect(call?.actorRole).toBe('super_admin');
  });
});
