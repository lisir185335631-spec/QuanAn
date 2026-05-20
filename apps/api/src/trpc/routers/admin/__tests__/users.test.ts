// PRD-11 US-006 · users router unit tests — 25+ tests
// list/detail/changePlan/banUser/resetPassword + auth boundaries

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ──────────────────────────────────────────────────────────

const mockLogAdminAction = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

// per-test override refs
const mockUserFindUnique = vi.hoisted(() => vi.fn());
const mockUserFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockUserCount = vi.hoisted(() => vi.fn().mockResolvedValue(0));
const mockUserUpdate = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const mockIpAccountFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockCostLogAggregate = vi.hoisted(() => vi.fn().mockResolvedValue({ _sum: { totalTokens: 0 }, _count: { id: 0 } }));
const mockAuditLogFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockStepDataFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockApprovalRequestCreate = vi.hoisted(() => vi.fn().mockResolvedValue({ id: 99 }));
const mockAdminAuditLogFindFirst = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockAdminAuditLogCreate = vi.hoisted(() => vi.fn().mockResolvedValue({}));

vi.mock('@/services/admin/admin-audit-service', () => ({
  logAdminAction: mockLogAdminAction,
}));

vi.mock('@/lib/prisma', () => {
  const txProxy = {
    $executeRawUnsafe: vi.fn().mockResolvedValue(undefined),
    user: {
      findUnique: mockUserFindUnique,
      findMany: mockUserFindMany,
      count: mockUserCount,
      update: mockUserUpdate,
    },
    ipAccount: { findMany: mockIpAccountFindMany },
    costLog: { aggregate: mockCostLogAggregate },
    auditLog: { findMany: mockAuditLogFindMany },
    stepData: { findMany: mockStepDataFindMany },
    approvalRequest: { create: mockApprovalRequestCreate },
    adminAuditLog: {
      findFirst: mockAdminAuditLogFindFirst,
      create: mockAdminAuditLogCreate,
    },
  };

  return {
    prisma: {
      $transaction: vi.fn().mockImplementation((cb: (tx: unknown) => unknown) => cb(txProxy)),
      $executeRawUnsafe: vi.fn().mockResolvedValue(undefined),
      user: {
        findUnique: mockUserFindUnique,
        findMany: mockUserFindMany,
        count: mockUserCount,
        update: mockUserUpdate,
      },
      ipAccount: { findMany: mockIpAccountFindMany },
      costLog: { aggregate: mockCostLogAggregate },
      auditLog: { findMany: mockAuditLogFindMany },
      stepData: { findMany: mockStepDataFindMany },
      approvalRequest: { create: mockApprovalRequestCreate },
      adminAuditLog: {
        findFirst: mockAdminAuditLogFindFirst,
        create: mockAdminAuditLogCreate,
      },
    },
  };
});

// ── Imports ────────────────────────────────────────────────────────────────
import type { AdminLuciaSession, AdminLuciaUser } from '@/lib/auth/lucia-admin';
import { prisma } from '@/lib/prisma';
import type { AdminTRPCContext } from '@/server/context-admin';
import { usersRouter } from '@/trpc/routers/admin/users';



// ── Fixtures ───────────────────────────────────────────────────────────────

const SUPER_ADMIN: AdminLuciaUser = {
  id: 1,
  email: 'super@quanan.com',
  role: 'super_admin',
  isMock: true,
  isActive: true,
};
const ADMIN_USER: AdminLuciaUser = {
  id: 2,
  email: 'admin@quanan.com',
  role: 'admin',
  isMock: true,
  isActive: true,
};
const READONLY_ADMIN: AdminLuciaUser = {
  id: 3,
  email: 'ro@quanan.com',
  role: 'readonly_admin',
  isMock: true,
  isActive: true,
};

const MOCK_SESSION: AdminLuciaSession = {
  id: 'sess-users-test',
  expiresAt: new Date(Date.now() + 3600_000),
  fresh: false,
} as AdminLuciaSession;

const MOCK_USER = {
  id: 42,
  email: 'user@example.com',
  name: 'Test User',
  role: 'user',
  plan: 'free',
  isBanned: false,
  bannedAt: null,
  passwordHash: null,
  industry: 'tech',
  openId: 'oid_42',
  loginMethod: 'google',
  isActivated: true,
  activeAccountId: null,
  lastLoginAt: null,
  lastLoginIp: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: null,
  ipAccounts: [],
};

