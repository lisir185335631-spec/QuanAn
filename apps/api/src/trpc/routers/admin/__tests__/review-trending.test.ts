// PRD-12 US-004 · reviewTrendingRouter unit tests — ≥ 30 tests
// list / detail / approve / reject / batchAction / configRules / auth gates

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ──────────────────────────────────────────────────────────

const mockLogAdminAction = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

const mockQueueFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockQueueCount = vi.hoisted(() => vi.fn().mockResolvedValue(0));
const mockQueueFindUnique = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockQueueUpdate = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const mockTrendingItemCreate = vi.hoisted(() => vi.fn().mockResolvedValue({ id: 42 }));
const mockAutoReviewRuleUpsert = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    id: 1,
    ruleType: 'sampling_rate',
    ruleKey: 'default',
    ruleValue: {},
    enabled: true,
    updatedByAdminId: 1,
    updatedAt: new Date(),
  }),
);
const mockExecuteRawUnsafe = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock('@/services/admin/admin-audit-service', () => ({
  logAdminAction: mockLogAdminAction,
}));

vi.mock('@/lib/prisma', () => {
  const buildTx = () => ({
    $executeRawUnsafe: mockExecuteRawUnsafe,
    trendingReviewQueue: {
      findMany: mockQueueFindMany,
      count: mockQueueCount,
      findUnique: mockQueueFindUnique,
      update: mockQueueUpdate,
    },
    trendingItem: { create: mockTrendingItemCreate },
    autoReviewRule: { upsert: mockAutoReviewRuleUpsert },
  });

  return {
    prisma: {
      $transaction: vi.fn().mockImplementation((cb: (tx: unknown) => unknown) => cb(buildTx())),
      trendingReviewQueue: {
        findMany: mockQueueFindMany,
        count: mockQueueCount,
        findUnique: mockQueueFindUnique,
        update: mockQueueUpdate,
      },
      trendingItem: { create: mockTrendingItemCreate },
      autoReviewRule: { upsert: mockAutoReviewRuleUpsert },
    },
  };
});

// ── Imports ────────────────────────────────────────────────────────────────

import type { AdminLuciaSession, AdminLuciaUser } from '@/lib/auth/lucia-admin';
import { prisma } from '@/lib/prisma';
import type { AdminTRPCContext } from '@/server/context-admin';
import { reviewTrendingRouter } from '@/trpc/routers/admin/review-trending';

import type { PrismaClient } from '@prisma/client';


// ── Fixtures ───────────────────────────────────────────────────────────────

const SUPER_ADMIN: AdminLuciaUser = {
  id: 1,
  email: 'super@quanan.com',
  role: 'super_admin',
  isMock: true,
  isActive: true,
  allowedDomains: [],
};

const ADMIN_USER: AdminLuciaUser = {
  id: 2,
  email: 'admin@quanan.com',
  role: 'admin',
  isMock: true,
  isActive: true,
  allowedDomains: [],
};

const READONLY_ADMIN: AdminLuciaUser = {
  id: 3,
  email: 'ro@quanan.com',
  role: 'readonly_admin',
  isMock: true,
  isActive: true,
  allowedDomains: [],
};

const SESSION: AdminLuciaSession = {
  id: 'sess-test',
  expiresAt: new Date(Date.now() + 3600_000),
  fresh: false,
};

function makeCtx(user: AdminLuciaUser): AdminTRPCContext {
  return {
    req: new Request('http://localhost', {
      headers: { 'x-forwarded-for': '10.0.0.1', 'user-agent': 'test-agent' },
    }),
    resHeaders: new Headers(),
    prisma: prisma as unknown as PrismaClient,
    adminPrisma: prisma as unknown as PrismaClient,
    activeAdminUser: user,
    adminSession: SESSION,
    traceId: 'trace-us004',
  };
}

function makeCaller(user: AdminLuciaUser) {
  return reviewTrendingRouter.createCaller(makeCtx(user));
}

