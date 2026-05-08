/**
 * Unit tests — PRD-2 US-006
 * knowledge router: 7 procedures (getRecommendations/getScriptCases/getFavorites/addFavorite/removeFavorite/getNotes/addNote)
 * AC-6: addFavorite sets accountId · per-account RLS isolation via protectedProcedure
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { knowledgeRouter } from '@/trpc/routers/knowledge';

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_FAVORITE = {
  id: 1,
  accountId: 1,
  itemType: 'script_case',
  itemKey: 'mock-001',
  userTags: [],
  noteId: null,
  createdAt: new Date('2026-01-01'),
};

const MOCK_NOTE = {
  id: 1,
  accountId: 1,
  itemType: null as string | null,
  itemKey: null as string | null,
  content: 'test note',
  title: null as string | null,
  tags: [],
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

// ─── Helper: minimal tRPC context with mocked prisma ─────────────────────────
// Note: protectedProcedure wraps resolver in $transaction — tx must have $executeRaw

function makeCtx(overrides: Record<string, unknown> = {}) {
  const knowledgeFavorite = {
    findMany: vi.fn(async () => [{ ...MOCK_FAVORITE }]),
    create: vi.fn(async () => ({ ...MOCK_FAVORITE })),
    deleteMany: vi.fn(async () => ({ count: 1 })),
  };

  const knowledgeNote = {
    findMany: vi.fn(async () => [{ ...MOCK_NOTE }]),
    create: vi.fn(async () => ({ ...MOCK_NOTE })),
  };

  const tx = {
    knowledgeFavorite,
    knowledgeNote,
    $executeRaw: vi.fn(async () => 0),
  };

  const prisma = {
    knowledgeFavorite,
    knowledgeNote,
    $transaction: vi.fn(async (fn: (tx: typeof tx) => Promise<unknown>) => fn(tx)),
  };

  return {
    ctx: {
      traceId: 'test-trace-001',
      activeAccountId: 1 as number | null,
      user: { id: 42, activeAccountId: 1 } as { id: number; activeAccountId: number | null } | null,
      prisma,
      req: new Request('http://localhost', { headers: { 'x-trace-id': 'test-trace-001' } }),
      sessionId: 'sess-001',
      ...overrides,
    },
    prisma,
    tx,
    knowledgeFavorite,
    knowledgeNote,
  };
}

// ─── getRecommendations ───────────────────────────────────────────────────────

describe('knowledge.getRecommendations', () => {
  it('returns mock recommendation array without DB calls', async () => {
    const { ctx, prisma } = makeCtx();
    const caller = knowledgeRouter.createCaller(ctx);
    const result = await caller.getRecommendations({});
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toMatchObject({ itemType: 'script_case' });
    expect(prisma.knowledgeFavorite.findMany).not.toHaveBeenCalled();
  });
});

// ─── getScriptCases ───────────────────────────────────────────────────────────

describe('knowledge.getScriptCases', () => {
  it('returns mock script case array and echoes industry filter', async () => {
    const { ctx } = makeCtx();
    const caller = knowledgeRouter.createCaller(ctx);
    const result = await caller.getScriptCases({ industry: 'food' });
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]?.industry).toBe('food');
  });
});

// ─── getFavorites ─────────────────────────────────────────────────────────────

describe('knowledge.getFavorites', () => {
  it('calls knowledgeFavorite.findMany and returns favorites array', async () => {
    const { ctx, knowledgeFavorite } = makeCtx();
    const caller = knowledgeRouter.createCaller(ctx);
    const result = await caller.getFavorites({});
    expect(knowledgeFavorite.findMany).toHaveBeenCalledOnce();
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]?.accountId).toBe(1);
  });
});

// ─── addFavorite ──────────────────────────────────────────────────────────────

describe('knowledge.addFavorite', () => {
  it('AC-6: creates favorite with activeAccountId (per-account isolation)', async () => {
    const { ctx, knowledgeFavorite } = makeCtx();
    const caller = knowledgeRouter.createCaller(ctx);
    await caller.addFavorite({ itemType: 'script_case', itemKey: 'test-001' });
    expect(knowledgeFavorite.create).toHaveBeenCalledOnce();
    const createArgs = knowledgeFavorite.create.mock.calls[0]?.[0] as {
      data: { accountId: number; itemType: string; itemKey: string };
    };
    expect(createArgs.data.accountId).toBe(1);
    expect(createArgs.data.itemType).toBe('script_case');
    expect(createArgs.data.itemKey).toBe('test-001');
  });
});

// ─── removeFavorite ───────────────────────────────────────────────────────────

describe('knowledge.removeFavorite', () => {
  it('calls knowledgeFavorite.deleteMany with accountId+itemType+itemKey and returns {ok:true}', async () => {
    const { ctx, knowledgeFavorite } = makeCtx();
    const caller = knowledgeRouter.createCaller(ctx);
    const result = await caller.removeFavorite({ itemType: 'script_case', itemKey: 'test-001' });
    expect(result).toEqual({ ok: true });
    expect(knowledgeFavorite.deleteMany).toHaveBeenCalledOnce();
    const deleteArgs = knowledgeFavorite.deleteMany.mock.calls[0]?.[0] as {
      where: { accountId: number; itemType: string; itemKey: string };
    };
    expect(deleteArgs.where.accountId).toBe(1);
    expect(deleteArgs.where.itemType).toBe('script_case');
  });
});

// ─── getNotes ─────────────────────────────────────────────────────────────────

describe('knowledge.getNotes', () => {
  it('calls knowledgeNote.findMany and returns notes array', async () => {
    const { ctx, knowledgeNote } = makeCtx();
    const caller = knowledgeRouter.createCaller(ctx);
    const result = await caller.getNotes({});
    expect(knowledgeNote.findMany).toHaveBeenCalledOnce();
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]?.accountId).toBe(1);
  });
});

// ─── addNote ──────────────────────────────────────────────────────────────────

describe('knowledge.addNote', () => {
  it('creates note with activeAccountId and content', async () => {
    const { ctx, knowledgeNote } = makeCtx();
    const caller = knowledgeRouter.createCaller(ctx);
    await caller.addNote({ content: 'my note content' });
    expect(knowledgeNote.create).toHaveBeenCalledOnce();
    const createArgs = knowledgeNote.create.mock.calls[0]?.[0] as {
      data: { accountId: number; content: string };
    };
    expect(createArgs.data.accountId).toBe(1);
    expect(createArgs.data.content).toBe('my note content');
  });
});
