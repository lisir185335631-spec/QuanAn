/**
 * Integration test — PRD-8 US-003 AC-10
 * 5 同 account feedback 并发 → 仅 1 次 enqueue (prisma update 原子保证)
 *
 * 测试策略:
 * - 真实 DB (quanqn_test) — 验证 INSERT ON CONFLICT 原子递增
 * - mock evolutionQueue.add — 计数 enqueue 次数, 不需要真实 Redis
 * - 5 并发 Promise.all 同 accountId → feedbackCountTotal 0→5 → threshold:5 触发
 * - 期望: queue.add 恰好调用 1 次 (count=5 唯一命中阈值)
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';

// ── All mocks must use vi.hoisted to avoid top-level variable hoisting issues ─

const { mockQueueAdd, testPrisma } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require('@prisma/client') as {
    PrismaClient: typeof import('@prisma/client').PrismaClient;
  };
  const TEST_DB =
    process.env['DATABASE_URL_TEST'] ?? 'postgresql://return@localhost:5432/quanqn_test';
  return {
    mockQueueAdd: vi.fn().mockResolvedValue({ id: 'evo-mock-job-1' }),
    testPrisma: new PrismaClient({ datasources: { db: { url: TEST_DB } } }),
  };
});

vi.mock('@/workers/evolution/queue', () => ({
  evolutionQueue: { add: mockQueueAdd },
  EVOLUTION_QUEUE_NAME: 'evolution',
}));

vi.mock('@/lib/prisma', () => ({
  prisma: testPrisma,
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── Import SUT after mocks ────────────────────────────────────────────────────

import { enqueueIfThresholdMet } from '@/lib/evolution/trigger';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const RUN_ID = `evo_threshold_${Date.now()}`;
let testAccountId = 0;

beforeAll(async () => {
  const user = await testPrisma.user.create({
    data: {
      openId: `${RUN_ID}_user`,
      name: 'Evolution Threshold Test User',
      email: `${RUN_ID}@evolution-threshold.test`,
      loginMethod: 'mock',
    },
  });
  const account = await testPrisma.ipAccount.create({
    data: {
      userId: user.id,
      name: `Evolution Threshold Test Account ${RUN_ID}`,
      platform: 'xiaohongshu',
      industry: 'test',
    },
  });
  testAccountId = account.id;
}, 30_000);

afterAll(async () => {
  await testPrisma.evolutionProfile.deleteMany({ where: { accountId: testAccountId } });
  const accounts = await testPrisma.ipAccount.findMany({ where: { id: testAccountId } });
  if (accounts.length > 0) {
    await testPrisma.ipAccount.delete({ where: { id: testAccountId } });
    const userId = accounts[0]!.userId;
    await testPrisma.user.delete({ where: { id: userId } });
  }
  await testPrisma.$disconnect();
}, 30_000);

beforeEach(async () => {
  vi.clearAllMocks();
  // Reset evolution_profile to count=0 before each test
  await testPrisma.evolutionProfile.deleteMany({ where: { accountId: testAccountId } });
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AC-10: 5 concurrent same-account feedback → exactly 1 enqueue', () => {
  it('5 parallel enqueueIfThresholdMet calls → queue.add called exactly once (threshold:5)', async () => {
    const traceId = `tr_race_test_${Date.now()}`;

    // 5 concurrent calls with same accountId (starting from 0 → final count=5)
    await Promise.all(
      Array.from({ length: 5 }, () => enqueueIfThresholdMet(testAccountId, traceId)),
    );

    // Verify atomic increment: final count must be 5
    const profile = await testPrisma.evolutionProfile.findUnique({
      where: { accountId: testAccountId },
      select: { feedbackCountTotal: true },
    });
    expect(profile?.feedbackCountTotal).toBe(5);

    // AC-10: exactly 1 enqueue (count=5 is the only threshold in {5,20,50,100})
    expect(mockQueueAdd).toHaveBeenCalledTimes(1);
    expect(mockQueueAdd).toHaveBeenCalledWith(
      'evolve',
      { accountId: testAccountId, triggerType: 'threshold:5' },
      expect.objectContaining({ jobId: `evo:${testAccountId}:5` }),
    );
  }, 15_000);

  it('counts 1-4 and 6-10 do NOT trigger enqueue', async () => {
    // Counts 1-4 → no threshold
    for (let i = 0; i < 4; i++) {
      await enqueueIfThresholdMet(testAccountId, 'tr_no_threshold');
    }
    expect(mockQueueAdd).not.toHaveBeenCalled();

    // Count 5 → threshold → 1 enqueue
    await enqueueIfThresholdMet(testAccountId, 'tr_threshold_5');
    expect(mockQueueAdd).toHaveBeenCalledTimes(1);

    // Counts 6-9 → no threshold (next threshold is 20)
    for (let i = 0; i < 4; i++) {
      await enqueueIfThresholdMet(testAccountId, 'tr_no_threshold');
    }
    expect(mockQueueAdd).toHaveBeenCalledTimes(1); // still 1

    // Count 10 → not in {5,20,50,100} → no additional enqueue
    await enqueueIfThresholdMet(testAccountId, 'tr_count_10');
    expect(mockQueueAdd).toHaveBeenCalledTimes(1);
  }, 15_000);

  it('jobId deduplication: concurrent rush at threshold uses same jobId', async () => {
    // Advance to count=4 (sequential)
    for (let i = 0; i < 4; i++) {
      await enqueueIfThresholdMet(testAccountId, 'tr_advance');
    }
    expect(mockQueueAdd).not.toHaveBeenCalled();

    // 5 concurrent — only one sees count=5; rest see 6-9 (all non-threshold)
    await Promise.all(
      Array.from({ length: 5 }, () => enqueueIfThresholdMet(testAccountId, 'tr_concurrent')),
    );

    expect(mockQueueAdd).toHaveBeenCalledTimes(1);
    const call = mockQueueAdd.mock.calls[0];
    expect(call?.[2]).toMatchObject({ jobId: `evo:${testAccountId}:5` });
  }, 15_000);
});