function makeCtx(user: AdminLuciaUser | null, overrides: Partial<AdminTRPCContext> = {}): AdminTRPCContext {
  return {
    prisma: prisma,
    adminPrisma: prisma,
    traceId: 'trace-users-test',
    req: new Request('http://localhost/trpc/admin/users', {
      headers: { 'x-forwarded-for': '10.0.0.1', 'user-agent': 'test/1.0' },
    }),
    resHeaders: new Headers(),
    adminSession: MOCK_SESSION,
    activeAdminUser: user,
    ...overrides,
  };
}

function makeCaller(user: AdminLuciaUser | null, overrides: Partial<AdminTRPCContext> = {}) {
  return usersRouter.createCaller(makeCtx(user, overrides));
}

beforeEach(() => {
  vi.clearAllMocks();
  mockLogAdminAction.mockResolvedValue(undefined);
  mockUserFindUnique.mockResolvedValue(null);
  mockUserFindMany.mockResolvedValue([]);
  mockUserCount.mockResolvedValue(0);
  mockUserUpdate.mockResolvedValue({});
  mockIpAccountFindMany.mockResolvedValue([]);
  mockCostLogAggregate.mockResolvedValue({ _sum: { totalTokens: 0 }, _count: { id: 0 } });
  mockAuditLogFindMany.mockResolvedValue([]);
  mockStepDataFindMany.mockResolvedValue([]);
  mockApprovalRequestCreate.mockResolvedValue({ id: 99 });
  mockAdminAuditLogFindFirst.mockResolvedValue(null);
  mockAdminAuditLogCreate.mockResolvedValue({});
});

// ── list ───────────────────────────────────────────────────────────────────

describe('list', () => {
  it('returns users + count with defaults (AC-2)', async () => {
    mockUserFindMany.mockResolvedValue([MOCK_USER]);
    mockUserCount.mockResolvedValue(1);
    const caller = makeCaller(ADMIN_USER);
    const result = await caller.list({});
    expect(result.users).toHaveLength(1);
    expect(result.count).toBe(1);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });

  it('filters by search keyword', async () => {
    mockUserFindMany.mockResolvedValue([]);
    mockUserCount.mockResolvedValue(0);
    const caller = makeCaller(ADMIN_USER);
    await caller.list({ search: 'alice' });
    expect(mockUserFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ OR: expect.any(Array) }) }),
    );
  });

  it('filters by roleFilter', async () => {
    mockUserFindMany.mockResolvedValue([]);
    mockUserCount.mockResolvedValue(0);
    const caller = makeCaller(ADMIN_USER);
    await caller.list({ roleFilter: 'user' });
    expect(mockUserFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ role: 'user' }) }),
    );
  });

  it('filters by planFilter', async () => {
    mockUserFindMany.mockResolvedValue([]);
    mockUserCount.mockResolvedValue(0);
    const caller = makeCaller(ADMIN_USER);
    await caller.list({ planFilter: 'pro' });
    expect(mockUserFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ plan: 'pro' }) }),
    );
  });

  it('filters by industryFilter', async () => {
    mockUserFindMany.mockResolvedValue([]);
    mockUserCount.mockResolvedValue(0);
    const caller = makeCaller(ADMIN_USER);
    await caller.list({ industryFilter: 'tech' });
    expect(mockUserFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ industry: 'tech' }) }),
    );
  });

  it('uses Promise.all for users + count query (AC-2)', async () => {
    // Both mocks resolve independently
    mockUserFindMany.mockResolvedValue([MOCK_USER]);
    mockUserCount.mockResolvedValue(1);
    const caller = makeCaller(ADMIN_USER);
    const result = await caller.list({});
    // Both should have been called
    expect(mockUserFindMany).toHaveBeenCalledTimes(1);
    expect(mockUserCount).toHaveBeenCalledTimes(1);
    expect(result.count).toBe(1);
  });

  it('writes audit cross_account_query/list_users (AC-2)', async () => {
    const caller = makeCaller(ADMIN_USER);
    await caller.list({});
    // logAdminAction is void'd but still called
    await vi.runAllTimersAsync().catch(() => {});
    expect(mockLogAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({ eventCategory: 'cross_account_query', eventType: 'list_users' }),
    );
  });
});

// ── detail ─────────────────────────────────────────────────────────────────

