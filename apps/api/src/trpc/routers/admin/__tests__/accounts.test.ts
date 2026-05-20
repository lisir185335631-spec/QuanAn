// PRD-11 US-010 · accounts router unit tests — 32 tests
// list/detail/flag/unflag/addNote/forceFreeze + auth boundaries

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ──────────────────────────────────────────────────────────

const mockLogAdminAction = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

const mockIpAccountFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockIpAccountCount = vi.hoisted(() => vi.fn().mockResolvedValue(0));
const mockIpAccountFindUnique = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockIpAccountUpdate = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const mockStepDataFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockEvolutionProfileFindUnique = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockEvolutionInsightFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockHistoryFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockAnomalyFlagFindFirst = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockAnomalyFlagFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockAnomalyFlagFindUnique = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockAnomalyFlagCreate = vi.hoisted(() => vi.fn().mockResolvedValue({ id: 101 }));
const mockAnomalyFlagUpdate = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const mockAdminNoteFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockAdminNoteCreate = vi.hoisted(() => vi.fn().mockResolvedValue({ id: 201 }));
const mockApprovalRequestCreate = vi.hoisted(() => vi.fn().mockResolvedValue({ id: 99 }));
const mockAdminAuditLogFindFirst = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockAdminAuditLogCreate = vi.hoisted(() => vi.fn().mockResolvedValue({}));

vi.mock('@/services/admin/admin-audit-service', () => ({
  logAdminAction: mockLogAdminAction,
}));

