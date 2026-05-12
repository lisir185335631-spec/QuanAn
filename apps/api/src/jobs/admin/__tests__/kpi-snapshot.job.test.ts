// PRD-11 US-002 · AC-8: unit tests
// cron 注册 · worker 处理 job 调 computeSnapshot · job failed 3 次进 failed queue + audit log

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock BullMQ
// ---------------------------------------------------------------------------

const mockQueueAdd = vi.fn();
const mockWorkerOn = vi.fn();

let capturedProcessor: ((job: unknown) => Promise<void>) | null = null;
let capturedFailedHandler: ((job: unknown, error: Error) => Promise<void>) | null = null;

vi.mock('bullmq', () => {
  return {
    Queue: vi.fn().mockImplementation(() => ({
      add: mockQueueAdd,
    })),
    Worker: vi.fn().mockImplementation((_name: string, processor: (job: unknown) => Promise<void>) => {
      capturedProcessor = processor;
      return {
        on: (event: string, handler: (job: unknown, error: Error) => Promise<void>) => {
          if (event === 'failed') capturedFailedHandler = handler;
          mockWorkerOn(event, handler);
        },
      };
    }),
  };
});

// ---------------------------------------------------------------------------
// Mock redis, prisma, logger, computeSnapshot
// ---------------------------------------------------------------------------

vi.mock('@/lib/redis', () => ({ redis: {} }));

const mockAuditLogCreate = vi.fn();
vi.mock('@/lib/prisma', () => ({
  prisma: {
    adminAuditLog: { create: mockAuditLogCreate },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn() },
}));

const mockComputeSnapshot = vi.fn();
vi.mock('@/services/admin/nsm/kpi-snapshot.service', () => ({
  computeSnapshot: mockComputeSnapshot,
}));

// ---------------------------------------------------------------------------
// Import module under test (after mocks are set up)
// ---------------------------------------------------------------------------

const {
  scheduleDailySnapshot,
  scheduleWeeklySnapshot,
  scheduleMonthlySnapshot,
} = await import('../kpi-snapshot.job');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('kpi-snapshot.job', () => {
  beforeEach(() => {
    mockQueueAdd.mockReset();
    mockComputeSnapshot.mockReset();
    mockAuditLogCreate.mockReset();
    mockWorkerOn.mockReset();

    mockQueueAdd.mockResolvedValue({ id: 'job-1' });
    mockComputeSnapshot.mockResolvedValue({});
    mockAuditLogCreate.mockResolvedValue({ id: 1 });
  });

  // AC-2: scheduleDailySnapshot registers correct cron
  it('scheduleDailySnapshot adds job with pattern=0 * * * * tz=Asia/Shanghai jobId=daily-snapshot-recurring', async () => {
    await scheduleDailySnapshot();

    expect(mockQueueAdd).toHaveBeenCalledWith(
      'daily-snapshot',
      { granularity: 'day' },
      expect.objectContaining({
        repeat: expect.objectContaining({
          pattern: '0 * * * *',
          tz: 'Asia/Shanghai',
        }),
        jobId: 'daily-snapshot-recurring',
      }),
    );
  });

  // AC-3: scheduleWeeklySnapshot registers correct cron
  it('scheduleWeeklySnapshot adds job with pattern=0 4 * * 1 tz=Asia/Shanghai jobId=weekly-snapshot-recurring', async () => {
    await scheduleWeeklySnapshot();

    expect(mockQueueAdd).toHaveBeenCalledWith(
      'weekly-snapshot',
      { granularity: 'week' },
      expect.objectContaining({
        repeat: expect.objectContaining({
          pattern: '0 4 * * 1',
          tz: 'Asia/Shanghai',
        }),
        jobId: 'weekly-snapshot-recurring',
      }),
    );
  });

  // AC-4: scheduleMonthlySnapshot registers correct cron
  it('scheduleMonthlySnapshot adds job with pattern=0 4 1 * * tz=Asia/Shanghai jobId=monthly-snapshot-recurring', async () => {
    await scheduleMonthlySnapshot();

    expect(mockQueueAdd).toHaveBeenCalledWith(
      'monthly-snapshot',
      { granularity: 'month' },
      expect.objectContaining({
        repeat: expect.objectContaining({
          pattern: '0 4 1 * *',
          tz: 'Asia/Shanghai',
        }),
        jobId: 'monthly-snapshot-recurring',
      }),
    );
  });

  // AC-1: worker calls computeSnapshot when processing a job
  it('worker processor calls computeSnapshot with current date and job granularity', async () => {
    expect(capturedProcessor).not.toBeNull();

    const mockJob = { id: 'job-123', data: { granularity: 'day' }, opts: { attempts: 3 }, attemptsMade: 1 };
    await capturedProcessor!(mockJob);

    expect(mockComputeSnapshot).toHaveBeenCalledOnce();
    const [dateArg, granularityArg] = mockComputeSnapshot.mock.calls[0] as [Date, string];
    expect(dateArg).toBeInstanceOf(Date);
    expect(granularityArg).toBe('day');
  });

  // AC-6: failed event on final attempt writes admin_audit_log
  it('failed handler writes admin_audit_log when attemptsMade >= attempts (final failure)', async () => {
    expect(capturedFailedHandler).not.toBeNull();

    const mockJob = {
      id: 'job-456',
      name: 'daily-snapshot',
      data: { granularity: 'day' },
      opts: { attempts: 3 },
      attemptsMade: 3,
    };
    const mockError = new Error('snapshot computation failed');

    await capturedFailedHandler!(mockJob, mockError);

    expect(mockAuditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorAdminId: 0,
          actorRole: 'system',
          eventCategory: 'system_alert',
          eventType: 'kpi_snapshot_failed',
          success: false,
          errorMessage: 'snapshot computation failed',
        }),
      }),
    );
  });

  // AC-6: non-final failure does NOT write audit log
  it('failed handler does NOT write audit log when attemptsMade < attempts (non-final)', async () => {
    expect(capturedFailedHandler).not.toBeNull();

    const mockJob = {
      id: 'job-789',
      name: 'daily-snapshot',
      data: { granularity: 'day' },
      opts: { attempts: 3 },
      attemptsMade: 1,
    };
    const mockError = new Error('transient error');

    await capturedFailedHandler!(mockJob, mockError);

    expect(mockAuditLogCreate).not.toHaveBeenCalled();
  });

  // AC-6: failed handler with undefined job does not throw
  it('failed handler handles undefined job gracefully', async () => {
    expect(capturedFailedHandler).not.toBeNull();

    await expect(
      capturedFailedHandler!(undefined, new Error('test')),
    ).resolves.toBeUndefined();

    expect(mockAuditLogCreate).not.toHaveBeenCalled();
  });
});
