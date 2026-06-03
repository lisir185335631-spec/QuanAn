/**
 * Unit tests — PRD-2 US-006 / PRD-15 US-006
 * trending router: legacy procedures (fetch/listByIndustry/listByStyle)
 *                  + favorite mutation (dangling-ref guard)
 * AC-5: trending 走全局表 — globalProcedure (no $transaction, no RLS)
 * AC-7: favorite uses protectedProcedure · validates trendingItemId exists before write
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── vi.hoisted: shared mock state for module-level prisma ────────────────────

const mockState = vi.hoisted(() => ({
  trendingItemExists: null as { id: number } | null,
  upsertCalls: [] as Array<{ accountId: number; trendingItemId: number }>,
  deleteCalls: [] as Array<{ accountId: number; trendingItemId: number }>,
}));

// ── Mock module-level prisma (imported directly in trending.ts) ───────────────

vi.mock('@/lib/prisma', () => ({
  prisma: {
    trendingItem: {
      findUnique: vi.fn(async () => mockState.trendingItemExists),
    },
    trendingFavorite: {
      upsert: vi.fn(async (args: { create: { accountId: number; trendingItemId: number } }) => {
        mockState.upsertCalls.push({ accountId: args.create.accountId, trendingItemId: args.create.trendingItemId });
        return { id: 1, accountId: args.create.accountId, trendingItemId: args.create.trendingItemId, createdAt: new Date() };
      }),
      deleteMany: vi.fn(async (args: { where: { accountId: number; trendingItemId: number } }) => {
        mockState.deleteCalls.push({ accountId: args.where.accountId, trendingItemId: args.where.trendingItemId });
        return { count: 1 };
      }),
    },
  },
}));

// ── Import router after mocks ─────────────────────────────────────────────────

import { trendingRouter } from '@/trpc/routers/app/trending';

// ── Helper: context for globalProcedure (no $transaction needed) ──────────────

function makePublicCtx() {
  return {
    ctx: {
      traceId: 'test-trace-001',
      activeAccountId: null as number | null,
      user: null,
      prisma: {},
      req: new Request('http://localhost', { headers: { 'x-trace-id': 'test-trace-001' } }),
      sessionId: null,
    },
  };
}

// ── Helper: context for protectedProcedure (needs $transaction + $executeRaw) ─
// protectedProcedure replaces ctx.prisma with tx inside the callback,
// but trending.ts favorite uses the module-level prisma (mocked above).

function makeProtectedCtx(accountId = 1) {
  const tx = {
    $executeRaw: vi.fn(async () => 0),
  };
  const ctxPrisma = {
    $executeRaw: vi.fn(async () => 0),
    $transaction: vi.fn(async (fn: (tx: typeof tx) => Promise<unknown>) => fn(tx)),
  };
  return {
    ctx: {
      traceId: 'test-trace-002',
      activeAccountId: accountId as number | null,
      user: { id: 99, activeAccountId: accountId } as { id: number; activeAccountId: number | null } | null,
      prisma: ctxPrisma,
      req: new Request('http://localhost', { headers: { 'x-trace-id': 'test-trace-002' } }),
      sessionId: 'sess-001',
    },
  };
}

// ── Reset state between tests ─────────────────────────────────────────────────

beforeEach(() => {
  mockState.trendingItemExists = null;
  mockState.upsertCalls = [];
  mockState.deleteCalls = [];
  vi.clearAllMocks();
});

// ── trending.fetch ────────────────────────────────────────────────────────────

describe('trending.fetch', () => {
  it('AC-5: returns mock TrendingItem array without RLS transaction', async () => {
    const { ctx } = makePublicCtx();
    const caller = trendingRouter.createCaller(ctx);
    const result = await caller.fetch({});
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('platform');
    expect(result[0]).toHaveProperty('title');
  });
});

// ── trending.listByIndustry ───────────────────────────────────────────────────

describe('trending.listByIndustry', () => {
  it('returns mock items with the requested industry', async () => {
    const { ctx } = makePublicCtx();
    const caller = trendingRouter.createCaller(ctx);
    const result = await caller.listByIndustry({ industry: '美食' });
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]?.industry).toBe('美食');
  });
});

// ── trending.listByStyle ──────────────────────────────────────────────────────

describe('trending.listByStyle', () => {
  it('returns mock items with the requested presentStyle', async () => {
    const { ctx } = makePublicCtx();
    const caller = trendingRouter.createCaller(ctx);
    const result = await caller.listByStyle({ presentStyle: 'vlog' });
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]?.presentStyle).toBe('vlog');
  });
});

// ── trending.favorite — dangling-ref guard ────────────────────────────────────

describe('trending.favorite — non-existent trendingItemId', () => {
  it('AC-7: skips write and returns { favorited: false, skipped: true } when trendingItem does not exist', async () => {
    // Arrange: item not in DB (mock returns null)
    mockState.trendingItemExists = null;

    const { ctx } = makeProtectedCtx(1);
    const caller = trendingRouter.createCaller(ctx);

    // Act
    const result = await caller.favorite({ trendingItemId: 99, action: 'add' });

    // Assert: no write occurred
    expect(result).toEqual({ favorited: false, skipped: true });
    expect(mockState.upsertCalls).toHaveLength(0);
    expect(mockState.deleteCalls).toHaveLength(0);
  });

  it('AC-7: remove action on non-existent item also skips and returns skipped: true', async () => {
    mockState.trendingItemExists = null;

    const { ctx } = makeProtectedCtx(1);
    const caller = trendingRouter.createCaller(ctx);
    const result = await caller.favorite({ trendingItemId: 99, action: 'remove' });

    expect(result).toEqual({ favorited: false, skipped: true });
    expect(mockState.deleteCalls).toHaveLength(0);
  });
});

describe('trending.favorite — existing trendingItemId', () => {
  it('AC-7: add action upserts and returns { favorited: true } when item exists', async () => {
    // Arrange: item exists in DB
    mockState.trendingItemExists = { id: 42 };

    const { ctx } = makeProtectedCtx(1);
    const caller = trendingRouter.createCaller(ctx);

    const result = await caller.favorite({ trendingItemId: 42, action: 'add' });

    expect(result).toMatchObject({ favorited: true });
    expect(result.skipped).toBeUndefined();
    expect(mockState.upsertCalls).toHaveLength(1);
    expect(mockState.upsertCalls[0]).toMatchObject({ accountId: 1, trendingItemId: 42 });
    expect(mockState.deleteCalls).toHaveLength(0);
  });

  it('AC-7: remove action deletes and returns { favorited: false } when item exists', async () => {
    mockState.trendingItemExists = { id: 42 };

    const { ctx } = makeProtectedCtx(1);
    const caller = trendingRouter.createCaller(ctx);

    const result = await caller.favorite({ trendingItemId: 42, action: 'remove' });

    expect(result).toMatchObject({ favorited: false });
    expect(result.skipped).toBeUndefined();
    expect(mockState.deleteCalls).toHaveLength(1);
    expect(mockState.deleteCalls[0]).toMatchObject({ accountId: 1, trendingItemId: 42 });
    expect(mockState.upsertCalls).toHaveLength(0);
  });
});