vi.mock('@/lib/prisma', () => {
  const txProxy = {
    $executeRawUnsafe: vi.fn().mockResolvedValue(undefined),
    ipAccount: {
      findMany: mockIpAccountFindMany,
      count: mockIpAccountCount,
      findUnique: mockIpAccountFindUnique,
      update: mockIpAccountUpdate,
    },
    stepData: { findMany: mockStepDataFindMany },
    evolutionProfile: { findUnique: mockEvolutionProfileFindUnique },
    evolutionInsight: { findMany: mockEvolutionInsightFindMany },
    history: { findMany: mockHistoryFindMany },
    ipAccountAnomalyFlag: {
      findFirst: mockAnomalyFlagFindFirst,
      findMany: mockAnomalyFlagFindMany,
      findUnique: mockAnomalyFlagFindUnique,
      create: mockAnomalyFlagCreate,
      update: mockAnomalyFlagUpdate,
    },
    ipAccountAdminNote: {
      findMany: mockAdminNoteFindMany,
      create: mockAdminNoteCreate,
    },
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
      ipAccount: {
        findMany: mockIpAccountFindMany,
        count: mockIpAccountCount,
        findUnique: mockIpAccountFindUnique,
        update: mockIpAccountUpdate,
      },
      stepData: { findMany: mockStepDataFindMany },
      evolutionProfile: { findUnique: mockEvolutionProfileFindUnique },
      evolutionInsight: { findMany: mockEvolutionInsightFindMany },
      history: { findMany: mockHistoryFindMany },
      ipAccountAnomalyFlag: {
        findFirst: mockAnomalyFlagFindFirst,
        findMany: mockAnomalyFlagFindMany,
        findUnique: mockAnomalyFlagFindUnique,
        create: mockAnomalyFlagCreate,
        update: mockAnomalyFlagUpdate,
      },
      ipAccountAdminNote: {
        findMany: mockAdminNoteFindMany,
        create: mockAdminNoteCreate,
      },
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
import { accountsRouter } from '@/trpc/routers/admin/accounts';



// ── Fixtures ───────────────────────────────────────────────────────────────

const SUPER_ADMIN: AdminLuciaUser = {
  id: 1, email: 'super@quanan.com', role: 'super_admin', isMock: true, isActive: true,
};
const ADMIN_USER: AdminLuciaUser = {
  id: 2, email: 'admin@quanan.com', role: 'admin', isMock: true, isActive: true,
};
const READONLY_ADMIN: AdminLuciaUser = {
  id: 3, email: 'ro@quanan.com', role: 'readonly_admin', isMock: true, isActive: true,
};

const MOCK_SESSION: AdminLuciaSession = {
  id: 'sess-accounts-test',
  expiresAt: new Date(Date.now() + 3600_000),
  fresh: false,
} as AdminLuciaSession;

const MOCK_ACCOUNT = {
  id: 10,
  userId: 42,
  name: 'Test IP',
  industry: 'tech',
  platform: 'douyin',
  stage: 'starter',
  isActive: true,
  frozenAt: null,
  frozenByAdminId: null,
  freezeReason: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  _count: { anomalyFlags: 0 },
  user: { id: 42, email: 'user@example.com' },
  evolutionProfile: null,
};

function makeCtx(user: AdminLuciaUser | null, overrides: Partial<AdminTRPCContext> = {}): AdminTRPCContext {
  return {
    prisma: prisma,
    adminPrisma: prisma,
    traceId: 'trace-accounts-test',
    req: new Request('http://localhost/trpc/admin/accounts', {
      headers: { 'x-forwarded-for': '10.0.0.1', 'user-agent': 'test/1.0' },
    }),
    resHeaders: new Headers(),
    adminSession: MOCK_SESSION,
    activeAdminUser: user,
    ...overrides,
  };
}

function makeCaller(user: AdminLuciaUser | null, overrides: Partial<AdminTRPCContext> = {}) {
  return accountsRouter.createCaller(makeCtx(user, overrides));
}

beforeEach(() => {
  vi.clearAllMocks();
  mockLogAdminAction.mockResolvedValue(undefined);
  mockIpAccountFindMany.mockResolvedValue([]);
  mockIpAccountCount.mockResolvedValue(0);
  mockIpAccountFindUnique.mockResolvedValue(null);
  mockIpAccountUpdate.mockResolvedValue({});
  mockStepDataFindMany.mockResolvedValue([]);
  mockEvolutionProfileFindUnique.mockResolvedValue(null);
  mockEvolutionInsightFindMany.mockResolvedValue([]);
  mockHistoryFindMany.mockResolvedValue([]);
  mockAnomalyFlagFindFirst.mockResolvedValue(null);
  mockAnomalyFlagFindMany.mockResolvedValue([]);
  mockAnomalyFlagFindUnique.mockResolvedValue(null);
  mockAnomalyFlagCreate.mockResolvedValue({ id: 101 });
  mockAnomalyFlagUpdate.mockResolvedValue({});
  mockAdminNoteFindMany.mockResolvedValue([]);
  mockAdminNoteCreate.mockResolvedValue({ id: 201 });
  mockApprovalRequestCreate.mockResolvedValue({ id: 99 });
  mockAdminAuditLogFindFirst.mockResolvedValue(null);
  mockAdminAuditLogCreate.mockResolvedValue({});
});

// ── list ───────────────────────────────────────────────────────────────────

describe('list', () => {
  it('returns paginated accounts with defaults (AC-2)', async () => {
    mockIpAccountFindMany.mockResolvedValue([MOCK_ACCOUNT]);
    mockIpAccountCount.mockResolvedValue(1);
    const result = await makeCaller(ADMIN_USER).list({});
    expect(result.accounts).toHaveLength(1);
    expect(result.count).toBe(1);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });

  it('passes industryFilter to where clause', async () => {
    await makeCaller(ADMIN_USER).list({ industryFilter: 'tech' });
    expect(mockIpAccountFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ industry: 'tech' }) }),
    );
  });

  it('passes platformFilter to where clause', async () => {
    await makeCaller(ADMIN_USER).list({ platformFilter: 'douyin' });
    expect(mockIpAccountFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ platform: 'douyin' }) }),
    );
  });

  it('passes stageFilter to where clause', async () => {
    await makeCaller(ADMIN_USER).list({ stageFilter: 'growth' });
    expect(mockIpAccountFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ stage: 'growth' }) }),
    );
  });

  it('passes levelFilter as evolutionProfile.level filter', async () => {
    await makeCaller(ADMIN_USER).list({ levelFilter: 'L3' });
    expect(mockIpAccountFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ evolutionProfile: { level: 'L3' } }),
      }),
    );
  });

  it('passes anomalyOnly as anomalyFlags.some filter', async () => {
    await makeCaller(ADMIN_USER).list({ anomalyOnly: true });
    expect(mockIpAccountFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ anomalyFlags: { some: { resolvedAt: null } } }),
      }),
    );
  });

  it('passes search as OR name/user.email filter', async () => {
    await makeCaller(ADMIN_USER).list({ search: 'alice' });
    expect(mockIpAccountFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ OR: expect.any(Array) }),
      }),
    );
  });

  it('respects custom sortBy and sortDir', async () => {
    await makeCaller(ADMIN_USER).list({ sortBy: 'name', sortDir: 'asc' });
    expect(mockIpAccountFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { name: 'asc' } }),
    );
  });

  it('includes evolutionProfile + user + _count anomalyFlags', async () => {
    await makeCaller(ADMIN_USER).list({});
    expect(mockIpAccountFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          evolutionProfile: true,
          user: true,
          _count: { select: { anomalyFlags: true } },
        }),
      }),
    );
  });

  it('writes cross_account_query/list_ip_accounts audit', async () => {
    await makeCaller(ADMIN_USER).list({});
    expect(mockLogAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        eventCategory: 'cross_account_query',
        eventType: 'list_ip_accounts',
      }),
    );
  });
});

