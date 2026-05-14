// PRD-14 US-003 · ab-stop-loss.job unit tests
// AC-9: ≥ 8 it · cron register + 触发/不触发条件 + dedupe + dingtalk isMock + manual stop · failed 兜底

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
// Mock redis, logger
// ---------------------------------------------------------------------------

vi.mock('@/lib/redis', () => ({ redis: {} }));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Mock prisma
// ---------------------------------------------------------------------------

const mockAbExperimentFindMany = vi.hoisted(() => vi.fn());
const mockAuditLogFindFirst = vi.hoisted(() => vi.fn());
const mockAuditLogCreate = vi.hoisted(() => vi.fn().mockResolvedValue({ id: 1 }));
const mockTransaction = vi.hoisted(() =>
  vi.fn().mockImplementation((cb: (tx: unknown) => unknown) => cb({})),
);

vi.mock('@/lib/prisma', () => ({
  prisma: {
    abExperiment: { findMany: mockAbExperimentFindMany },
    adminAuditLog: {
      findFirst: mockAuditLogFindFirst,
      create: mockAuditLogCreate,
    },
    $transaction: mockTransaction,
  },
}));

// ---------------------------------------------------------------------------
// Mock significance service
// ---------------------------------------------------------------------------

const mockComputeSignificance = vi.hoisted(() => vi.fn());
vi.mock('@/services/admin/ab-experiment/significance.service', () => ({
  computeExperimentSignificance: mockComputeSignificance,
}));

// ---------------------------------------------------------------------------
// Mock ab-experiment service
// ---------------------------------------------------------------------------

const mockStopAbExperimentInTx = vi.hoisted(() => vi.fn().mockResolvedValue({}));
vi.mock('@/services/admin/ab-experiment/ab-experiment.service', () => ({
  _stopAbExperimentInTx: mockStopAbExperimentInTx,
}));

// ---------------------------------------------------------------------------
// Mock DingtalkService
// ---------------------------------------------------------------------------

