// PRD-11 US-020 · invites router unit tests — ≥ 20 tests
// list / create / batchImport / invalidate / detail / campaignFunnel

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ──────────────────────────────────────────────────────────

const mockLogAdminAction = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockGetCampaignFunnel = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    campaignKey: 'SPRING2026',
    stages: { registered: 100, activated: 80, step9Completed: 40, d30Retained: 60 },
  }),
);

const mockInviteCodeFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockInviteCodeCount = vi.hoisted(() => vi.fn().mockResolvedValue(0));
const mockInviteCodeFindUnique = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockInviteCodeCreate = vi.hoisted(() => vi.fn().mockResolvedValue({ id: 1, code: 'TEST1234' }));
const mockInviteCodeUpdate = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const mockApprovalRequestCreate = vi.hoisted(() => vi.fn().mockResolvedValue({ id: 99 }));
const mockAuditLogFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockIpAccountFindFirst = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockStepDataFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockAdminAuditLogCreate = vi.hoisted(() => vi.fn().mockResolvedValue({}));

vi.mock('@/services/admin/admin-audit-service', () => ({
  logAdminAction: mockLogAdminAction,
}));

vi.mock('@/services/admin/invites/campaign.service', () => ({
  getCampaignFunnel: mockGetCampaignFunnel,
  CampaignNotFoundError: class CampaignNotFoundError extends Error {
    constructor(key: string) { super(`Campaign "${key}" not found`); }
  },
}));

vi.mock('@/lib/prisma', () => {
  const txProxy = {
    $executeRawUnsafe: vi.fn().mockResolvedValue(undefined),
    inviteCode: {
      findMany: mockInviteCodeFindMany,
      count: mockInviteCodeCount,
      findUnique: mockInviteCodeFindUnique,
      create: mockInviteCodeCreate,
      update: mockInviteCodeUpdate,
    },
    approvalRequest: { create: mockApprovalRequestCreate },
    auditLog: { findMany: mockAuditLogFindMany },
    ipAccount: { findFirst: mockIpAccountFindFirst },
    stepData: { findMany: mockStepDataFindMany },
    adminAuditLog: { create: mockAdminAuditLogCreate },
  };

  return {
    prisma: {
      $transaction: vi.fn().mockImplementation((cb: (tx: unknown) => unknown) => cb(txProxy)),
      $executeRawUnsafe: vi.fn().mockResolvedValue(undefined),
      inviteCode: {
        findMany: mockInviteCodeFindMany,
        count: mockInviteCodeCount,
        findUnique: mockInviteCodeFindUnique,
        create: mockInviteCodeCreate,
        update: mockInviteCodeUpdate,
      },
      approvalRequest: { create: mockApprovalRequestCreate },
      auditLog: { findMany: mockAuditLogFindMany },
      ipAccount: { findFirst: mockIpAccountFindFirst },
      stepData: { findMany: mockStepDataFindMany },
      adminAuditLog: { create: mockAdminAuditLogCreate },
    },
  };
});

// ── Imports ────────────────────────────────────────────────────────────────

