/**
 * Unit tests — PRD-2 US-006
 * invite router: redeem procedure
 * AC-3: check InviteCode + mark used + link user
 * AC-4: duplicate redeem → CONFLICT 409
 */

import { describe, it, expect, vi } from 'vitest';
import { inviteRouter } from '@/trpc/routers/app/invite';
// Note: @trpc/server lives in apps/api/node_modules — cannot import directly in root vitest.
// Check TRPCError fields via toMatchObject instead.

// ─── Mock data ────────────────────────────────────────────────────────────────

const UNUSED_INVITE = {
  id: 1,
  code: 'WELCOME2026',
  isActive: true,
  maxUses: 1,
  usedCount: 0,
  usedById: null,
  usedAt: null,
  expiresAt: null,
  createdAt: new Date('2026-01-01'),
};

const USED_INVITE = {
  ...UNUSED_INVITE,
  usedCount: 1,
  usedById: 99,
  usedAt: new Date('2026-01-02'),
};

// ─── Helper: context for globalProcedure ─────────────────────────────────────

function makeCtx(
  findUniqueResult: unknown,
  overrides: Record<string, unknown> = {},
) {
  const inviteCode = {
    findUnique: vi.fn(async () => findUniqueResult),
    update: vi.fn(async () => ({
      ...UNUSED_INVITE,
      usedById: 42,
      usedAt: new Date(),
      usedCount: 1,
    })),
  };

  const prisma = { inviteCode };

  return {
    ctx: {
      traceId: 'test-trace-001',
      activeAccountId: null as number | null,
      user: { id: 42, activeAccountId: null } as { id: number; activeAccountId: number | null } | null,
      prisma,
      req: new Request('http://localhost', { headers: { 'x-trace-id': 'test-trace-001' } }),
      sessionId: null,
      ...overrides,
    },
    prisma,
    inviteCode,
  };
}

// ─── invite.redeem — success ──────────────────────────────────────────────────

describe('invite.redeem — success', () => {
  it('AC-3: calls findUnique then update with usedById=user.id and returns updated invite', async () => {
    const { ctx, inviteCode } = makeCtx(UNUSED_INVITE);
    const caller = inviteRouter.createCaller(ctx);
    const result = await caller.redeem({ code: 'WELCOME2026' });

    expect(inviteCode.findUnique).toHaveBeenCalledOnce();
    expect(inviteCode.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { code: 'WELCOME2026' } }),
    );

    expect(inviteCode.update).toHaveBeenCalledOnce();
    const updateArgs = inviteCode.update.mock.calls[0]?.[0] as {
      data: { usedById: number; usedAt: Date };
    };
    expect(updateArgs.data.usedById).toBe(42);
    expect(updateArgs.data.usedAt).toBeInstanceOf(Date);

    expect(result.usedById).toBe(42);
  });
});

// ─── invite.redeem — AC-4 duplicate CONFLICT ─────────────────────────────────

describe('invite.redeem — duplicate', () => {
  it('AC-4: already-used invite code → throws CONFLICT 409', async () => {
    const { ctx } = makeCtx(USED_INVITE);
    const caller = inviteRouter.createCaller(ctx);

    await expect(caller.redeem({ code: 'WELCOME2026' })).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'invite_code_already_used',
    });
  });
});

// ─── invite.redeem — not found ────────────────────────────────────────────────

describe('invite.redeem — not found', () => {
  it('unknown code → throws NOT_FOUND', async () => {
    const { ctx } = makeCtx(null);
    const caller = inviteRouter.createCaller(ctx);

    await expect(caller.redeem({ code: 'BADCODE' })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});

// ─── invite.redeem — unauthenticated ──────────────────────────────────────────

describe('invite.redeem — unauthenticated', () => {
  it('no user session → throws UNAUTHORIZED', async () => {
    const { ctx } = makeCtx(UNUSED_INVITE, { user: null });
    const caller = inviteRouter.createCaller(ctx);

    await expect(caller.redeem({ code: 'WELCOME2026' })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });
});
