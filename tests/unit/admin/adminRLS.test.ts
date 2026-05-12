// PRD-10 US-003 · adminRLS middleware unit tests (AC-10: 8 tests)
import { describe, it, expect, vi } from 'vitest';

import { adminRLSMiddleware } from '@/trpc/middleware/admin/adminRLS';

type RawFn = (opts: {
  ctx: unknown;
  meta?: unknown;
  next: (o?: { ctx?: unknown }) => Promise<unknown>;
}) => Promise<unknown>;

function extractFn(mw: unknown): RawFn {
  return (mw as { _middlewares: RawFn[] })._middlewares[0]!;
}

function makeMockPrisma() {
  const tx = {
    $executeRawUnsafe: vi.fn().mockResolvedValue(undefined),
  };
  const prisma = {
    $transaction: vi.fn().mockImplementation(
      async (fn: (tx: typeof tx) => Promise<unknown>) => fn(tx),
    ),
  };
  return { prisma, tx };
}

function makeCtx(prismaMock: unknown) {
  return {
    prisma: prismaMock,
    traceId: 'test-trace',
    req: new Request('http://localhost'),
    resHeaders: new Headers(),
    adminSession: null,
    activeAdminUser: null,
  };
}

describe('adminRLSMiddleware', () => {
  it('calls $transaction on ctx.prisma', async () => {
    const { prisma, tx: _tx } = makeMockPrisma();
    const next = vi.fn().mockResolvedValue({ ok: true });
    await extractFn(adminRLSMiddleware)({ ctx: makeCtx(prisma), next });
    expect(prisma.$transaction).toHaveBeenCalledOnce();
  });

  it('calls $executeRawUnsafe with set_config admin SQL inside transaction', async () => {
    const { prisma, tx } = makeMockPrisma();
    const next = vi.fn().mockResolvedValue({ ok: true });
    await extractFn(adminRLSMiddleware)({ ctx: makeCtx(prisma), next });
    expect(tx.$executeRawUnsafe).toHaveBeenCalledWith(
      "SELECT set_config('app.role', 'admin', true)",
    );
  });

  it('set_config SQL has true as 3rd argument (is_local=true / transaction-scoped)', async () => {
    const { prisma, tx } = makeMockPrisma();
    const next = vi.fn().mockResolvedValue({ ok: true });
    await extractFn(adminRLSMiddleware)({ ctx: makeCtx(prisma), next });
    const sql: string = tx.$executeRawUnsafe.mock.calls[0]?.[0] ?? '';
    expect(sql).toMatch(/set_config\s*\(.*,\s*'admin'\s*,\s*true\s*\)/);
  });

  it('injects ctx.adminPrisma = transaction client', async () => {
    const { prisma, tx } = makeMockPrisma();
    let capturedCtx: unknown;
    const next = vi.fn().mockImplementation(({ ctx: newCtx }: { ctx: unknown }) => {
      capturedCtx = newCtx;
      return Promise.resolve({ ok: true });
    });
    await extractFn(adminRLSMiddleware)({ ctx: makeCtx(prisma), next });
    expect((capturedCtx as { adminPrisma: unknown }).adminPrisma).toBe(tx);
  });

  it('sets ctx.crossAccountAccessed = true', async () => {
    const { prisma } = makeMockPrisma();
    let capturedCtx: unknown;
    const next = vi.fn().mockImplementation(({ ctx: newCtx }: { ctx: unknown }) => {
      capturedCtx = newCtx;
      return Promise.resolve({ ok: true });
    });
    await extractFn(adminRLSMiddleware)({ ctx: makeCtx(prisma), next });
    expect((capturedCtx as { crossAccountAccessed: boolean }).crossAccountAccessed).toBe(true);
  });

  it('original ctx properties are preserved in the new ctx passed to next()', async () => {
    const { prisma } = makeMockPrisma();
    const originalCtx = makeCtx(prisma);
    let capturedCtx: unknown;
    const next = vi.fn().mockImplementation(({ ctx: newCtx }: { ctx: unknown }) => {
      capturedCtx = newCtx;
      return Promise.resolve({ ok: true });
    });
    await extractFn(adminRLSMiddleware)({ ctx: originalCtx, next });
    expect((capturedCtx as { traceId: string }).traceId).toBe('test-trace');
  });

  it('propagates error from next() (transaction would auto-rollback)', async () => {
    const { prisma } = makeMockPrisma();
    const error = new Error('downstream_error');
    const next = vi.fn().mockRejectedValue(error);
    await expect(
      extractFn(adminRLSMiddleware)({ ctx: makeCtx(prisma), next }),
    ).rejects.toThrow('downstream_error');
  });

  it('$executeRawUnsafe is called before next()', async () => {
    const { prisma, tx } = makeMockPrisma();
    const callOrder: string[] = [];
    tx.$executeRawUnsafe.mockImplementation(async () => {
      callOrder.push('executeRaw');
    });
    const next = vi.fn().mockImplementation(async () => {
      callOrder.push('next');
      return { ok: true };
    });
    await extractFn(adminRLSMiddleware)({ ctx: makeCtx(prisma), next });
    expect(callOrder).toEqual(['executeRaw', 'next']);
  });
});
