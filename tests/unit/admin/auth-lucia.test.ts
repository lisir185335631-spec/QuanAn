// PRD-10 US-002 · auth-lucia unit tests (12 tests)
// session lifecycle + factory + mock + google stub

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Prisma mock ────────────────────────────────────────────────────────────
vi.mock('@/lib/prisma', () => ({
  prisma: {
    adminSession: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    adminUser: {
      findUnique: vi.fn(),
    },
  },
}));

// ─── Redis mock ─────────────────────────────────────────────────────────────
vi.mock('@/lib/redis', () => ({
  redis: {
    set: vi.fn().mockResolvedValue('OK'),
    get: vi.fn().mockResolvedValue('1'),
    getex: vi.fn().mockResolvedValue('1'),
    del: vi.fn().mockResolvedValue(1),
  },
}));

import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import {
  luciaAdmin,
  createAdminIdleKey,
  touchAdminIdleKey,
  deleteAdminIdleKey,
  validateAdminSession,
} from '@/lib/auth/lucia-admin';
import { mockOAuthCallback } from '@/lib/auth/oauth-admin-mock';
import { googleWorkspaceOAuthStub } from '@/lib/auth/oauth-admin-google';
import {
  getAdminOAuthProvider,
  validateAdminStartupConfig,
} from '@/lib/auth/oauth-admin-factory';

const prismaMock = prisma as unknown as {
  adminSession: {
    findUnique: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
  };
  adminUser: { findUnique: ReturnType<typeof vi.fn> };
};
const redisMock = redis as unknown as {
  set: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  getex: ReturnType<typeof vi.fn>;
  del: ReturnType<typeof vi.fn>;
};

describe('luciaAdmin instance', () => {
  it('sessionCookieName is admin_session_id', () => {
    expect(luciaAdmin.sessionCookieName).toBe('admin_session_id');
  });

  it('readSessionCookie parses admin_session_id cookie', () => {
    const result = luciaAdmin.readSessionCookie('admin_session_id=abc123; other=x');
    expect(result).toBe('abc123');
  });
});

describe('admin Prisma adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getSessionAndUser returns [null, null] when session not found', async () => {
    prismaMock.adminSession.findUnique.mockResolvedValue(null);
    redisMock.getex.mockResolvedValue(null); // idle timeout

    const { session, user } = await validateAdminSession('nonexistent');
    expect(session).toBeNull();
    expect(user).toBeNull();
  });

  it('getSessionAndUser returns [null, null] when session isActive=false', async () => {
    prismaMock.adminSession.findUnique.mockResolvedValue({
      id: 'sess1',
      adminUserId: 1,
      expiresAt: new Date(Date.now() + 1000 * 3600),
      isActive: false,
      adminUser: { email: 'a@b.com', role: 'super_admin', isMock: true, isActive: true },
    });
    const { session, user } = await validateAdminSession('sess1');
    expect(session).toBeNull();
    expect(user).toBeNull();
  });

  it('validateAdminSession returns user when session is active + redis alive', async () => {
    prismaMock.adminSession.findUnique.mockResolvedValue({
      id: 'sess1',
      adminUserId: 1,
      expiresAt: new Date(Date.now() + 1000 * 3600),
      isActive: true,
      adminUser: { email: 'super@quanan.com', role: 'super_admin', isMock: true, isActive: true },
    });
    redisMock.getex.mockResolvedValue('1');

    const { session, user } = await validateAdminSession('sess1');
    expect(session).not.toBeNull();
    expect(user?.email).toBe('super@quanan.com');
    expect(user?.role).toBe('super_admin');
  });

  it('validateAdminSession returns null when Redis idle key expired', async () => {
    prismaMock.adminSession.findUnique.mockResolvedValue({
      id: 'sess-idle',
      adminUserId: 1,
      expiresAt: new Date(Date.now() + 1000 * 3600),
      isActive: true,
      adminUser: { email: 'a@b.com', role: 'super_admin', isMock: true, isActive: true },
    });
    prismaMock.adminSession.update.mockResolvedValue({});
    redisMock.getex.mockResolvedValue(null); // idle timeout expired

    const { session, user } = await validateAdminSession('sess-idle');
    expect(session).toBeNull();
    expect(user).toBeNull();
  });
});

describe('admin Redis idle key helpers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('createAdminIdleKey sets admin:session: prefixed key', async () => {
    await createAdminIdleKey('abc');
    expect(redisMock.set).toHaveBeenCalledWith('admin:session:abc', '1', 'EX', 1800);
  });

  it('touchAdminIdleKey returns true when key exists', async () => {
    redisMock.getex.mockResolvedValue('1');
    const alive = await touchAdminIdleKey('abc');
    expect(alive).toBe(true);
    expect(redisMock.getex).toHaveBeenCalledWith('admin:session:abc', 'EX', 1800);
  });

  it('touchAdminIdleKey returns false when key is gone', async () => {
    redisMock.getex.mockResolvedValue(null);
    const alive = await touchAdminIdleKey('abc');
    expect(alive).toBe(false);
  });

  it('deleteAdminIdleKey removes the key', async () => {
    await deleteAdminIdleKey('abc');
    expect(redisMock.del).toHaveBeenCalledWith('admin:session:abc');
  });
});

describe('admin OAuth factory', () => {
  const origEnv = process.env;
  beforeEach(() => {
    process.env = { ...origEnv };
    vi.clearAllMocks();
  });
  afterEach(() => {
    process.env = origEnv;
  });

  it('OAUTH_PROVIDER=mock returns mockOAuthCallback', () => {
    process.env.OAUTH_PROVIDER = 'mock';
    const fn = getAdminOAuthProvider();
    expect(typeof fn).toBe('function');
  });

  it('OAUTH_PROVIDER=google returns google stub function', () => {
    process.env.OAUTH_PROVIDER = 'google';
    const fn = getAdminOAuthProvider();
    expect(typeof fn).toBe('function');
  });

  it('unknown OAUTH_PROVIDER throws config error', () => {
    process.env.OAUTH_PROVIDER = 'facebook';
    expect(() => getAdminOAuthProvider()).toThrow('facebook');
  });

  it('validateAdminStartupConfig throws when NODE_ENV=production + OAUTH_PROVIDER=mock', () => {
    process.env.NODE_ENV = 'production';
    process.env.OAUTH_PROVIDER = 'mock';
    // process.exit is mocked in test env; spy on it
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    validateAdminStartupConfig();
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });
});

describe('mockOAuthCallback', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws user_not_found when user does not exist', async () => {
    prismaMock.adminUser.findUnique.mockResolvedValue(null);
    await expect(mockOAuthCallback('x@y.com')).rejects.toMatchObject({ code: 'user_not_found' });
  });

  it('throws user_inactive when user.isActive=false', async () => {
    prismaMock.adminUser.findUnique.mockResolvedValue({
      id: 1, email: 'x@y.com', role: 'super_admin', isMock: true, isActive: false,
    });
    await expect(mockOAuthCallback('x@y.com')).rejects.toMatchObject({ code: 'user_inactive' });
  });
});

describe('googleWorkspaceOAuthStub', () => {
  it('throws PRR config error', () => {
    expect(() => googleWorkspaceOAuthStub()).toThrow('PRR config required');
  });
});
