/**
 * Unit tests — PRD-3 US-001 (TD-012 merge)
 * Migrated from alias routers (account/step) → canonical routers (ipAccounts/stepData)
 * ipAccounts.active / ipAccounts.switchActive / stepData.save / auth.me
 * AC-8: TD-012 合并不破坏现有 174 tests
 */

import { describe, it, expect, vi } from 'vitest';
import { ipAccountsRouter } from '@/trpc/routers/ipAccounts';
import { stepDataRouter } from '@/trpc/routers/stepData';
import { authRouter } from '@/trpc/routers/auth';

// Mock PositioningAgent so stepData.save tests don't hit real LLM (US-004 integration)
vi.mock('@/specialists/PositioningAgent', () => ({
  positioningAgent: {
    execute: vi.fn().mockResolvedValue({
      result: { industry: 'beauty', marketAnalysis: 'mock', competitionLevel: 'high', recommendation: 'mock' },
      isFallback: false,
      durationMs: 50,
      tokensUsed: { prompt: 10, completion: 20, total: 30 },
      modelUsed: 'claude-sonnet-4-6',
      traceId: 'mock-trace',
    }),
  },
}));

// ─── Helper: build a minimal tRPC context mock ────────────────────────────────

function makeCtx(overrides: Record<string, unknown> = {}) {
  const ipAccount = {
    findUnique: vi.fn(async () => null as unknown),
    findFirst: vi.fn(async () => null as unknown),
    create: vi.fn(async (args: { data: Record<string, unknown> }) => ({ id: 99, ...args.data })),
    update: vi.fn(async (args: { data: Record<string, unknown> }) => args.data),
  };
  const user = {
    update: vi.fn(async () => ({})),
  };
  const stepData = {
    upsert: vi.fn(async (args: { create: Record<string, unknown> }) => ({
      stepKey: args.create['stepKey'] as string,
      inputs: args.create['inputs'],
      result: null,
      version: 0,
      updatedAt: new Date(),
    })),
    update: vi.fn(async (args: { data: Record<string, unknown>; where: unknown }) => ({
      stepKey: 'step1',
      inputs: {},
      result: args.data['result'] ?? null,
      version: 1,
      updatedAt: new Date(),
    })),
  };
  const auditLog = {
    create: vi.fn(async () => ({})),
  };
  const tx = {
    ipAccount,
    user,
    stepData,
    auditLog,
    $executeRaw: vi.fn(async () => 0),
  };
  const prisma = {
    ipAccount,
    user,
    stepData,
    auditLog,
    $transaction: vi.fn(async (fn: (tx: typeof tx) => Promise<unknown>) => fn(tx)),
    _tx: tx,
  };

  return {
    ctx: {
      traceId: 'test-trace-us001-td012',
      activeAccountId: 1 as number | null,
      user: { id: 7, activeAccountId: 1 } as { id: number; activeAccountId: number | null } | null,
      prisma,
      req: new Request('http://localhost', { headers: { 'x-trace-id': 'test-trace-us001-td012' } }),
      sessionId: 'sess-us001',
      ...overrides,
    },
    prisma,
    ipAccount,
    user,
    stepData,
    auditLog,
    tx,
  };
}

// ─── ipAccounts.active (replaces account.getActive) ──────────────────────────

describe('ipAccounts.active', () => {
  it('returns null when no account found', async () => {
    const { ctx } = makeCtx();
    const caller = ipAccountsRouter.createCaller(ctx);
    const result = await caller.active();
    expect(result).toBeNull();
  });

  // PRD-23 d1dbfc1 改 globalProcedure · findUnique → findFirst with explicit where:{id, userId}(PRD-26-prep 2026-05-21 同步)
  it('returns account data when found', async () => {
    const { ctx, ipAccount } = makeCtx();
    const mockAccount = {
      id: 1,
      name: 'Test Account',
      platform: 'douyin',
      stage: 'growth',
      industry: 'beauty',
      followersRange: '10k-50k',
      isActive: true,
    };
    ipAccount.findFirst.mockResolvedValueOnce(mockAccount);
    const caller = ipAccountsRouter.createCaller(ctx);
    const result = await caller.active();
    expect(result).toMatchObject({ id: 1, name: 'Test Account', platform: 'douyin' });
  });

  it('queries with activeAccountId from ctx', async () => {
    const { ctx, ipAccount } = makeCtx({ activeAccountId: 42 });
    const caller = ipAccountsRouter.createCaller(ctx);
    await caller.active();
    expect(ipAccount.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 42, userId: expect.any(Number) } }),
    );
  });
});