// ── detail ─────────────────────────────────────────────────────────────────

describe('detail', () => {
  it('executes 6-table Promise.all and returns structured result (AC-3)', async () => {
    mockIpAccountFindUnique.mockResolvedValue({ ...MOCK_ACCOUNT, user: { id: 42, email: 'u@example.com' } });
    mockStepDataFindMany.mockResolvedValue([{ id: 1 }]);
    mockEvolutionProfileFindUnique.mockResolvedValue({ id: 5, level: 'L2' });
    mockEvolutionInsightFindMany.mockResolvedValue([{ id: 3 }]);
    mockHistoryFindMany.mockResolvedValue([{ id: 7 }]);
    mockAdminNoteFindMany.mockResolvedValue([{ id: 201 }]);
    mockAnomalyFlagFindMany.mockResolvedValue([{ id: 101, resolvedAt: null }]);

    const result = await makeCaller(ADMIN_USER).detail({ accountId: 10 });

    expect(result.account).toBeDefined();
    expect(result.stepData).toHaveLength(1);
    expect(result.evolutionProfile).toMatchObject({ level: 'L2' });
    expect(result.insights).toHaveLength(1);
    expect(result.histories).toHaveLength(1);
    expect(result.adminNotes).toHaveLength(1);
    expect(result.anomalyFlags).toHaveLength(1);
  });

  it('anomalyFlags query only returns unresolved (resolvedAt: null)', async () => {
    mockIpAccountFindUnique.mockResolvedValue(MOCK_ACCOUNT);
    await makeCaller(ADMIN_USER).detail({ accountId: 10 });
    expect(mockAnomalyFlagFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { accountId: 10, resolvedAt: null } }),
    );
  });

  it('returns history with take 50', async () => {
    mockIpAccountFindUnique.mockResolvedValue(MOCK_ACCOUNT);
    await makeCaller(ADMIN_USER).detail({ accountId: 10 });
    expect(mockHistoryFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 50 }),
    );
  });

  it('writes cross_account_query/view_account_detail audit', async () => {
    mockIpAccountFindUnique.mockResolvedValue(MOCK_ACCOUNT);
    await makeCaller(ADMIN_USER).detail({ accountId: 10 });
    expect(mockLogAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        eventCategory: 'cross_account_query',
        eventType: 'view_account_detail',
        targetAccountId: 10,
      }),
    );
  });
});

// ── flag ───────────────────────────────────────────────────────────────────

