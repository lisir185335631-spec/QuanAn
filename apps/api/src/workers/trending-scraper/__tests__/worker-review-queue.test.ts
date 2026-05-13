// PRD-12 US-002 AC-8: ≥ 8 tests · worker-review-queue
// 覆盖 autoVerdict 三态 / 重复防御(P2002) / 失败 retry / autoScanResult Json 写入

import { Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockTrendingReviewQueueCreate = vi.fn();
const mockAdminAuditLogCreate = vi.fn();
const mockAutoReviewRuleFindMany = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    trendingReviewQueue: { create: mockTrendingReviewQueueCreate },
    adminAuditLog: { create: mockAdminAuditLogCreate },
    autoReviewRule: { findMany: mockAutoReviewRuleFindMany },
  },
}));

vi.mock('@/lib/redis', () => ({
  redis: { status: 'ready' },
}));

vi.mock('bullmq', () => ({
  Worker: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
  })),
  Queue: vi.fn().mockImplementation(() => ({
    add: vi.fn(),
    on: vi.fn(),
  })),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Dynamic import after mocks
const { processTrendingScraperJob } = await import('@/workers/trending-scraper/worker');

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BASE_PAYLOAD = {
  sourcePlatform: 'douyin',
  sourceItemId: 'item-001',
  sourceUrl: 'https://example.com/item-001',
  rawContent: { title: '正常内容', views: 1000 },
};

const P2002_ERROR = Object.assign(
  new Prisma.PrismaClientKnownRequestError('Unique constraint violation', {
    code: 'P2002',
    clientVersion: '5.0.0',
  }),
);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('processTrendingScraperJob', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAutoReviewRuleFindMany.mockResolvedValue([]);
    mockTrendingReviewQueueCreate.mockResolvedValue({ id: 1 });
    mockAdminAuditLogCreate.mockResolvedValue({ id: BigInt(1) });
  });

  it('AC-1: 写 trendingReviewQueue.create · 不写 trendingItem', async () => {
    await processTrendingScraperJob(BASE_PAYLOAD);
    expect(mockTrendingReviewQueueCreate).toHaveBeenCalledOnce();
    const call = (mockTrendingReviewQueueCreate.mock.calls[0] as [{ data: Record<string, unknown> }])[0];
    expect(call.data.sourcePlatform).toBe('douyin');
    expect(call.data.sourceItemId).toBe('item-001');
  });

  it('autoVerdict=auto_approved 时 status=auto_approved', async () => {
    // no banned words + samplingRate=0 → auto_approved
    mockAutoReviewRuleFindMany.mockResolvedValue([]);
    await processTrendingScraperJob(BASE_PAYLOAD);
    const call = (mockTrendingReviewQueueCreate.mock.calls[0] as [{ data: Record<string, unknown> }])[0];
    expect(call.data.autoVerdict).toBe('auto_approved');
    expect(call.data.status).toBe('auto_approved');
  });

  it('autoVerdict=auto_rejected 时 status=auto_rejected · 违禁词命中', async () => {
    mockAutoReviewRuleFindMany.mockResolvedValue([
      {
        id: 1,
        ruleType: 'banned_word',
        ruleKey: 'default',
        ruleValue: { words: ['正常内容'] }, // payload title contains this
        enabled: true,
        updatedByAdminId: 1,
        updatedAt: new Date(),
      },
    ]);
    await processTrendingScraperJob(BASE_PAYLOAD);
    const call = (mockTrendingReviewQueueCreate.mock.calls[0] as [{ data: Record<string, unknown> }])[0];
    expect(call.data.autoVerdict).toBe('auto_rejected');
    expect(call.data.status).toBe('auto_rejected');
  });

  it('autoVerdict=needs_review 时 status=pending · 抽样率=1', async () => {
    mockAutoReviewRuleFindMany.mockResolvedValue([
      {
        id: 2,
        ruleType: 'sampling_rate',
        ruleKey: 'default',
        ruleValue: { rate: 1 }, // 100% → all sampled → needs_review
        enabled: true,
        updatedByAdminId: 1,
        updatedAt: new Date(),
      },
    ]);
    await processTrendingScraperJob(BASE_PAYLOAD);
    const call = (mockTrendingReviewQueueCreate.mock.calls[0] as [{ data: Record<string, unknown> }])[0];
    expect(call.data.autoVerdict).toBe('needs_review');
    expect(call.data.status).toBe('pending');
  });

  it('AC-4: P2002 重复 → log warn 不 throw', async () => {
    const { logger } = await import('@/lib/logger');
    mockTrendingReviewQueueCreate.mockRejectedValue(P2002_ERROR);
    await expect(processTrendingScraperJob(BASE_PAYLOAD)).resolves.toBeUndefined();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ sourcePlatform: 'douyin', sourceItemId: 'item-001' }),
      'trending_scraper_worker.duplicate_skipped',
    );
  });

  it('非 P2002 错误正常 rethrow', async () => {
    mockTrendingReviewQueueCreate.mockRejectedValue(new Error('DB timeout'));
    await expect(processTrendingScraperJob(BASE_PAYLOAD)).rejects.toThrow('DB timeout');
  });

  it('AC-7: 成功写入后写 data_mutation/scraper_enqueue 审计日志', async () => {
    await processTrendingScraperJob(BASE_PAYLOAD);
    expect(mockAdminAuditLogCreate).toHaveBeenCalledOnce();
    const auditCall = (mockAdminAuditLogCreate.mock.calls[0] as [{ data: Record<string, unknown> }])[0];
    expect(auditCall.data.eventCategory).toBe('data_mutation');
    expect(auditCall.data.eventType).toBe('scraper_enqueue');
    expect(auditCall.data.actorAdminId).toBe(0);
    expect(auditCall.data.actorRole).toBe('system');
  });

  it('AC-1 反向验证: autoScanResult 是 Json 对象写入', async () => {
    await processTrendingScraperJob(BASE_PAYLOAD);
    const call = (mockTrendingReviewQueueCreate.mock.calls[0] as [{ data: Record<string, unknown> }])[0];
    expect(call.data.autoScanResult).toBeDefined();
    expect(typeof call.data.autoScanResult).toBe('object');
    const scan = call.data.autoScanResult as Record<string, unknown>;
    expect(Object.keys(scan)).toContain('bannedWordHits');
  });

  it('P2002 时不写 data_mutation 审计', async () => {
    mockTrendingReviewQueueCreate.mockRejectedValue(P2002_ERROR);
    await processTrendingScraperJob(BASE_PAYLOAD);
    // audit is written AFTER create; on P2002 we return early
    expect(mockAdminAuditLogCreate).not.toHaveBeenCalled();
  });
});
