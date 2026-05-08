/**
 * Unit tests — PRD-4 US-014
 * costLog.logFeedback: writes to cost_log with eventType='good'|'bad'
 * AC-18: ≥ 4 tests · logFeedback / event_type enum / RLS isolation / target JSON complete
 * AC-10: type not in ['good','bad'] → zod rejection
 * AC-11: traceId fallback
 * AC-12: DB error → { ok: false } without throwing
 * AC-20: logFeedback < 50ms (single INSERT)
 */

import { describe, it, expect, vi } from 'vitest';
import { costLogRouter } from '@/trpc/routers/costLog';

// ─── Helper: build minimal tRPC context matching protectedProcedure expectations ─

function makeCtx(overrides: Record<string, unknown> = {}) {
  // costLog.create lives on tx (the transaction client passed to the resolver)
  const costLog = {
    create: vi.fn(async (args: { data: Record<string, unknown> }) => ({
      id: BigInt(1),
      ...args.data,
    })),
  };

  const tx = {
    costLog,
    $executeRaw: vi.fn(async () => 0),
  };

  const prisma = {
    costLog,
    $transaction: vi.fn(async (fn: (tx: typeof tx) => Promise<unknown>) => fn(tx)),
    _tx: tx,
  };

  return {
    ctx: {
      traceId: 'test-trace-us014',
      activeAccountId: 7 as number | null,
      user: { id: 3, activeAccountId: 7 } as { id: number; activeAccountId: number | null } | null,
      prisma,
      req: new Request('http://localhost', { headers: { 'x-trace-id': 'test-trace-us014' } }),
      sessionId: null,
      ...overrides,
    } as unknown,
    costLog,
    tx,
    prisma,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('costLog.logFeedback', () => {
  it('AC-18-1: logFeedback writes cost_log with eventType=good and correct fields', async () => {
    const { ctx, costLog } = makeCtx();
    const caller = costLogRouter.createCaller(ctx as Parameters<typeof costLogRouter.createCaller>[0]);

    const result = await caller.logFeedback({
      stepKey: 'step1',
      agentId: 'PositioningAgent',
      type: 'good',
    });

    expect(result).toEqual({ ok: true });
    expect(costLog.create).toHaveBeenCalledOnce();
    const data = costLog.create.mock.calls[0][0].data as Record<string, unknown>;
    expect(data['eventType']).toBe('good');
    expect(data['agentId']).toBe('PositioningAgent');
    expect(data['callType']).toBe('feedback');
    expect(data['accountId']).toBe(7);
  });

  it("AC-18-2: event_type enum — 'bad' maps correctly", async () => {
    const { ctx, costLog } = makeCtx();
    const caller = costLogRouter.createCaller(ctx as Parameters<typeof costLogRouter.createCaller>[0]);

    await caller.logFeedback({ stepKey: 'step3', agentId: 'BrandingAgent', type: 'bad' });

    const data = costLog.create.mock.calls[0][0].data as Record<string, unknown>;
    expect(data['eventType']).toBe('bad');
  });

  it('AC-18-3: RLS isolation — accountId comes from ctx.activeAccountId, not input', async () => {
    // protectedProcedure injects activeAccountId from ctx — no input.accountId allowed
    const { ctx, costLog } = makeCtx({ activeAccountId: 42 });
    const caller = costLogRouter.createCaller(ctx as Parameters<typeof costLogRouter.createCaller>[0]);

    await caller.logFeedback({ stepKey: 'step5', agentId: 'TopicAgent', type: 'good' });

    const data = costLog.create.mock.calls[0][0].data as Record<string, unknown>;
    expect(data['accountId']).toBe(42);
  });

  it('AC-18-4: target JSON complete — stepKey + agentId + traceId all present', async () => {
    const { ctx, costLog } = makeCtx();
    const caller = costLogRouter.createCaller(ctx as Parameters<typeof costLogRouter.createCaller>[0]);

    await caller.logFeedback({
      stepKey: 'step1',
      agentId: 'PositioningAgent',
      type: 'good',
      traceId: 'explicit-trace-001',
    });

    const data = costLog.create.mock.calls[0][0].data as Record<string, unknown>;
    const target = data['target'] as Record<string, unknown>;
    expect(target).toMatchObject({
      stepKey: 'step1',
      agentId: 'PositioningAgent',
    });
    expect(typeof target['traceId']).toBe('string');
    expect((target['traceId'] as string).length).toBeGreaterThan(0);
  });

  it('AC-10: type not in [good,bad] → zod input rejection', async () => {
    const { ctx } = makeCtx();
    const caller = costLogRouter.createCaller(ctx as Parameters<typeof costLogRouter.createCaller>[0]);

    await expect(
      caller.logFeedback({ stepKey: 'step1', agentId: 'PositioningAgent', type: 'neutral' as never }),
    ).rejects.toThrow();
  });

  it('AC-12: DB error → returns { ok: false } without throwing', async () => {
    const { ctx, costLog } = makeCtx();
    costLog.create.mockRejectedValueOnce(new Error('DB connection lost'));
    const caller = costLogRouter.createCaller(ctx as Parameters<typeof costLogRouter.createCaller>[0]);

    const result = await caller.logFeedback({
      stepKey: 'step1',
      agentId: 'PositioningAgent',
      type: 'good',
    });

    expect(result).toEqual({ ok: false });
  });

  it('AC-11: traceId propagated from x-trace-id header into cost_log', async () => {
    // traceMiddleware reads x-trace-id from headers → injects into ctx.traceId → costLog.create
    const { ctx, costLog } = makeCtx({
      req: new Request('http://localhost', { headers: { 'x-trace-id': 'header-trace-xyz' } }),
    });
    const caller = costLogRouter.createCaller(ctx as Parameters<typeof costLogRouter.createCaller>[0]);

    await caller.logFeedback({ stepKey: 'step1', agentId: 'PositioningAgent', type: 'good' });

    const data = costLog.create.mock.calls[0][0].data as Record<string, unknown>;
    expect(data['traceId']).toBe('header-trace-xyz');
  });

  it('AC-20: logFeedback < 50ms (single INSERT with mock DB)', async () => {
    const { ctx } = makeCtx();
    const caller = costLogRouter.createCaller(ctx as Parameters<typeof costLogRouter.createCaller>[0]);

    const start = Date.now();
    await caller.logFeedback({ stepKey: 'step1', agentId: 'PositioningAgent', type: 'good' });
    expect(Date.now() - start).toBeLessThan(50);
  });
});
