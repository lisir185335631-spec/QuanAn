/**
 * Unit tests — PRD-2 US-003
 * ipAccounts: list/active/create/update/delete/switchActive (AC-1, AC-5, AC-6)
 * stepData: get/getAll/save/progress (AC-2, AC-7, AC-8)
 * AC-11: ≥ 10 unit tests · ≥ 1 per procedure
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';
import { ipAccountsRouter } from '@/trpc/routers/ipAccounts';
import { stepDataRouter } from '@/trpc/routers/stepData';

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

// ─── Helper: build a minimal tRPC context mock ───────────────────────────────

type AuditLogCreateArgs = {
  data: { eventType: string; accountId: number; userId: number; payload: unknown };
};

function makeCtx(overrides: Record<string, unknown> = {}) {
  const methods = {
    ipAccount: {
      findMany: vi.fn(async () => []),
      findUnique: vi.fn(async () => null),
      findFirst: vi.fn(async () => null),
      create: vi.fn(async (args: { data: Record<string, unknown> }) => ({ id: 99, ...args.data })),
      update: vi.fn(async (args: { data: Record<string, unknown> }) => ({ id: 1, ...args.data })),
    },
    stepData: {
      findMany: vi.fn(async () => []),
      findFirst: vi.fn(async () => null),
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
    },
    user: {
      update: vi.fn(async () => ({})),
    },
    auditLog: {
      create: vi.fn(async (_args: AuditLogCreateArgs) => ({})),
    },
  };

  // tx mirrors the same methods + $executeRaw; passed to resolver by accountIsolationMiddleware
  const tx = {
    ...methods,
    $executeRaw: vi.fn(async () => 0),
  };

  const prisma = {
    ...methods,
    // accountIsolationMiddleware calls $transaction(fn) → fn(tx)
    $transaction: vi.fn(async (fn: (tx: typeof tx) => Promise<unknown>) => fn(tx)),
    _tx: tx,
  };

  return {
    ctx: {
      traceId: 'test-trace-001',
      activeAccountId: 1 as number | null,
      user: { id: 42, activeAccountId: 1 } as { id: number; activeAccountId: number | null } | null,
      prisma,
      req: new Request('http://localhost'),
      sessionId: 'sess-001',
      ...overrides,
    },
    prisma,
  };
}

// ─── ipAccounts router ────────────────────────────────────────────────────────

describe('ipAccounts.list', () => {
  it('AC-5: calls findMany without explicit where:{userId} (RLS handles it)', async () => {
    const { ctx, prisma } = makeCtx();
    prisma.ipAccount.findMany.mockResolvedValueOnce([
      { id: 1, name: 'Test IP', industry: 'beauty', platform: 'douyin', stage: 'starter', isActive: true, followersRange: '0-1000' },
    ]);
    const caller = ipAccountsRouter.createCaller(ctx);
    const result = await caller.list();
    expect(prisma.ipAccount.findMany).toHaveBeenCalledOnce();
    // Must NOT pass where:{userId} — RLS handles it
    const callArgs = prisma.ipAccount.findMany.mock.calls[0]?.[0] as { where?: unknown } | undefined;
    expect(callArgs?.where).toBeUndefined();
    expect(result).toHaveLength(1);
  });
});

describe('ipAccounts.active', () => {
  it('returns the active account by activeAccountId', async () => {
    const { ctx, prisma } = makeCtx({ activeAccountId: 7 });
    const mockAccount = { id: 7, name: 'IP 7', industry: 'food', platform: 'kuaishou', stage: 'growth', isActive: true, followersRange: '1k-10k' };
    prisma.ipAccount.findUnique.mockResolvedValueOnce(mockAccount);
    const caller = ipAccountsRouter.createCaller(ctx);
    const result = await caller.active();
    expect(prisma.ipAccount.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 7 },
    }));
    expect(result).toEqual(mockAccount);
  });

  it('returns null when account not found', async () => {
    const { ctx } = makeCtx({ activeAccountId: 99 });
    const caller = ipAccountsRouter.createCaller(ctx);
    const result = await caller.active();
    expect(result).toBeNull();
  });
});

describe('ipAccounts.create', () => {
  it('creates account with user.id from context', async () => {
    const { ctx, prisma } = makeCtx();
    const caller = ipAccountsRouter.createCaller(ctx);
    await caller.create({ name: 'New IP', industry: 'tech', platform: 'bilibili', stage: 'starter' });
    expect(prisma.ipAccount.create).toHaveBeenCalledOnce();
    const createArgs = prisma.ipAccount.create.mock.calls[0]?.[0] as { data: { userId: number } };
    expect(createArgs.data.userId).toBe(42);
  });
});

describe('ipAccounts.update', () => {
  it('updates the active account (where:{id: activeAccountId})', async () => {
    const { ctx, prisma } = makeCtx({ activeAccountId: 5 });
    prisma.ipAccount.update.mockResolvedValueOnce({ id: 5, name: 'Updated', industry: 'food', platform: 'wechat', stage: 'growth', isActive: true, followersRange: '1k-10k' });
    const caller = ipAccountsRouter.createCaller(ctx);
    await caller.update({ name: 'Updated' });
    expect(prisma.ipAccount.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 5 },
    }));
  });
});

describe('ipAccounts.delete', () => {
  it('soft-deletes by setting isActive=false + archivedAt', async () => {
    const { ctx, prisma } = makeCtx();
    prisma.ipAccount.update.mockResolvedValueOnce({});
    const caller = ipAccountsRouter.createCaller(ctx);
    const result = await caller.delete({ accountId: 3 });
    expect(result).toEqual({ ok: true });
    const updateArgs = prisma.ipAccount.update.mock.calls[0]?.[0] as { data: { isActive: boolean; archivedAt: Date } };
    expect(updateArgs.data.isActive).toBe(false);
    expect(updateArgs.data.archivedAt).toBeInstanceOf(Date);
  });
});

describe('ipAccounts.switchActive', () => {
  it('AC-6: updates user.activeAccountId and writes audit_log', async () => {
    const { ctx, prisma } = makeCtx();
    prisma.ipAccount.findFirst.mockResolvedValueOnce({ id: 2 });
    const caller = ipAccountsRouter.createCaller(ctx);
    const result = await caller.switchActive({ accountId: 2 });
    expect(result).toMatchObject({ ok: true, activeAccountId: 2 });
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { activeAccountId: 2 },
    }));
    expect(prisma.auditLog.create).toHaveBeenCalledOnce();
    const auditArgs = prisma.auditLog.create.mock.calls[0]?.[0] as AuditLogCreateArgs;
    expect(auditArgs.data.eventType).toBe('account.switch');
  });

  it('AC-6: throws UNAUTHORIZED when user is null', async () => {
    const { ctx } = makeCtx({ user: null });
    const caller = ipAccountsRouter.createCaller(ctx);
    await expect(caller.switchActive({ accountId: 1 })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });

  it('AC-6: throws NOT_FOUND when account does not belong to user', async () => {
    const { ctx } = makeCtx();
    // findFirst returns null → account not found / not owned
    const caller = ipAccountsRouter.createCaller(ctx);
    await expect(caller.switchActive({ accountId: 999 })).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'account_not_found',
    });
  });
});

// ─── stepData router ──────────────────────────────────────────────────────────

describe('stepData.get', () => {
  it('AC-8: queries by stepKey only (no accountId — RLS handles it)', async () => {
    const { ctx, prisma } = makeCtx();
    prisma.stepData.findFirst.mockResolvedValueOnce({ stepKey: 'step1', inputs: {}, result: null, version: 1, updatedAt: new Date() });
    const caller = stepDataRouter.createCaller(ctx);
    const result = await caller.get({ stepKey: 'step1' });
    expect(result).not.toBeNull();
    const callArgs = prisma.stepData.findFirst.mock.calls[0]?.[0] as { where: { stepKey: string; accountId?: unknown } };
    expect(callArgs.where.accountId).toBeUndefined();
    expect(callArgs.where.stepKey).toBe('step1');
  });

  it('returns null when stepKey not found', async () => {
    const { ctx } = makeCtx();
    const caller = stepDataRouter.createCaller(ctx);
    const result = await caller.get({ stepKey: 'step3' });
    expect(result).toBeNull();
  });
});

describe('stepData.getAll', () => {
  it('calls findMany without where:{accountId} (RLS handles it)', async () => {
    const { ctx, prisma } = makeCtx();
    prisma.stepData.findMany.mockResolvedValueOnce([]);
    const caller = stepDataRouter.createCaller(ctx);
    const result = await caller.getAll();
    expect(Array.isArray(result)).toBe(true);
    const callArgs = prisma.stepData.findMany.mock.calls[0]?.[0] as { where?: unknown } | undefined;
    expect(callArgs?.where).toBeUndefined();
  });
});

describe('stepData.save', () => {
  it('AC-7: upserts with accountId_stepKey composite key', async () => {
    const { ctx, prisma } = makeCtx({ activeAccountId: 3 });
    const caller = stepDataRouter.createCaller(ctx);
    const result = await caller.save({ stepKey: 'step1', inputs: { industry: 'beauty' } });
    expect(result.ok).toBe(true);
    expect(result.data).toBeDefined();
    const upsertArgs = prisma.stepData.upsert.mock.calls[0]?.[0] as {
      where: { accountId_stepKey: { accountId: number; stepKey: string } };
    };
    expect(upsertArgs.where.accountId_stepKey.accountId).toBe(3);
    expect(upsertArgs.where.accountId_stepKey.stepKey).toBe('step1');
  });
});

describe('stepData.progress', () => {
  it('returns completed/total counts for the current account', async () => {
    const { ctx, prisma } = makeCtx();
    prisma.stepData.findMany.mockResolvedValueOnce([
      { stepKey: 'step1' },
      { stepKey: 'step3' },
      { stepKey: 'step5' },
    ]);
    const caller = stepDataRouter.createCaller(ctx);
    const result = await caller.progress();
    expect(result.total).toBe(9);
    expect(result.completed).toBe(3);
    expect(result.completedKeys).toContain('step1');
  });

  it('returns zero completed when no step data exists', async () => {
    const { ctx } = makeCtx();
    const caller = stepDataRouter.createCaller(ctx);
    const result = await caller.progress();
    expect(result.completed).toBe(0);
    expect(result.total).toBe(9);
  });
});
