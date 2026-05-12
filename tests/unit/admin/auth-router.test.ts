// PRD-10 US-002 · admin auth router unit tests (8 tests)
// login/logout/me happy + error paths

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';

// ─── Module mocks ────────────────────────────────────────────────────────────
vi.mock('@/lib/prisma', () => ({
  prisma: {
    adminUser: { findUnique: vi.fn() },
    adminSession: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    adminAuditLog: { create: vi.fn().mockResolvedValue({}) },
  },
}));

vi.mock('@/lib/redis', () => ({
  redis: {
    set: vi.fn().mockResolvedValue('OK'),
    getex: vi.fn().mockResolvedValue('1'),
    del: vi.fn().mockResolvedValue(1),
  },
}));

import { prisma } from '@/lib/prisma';
import { adminAuthRouter } from '@/trpc/routers/admin/auth';
import type { AdminTRPCContext } from '@/server/context-admin';

const prismaMock = prisma as unknown as {
  adminUser: { findUnique: ReturnType<typeof vi.fn> };
  adminSession: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
  };
  adminAuditLog: { create: ReturnType<typeof vi.fn> };
};

function makeCtx(overrides?: Partial<AdminTRPCContext>): AdminTRPCContext {
  const resHeaders = new Headers();
  return {
    prisma: prisma as AdminTRPCContext['prisma'],
    traceId: 'test-trace',
    req: new Request('http://localhost/trpc/admin'),
    resHeaders,
    adminSession: null,
    activeAdminUser: null,
    ...overrides,
  };
}

// Helper to call router procedure with caller pattern
function makeAdminCaller(ctx: AdminTRPCContext) {
  return adminAuthRouter.createCaller(ctx);
}

describe('admin auth router — login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OAUTH_PROVIDER = 'mock';
  });

  it('login happy path: returns sessionId + user, sets cookie', async () => {
    prismaMock.adminUser.findUnique.mockResolvedValue({
      id: 1,
      email: 'super@quanqn.com',
      role: 'super_admin',
      isMock: true,
      isActive: true,
    });
    prismaMock.adminSession.create.mockResolvedValue({});
    // findUnique for lucia validateSession — not called in login
    const ctx = makeCtx();
    const caller = makeAdminCaller(ctx);
    const result = await caller.login({ email: 'super@quanqn.com' });

    expect(result.sessionId).toBeTruthy();
    expect(result.user.email).toBe('super@quanqn.com');
    expect(result.user.role).toBe('super_admin');
    expect(ctx.resHeaders.get('Set-Cookie')).toContain('admin_session_id=');
    expect(ctx.resHeaders.get('Set-Cookie')).toContain('HttpOnly');
  });

  it('login: user_not_found → NOT_FOUND error + audit log written', async () => {
    prismaMock.adminUser.findUnique.mockResolvedValue(null);
    const ctx = makeCtx();
    const caller = makeAdminCaller(ctx);

    await expect(caller.login({ email: 'unknown@x.com' })).rejects.toThrow(TRPCError);
    expect(prismaMock.adminAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ success: false, errorCode: 'user_not_found' }) }),
    );
  });

  it('login: user_inactive → FORBIDDEN error + audit log written', async () => {
    prismaMock.adminUser.findUnique.mockResolvedValue({
      id: 2, email: 'inactive@x.com', role: 'admin', isMock: true, isActive: false,
    });
    const ctx = makeCtx();
    const caller = makeAdminCaller(ctx);

    await expect(caller.login({ email: 'inactive@x.com' })).rejects.toThrow(TRPCError);
    expect(prismaMock.adminAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ success: false, errorCode: 'user_inactive' }) }),
    );
  });

  it('login: OAUTH_PROVIDER=google → google stub throws → INTERNAL_SERVER_ERROR + audit log written', async () => {
    process.env.OAUTH_PROVIDER = 'google';
    const ctx = makeCtx();
    const caller = makeAdminCaller(ctx);

    await expect(caller.login({ email: 'admin@company.com' })).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
    });
    expect(prismaMock.adminAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ success: false }) }),
    );
  });
});

describe('admin auth router — logout', () => {
  it('logout with valid session: invalidates + clears cookie', async () => {
    prismaMock.adminSession.update.mockResolvedValue({});
    prismaMock.adminSession.findUnique.mockResolvedValue({
      id: 'sess1',
      adminUserId: 1,
      expiresAt: new Date(Date.now() + 3600_000),
      isActive: true,
      adminUser: { email: 'a@b.com', role: 'super_admin', isMock: true, isActive: true },
    });
    const ctx = makeCtx({
      adminSession: { id: 'sess1', expiresAt: new Date(Date.now() + 3600_000), fresh: false },
      activeAdminUser: { id: 1, email: 'a@b.com', role: 'super_admin', isMock: true, isActive: true },
    });
    const caller = makeAdminCaller(ctx);
    const result = await caller.logout();

    expect(result.ok).toBe(true);
    expect(ctx.resHeaders.get('Set-Cookie')).toContain('admin_session_id=');
    expect(ctx.resHeaders.get('Set-Cookie')).toContain('Max-Age=0');
  });

  it('logout without session: still returns ok + clears cookie', async () => {
    const ctx = makeCtx();
    const caller = makeAdminCaller(ctx);
    const result = await caller.logout();
    expect(result.ok).toBe(true);
    expect(ctx.resHeaders.get('Set-Cookie')).toContain('Max-Age=0');
  });
});

describe('admin auth router — me', () => {
  it('me: authenticated context returns user', async () => {
    const ctx = makeCtx({
      adminSession: { id: 'sess1', expiresAt: new Date(Date.now() + 3600_000), fresh: false },
      activeAdminUser: { id: 1, email: 'super@quanqn.com', role: 'super_admin', isMock: true, isActive: true },
    });
    const caller = makeAdminCaller(ctx);
    const result = await caller.me();
    expect(result.email).toBe('super@quanqn.com');
    expect(result.role).toBe('super_admin');
    expect(result.sessionId).toBe('sess1');
  });

  it('me: unauthenticated throws UNAUTHORIZED', async () => {
    const ctx = makeCtx();
    const caller = makeAdminCaller(ctx);
    await expect(caller.me()).rejects.toThrow(TRPCError);
    await expect(caller.me()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });
});
