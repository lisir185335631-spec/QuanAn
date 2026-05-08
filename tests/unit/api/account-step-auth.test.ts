/**
 * Unit tests — PRD-2 US-008
 * account router: getActive / switchActive (2 procedures)
 * step router: saveStepData (1 procedure)
 * auth router: me (1 procedure)
 * AC-1: all procedures covered · zod validation tested
 */

import { describe, it, expect, vi } from 'vitest';
import { accountRouter } from '@/trpc/routers/account';
import { stepRouter } from '@/trpc/routers/step';
import { authRouter } from '@/trpc/routers/auth';

// ─── Helper: build a minimal tRPC context mock ────────────────────────────────

function makeCtx(overrides: Record<string, unknown> = {}) {
  const ipAccount = {
    findUnique: vi.fn(async () => null as unknown),
    findFirst: vi.fn(async () => null as unknown),
    update: vi.fn(async (args: { data: Record<string, unknown> }) => args.data),
  };
  const user = {
    update: vi.fn(async () => ({})),
  };
  const stepData = {
    upsert: vi.fn(async () => ({
      stepKey: 'test-step',
      inputs: {},
      result: null,
      version: 0,
      updatedAt: new Date(),
    })),
  };
  const tx = {
    ipAccount,
    user,
    stepData,
    $executeRaw: vi.fn(async () => 0),
  };
  const prisma = {
    ipAccount,
    user,
    stepData,
    $transaction: vi.fn(async (fn: (tx: typeof tx) => Promise<unknown>) => fn(tx)),
    _tx: tx,
  };

  return {
    ctx: {
      traceId: 'test-trace-us008',
      activeAccountId: 1 as number | null,
      user: { id: 7, activeAccountId: 1 } as { id: number; activeAccountId: number | null } | null,
      prisma,
      req: new Request('http://localhost', { headers: { 'x-trace-id': 'test-trace-us008' } }),
      sessionId: 'sess-us008',
      ...overrides,
    },
    prisma,
    ipAccount,
    user: user,
    stepData,
    tx,
  };
}

// ─── account.getActive ────────────────────────────────────────────────────────

describe('account.getActive', () => {
  it('returns null when no account found', async () => {
    const { ctx } = makeCtx();
    const caller = accountRouter.createCaller(ctx);
    const result = await caller.getActive();
    expect(result).toBeNull();
  });

  it('returns account data when found', async () => {
    const { ctx, ipAccount } = makeCtx();
    const mockAccount = {
      id: 1,
      name: 'Test Account',
      platform: 'douyin',
      stage: 'growth',
      industry: 'beauty',
      followersRange: '10k-50k',
    };
    ipAccount.findUnique.mockResolvedValueOnce(mockAccount);
    const caller = accountRouter.createCaller(ctx);
    const result = await caller.getActive();
    expect(result).toMatchObject({ id: 1, name: 'Test Account', platform: 'douyin' });
    expect(ipAccount.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 } }),
    );
  });

  it('queries with activeAccountId from ctx', async () => {
    const { ctx, ipAccount } = makeCtx({ activeAccountId: 42 });
    const caller = accountRouter.createCaller(ctx);
    await caller.getActive();
    expect(ipAccount.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 42 } }),
    );
  });
});

// ─── account.switchActive ─────────────────────────────────────────────────────

describe('account.switchActive', () => {
  it('updates user.activeAccountId and returns { ok: true }', async () => {
    const { ctx, tx, user } = makeCtx();
    const mockFoundAccount = { id: 5 };
    tx.ipAccount.findFirst.mockResolvedValueOnce(mockFoundAccount);
    const caller = accountRouter.createCaller(ctx);
    const result = await caller.switchActive({ accountId: 5 });
    expect(result).toEqual({ ok: true });
    expect(user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { activeAccountId: 5 } }),
    );
  });

  it('throws NOT_FOUND when account does not belong to user', async () => {
    const { ctx } = makeCtx();
    // findFirst returns null — account not found for this user
    const caller = accountRouter.createCaller(ctx);
    await expect(caller.switchActive({ accountId: 999 })).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'account_not_found',
    });
  });

  it('throws UNAUTHORIZED when no user in ctx', async () => {
    const { ctx } = makeCtx({ user: null });
    const caller = accountRouter.createCaller(ctx);
    await expect(caller.switchActive({ accountId: 1 })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });

  it('zod: rejects non-positive accountId', async () => {
    const { ctx } = makeCtx();
    const caller = accountRouter.createCaller(ctx);
    await expect(caller.switchActive({ accountId: 0 })).rejects.toThrow();
    await expect(caller.switchActive({ accountId: -1 })).rejects.toThrow();
  });

  it('zod: rejects non-integer accountId', async () => {
    const { ctx } = makeCtx();
    const caller = accountRouter.createCaller(ctx);
    await expect(caller.switchActive({ accountId: 1.5 })).rejects.toThrow();
  });
});

