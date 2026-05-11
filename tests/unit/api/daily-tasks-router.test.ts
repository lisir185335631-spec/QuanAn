/**
 * Unit tests — PRD-8 US-008
 * dailyTasks router: getToday / getHistory / markCompleted / regenerateToday
 * AC-1: LD-009 双层防护(accountId explicit + RLS via protectedProcedure)
 * AC-2: getToday null when no record; markCompleted updates tasks + completedCount;
 *       getHistory ordered by date desc; regenerateToday enqueues job
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';

// ── vi.hoisted — hoist mockQueueAdd before module resolution ─────────────────

const { mockQueueAdd } = vi.hoisted(() => ({
  mockQueueAdd: vi.fn(async () => ({ id: 'job-123' })),
}));

vi.mock('@/workers/daily-task/queue', () => ({
  dailyTaskQueue: { add: mockQueueAdd },
}));

// ── Mock redis (queue module imports it transitively) ─────────────────────────

vi.mock('@/lib/redis', () => ({
  redis: { duplicate: vi.fn(() => ({ on: vi.fn() })), on: vi.fn() },
}));

import { dailyTasksRouter } from '@/trpc/routers/dailyTasks';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

const UUID1 = '11111111-1111-4111-8111-111111111111';
const UUID2 = '22222222-2222-4222-8222-222222222222';
const UUID3 = '33333333-3333-4333-8333-333333333333';

const MOCK_TASKS_3 = [
  { id: UUID1, type: 'copywriting', title: '写一篇文案', description: '今日文案任务', difficulty: 'easy' as const, estimatedMinutes: 30, ctaText: '去写作', ctaUrl: '/copywriting', completed: false },
  { id: UUID2, type: 'analysis', title: '分析竞品', description: '分析3个竞品账号', difficulty: 'medium' as const, estimatedMinutes: 45, ctaText: '去分析', ctaUrl: '/analysis', completed: true },
  { id: UUID3, type: 'trending', title: '研究趋势', description: '看今日热门榜单', difficulty: 'easy' as const, estimatedMinutes: 20, ctaText: '去看榜', ctaUrl: '/trending', completed: false },
];

const MOCK_DAILY_TASK = {
  id: 1,
  accountId: 1,
  taskDate: TODAY,
  tasks: MOCK_TASKS_3,
  completedCount: 1,
  totalCount: 3,
  agentId: 'DailyTaskAgent',
  modelUsed: 'claude-sonnet-4-6',
  isFallback: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ── makeCtx ───────────────────────────────────────────────────────────────────

function makeCtx(overrides: Record<string, unknown> = {}) {
  const dailyTask = {
    findFirst: vi.fn(async () => ({ ...MOCK_DAILY_TASK })),
    findMany: vi.fn(async () => [{ ...MOCK_DAILY_TASK }]),
    update: vi.fn(async () => ({ ...MOCK_DAILY_TASK, completedCount: 2 })),
  };

  const tx = {
    dailyTask,
    $executeRaw: vi.fn(async () => 0),
  };

  const prisma = {
    dailyTask,
    $transaction: vi.fn(async (fn: (tx: typeof tx) => Promise<unknown>) => fn(tx)),
    _tx: tx,
  };

  return {
    ctx: {
      traceId: 'test-trace-us-008',
      activeAccountId: 1 as number | null,
      user: { id: 10, activeAccountId: 1 } as { id: number; activeAccountId: number | null } | null,
      prisma,
      req: new Request('http://localhost', { headers: { 'x-trace-id': 'test-trace-us-008' } }),
      sessionId: 'sess-008',
      ...overrides,
    },
    prisma,
  };
}

// ── getToday ──────────────────────────────────────────────────────────────────

describe('dailyTasks.getToday', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('AC-2: returns today DailyTask row when record exists', async () => {
    const { ctx, prisma } = makeCtx();
    const caller = dailyTasksRouter.createCaller(ctx as Parameters<typeof dailyTasksRouter.createCaller>[0]);

    const result = await caller.getToday();

    expect(prisma._tx.dailyTask.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ accountId: 1 }),
      }),
    );
    expect(result).toMatchObject({ id: 1, accountId: 1, totalCount: 3 });
  });

  it('AC-2: returns null when no record for today', async () => {
    const { ctx, prisma } = makeCtx();
    prisma._tx.dailyTask.findFirst.mockResolvedValue(null);
    const caller = dailyTasksRouter.createCaller(ctx as Parameters<typeof dailyTasksRouter.createCaller>[0]);

    const result = await caller.getToday();

    expect(result).toBeNull();
  });

  it('AC-1: queries with accountId (explicit double-layer guard)', async () => {
    const { ctx, prisma } = makeCtx({ activeAccountId: 7 });
    const caller = dailyTasksRouter.createCaller(ctx as Parameters<typeof dailyTasksRouter.createCaller>[0]);

    await caller.getToday();

    expect(prisma._tx.dailyTask.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ accountId: 7 }) }),
    );
  });
});

// ── getHistory ────────────────────────────────────────────────────────────────

describe('dailyTasks.getHistory', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('AC-2: returns list ordered by taskDate desc', async () => {
    const { ctx, prisma } = makeCtx();
    const caller = dailyTasksRouter.createCaller(ctx as Parameters<typeof dailyTasksRouter.createCaller>[0]);

    await caller.getHistory({ limit: 7, offset: 0 });

    expect(prisma._tx.dailyTask.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { accountId: 1 },
        orderBy: { taskDate: 'desc' },
        take: 7,
        skip: 0,
      }),
    );
  });

  it('AC-2: respects limit=30', async () => {
    const { ctx, prisma } = makeCtx();
    const caller = dailyTasksRouter.createCaller(ctx as Parameters<typeof dailyTasksRouter.createCaller>[0]);

    await caller.getHistory({ limit: 30, offset: 0 });

    expect(prisma._tx.dailyTask.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 30 }),
    );
  });

  it('AC-1: queries with accountId isolation', async () => {
    const { ctx, prisma } = makeCtx({ activeAccountId: 5 });
    const caller = dailyTasksRouter.createCaller(ctx as Parameters<typeof dailyTasksRouter.createCaller>[0]);

    await caller.getHistory({ limit: 7, offset: 0 });

    expect(prisma._tx.dailyTask.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { accountId: 5 } }),
    );
  });
});

// ── markCompleted ─────────────────────────────────────────────────────────────

describe('dailyTasks.markCompleted', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('AC-2: marks task completed and recalculates completedCount', async () => {
    const { ctx, prisma } = makeCtx();
    const caller = dailyTasksRouter.createCaller(ctx as Parameters<typeof dailyTasksRouter.createCaller>[0]);

    const result = await caller.markCompleted({ dailyTaskId: 1, taskId: UUID1 });

    // update called with updated tasks
    expect(prisma._tx.dailyTask.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: expect.objectContaining({ completedCount: 2 }),
      }),
    );
    expect(result).toMatchObject({ ok: true, completedCount: 2, totalCount: 3 });
  });

  it('AC-1: NOT_FOUND when record belongs to different account', async () => {
    const { ctx, prisma } = makeCtx({ activeAccountId: 99 });
    prisma._tx.dailyTask.findFirst.mockResolvedValue(null);
    const caller = dailyTasksRouter.createCaller(ctx as Parameters<typeof dailyTasksRouter.createCaller>[0]);

    await expect(caller.markCompleted({ dailyTaskId: 1, taskId: UUID1 })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('AC-2: findFirst uses accountId guard (LD-009)', async () => {
    const { ctx, prisma } = makeCtx({ activeAccountId: 3 });
    prisma._tx.dailyTask.findFirst.mockResolvedValue({ ...MOCK_DAILY_TASK, accountId: 3 });
    const caller = dailyTasksRouter.createCaller(ctx as Parameters<typeof dailyTasksRouter.createCaller>[0]);

    await caller.markCompleted({ dailyTaskId: 1, taskId: UUID1 });

    expect(prisma._tx.dailyTask.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1, accountId: 3 },
      }),
    );
  });

  it('AC-4: already-completed task stays completed (idempotent)', async () => {
    const { ctx, prisma } = makeCtx();
    const allCompleted = MOCK_TASKS_3.map((t) => ({ ...t, completed: true }));
    prisma._tx.dailyTask.findFirst.mockResolvedValue({
      ...MOCK_DAILY_TASK,
      tasks: allCompleted,
      completedCount: 3,
    });
    const caller = dailyTasksRouter.createCaller(ctx as Parameters<typeof dailyTasksRouter.createCaller>[0]);

    const result = await caller.markCompleted({ dailyTaskId: 1, taskId: UUID1 });

    expect(result.completedCount).toBe(3);
  });
});

// ── regenerateToday ───────────────────────────────────────────────────────────

describe('dailyTasks.regenerateToday', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('AC-2: enqueues daily-task job and returns ok + scheduledDate + jobId', async () => {
    const { ctx } = makeCtx();
    const caller = dailyTasksRouter.createCaller(ctx as Parameters<typeof dailyTasksRouter.createCaller>[0]);

    const result = await caller.regenerateToday();

    expect(mockQueueAdd).toHaveBeenCalledWith(
      'daily-task',
      expect.objectContaining({ accountId: 1 }),
      expect.objectContaining({ priority: 1 }),
    );
    expect(result).toMatchObject({ ok: true });
    expect(typeof result.scheduledDate).toBe('string');
    expect(result.scheduledDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('AC-2: INTERNAL_SERVER_ERROR when queue add fails', async () => {
    mockQueueAdd.mockRejectedValueOnce(new Error('Redis connection failed'));
    const { ctx } = makeCtx();
    const caller = dailyTasksRouter.createCaller(ctx as Parameters<typeof dailyTasksRouter.createCaller>[0]);

    await expect(caller.regenerateToday()).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
    });
  });

  it('AC-1: jobId includes accountId for per-account isolation', async () => {
    const { ctx } = makeCtx({ activeAccountId: 42 });
    const caller = dailyTasksRouter.createCaller(ctx as Parameters<typeof dailyTasksRouter.createCaller>[0]);

    await caller.regenerateToday();

    const callArgs = mockQueueAdd.mock.calls[0];
    expect(callArgs?.[2]).toMatchObject({ jobId: expect.stringContaining('42') });
  });
});

// ── FORBIDDEN when no activeAccountId ────────────────────────────────────────

describe('dailyTasks protectedProcedure guard', () => {
  it('AC-1: getToday FORBIDDEN when activeAccountId=null', async () => {
    const { ctx } = makeCtx({ activeAccountId: null });
    const caller = dailyTasksRouter.createCaller(ctx as Parameters<typeof dailyTasksRouter.createCaller>[0]);

    await expect(caller.getToday()).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
});