import { invitesRouter } from '@/trpc/routers/admin/invites';
import type { AdminTRPCContext } from '@/server/context-admin';
import type { AdminLuciaSession, AdminLuciaUser } from '@/lib/auth/lucia-admin';
import type { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';

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

const SESSION: AdminLuciaSession = {
  id: 'sess-001',
  expiresAt: new Date(Date.now() + 3600_000),
  fresh: false,
};

function makeReq(headers: Record<string, string> = {}) {
  return new Request('http://localhost', { headers });
}

function makeCtx(user: AdminLuciaUser): AdminTRPCContext {
  return {
    req: makeReq({ 'x-forwarded-for': '1.2.3.4', 'user-agent': 'test' }),
    resHeaders: new Headers(),
    prisma: prisma as unknown as PrismaClient,
    adminPrisma: prisma as unknown as PrismaClient,
    activeAdminUser: user,
    adminSession: SESSION,
    traceId: 'trace-001',
  };
}

// Helper to call procedures via createCaller
function makeCaller(user: AdminLuciaUser) {
  return invitesRouter.createCaller(makeCtx(user));
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('invitesRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── list ───────────────────────────────────────────────────────────────

  describe('list', () => {
    it('returns paginated invite codes with count', async () => {
      const mockCodes = [{ id: 1, code: 'ABC123', isActive: true, maxUses: 1, usedCount: 0, expiresAt: null, campaign: null, notes: null, createdAt: new Date(), usedAt: null, usedById: null }];
      mockInviteCodeFindMany.mockResolvedValueOnce(mockCodes);
      mockInviteCodeCount.mockResolvedValueOnce(1);

      const caller = makeCaller(SUPER_ADMIN);
      const result = await caller.list({ page: 1, pageSize: 20 });

      expect(result.codes).toHaveLength(1);
      expect(result.count).toBe(1);
      expect(result.page).toBe(1);
    });

    it('filters by statusFilter=active', async () => {
      mockInviteCodeFindMany.mockResolvedValueOnce([]);
      mockInviteCodeCount.mockResolvedValueOnce(0);

      const caller = makeCaller(SUPER_ADMIN);
      await caller.list({ statusFilter: 'active' });

      const whereArg = (mockInviteCodeFindMany.mock.calls[0] as [{ where: Record<string, unknown> }])[0].where;
      expect(whereArg.isActive).toBe(true);
    });

    it('filters by campaignFilter', async () => {
      mockInviteCodeFindMany.mockResolvedValueOnce([]);
      mockInviteCodeCount.mockResolvedValueOnce(0);

      const caller = makeCaller(SUPER_ADMIN);
      await caller.list({ campaignFilter: 'SPRING2026' });

      const whereArg = (mockInviteCodeFindMany.mock.calls[0] as [{ where: Record<string, unknown> }])[0].where;
      expect(whereArg.campaign).toBe('SPRING2026');
    });

    it('writes audit log on list', async () => {
      mockInviteCodeFindMany.mockResolvedValueOnce([]);
      mockInviteCodeCount.mockResolvedValueOnce(0);

      const caller = makeCaller(SUPER_ADMIN);
      await caller.list({});

      expect(mockLogAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'list_invite_codes' }),
      );
    });
  });

  // ── create ─────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates invite with explicit code', async () => {
      const mockInvite = { id: 1, code: 'MYCODE01' };
      mockInviteCodeCreate.mockResolvedValueOnce(mockInvite);

      const caller = makeCaller(SUPER_ADMIN);
      const result = await caller.create({ code: 'MYCODE01', quotaLimit: 5 });

      expect(mockInviteCodeCreate).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ code: 'MYCODE01', maxUses: 5 }) }),
      );
      expect(result.code).toBe('MYCODE01');
    });

    it('auto-generates code when not provided', async () => {
      mockInviteCodeCreate.mockResolvedValueOnce({ id: 2, code: 'AUTOGENX' });

      const caller = makeCaller(SUPER_ADMIN);
      await caller.create({ quotaLimit: 1 });

      const dataArg = (mockInviteCodeCreate.mock.calls[0] as [{ data: Record<string, unknown> }])[0].data;
      expect(typeof dataArg.code).toBe('string');
      expect((dataArg.code as string).length).toBeGreaterThan(0);
    });

    it('sets campaign and expiresAt', async () => {
      mockInviteCodeCreate.mockResolvedValueOnce({ id: 3, code: 'CAMP001' });
      const expiresAt = new Date(Date.now() + 86400_000);

      const caller = makeCaller(SUPER_ADMIN);
      await caller.create({ campaign: 'SPRING2026', expiresAt, quotaLimit: 10 });

      const dataArg = (mockInviteCodeCreate.mock.calls[0] as [{ data: Record<string, unknown> }])[0].data;
      expect(dataArg.campaign).toBe('SPRING2026');
      expect(dataArg.expiresAt).toEqual(expiresAt);
    });

    it('throws FORBIDDEN for readonly_admin', async () => {
      const caller = makeCaller(READONLY_ADMIN);
      await expect(caller.create({ quotaLimit: 1 })).rejects.toThrow('privilege_escalation');
    });

    it('writes audit on create', async () => {
      mockInviteCodeCreate.mockResolvedValueOnce({ id: 4, code: 'AUDIT001' });

      const caller = makeCaller(ADMIN_USER);
      await caller.create({ quotaLimit: 1 });

      expect(mockLogAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'create_invite_code' }),
      );
    });
  });

  // ── batchImport ────────────────────────────────────────────────────────

  describe('batchImport', () => {
    it('imports valid CSV rows', async () => {
      const csv = 'code,quotaLimit,campaign\nABC001,1,SPRING2026\nABC002,2,SPRING2026';
      mockInviteCodeCreate.mockResolvedValue({ id: 10, code: 'ABC001' });

      const caller = makeCaller(SUPER_ADMIN);
      const result = await caller.batchImport({ csvData: csv });

      expect(result.imported).toBe(2);
      expect(result.errors).toHaveLength(0);
    });

    it('skips duplicate codes and returns row errors', async () => {
      const csv = 'code\nDUP001\nDUP001';
      mockInviteCodeCreate
        .mockResolvedValueOnce({ id: 11, code: 'DUP001' })
        .mockRejectedValueOnce(Object.assign(new Error('Unique constraint'), { code: 'P2002' }));

      const caller = makeCaller(SUPER_ADMIN);
      const result = await caller.batchImport({ csvData: csv });

      expect(result.imported).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.reason).toBe('duplicate code');
    });

    it('throws ValidationError when rows > 10000', async () => {
      const rows = ['code', ...Array.from({ length: 10001 }, (_, i) => `CODE${i}`)];
      const csv = rows.join('\n');

      const caller = makeCaller(SUPER_ADMIN);
      await expect(caller.batchImport({ csvData: csv })).rejects.toThrow('exceeds limit');
    });

    it('skips rows with missing code and records error', async () => {
      const csv = 'code,campaign\n,SPRING2026\nGOOD001,SPRING2026';
      mockInviteCodeCreate.mockResolvedValueOnce({ id: 12, code: 'GOOD001' });

      const caller = makeCaller(SUPER_ADMIN);
      const result = await caller.batchImport({ csvData: csv });

      expect(result.imported).toBe(1);
      expect(result.errors.some((e) => e.reason === 'missing code')).toBe(true);
    });

    it('throws FORBIDDEN for readonly_admin', async () => {
      const caller = makeCaller(READONLY_ADMIN);
      await expect(caller.batchImport({ csvData: 'code\nTEST' })).rejects.toThrow('privilege_escalation');
    });
  });

  // ── invalidate ─────────────────────────────────────────────────────────

  describe('invalidate', () => {
    const activeInvite = { id: 1, code: 'VALID001', isActive: true, campaign: 'SPRING2026' };
    const inactiveInvite = { id: 2, code: 'DEAD001', isActive: false, campaign: null };

    it('super_admin invalidates — creates auto_executed approval + deactivates code', async () => {
      mockInviteCodeFindUnique.mockResolvedValueOnce(activeInvite);
      mockApprovalRequestCreate.mockResolvedValueOnce({ id: 99 });
      mockInviteCodeUpdate.mockResolvedValueOnce({});

      const caller = makeCaller(SUPER_ADMIN);
      const result = await caller.invalidate({ code: 'VALID001', reason: 'Test invalidation reason' });

      expect(result.status).toBe('auto_executed');
      expect(mockApprovalRequestCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'auto_executed', actionType: 'invalidate_invite_code' }),
        }),
      );
      expect(mockInviteCodeUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isActive: false } }),
      );
    });

    it('admin creates pending approval_request — does NOT deactivate code', async () => {
      mockInviteCodeFindUnique.mockResolvedValueOnce(activeInvite);
      mockApprovalRequestCreate.mockResolvedValueOnce({ id: 100 });

      const caller = makeCaller(ADMIN_USER);
      const result = await caller.invalidate({ code: 'VALID001', reason: 'Admin invalidation reason' });

      expect(result.status).toBe('pending');
      expect(mockApprovalRequestCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'pending', actionType: 'invalidate_invite_code' }),
        }),
      );
      expect(mockInviteCodeUpdate).not.toHaveBeenCalled();
    });

    it('throws BAD_REQUEST when code already invalidated', async () => {
      mockInviteCodeFindUnique.mockResolvedValueOnce(inactiveInvite);

      const caller = makeCaller(SUPER_ADMIN);
      await expect(
        caller.invalidate({ code: 'DEAD001', reason: 'Already dead reason' }),
      ).rejects.toThrow('already invalidated');
    });

    it('throws NOT_FOUND when code does not exist', async () => {
      mockInviteCodeFindUnique.mockResolvedValueOnce(null);

      const caller = makeCaller(SUPER_ADMIN);
      await expect(
        caller.invalidate({ code: 'NOTEXIST', reason: 'Not found reason' }),
      ).rejects.toThrow('invite_code_not_found');
    });

    it('writes high_risk_action audit for super_admin', async () => {
      mockInviteCodeFindUnique.mockResolvedValueOnce(activeInvite);
      mockApprovalRequestCreate.mockResolvedValueOnce({ id: 99 });
      mockInviteCodeUpdate.mockResolvedValueOnce({});

      const caller = makeCaller(SUPER_ADMIN);
      await caller.invalidate({ code: 'VALID001', reason: 'Audit test reason' });

      expect(mockLogAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({
          eventCategory: 'high_risk_action',
          eventType: 'invalidate_invite_code',
        }),
      );
    });

    it('throws FORBIDDEN for readonly_admin', async () => {
      const caller = makeCaller(READONLY_ADMIN);
      await expect(
        caller.invalidate({ code: 'VALID001', reason: 'ReadOnly attempt reason' }),
      ).rejects.toThrow('privilege_escalation');
    });
  });

  // ── detail ─────────────────────────────────────────────────────────────

  describe('detail', () => {
    const inviteWithUser = {
      id: 1,
      code: 'DETAIL001',
      isActive: true,
      maxUses: 1,
      usedCount: 1,
      expiresAt: null,
      campaign: 'SPRING2026',
      notes: null,
      createdAt: new Date(),
      usedAt: new Date(),
      usedById: 42,
      createdBy: { id: 1, email: 'super@quanan.com' },
      usedBy: { id: 42, email: 'user@example.com', isActivated: true, createdAt: new Date() },
    };

    it('returns invite detail with activation history and step9 progress', async () => {
      mockInviteCodeFindUnique.mockResolvedValueOnce(inviteWithUser);
      mockAuditLogFindMany.mockResolvedValueOnce([{ id: 1, userId: 42, eventType: 'redeem', createdAt: new Date(), ipAddress: '1.2.3.4', userAgent: 'test' }]);
      mockIpAccountFindFirst.mockResolvedValueOnce({ id: 55 });
      mockStepDataFindMany.mockResolvedValueOnce([{ stepKey: 'step9', status: 'completed', updatedAt: new Date() }]);

      const caller = makeCaller(SUPER_ADMIN);
      const result = await caller.detail({ code: 'DETAIL001' });

      expect(result.invite.code).toBe('DETAIL001');
      expect(result.activationHistory).toHaveLength(1);
      expect(result.step9Progress).toHaveLength(1);
      expect(result.step9Progress[0]?.stepKey).toBe('step9');
    });

    it('throws NOT_FOUND when code does not exist', async () => {
      mockInviteCodeFindUnique.mockResolvedValueOnce(null);

      const caller = makeCaller(SUPER_ADMIN);
      await expect(caller.detail({ code: 'NOTEXIST' })).rejects.toThrow('invite_code_not_found');
    });

    it('returns empty step9Progress when code not used', async () => {
      const unusedInvite = { ...inviteWithUser, usedById: null, usedBy: null };
      mockInviteCodeFindUnique.mockResolvedValueOnce(unusedInvite);
      mockAuditLogFindMany.mockResolvedValueOnce([]);

      const caller = makeCaller(SUPER_ADMIN);
      const result = await caller.detail({ code: 'DETAIL001' });

      expect(result.step9Progress).toHaveLength(0);
      expect(mockIpAccountFindFirst).not.toHaveBeenCalled();
    });
  });

  // ── campaignFunnel ─────────────────────────────────────────────────────

  describe('campaignFunnel', () => {
    it('returns funnel as [{stage, count}] array', async () => {
      const caller = makeCaller(SUPER_ADMIN);
      const result = await caller.campaignFunnel({ campaignKey: 'SPRING2026' });

      expect(result).toEqual([
        { stage: 'registered', count: 100 },
        { stage: 'activated', count: 80 },
        { stage: 'step9Completed', count: 40 },
        { stage: 'd30Retained', count: 60 },
      ]);
    });

    it('calls getCampaignFunnel with correct campaignKey', async () => {
      const caller = makeCaller(ADMIN_USER);
      await caller.campaignFunnel({ campaignKey: 'SUMMER2026' });

      expect(mockGetCampaignFunnel).toHaveBeenCalledWith('SUMMER2026');
    });

    it('propagates CampaignNotFoundError when campaign not found', async () => {
      mockGetCampaignFunnel.mockRejectedValueOnce(
        new Error('Campaign "NOTEXIST" not found'),
      );

      const caller = makeCaller(SUPER_ADMIN);
      await expect(caller.campaignFunnel({ campaignKey: 'NOTEXIST' })).rejects.toThrow('Campaign "NOTEXIST" not found');
    });

    it('writes audit log on campaignFunnel', async () => {
      const caller = makeCaller(SUPER_ADMIN);
      await caller.campaignFunnel({ campaignKey: 'SPRING2026' });

      expect(mockLogAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'view_campaign_funnel' }),
      );
    });
  });
});