// ─── step.saveStepData ────────────────────────────────────────────────────────

describe('step.saveStepData', () => {
  it('upserts step data and returns { ok: true }', async () => {
    const { ctx, tx } = makeCtx();
    const caller = stepRouter.createCaller(ctx);
    const result = await caller.saveStepData({ stepKey: 'step-1', inputs: { text: 'hello' } });
    expect(result).toEqual({ ok: true });
    expect(tx.stepData.upsert).toHaveBeenCalledOnce();
    const upsertCall = tx.stepData.upsert.mock.calls[0]?.[0] as {
      where: { accountId_stepKey: { accountId: number; stepKey: string } };
      create: { stepKey: string; inputs: unknown; traceId: string | null };
    };
    expect(upsertCall.where.accountId_stepKey).toMatchObject({ accountId: 1, stepKey: 'step-1' });
    expect(upsertCall.create.inputs).toEqual({ text: 'hello' });
  });

  it('passes traceId from ctx to upsert', async () => {
    const { ctx, tx } = makeCtx();
    const caller = stepRouter.createCaller(ctx);
    await caller.saveStepData({ stepKey: 'step-2', inputs: {} });
    const upsertCall = tx.stepData.upsert.mock.calls[0]?.[0] as {
      update: { traceId: string | null };
    };
    expect(upsertCall.update.traceId).toBe('test-trace-us008');
  });

  it('zod: rejects stepKey longer than 16 chars', async () => {
    const { ctx } = makeCtx();
    const caller = stepRouter.createCaller(ctx);
    await expect(
      caller.saveStepData({ stepKey: 'this-key-is-too-long-17', inputs: {} }),
    ).rejects.toThrow();
  });

  it('zod: accepts empty inputs object', async () => {
    const { ctx } = makeCtx();
    const caller = stepRouter.createCaller(ctx);
    await expect(caller.saveStepData({ stepKey: 'k', inputs: {} })).resolves.toEqual({ ok: true });
  });
});

// ─── auth.me ─────────────────────────────────────────────────────────────────

describe('auth.me', () => {
  it('returns unauthenticated stub when no user in ctx', async () => {
    const { ctx } = makeCtx({ user: null });
    const caller = authRouter.createCaller(ctx);
    const result = await caller.me();
    expect(result).toEqual({ ok: false, error: 'unauthenticated' });
  });

  it('returns user info when authenticated', async () => {
    const { ctx } = makeCtx({
      user: { id: 7, email: 'test@example.com', name: 'Test User', activeAccountId: 1 },
    });
    const caller = authRouter.createCaller(ctx);
    const result = await caller.me();
    expect(result).toMatchObject({ ok: true });
    if (result.ok) {
      expect(result.user).toMatchObject({
        id: 7,
        email: 'test@example.com',
        name: 'Test User',
      });
    }
  });

  it('exposes only id, email, name (not password or session data)', async () => {
    const { ctx } = makeCtx({
      user: {
        id: 3,
        email: 'safe@example.com',
        name: 'Safe User',
        activeAccountId: null,
        secretField: 'should-not-appear',
      },
    });
    const caller = authRouter.createCaller(ctx);
    const result = await caller.me();
    if (result.ok) {
      const keys = Object.keys(result.user);
      expect(keys).toContain('id');
      expect(keys).toContain('email');
      expect(keys).toContain('name');
      expect(keys).not.toContain('secretField');
    }
  });
});
