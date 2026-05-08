/**
 * Unit tests — PRD-2 US-006
 * trending router: 3 procedures (fetch/listByIndustry/listByStyle)
 * AC-5: trending 走全局表 — globalProcedure (no $transaction, no RLS)
 */

import { describe, it, expect } from 'vitest';
import { trendingRouter } from '@/trpc/routers/trending';

// ─── Helper: minimal context for globalProcedure (no $transaction needed) ─────

function makeCtx() {
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

// ─── trending.fetch ───────────────────────────────────────────────────────────

describe('trending.fetch', () => {
  it('AC-5: returns mock TrendingItem array without RLS transaction', async () => {
    const { ctx } = makeCtx();
    const caller = trendingRouter.createCaller(ctx);
    const result = await caller.fetch({});
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('platform');
    expect(result[0]).toHaveProperty('title');
  });
});

// ─── trending.listByIndustry ──────────────────────────────────────────────────

describe('trending.listByIndustry', () => {
  it('returns mock items with the requested industry', async () => {
    const { ctx } = makeCtx();
    const caller = trendingRouter.createCaller(ctx);
    const result = await caller.listByIndustry({ industry: '美食' });
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]?.industry).toBe('美食');
  });
});

// ─── trending.listByStyle ─────────────────────────────────────────────────────

describe('trending.listByStyle', () => {
  it('returns mock items with the requested presentStyle', async () => {
    const { ctx } = makeCtx();
    const caller = trendingRouter.createCaller(ctx);
    const result = await caller.listByStyle({ presentStyle: 'vlog' });
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]?.presentStyle).toBe('vlog');
  });
});
