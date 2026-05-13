// PRD-12 US-012 · violation-detection.job unit tests
// AC-11: ≥ 7 tests · cron schedule / worker processor / failed handler / undefined job

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
// Mock redis, prisma, logger
// ---------------------------------------------------------------------------

vi.mock('@/lib/redis', () => ({ redis: {} }));

const mockAuditLogCreate = vi.hoisted(() => vi.fn().mockResolvedValue({ id: 1 }));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    adminAuditLog: { create: mockAuditLogCreate },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const mockDetectViolationThresholds = vi.fn();
vi.mock('@/services/admin/content-review/violation-detection.service', () => ({
  detectViolationThresholds: mockDetectViolationThresholds,
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

const { scheduleViolationDetection } = await import('../violation-detection.job');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('violation-detection.job — cron scheduling', () => {
  beforeEach(() => {
    mockQueueAdd.mockReset().mockResolvedValue({ id: 'job-1' });
    mockDetectViolationThresholds.mockReset().mockResolvedValue({ warned: 0, banRequested: 0, skipped: 0 });
    mockAuditLogCreate.mockReset().mockResolvedValue({ id: 1 });
    mockWorkerOn.mockReset();
  });

  // AC-1: cron registers with correct pattern, tz, jobId
  it('scheduleViolationDetection registers cron with pattern 0 4 * * * tz Asia/Shanghai', async () => {
    await scheduleViolationDetection();
    expect(mockQueueAdd).toHaveBeenCalledWith(
      'violation-detection',
      {},
      expect.objectContaining({
        repeat: expect.objectContaining({
          pattern: '0 4 * * *',
          tz: 'Asia/Shanghai',
        }),
        jobId: 'violation-detection-recurring',
      }),
    );
  });

  // Worker processor calls detectViolationThresholds
  it('worker processor calls detectViolationThresholds', async () => {
    expect(capturedProcessor).not.toBeNull();
    const mockJob = { id: 'job-123', data: {}, opts: { attempts: 3 }, attemptsMade: 1 };
    await capturedProcessor!(mockJob);
    expect(mockDetectViolationThresholds).toHaveBeenCalledOnce();
  });

  // AC-7: final failure writes audit log 'violation_cron_failed'
  it('failed handler writes admin_audit_log violation_cron_failed on final attempt', async () => {
    expect(capturedFailedHandler).not.toBeNull();
    const mockJob = {
      id: 'job-456',
      name: 'violation-detection',
      data: {},
      opts: { attempts: 3 },
      attemptsMade: 3,
    };
    await capturedFailedHandler!(mockJob, new Error('detect failed'));
    expect(mockAuditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorAdminId: 0,
          actorRole: 'system',
          eventCategory: 'system_alert',
          eventType: 'violation_cron_failed',
          success: false,
          errorMessage: 'detect failed',
        }),
      }),
    );
  });

  // AC-7: non-final failure does NOT write audit log
  it('failed handler skips audit log on non-final attempt', async () => {
    expect(capturedFailedHandler).not.toBeNull();
    const mockJob = {
      id: 'job-789',
      name: 'violation-detection',
      data: {},
      opts: { attempts: 3 },
      attemptsMade: 1,
    };
    await capturedFailedHandler!(mockJob, new Error('transient'));
    expect(mockAuditLogCreate).not.toHaveBeenCalled();
  });

  // AC-7: undefined job handled gracefully
  it('failed handler with undefined job does not throw', async () => {
    expect(capturedFailedHandler).not.toBeNull();
    await expect(capturedFailedHandler!(undefined, new Error('test'))).resolves.toBeUndefined();
    expect(mockAuditLogCreate).not.toHaveBeenCalled();
  });

  // AC-7: failed handler with attempts=2 and attemptsMade=2 (final) writes audit
  it('failed handler writes audit log when attemptsMade equals attempts', async () => {
    expect(capturedFailedHandler).not.toBeNull();
    const mockJob = {
      id: 'job-999',
      name: 'violation-detection',
      data: {},
      opts: { attempts: 2 },
      attemptsMade: 2,
    };
    await capturedFailedHandler!(mockJob, new Error('final error'));
    expect(mockAuditLogCreate).toHaveBeenCalledOnce();
  });

  // scheduleViolationDetection returns void (no throw)
  it('scheduleViolationDetection resolves without error', async () => {
    await expect(scheduleViolationDetection()).resolves.toBeUndefined();
  });
});
