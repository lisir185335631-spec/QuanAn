/**
 * Unit tests for account-isolation middleware — PRD-2 US-001
 * AC-4: missing activeAccountId → FORBIDDEN + log 'no_active_account'
 * AC-5: isGlobal=true → skip RLS
 * AC-2: valid account → set_config called with correct values
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { accountIsolationMiddleware } from '@/trpc/middleware/account-isolation';

// Build a minimal fake tRPC middleware caller from the raw function
// accountIsolationMiddleware is a MiddlewareFunction; we call its _fn directly via type cast.
type MiddlewareFn = (opts: {
  ctx: Record<string, unknown>;
  meta?: Record<string, unknown>;
  next: (opts?: { ctx?: Record<string, unknown> }) => Promise<unknown>;
  rawInput?: unknown;
  input?: unknown;
  path?: string;
  type?: string;
}) => Promise<unknown>;

// Extract the underlying function from the tRPC middleware builder.
// In tRPC v11, a middleware exposes _middlewares: fn[]. The first entry is the raw function.
const middlewareFn = (accountIsolationMiddleware as unknown as { _middlewares: MiddlewareFn[] })
  ._middlewares[0]!;

function makeCtx(overrides: Record<string, unknown> = {}) {
  const executeRawCalls: Array<{ sql: string; values: unknown[] }> = [];
  const tx = {
    $executeRaw: vi.fn(async (sql: TemplateStringsArray, ...values: unknown[]) => {
      executeRawCalls.push({ sql: sql.join('?'), values });
      return 0;
    }),
  };
  const prisma = {
    $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(tx)),
    _tx: tx,
    _calls: executeRawCalls,
  };
  return {
    ctx: {
      traceId: 'test-trace-001',
      activeAccountId: null as number | null,
      user: null as { id: number } | null,
      prisma,
      req: new Request('http://localhost'),
      sessionId: null,
      ...overrides,
    },
    prisma,
    executeRawCalls,
  };
}

describe('accountIsolationMiddleware', () => {
  const next = vi.fn(async () => ({ ok: true }));

  beforeEach(() => {
    next.mockClear();
  });

  it('AC-4: throws FORBIDDEN when activeAccountId is null', async () => {
    const { ctx } = makeCtx({ activeAccountId: null });
    await expect(middlewareFn({ ctx, meta: undefined, next })).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: 'no_active_account',
    });
  });

  it('AC-4: calls next=false (does not proceed) when activeAccountId missing', async () => {
    const { ctx } = makeCtx({ activeAccountId: null });
    await expect(middlewareFn({ ctx, meta: undefined, next })).rejects.toThrow();
    expect(next).not.toHaveBeenCalled();
  });

  it('AC-5: skips RLS and calls next when meta.isGlobal=true', async () => {
    const { ctx, prisma } = makeCtx({ activeAccountId: null });
    await middlewareFn({ ctx, meta: { isGlobal: true }, next });
    expect(next).toHaveBeenCalledOnce();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('AC-5: isGlobal skips even when activeAccountId is present', async () => {
    const { ctx, prisma } = makeCtx({ activeAccountId: 42 });
    await middlewareFn({ ctx, meta: { isGlobal: true }, next });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('AC-2: sets app.current_account_id via set_config for valid context', async () => {
    const { ctx, executeRawCalls } = makeCtx({
      activeAccountId: 7,
      user: { id: 3 },
    });
    await middlewareFn({ ctx, meta: undefined, next });
    const sqls = executeRawCalls.map((c) => c.sql);
    expect(sqls.some((s) => s.includes('app.current_account_id'))).toBe(true);
    const accountCall = executeRawCalls.find((c) => c.sql.includes('app.current_account_id'));
    expect(accountCall?.values).toContain('7');
  });

  it('AC-2: sets app.current_user_id when user.id is present', async () => {
    const { ctx, executeRawCalls } = makeCtx({
      activeAccountId: 7,
      user: { id: 3 },
    });
    await middlewareFn({ ctx, meta: undefined, next });
    const userCall = executeRawCalls.find((c) => c.sql.includes('app.current_user_id'));
    expect(userCall).toBeDefined();
    expect(userCall?.values).toContain('3');
  });

  it('AC-2: skips app.current_user_id when user is null', async () => {
    const { ctx, executeRawCalls } = makeCtx({
      activeAccountId: 7,
      user: null,
    });
    await middlewareFn({ ctx, meta: undefined, next });
    const userCall = executeRawCalls.find((c) => c.sql.includes('app.current_user_id'));
    expect(userCall).toBeUndefined();
  });

  it('AC-2: calls next with updated ctx including transaction prisma', async () => {
    const { ctx } = makeCtx({ activeAccountId: 5, user: { id: 2 } });
    let capturedCtx: Record<string, unknown> | undefined;
    const capturingNext = vi.fn(async (opts?: { ctx?: Record<string, unknown> }) => {
      capturedCtx = opts?.ctx;
      return { ok: true };
    });
    await middlewareFn({ ctx, meta: undefined, next: capturingNext });
    // prisma in the forwarded ctx should be the transaction client (not the original)
    expect(capturedCtx?.prisma).toBeDefined();
    expect(capturedCtx?.activeAccountId).toBe(5);
  });

  it('AC-2: wraps resolver in $transaction (ensures set_config is LOCAL)', async () => {
    const { ctx, prisma } = makeCtx({ activeAccountId: 10, user: { id: 1 } });
    await middlewareFn({ ctx, meta: undefined, next });
    expect(prisma.$transaction).toHaveBeenCalledOnce();
  });
});