describe('flag', () => {
  it('creates anomaly flag (AC-4)', async () => {
    const result = await makeCaller(ADMIN_USER).flag({
      accountId: 10, anomalyType: 'inactive_no_feedback', severity: 'medium', evidence: { reason: 'test' },
    });
    expect(mockAnomalyFlagCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ accountId: 10, anomalyType: 'inactive_no_feedback', severity: 'medium' }),
      }),
    );
    expect(result.flagId).toBe(101);
  });

  it('throws 403 for readonly_admin (AC-11)', async () => {
    await expect(
      makeCaller(READONLY_ADMIN).flag({
        accountId: 10, anomalyType: 'test', severity: 'low', evidence: {},
      }),
    ).rejects.toThrow('privilege_escalation');
  });

  it('throws BAD_REQUEST if same (accountId, anomalyType) flagged today (AC-12)', async () => {
    mockAnomalyFlagFindFirst.mockResolvedValue({ id: 99, resolvedAt: null });
    await expect(
      makeCaller(ADMIN_USER).flag({
        accountId: 10, anomalyType: 'inactive_no_feedback', severity: 'low', evidence: {},
      }),
    ).rejects.toMatchObject({ message: 'already flagged today' });
  });

  it('allows different anomalyType on same account same day', async () => {
    mockAnomalyFlagFindFirst.mockResolvedValue(null);
    await expect(
      makeCaller(ADMIN_USER).flag({
        accountId: 10, anomalyType: 'evolution_stalled', severity: 'low', evidence: {},
      }),
    ).resolves.toBeDefined();
    expect(mockAnomalyFlagCreate).toHaveBeenCalled();
  });

  it('writes data_mutation/flag_account_anomaly audit', async () => {
    await makeCaller(ADMIN_USER).flag({
      accountId: 10, anomalyType: 'inactive_no_feedback', severity: 'medium', evidence: {},
    });
    expect(mockLogAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        eventCategory: 'data_mutation',
        eventType: 'flag_account_anomaly',
        targetAccountId: 10,
      }),
    );
  });
});

// ── unflag ─────────────────────────────────────────────────────────────────

describe('unflag', () => {
  it('updates resolvedAt + resolvedByAdminId + resolution (AC-5)', async () => {
    mockAnomalyFlagFindUnique.mockResolvedValue({ id: 101, accountId: 10, resolvedAt: null });
    const result = await makeCaller(ADMIN_USER).unflag({ flagId: 101, resolution: 'false_positive' });
    expect(mockAnomalyFlagUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 101 },
        data: expect.objectContaining({
          resolvedByAdminId: 2,
          resolution: 'false_positive',
        }),
      }),
    );
    expect(result.status).toBe('ok');
  });

  it('throws 403 for readonly_admin (AC-11)', async () => {
    await expect(
      makeCaller(READONLY_ADMIN).unflag({ flagId: 101, resolution: 'false_positive' }),
    ).rejects.toThrow('privilege_escalation');
  });

  it('throws BAD_REQUEST if already resolved (AC-13)', async () => {
    mockAnomalyFlagFindUnique.mockResolvedValue({ id: 101, accountId: 10, resolvedAt: new Date() });
    await expect(
      makeCaller(ADMIN_USER).unflag({ flagId: 101, resolution: 'admin_action' }),
    ).rejects.toMatchObject({ message: 'already resolved' });
  });

  it('throws NOT_FOUND if flag does not exist', async () => {
    mockAnomalyFlagFindUnique.mockResolvedValue(null);
    await expect(
      makeCaller(ADMIN_USER).unflag({ flagId: 999, resolution: 'false_positive' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('writes data_mutation/unflag_account_anomaly audit', async () => {
    mockAnomalyFlagFindUnique.mockResolvedValue({ id: 101, accountId: 10, resolvedAt: null });
    await makeCaller(ADMIN_USER).unflag({ flagId: 101, resolution: 'auto_resolved' });
    expect(mockLogAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        eventCategory: 'data_mutation',
        eventType: 'unflag_account_anomaly',
      }),
    );
  });
});

// ── addNote ────────────────────────────────────────────────────────────────

describe('addNote', () => {
  it('creates note with visibleToOtherAdmin (AC-6)', async () => {
    const result = await makeCaller(ADMIN_USER).addNote({
      accountId: 10, note: 'Suspicious activity detected', visibleToOtherAdmin: true,
    });
    expect(mockAdminNoteCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          accountId: 10,
          adminId: 2,
          note: 'Suspicious activity detected',
          visibleToOtherAdmin: true,
        }),
      }),
    );
    expect(result.noteId).toBe(201);
  });

  it('throws 403 for readonly_admin (AC-11)', async () => {
    await expect(
      makeCaller(READONLY_ADMIN).addNote({ accountId: 10, note: 'test', visibleToOtherAdmin: false }),
    ).rejects.toThrow('privilege_escalation');
  });

  it('writes data_mutation/add_account_note audit', async () => {
    await makeCaller(ADMIN_USER).addNote({ accountId: 10, note: 'note', visibleToOtherAdmin: true });
    expect(mockLogAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        eventCategory: 'data_mutation',
        eventType: 'add_account_note',
        targetAccountId: 10,
      }),
    );
  });

  it('visibleToOtherAdmin defaults to true', async () => {
    await makeCaller(ADMIN_USER).addNote({ accountId: 10, note: 'note' });
    expect(mockAdminNoteCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ visibleToOtherAdmin: true }),
      }),
    );
  });
});