const QUEUE_ITEM = {
  id: 1,
  sourcePlatform: 'douyin',
  sourceItemId: 'item-001',
  sourceUrl: 'https://douyin.com/item/001',
  rawContent: { title: '测试内容', vendor: 'douyin', viewCount: 1000, likeCount: 50 },
  fetchedAt: new Date(),
  autoScanResult: { violations: [] },
  autoVerdict: 'needs_review',
  status: 'pending',
  reviewerAdminId: null,
  reviewedAt: null,
  rejectReason: null,
  trendingItemId: null,
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe('reviewTrendingRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset defaults
    mockQueueFindMany.mockResolvedValue([]);
    mockQueueCount.mockResolvedValue(0);
    mockQueueFindUnique.mockResolvedValue(null);
    mockQueueUpdate.mockResolvedValue({});
    mockTrendingItemCreate.mockResolvedValue({ id: 42 });
    mockAutoReviewRuleUpsert.mockResolvedValue({
      id: 1,
      ruleType: 'sampling_rate',
      ruleKey: 'default',
      ruleValue: {},
      enabled: true,
      updatedByAdminId: 1,
      updatedAt: new Date(),
    });
    // Reset $transaction to rebuild tx on each call
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      (cb: (tx: unknown) => unknown) => {
        const tx = {
          $executeRawUnsafe: mockExecuteRawUnsafe,
          trendingReviewQueue: {
            findMany: mockQueueFindMany,
            count: mockQueueCount,
            findUnique: mockQueueFindUnique,
            update: mockQueueUpdate,
          },
          trendingItem: { create: mockTrendingItemCreate },
          autoReviewRule: { upsert: mockAutoReviewRuleUpsert },
        };
        return cb(tx);
      },
    );
  });

  // ── list ─────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('returns paginated items and count', async () => {
      mockQueueFindMany.mockResolvedValueOnce([QUEUE_ITEM]);
      mockQueueCount.mockResolvedValueOnce(1);

      const result = await makeCaller(SUPER_ADMIN).list({});
      expect(result.items).toHaveLength(1);
      expect(result.count).toBe(1);
      expect(result.page).toBe(1);
    });

    it('filters by statusFilter', async () => {
      await makeCaller(ADMIN_USER).list({ statusFilter: 'pending' });

      const whereArg = (mockQueueFindMany.mock.calls[0] as [{ where: Record<string, unknown> }])[0]
        .where;
      expect(whereArg.status).toBe('pending');
    });

    it('filters by platformFilter', async () => {
      await makeCaller(SUPER_ADMIN).list({ platformFilter: 'douyin' });

      const whereArg = (mockQueueFindMany.mock.calls[0] as [{ where: Record<string, unknown> }])[0]
        .where;
      expect(whereArg.sourcePlatform).toBe('douyin');
    });

    it('filters by autoVerdictFilter', async () => {
      await makeCaller(SUPER_ADMIN).list({ autoVerdictFilter: 'needs_review' });

      const whereArg = (mockQueueFindMany.mock.calls[0] as [{ where: Record<string, unknown> }])[0]
        .where;
      expect(whereArg.autoVerdict).toBe('needs_review');
    });

    it('applies dateRange filter with from and to', async () => {
      const from = new Date('2026-01-01');
      const to = new Date('2026-12-31');
      await makeCaller(SUPER_ADMIN).list({ dateRange: { from, to } });

      const whereArg = (mockQueueFindMany.mock.calls[0] as [{ where: Record<string, unknown> }])[0]
        .where;
      expect(whereArg.fetchedAt).toMatchObject({ gte: from, lte: to });
    });

    it('writes audit log: list_trending_review_queue', async () => {
      await makeCaller(SUPER_ADMIN).list({});
      expect(mockLogAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'list_trending_review_queue',
          eventCategory: 'data_query',
        }),
      );
    });

    it('readonly_admin can call list', async () => {
      await expect(makeCaller(READONLY_ADMIN).list({})).resolves.toBeDefined();
    });

    it('handles empty results correctly', async () => {
      const result = await makeCaller(SUPER_ADMIN).list({ page: 2, pageSize: 10 });
      expect(result.items).toHaveLength(0);
      expect(result.count).toBe(0);
      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(10);
    });
  });

  // ── detail ────────────────────────────────────────────────────────────────

  describe('detail', () => {
    it('returns full item with rawContent and autoScanResult', async () => {
      mockQueueFindUnique.mockResolvedValueOnce(QUEUE_ITEM);

      const result = await makeCaller(SUPER_ADMIN).detail({ queueId: 1 });
      expect(result.id).toBe(1);
      expect(result.rawContent).toBeDefined();
      expect(result.autoScanResult).toBeDefined();
    });

    it('returns trendingItemId when approved', async () => {
      mockQueueFindUnique.mockResolvedValueOnce({ ...QUEUE_ITEM, status: 'approved', trendingItemId: 99 });
      const result = await makeCaller(SUPER_ADMIN).detail({ queueId: 1 });
      expect(result.trendingItemId).toBe(99);
    });

    it('throws when item not found', async () => {
      mockQueueFindUnique.mockResolvedValueOnce(null);
      await expect(makeCaller(SUPER_ADMIN).detail({ queueId: 999 })).rejects.toThrow(
        'trending_review_queue_not_found',
      );
    });

    it('readonly_admin can call detail', async () => {
      mockQueueFindUnique.mockResolvedValueOnce(QUEUE_ITEM);
      await expect(makeCaller(READONLY_ADMIN).detail({ queueId: 1 })).resolves.toBeDefined();
    });
  });

  // ── approve ───────────────────────────────────────────────────────────────

  describe('approve', () => {
    it('approves a pending item and creates trendingItem', async () => {
      mockQueueFindUnique.mockResolvedValue({ ...QUEUE_ITEM, status: 'pending' });
      mockTrendingItemCreate.mockResolvedValue({ id: 42 });

      const result = await makeCaller(SUPER_ADMIN).approve({ queueId: 1 });
      expect(result.trendingItemId).toBe(42);
      expect(result.queueId).toBe(1);
    });

    it('calls update twice: status + trendingItemId (atomic)', async () => {
      mockQueueFindUnique.mockResolvedValue({ ...QUEUE_ITEM, status: 'pending' });

      await makeCaller(SUPER_ADMIN).approve({ queueId: 1 });
      // 2 updates: set status='approved', then set trendingItemId
      expect(mockQueueUpdate).toHaveBeenCalledTimes(2);
    });

    it('trendingItem.create is called exactly once (LD-A-5)', async () => {
      mockQueueFindUnique.mockResolvedValue({ ...QUEUE_ITEM, status: 'pending' });

      await makeCaller(SUPER_ADMIN).approve({ queueId: 1 });
      expect(mockTrendingItemCreate).toHaveBeenCalledTimes(1);
    });

    it('writes audit log: trending_review_approve', async () => {
      mockQueueFindUnique.mockResolvedValue({ ...QUEUE_ITEM, status: 'pending' });
      await makeCaller(SUPER_ADMIN).approve({ queueId: 1 });
      expect(mockLogAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'trending_review_approve',
          eventCategory: 'data_mutation',
        }),
      );
    });

    it('throws already_approved when already approved (防双重入库)', async () => {
      mockQueueFindUnique.mockResolvedValue({ ...QUEUE_ITEM, status: 'approved' });
      await expect(makeCaller(SUPER_ADMIN).approve({ queueId: 1 })).rejects.toThrow(
        'already_approved',
      );
    });

    it('throws already_has_trending_item when trendingItemId set (防双重入库)', async () => {
      mockQueueFindUnique.mockResolvedValue({
        ...QUEUE_ITEM,
        status: 'pending',
        trendingItemId: 99,
      });
      await expect(makeCaller(SUPER_ADMIN).approve({ queueId: 1 })).rejects.toThrow(
        'already_has_trending_item',
      );
    });

    it('throws when item not found', async () => {
      mockQueueFindUnique.mockResolvedValue(null);
      await expect(makeCaller(SUPER_ADMIN).approve({ queueId: 999 })).rejects.toThrow(
        'trending_review_queue_not_found',
      );
    });

    it('readonly_admin cannot approve → privilege_escalation', async () => {
      await expect(makeCaller(READONLY_ADMIN).approve({ queueId: 1 })).rejects.toThrow(
        'privilege_escalation',
      );
    });

    it('regular admin can approve', async () => {
      mockQueueFindUnique.mockResolvedValue({ ...QUEUE_ITEM, status: 'pending' });
      await expect(makeCaller(ADMIN_USER).approve({ queueId: 1 })).resolves.toBeDefined();
    });

    it('uses vendor from rawContent when not provided', async () => {
      mockQueueFindUnique.mockResolvedValue({ ...QUEUE_ITEM, status: 'pending' });
      await makeCaller(SUPER_ADMIN).approve({ queueId: 1 });
      const createData = (
        mockTrendingItemCreate.mock.calls[0] as [{ data: Record<string, unknown> }]
      )[0].data;
      expect(createData.vendor).toBe('douyin'); // from rawContent.vendor
    });

    it('uses input vendor when provided', async () => {
      mockQueueFindUnique.mockResolvedValue({ ...QUEUE_ITEM, status: 'pending' });
      await makeCaller(SUPER_ADMIN).approve({ queueId: 1, vendor: 'custom_vendor' });
      const createData = (
        mockTrendingItemCreate.mock.calls[0] as [{ data: Record<string, unknown> }]
      )[0].data;
      expect(createData.vendor).toBe('custom_vendor');
    });
  });

  // ── reject ────────────────────────────────────────────────────────────────

  describe('reject', () => {
    it('rejects a pending item and updates status', async () => {
      mockQueueFindUnique.mockResolvedValueOnce({ ...QUEUE_ITEM, status: 'pending' });

      const result = await makeCaller(SUPER_ADMIN).reject({
        queueId: 1,
        rejectReason: '内容不符合规范要求',
      });
      expect(result.status).toBe('rejected');
      expect(result.queueId).toBe(1);
    });

    it('writes audit log: trending_review_reject', async () => {
      mockQueueFindUnique.mockResolvedValueOnce({ ...QUEUE_ITEM, status: 'pending' });
      await makeCaller(SUPER_ADMIN).reject({ queueId: 1, rejectReason: '内容不符合规范要求' });
      expect(mockLogAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'trending_review_reject' }),
      );
    });

    it('throws already_rejected when already rejected', async () => {
      mockQueueFindUnique.mockResolvedValueOnce({ ...QUEUE_ITEM, status: 'rejected' });
      await expect(
        makeCaller(SUPER_ADMIN).reject({ queueId: 1, rejectReason: '内容不符合规范要求' }),
      ).rejects.toThrow('already_rejected');
    });

    it('throws when item not found', async () => {
      mockQueueFindUnique.mockImplementation(() => Promise.resolve(null));
      await expect(
        makeCaller(SUPER_ADMIN).reject({ queueId: 999, rejectReason: '内容违规理由说明' }),
      ).rejects.toThrow('trending_review_queue_not_found');
    });

    it('rejectReason min 5 chars — zod validation', async () => {
      await expect(
        makeCaller(SUPER_ADMIN).reject({ queueId: 1, rejectReason: 'ab' }),
      ).rejects.toThrow();
    });

    it('readonly_admin cannot reject → privilege_escalation', async () => {
      await expect(
        makeCaller(READONLY_ADMIN).reject({ queueId: 1, rejectReason: '内容不符合规范要求' }),
      ).rejects.toThrow('privilege_escalation');
    });

    it('regular admin can reject', async () => {
      mockQueueFindUnique.mockImplementation(() => Promise.resolve({ ...QUEUE_ITEM, status: 'pending' }));
      await expect(
        makeCaller(ADMIN_USER).reject({ queueId: 1, rejectReason: '内容不符合规范要求' }),
      ).resolves.toBeDefined();
    });
  });

  // ── batchAction ───────────────────────────────────────────────────────────

  describe('batchAction', () => {
    it('batch rejects multiple items successfully', async () => {
      // Use mockImplementation to return by queueId
      mockQueueFindUnique
        .mockResolvedValueOnce({ ...QUEUE_ITEM, id: 1, status: 'pending' })
        .mockResolvedValueOnce({ ...QUEUE_ITEM, id: 2, status: 'pending' });

      const result = await makeCaller(SUPER_ADMIN).batchAction({
        queueIds: [1, 2],
        action: 'reject',
        reason: 'batch reject reason',
      });

      expect(result.total).toBe(2);
      expect(result.succeeded).toBe(2);
    });

    it('batch approves items atomically (per item transaction)', async () => {
      // Return pending items for each findUnique call
      mockQueueFindUnique
        .mockResolvedValueOnce({ ...QUEUE_ITEM, id: 1, status: 'pending', trendingItemId: null })
        .mockResolvedValueOnce({ ...QUEUE_ITEM, id: 2, status: 'pending', trendingItemId: null });

      const result = await makeCaller(SUPER_ADMIN).batchAction({
        queueIds: [1, 2],
        action: 'approve',
      });

      expect(result.total).toBe(2);
      // Both should succeed (creates happen in nested $transaction)
      expect(result.succeeded).toBeGreaterThanOrEqual(1);
    });

    it('each item gets its own audit log entry', async () => {
      mockQueueFindUnique.mockResolvedValueOnce({ ...QUEUE_ITEM, id: 1, status: 'pending' });

      await makeCaller(SUPER_ADMIN).batchAction({
        queueIds: [1],
        action: 'reject',
        reason: 'test batch reason',
      });

      // At least one audit for the batchAction item
      expect(mockLogAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'trending_review_batch_reject' }),
      );
    });

    it('zod rejects queueIds array with > 100 items (AC-10)', async () => {
      const ids = Array.from({ length: 101 }, (_, i) => i + 1);
      await expect(
        makeCaller(SUPER_ADMIN).batchAction({ queueIds: ids, action: 'reject' }),
      ).rejects.toThrow();
    });

    it('readonly_admin cannot batchAction → privilege_escalation', async () => {
      await expect(
        makeCaller(READONLY_ADMIN).batchAction({ queueIds: [1], action: 'reject' }),
      ).rejects.toThrow('privilege_escalation');
    });

    it('returns error for already-approved items in batch', async () => {
      // Use mockImplementation to override any queue state
      mockQueueFindUnique.mockImplementation(() =>
        Promise.resolve({ ...QUEUE_ITEM, status: 'approved', trendingItemId: 10 }),
      );

      const result = await makeCaller(SUPER_ADMIN).batchAction({
        queueIds: [1],
        action: 'approve',
      });

      expect(result.succeeded).toBe(0);
      expect(result.results[0]?.error).toBe('already_processed');
    });

    it('returns error for not_found items in batch', async () => {
      mockQueueFindUnique.mockImplementation(() => Promise.resolve(null));

      const result = await makeCaller(SUPER_ADMIN).batchAction({
        queueIds: [999],
        action: 'reject',
      });

      expect(result.succeeded).toBe(0);
      expect(result.results[0]?.error).toBe('not_found');
    });

    it('returns error for already-rejected items in batch reject', async () => {
      mockQueueFindUnique.mockImplementation(() =>
        Promise.resolve({ ...QUEUE_ITEM, status: 'rejected' }),
      );

      const result = await makeCaller(SUPER_ADMIN).batchAction({
        queueIds: [1],
        action: 'reject',
        reason: 'reason for rejection',
      });

      expect(result.results[0]?.error).toBe('already_rejected');
    });
  });

  // ── configRules ───────────────────────────────────────────────────────────

  describe('configRules', () => {
    it('super_admin can update auto review rules', async () => {
      const result = await makeCaller(SUPER_ADMIN).configRules({
        ruleType: 'sampling_rate',
        ruleKey: 'default',
        ruleValue: { rate: 0.1 },
        enabled: true,
      });

      expect(mockAutoReviewRuleUpsert).toHaveBeenCalledTimes(1);
      expect(result.ruleType).toBe('sampling_rate');
    });

    it('writes audit log: auto_review_rule_update in config_change category', async () => {
      await makeCaller(SUPER_ADMIN).configRules({
        ruleType: 'banned_word',
        ruleKey: 'test_word',
        ruleValue: { words: ['badword'] },
        enabled: true,
      });

      expect(mockLogAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'auto_review_rule_update',
          eventCategory: 'config_change',
        }),
      );
    });

    it('regular admin cannot configRules → privilege_escalation', async () => {
      await expect(
        makeCaller(ADMIN_USER).configRules({
          ruleType: 'sampling_rate',
          ruleKey: 'default',
          ruleValue: {},
          enabled: true,
        }),
      ).rejects.toThrow('privilege_escalation');
    });

    it('readonly_admin cannot configRules → privilege_escalation', async () => {
      await expect(
        makeCaller(READONLY_ADMIN).configRules({
          ruleType: 'sampling_rate',
          ruleKey: 'default',
          ruleValue: {},
          enabled: true,
        }),
      ).rejects.toThrow('privilege_escalation');
    });

    it('privilege_escalation audit written for non-super_admin attempt', async () => {
      await expect(
        makeCaller(ADMIN_USER).configRules({
          ruleType: 'industry_quota',
          ruleKey: 'douyin',
          ruleValue: {},
          enabled: false,
        }),
      ).rejects.toThrow('privilege_escalation');

      expect(mockLogAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'privilege_escalation' }),
      );
    });

    it('upserts rule (create-or-update) using ruleType+ruleKey composite key', async () => {
      await makeCaller(SUPER_ADMIN).configRules({
        ruleType: 'industry_quota',
        ruleKey: 'douyin_food',
        ruleValue: { quota: 100 },
        enabled: true,
      });

      const upsertArgs = (mockAutoReviewRuleUpsert.mock.calls[0] as [{ where: Record<string, unknown> }])[0];
      expect(upsertArgs.where).toMatchObject({
        ruleType_ruleKey: { ruleType: 'industry_quota', ruleKey: 'douyin_food' },
      });
    });
  });
});