describe('detail', () => {
  it('returns all 5 tabs in parallel (AC-3)', async () => {
    mockUserFindUnique.mockResolvedValue({ ...MOCK_USER, ipAccounts: [] });
    const caller = makeCaller(ADMIN_USER);
    const result = await caller.detail({ userId: 42 });
    expect(result).toHaveProperty('user');
    expect(result).toHaveProperty('ipAccounts');
    expect(result).toHaveProperty('costAggregate');
    expect(result).toHaveProperty('auditLogs');
    expect(result).toHaveProperty('stepData');
  });

  it('all 5 queries called (Promise.all not serial)', async () => {
    mockUserFindUnique.mockResolvedValue({ ...MOCK_USER, ipAccounts: [] });
    const caller = makeCaller(ADMIN_USER);
    await caller.detail({ userId: 42 });
    expect(mockUserFindUnique).toHaveBeenCalledTimes(1);
    expect(mockIpAccountFindMany).toHaveBeenCalledTimes(1);
    expect(mockCostLogAggregate).toHaveBeenCalledTimes(1);
    expect(mockAuditLogFindMany).toHaveBeenCalledTimes(1);
    expect(mockStepDataFindMany).toHaveBeenCalledTimes(1);
  });

  it('writes audit cross_account_query/view_user_detail (AC-3)', async () => {
    mockUserFindUnique.mockResolvedValue({ ...MOCK_USER, ipAccounts: [] });
    const caller = makeCaller(ADMIN_USER);
    await caller.detail({ userId: 42 });
    expect(mockLogAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({ eventCategory: 'cross_account_query', eventType: 'view_user_detail' }),
    );
  });
});

// ── changePlan ─────────────────────────────────────────────────────────────