// ── forceFreeze ────────────────────────────────────────────────────────────

describe('forceFreeze', () => {
  it('super_admin: auto-executes + updates frozenAt/frozenByAdminId/freezeReason (AC-7)', async () => {
    mockIpAccountFindUnique.mockResolvedValue({ id: 10, frozenAt: null });
    const result = await makeCaller(SUPER_ADMIN).forceFreeze({ accountId: 10, freezeReason: 'TOS violation' });
    expect(mockIpAccountUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 10 },
        data: expect.objectContaining({
          frozenByAdminId: 1,
          freezeReason: 'TOS violation',
        }),
      }),
    );
    expect(result.status).toBe('auto_executed');
    expect(result.approvalRequestId).toBe(99);
  });

  it('super_admin: creates approval_requests with status=auto_executed (AC-7)', async () => {
    mockIpAccountFindUnique.mockResolvedValue({ id: 10, frozenAt: null });
    await makeCaller(SUPER_ADMIN).forceFreeze({ accountId: 10, freezeReason: 'TOS violation' });
    expect(mockApprovalRequestCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actionType: 'force_freeze_account',
          status: 'auto_executed',
          riskLevel: 'high',
        }),
      }),
    );
  });

  it('admin (non-super_admin): creates pending approval + returns {status:pending} (AC-10)', async () => {
    mockIpAccountFindUnique.mockResolvedValue({ id: 10, frozenAt: null });
    const result = await makeCaller(ADMIN_USER).forceFreeze({ accountId: 10, freezeReason: 'anomaly' });
    expect(result.status).toBe('pending');
    expect(mockIpAccountUpdate).not.toHaveBeenCalled();
    expect(mockApprovalRequestCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'pending' }),
      }),
    );
  });

  it('throws BAD_REQUEST if account already frozen (AC-9)', async () => {
    mockIpAccountFindUnique.mockResolvedValue({ id: 10, frozenAt: new Date() });
    await expect(
      makeCaller(SUPER_ADMIN).forceFreeze({ accountId: 10, freezeReason: 'reason' }),
    ).rejects.toMatchObject({ message: 'account already frozen' });
  });

  it('throws 403 for readonly_admin (AC-11)', async () => {
    await expect(
      makeCaller(READONLY_ADMIN).forceFreeze({ accountId: 10, freezeReason: 'reason' }),
    ).rejects.toThrow('privilege_escalation');
  });

  it('super_admin: writes high_risk_action/force_freeze_account audit', async () => {
    mockIpAccountFindUnique.mockResolvedValue({ id: 10, frozenAt: null });
    await makeCaller(SUPER_ADMIN).forceFreeze({ accountId: 10, freezeReason: 'TOS' });
    expect(mockLogAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        eventCategory: 'high_risk_action',
        eventType: 'force_freeze_account',
        targetAccountId: 10,
      }),
    );
  });

  it('admin: writes high_risk_action/approval_request_create audit', async () => {
    mockIpAccountFindUnique.mockResolvedValue({ id: 10, frozenAt: null });
    await makeCaller(ADMIN_USER).forceFreeze({ accountId: 10, freezeReason: 'reason' });
    expect(mockLogAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        eventCategory: 'high_risk_action',
        eventType: 'approval_request_create',
        targetAccountId: 10,
      }),
    );
  });

  it('throws NOT_FOUND if account does not exist', async () => {
    mockIpAccountFindUnique.mockResolvedValue(null);
    await expect(
      makeCaller(SUPER_ADMIN).forceFreeze({ accountId: 999, freezeReason: 'reason' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});