const mockDingtalkSend = vi.hoisted(() => vi.fn().mockResolvedValue({ ok: true, mock: true }));
vi.mock('@/services/admin/notifications/dingtalk.service', () => ({
  DingtalkService: vi.fn().mockImplementation(() => ({
    send: mockDingtalkSend,
  })),
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

const {
  scheduleAbStopLoss,
  scanAbExperimentsForStopLoss,
  stopAbExperimentManual,
} = await import('@/jobs/admin/ab-stop-loss.job');

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const EXPERIMENT = { id: 1, experimentKey: 'exp-test-001' };

const STOP_LOSER_METRIC = {
  metric: 'conversion',
  testType: 'chi_square' as const,
  pValue: 0.01,
  isSignificant: true,
  effect: -0.45,
  sampleSize: 200,
  confidence: 0.95,
  recommendation: 'stop_loser' as const,
};

const CONTINUE_METRIC = {
  metric: 'conversion',
  testType: 'chi_square' as const,
  pValue: 0.5,
  isSignificant: false,
  effect: 0.05,
  sampleSize: 200,
  confidence: 0.95,
  recommendation: 'continue' as const,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ab-stop-loss.job — cron scheduling', () => {
  beforeEach(() => {
    mockQueueAdd.mockReset().mockResolvedValue({ id: 'job-1' });
    mockWorkerOn.mockReset();
    mockAbExperimentFindMany.mockReset().mockResolvedValue([]);
    mockAuditLogFindFirst.mockReset().mockResolvedValue(null);
    mockAuditLogCreate.mockReset().mockResolvedValue({ id: 1 });
    mockTransaction.mockReset().mockImplementation((cb: (tx: unknown) => unknown) => cb({}));
    mockComputeSignificance.mockReset().mockResolvedValue([CONTINUE_METRIC]);
    mockStopAbExperimentInTx.mockReset().mockResolvedValue({});
    mockDingtalkSend.mockReset().mockResolvedValue({ ok: true, mock: true });
  });

  // AC-1: cron registers with correct pattern, tz, jobId
  it('scheduleAbStopLoss registers hourly cron with pattern 0 0 * * * * tz Asia/Shanghai', async () => {
    await scheduleAbStopLoss();
    expect(mockQueueAdd).toHaveBeenCalledWith(
      'ab-stop-loss',
      {},
      expect.objectContaining({
        repeat: expect.objectContaining({
          pattern: '0 0 * * * *',
          tz: 'Asia/Shanghai',
        }),
        jobId: 'ab-stop-loss-recurring',
      }),
    );
  });

  // Worker processor calls scanAbExperimentsForStopLoss
  it('worker processor calls scanAbExperimentsForStopLoss', async () => {
    expect(capturedProcessor).not.toBeNull();
    const mockJob = { id: 'job-123', data: {}, opts: { attempts: 3 }, attemptsMade: 1 };
    await capturedProcessor!(mockJob);
    expect(mockAbExperimentFindMany).toHaveBeenCalled();
  });

  // AC-3: no trigger when recommendation != 'stop_loser'
  it('does NOT trigger stop when recommendation is continue', async () => {
    mockAbExperimentFindMany.mockResolvedValue([EXPERIMENT]);
    mockComputeSignificance.mockResolvedValue([CONTINUE_METRIC]);

    const result = await scanAbExperimentsForStopLoss();

    expect(mockStopAbExperimentInTx).not.toHaveBeenCalled();
    expect(result.stopped).toBe(0);
    expect(result.skipped).toBe(1);
  });

  // AC-3: no trigger when stop_loser but effect >= -0.3 (dual condition)
  it('does NOT trigger stop when stop_loser but effect is only -20% (above -30% threshold)', async () => {
    const mildLoser = { ...STOP_LOSER_METRIC, effect: -0.2 };
    mockAbExperimentFindMany.mockResolvedValue([EXPERIMENT]);
    mockComputeSignificance.mockResolvedValue([mildLoser]);

    const result = await scanAbExperimentsForStopLoss();

    expect(mockStopAbExperimentInTx).not.toHaveBeenCalled();
    expect(result.stopped).toBe(0);
  });

  // AC-3 + AC-4: triggers stop when stop_loser AND effect < -30%
  it('triggers _stopAbExperimentInTx with auto_stop_loss when stop_loser AND effect < -0.3', async () => {
    mockAbExperimentFindMany.mockResolvedValue([EXPERIMENT]);
    mockComputeSignificance.mockResolvedValue([STOP_LOSER_METRIC]);

    const result = await scanAbExperimentsForStopLoss();

    expect(mockStopAbExperimentInTx).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        experimentId: EXPERIMENT.id,
        adminId: 0,
        stopReason: 'auto_stop_loss',
      }),
    );
    expect(result.stopped).toBe(1);
  });

  // AC-5: writes security_alert audit log with reasoning
  it('writes ab_experiment_auto_stop_loss audit log with metric/pValue/effect reasoning', async () => {
    mockAbExperimentFindMany.mockResolvedValue([EXPERIMENT]);
    mockComputeSignificance.mockResolvedValue([STOP_LOSER_METRIC]);

    await scanAbExperimentsForStopLoss();

    expect(mockAuditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorAdminId: 0,
          actorRole: 'system',
          eventCategory: 'security_alert',
          eventType: 'ab_experiment_auto_stop_loss',
          success: true,
        }),
      }),
    );
  });

  // AC-6: DingtalkService is called
  it('sends dingtalk notification (isMock=true by default)', async () => {
    mockAbExperimentFindMany.mockResolvedValue([EXPERIMENT]);
    mockComputeSignificance.mockResolvedValue([STOP_LOSER_METRIC]);

    await scanAbExperimentsForStopLoss();

    expect(mockDingtalkSend).toHaveBeenCalledOnce();
    expect(mockDingtalkSend.mock.calls[0]?.[0]).toContain('A/B 实验自动停损');
  });

  // AC-7: dedupe skips when already logged today
  it('dedupes and skips when ab_experiment_auto_stop_loss already logged within 24h', async () => {
    mockAbExperimentFindMany.mockResolvedValue([EXPERIMENT]);
    mockComputeSignificance.mockResolvedValue([STOP_LOSER_METRIC]);
    mockAuditLogFindFirst.mockResolvedValue({ id: 99 }); // already logged

    const result = await scanAbExperimentsForStopLoss();

    expect(mockStopAbExperimentInTx).not.toHaveBeenCalled();
    expect(mockDingtalkSend).not.toHaveBeenCalled();
    expect(result.stopped).toBe(0);
    expect(result.skipped).toBe(1);
  });

  // AC-8: manual stop goes through _stopAbExperimentInTx(stopReason='manual')
  it('stopAbExperimentManual calls _stopAbExperimentInTx with stopReason=manual', async () => {
    await stopAbExperimentManual({ experimentId: 5, adminId: 42 });

    expect(mockStopAbExperimentInTx).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        experimentId: 5,
        adminId: 42,
        stopReason: 'manual',
      }),
    );
  });

  // Failed handler — final failure writes system_alert audit log
  it('failed handler writes ab_stop_loss_cron_failed audit log on final attempt', async () => {
    expect(capturedFailedHandler).not.toBeNull();
    const mockJob = {
      id: 'job-456',
      name: 'ab-stop-loss',
      data: {},
      opts: { attempts: 3 },
      attemptsMade: 3,
    };
    await capturedFailedHandler!(mockJob, new Error('scan failed'));
    expect(mockAuditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorAdminId: 0,
          actorRole: 'system',
          eventCategory: 'system_alert',
          eventType: 'ab_stop_loss_cron_failed',
          success: false,
          errorMessage: 'scan failed',
        }),
      }),
    );
  });

  // Failed handler — non-final attempt does NOT write audit log
  it('failed handler skips audit log on non-final attempt', async () => {
    expect(capturedFailedHandler).not.toBeNull();
    const mockJob = {
      id: 'job-789',
      name: 'ab-stop-loss',
      data: {},
      opts: { attempts: 3 },
      attemptsMade: 1,
    };
    await capturedFailedHandler!(mockJob, new Error('transient'));
    expect(mockAuditLogCreate).not.toHaveBeenCalled();
  });

  // Failed handler — undefined job handled gracefully
  it('failed handler with undefined job does not throw', async () => {
    expect(capturedFailedHandler).not.toBeNull();
    await expect(capturedFailedHandler!(undefined, new Error('test'))).resolves.toBeUndefined();
    expect(mockAuditLogCreate).not.toHaveBeenCalled();
  });
});