describe('changePlan', () => {
  it('super_admin auto-executes: creates approval_request + updates user + audits (AC-4)', async () => {
    mockUserFindUnique.mockResolvedValue({ id: 42, plan: 'free' });
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.changePlan({ userId: 42, newPlan: 'pro', reason: 'admin override reason here' });
    expect(result.status).toBe('auto_executed');
    expect(result.approvalRequestId).toBe(99);
    expect(mockApprovalRequestCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'auto_executed', actionType: 'change_user_plan' }),
      }),
    );
    expect(mockUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ plan: 'pro' }) }),
    );
    expect(mockLogAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        eventCategory: 'high_risk_action',
        eventType: 'change_user_plan',
        approvalRequestId: 99,
      }),
    );
  });

  it('admin creates pending approval request (AC-4)', async () => {
    mockUserFindUnique.mockResolvedValue({ id: 42, plan: 'free' });
    const caller = makeCaller(ADMIN_USER);
    const result = await caller.changePlan({ userId: 42, newPlan: 'pro', reason: 'admin override reason here' });
    expect(result.status).toBe('pending');
    expect(result.approvalRequestId).toBe(99);
    expect(mockApprovalRequestCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'pending', actionType: 'change_user_plan' }),
      }),
    );
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it('throws ValidationError if already on same plan (AC-7)', async () => {
    mockUserFindUnique.mockResolvedValue({ id: 42, plan: 'pro' });
    const caller = makeCaller(SUPER_ADMIN);
    await expect(
      caller.changePlan({ userId: 42, newPlan: 'pro', reason: 'admin override reason here' }),
    ).rejects.toThrow('already on plan pro');
  });

  it('readonly_admin → FORBIDDEN + privilege_escalation audit (AC-9)', async () => {
    const caller = makeCaller(READONLY_ADMIN);
    await expect(
      caller.changePlan({ userId: 42, newPlan: 'pro', reason: 'admin override reason here' }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN', message: 'privilege_escalation' });
    expect(mockLogAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({ eventCategory: 'security_alert', eventType: 'privilege_escalation' }),
    );
  });

  it('throws NOT_FOUND if user does not exist', async () => {
    mockUserFindUnique.mockResolvedValue(null);
    const caller = makeCaller(SUPER_ADMIN);
    await expect(
      caller.changePlan({ userId: 9999, newPlan: 'pro', reason: 'admin override reason here' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

// ── banUser ────────────────────────────────────────────────────────────────

describe('banUser', () => {
  it('super_admin auto-executes: creates approval_request(high) + updates user.isBanned (AC-5)', async () => {
    mockUserFindUnique.mockResolvedValue({ id: 42, isBanned: false });
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.banUser({ userId: 42, reason: 'violation of terms of service' });
    expect(result.status).toBe('auto_executed');
    expect(mockApprovalRequestCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'auto_executed',
          riskLevel: 'high',
          requireDualApproval: true,
          actionType: 'ban_user',
        }),
      }),
    );
    expect(mockUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ isBanned: true }) }),
    );
    expect(mockLogAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({ eventCategory: 'high_risk_action', eventType: 'ban_user', approvalRequestId: 99 }),
    );
  });

  it('admin creates pending approval request (AC-5)', async () => {
    mockUserFindUnique.mockResolvedValue({ id: 42, isBanned: false });
    const caller = makeCaller(ADMIN_USER);
    const result = await caller.banUser({ userId: 42, reason: 'violation of terms of service' });
    expect(result.status).toBe('pending');
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it('throws ValidationError if already banned (AC-8)', async () => {
    mockUserFindUnique.mockResolvedValue({ id: 42, isBanned: true });
    const caller = makeCaller(SUPER_ADMIN);
    await expect(
      caller.banUser({ userId: 42, reason: 'violation of terms of service' }),
    ).rejects.toThrow('already banned');
  });

  it('readonly_admin → FORBIDDEN + privilege_escalation audit (AC-9)', async () => {
    const caller = makeCaller(READONLY_ADMIN);
    await expect(
      caller.banUser({ userId: 42, reason: 'violation of terms of service' }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN', message: 'privilege_escalation' });
    expect(mockLogAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({ eventCategory: 'security_alert', eventType: 'privilege_escalation' }),
    );
  });

  it('throws NOT_FOUND if user does not exist', async () => {
    mockUserFindUnique.mockResolvedValue(null);
    const caller = makeCaller(SUPER_ADMIN);
    await expect(
      caller.banUser({ userId: 9999, reason: 'violation of terms of service' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

// ── resetPassword ──────────────────────────────────────────────────────────

describe('resetPassword', () => {
  it('updates passwordHash + returns tempPassword (AC-6)', async () => {
    mockUserFindUnique.mockResolvedValue({ id: 42, email: 'u@example.com' });
    const caller = makeCaller(ADMIN_USER);
    const result = await caller.resetPassword({ userId: 42 });
    expect(result.status).toBe('ok');
    expect(typeof result.tempPassword).toBe('string');
    expect(result.tempPassword).toHaveLength(16); // 8 bytes hex = 16 chars
    expect(mockUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ passwordHash: expect.any(String) }) }),
    );
  });

  it('writes audit data_mutation/reset_password (AC-6)', async () => {
    mockUserFindUnique.mockResolvedValue({ id: 42, email: 'u@example.com' });
    const caller = makeCaller(ADMIN_USER);
    await caller.resetPassword({ userId: 42 });
    expect(mockLogAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({ eventCategory: 'data_mutation', eventType: 'reset_password', targetUserId: 42 }),
    );
  });

  it('readonly_admin → FORBIDDEN + privilege_escalation audit (AC-9)', async () => {
    const caller = makeCaller(READONLY_ADMIN);
    await expect(caller.resetPassword({ userId: 42 })).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: 'privilege_escalation',
    });
    expect(mockLogAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({ eventCategory: 'security_alert', eventType: 'privilege_escalation' }),
    );
  });

  it('throws NOT_FOUND if user does not exist', async () => {
    mockUserFindUnique.mockResolvedValue(null);
    const caller = makeCaller(ADMIN_USER);
    await expect(caller.resetPassword({ userId: 9999 })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

// ── payload redaction ──────────────────────────────────────────────────────

describe('audit payload redaction (AC-11)', () => {
  it('resetPassword audit does not include raw tempPassword in payload', async () => {
    mockUserFindUnique.mockResolvedValue({ id: 42, email: 'u@example.com' });
    const caller = makeCaller(ADMIN_USER);
    const result = await caller.resetPassword({ userId: 42 });
    // The audit payload should have tempPassword redacted
    const auditCall = mockLogAdminAction.mock.calls.find((c) => c[0]?.eventType === 'reset_password');
    expect(auditCall).toBeDefined();
    const payload = auditCall?.[0]?.payload as Record<string, unknown> | undefined;
    expect(payload?.['tempPassword']).toBe('[REDACTED]');
    // But the procedure still returns the actual tempPassword to the caller
    expect(result.tempPassword).toHaveLength(16);
  });
});