// ─── ipAccounts.switchActive (replaces account.switchActive) ──────────────────

describe('ipAccounts.switchActive', () => {
  it('updates user.activeAccountId and writes audit_log', async () => {
    const { ctx, tx, user, auditLog } = makeCtx();
    const mockFoundAccount = { id: 5 };
    tx.ipAccount.findFirst.mockResolvedValueOnce(mockFoundAccount);
    const caller = ipAccountsRouter.createCaller(ctx);
    const result = await caller.switchActive({ accountId: 5 });
    expect(result).toMatchObject({ ok: true, activeAccountId: 5 });
    expect(user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { activeAccountId: 5 } }),
    );
    expect(auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ eventType: 'account.switch' }) }),
    );
  });

  it('throws NOT_FOUND when account does not belong to user', async () => {
    const { ctx } = makeCtx();
    const caller = ipAccountsRouter.createCaller(ctx);
    await expect(caller.switchActive({ accountId: 999 })).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'account_not_found',
    });
  });

  it('throws UNAUTHORIZED when no user in ctx', async () => {
    const { ctx } = makeCtx({ user: null });
    const caller = ipAccountsRouter.createCaller(ctx);
    await expect(caller.switchActive({ accountId: 1 })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });

  it('zod: rejects non-positive accountId', async () => {
    const { ctx } = makeCtx();
    const caller = ipAccountsRouter.createCaller(ctx);
    await expect(caller.switchActive({ accountId: 0 })).rejects.toThrow();
    await expect(caller.switchActive({ accountId: -1 })).rejects.toThrow();
  });

  it('zod: rejects non-integer accountId', async () => {
    const { ctx } = makeCtx();
    const caller = ipAccountsRouter.createCaller(ctx);
    await expect(caller.switchActive({ accountId: 1.5 })).rejects.toThrow();
  });
});

// ─── stepData.save (replaces step.saveStepData) ───────────────────────────────

describe('stepData.save', () => {
  it('upserts step data and returns { ok: true, data }', async () => {
    const { ctx, tx } = makeCtx();
    const caller = stepDataRouter.createCaller(ctx);
    const result = await caller.save({ stepKey: 'step1', inputs: { text: 'hello' } });
    expect(result).toMatchObject({ ok: true });
    expect(result).toHaveProperty('data');
    expect(tx.stepData.upsert).toHaveBeenCalledOnce();
    const upsertCall = tx.stepData.upsert.mock.calls[0]?.[0] as {
      where: { accountId_stepKey: { accountId: number; stepKey: string } };
      create: { stepKey: string; inputs: unknown; traceId: string | null };
    };
    expect(upsertCall.where.accountId_stepKey).toMatchObject({ accountId: 1, stepKey: 'step1' });
    expect(upsertCall.create.inputs).toEqual({ text: 'hello' });
  });

  it('passes traceId from ctx to upsert', async () => {
    const { ctx, tx } = makeCtx();
    const caller = stepDataRouter.createCaller(ctx);
    await caller.save({ stepKey: 'step2', inputs: {} });
    const upsertCall = tx.stepData.upsert.mock.calls[0]?.[0] as {
      update: { traceId: string | null };
    };
    expect(upsertCall.update.traceId).toBe('test-trace-us001-td012');
  });

  it('zod: rejects empty stepKey', async () => {
    const { ctx } = makeCtx();
    const caller = stepDataRouter.createCaller(ctx);
    await expect(caller.save({ stepKey: '', inputs: {} })).rejects.toThrow();
  });

  it('zod: accepts empty inputs object', async () => {
    const { ctx } = makeCtx();
    const caller = stepDataRouter.createCaller(ctx);
    await expect(caller.save({ stepKey: 'step2', inputs: {} })).resolves.toMatchObject({ ok: true });
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
