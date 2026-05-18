// PRD-11 US-015 · cost-anomaly.job unit tests
// AC-12: ≥ 8 test: dingtalk(isMock=true/false × webhookUrl 有无) + detect-anomaly + cron job

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
const mockAuditLogFindFirst = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockUserFindUnique = vi.hoisted(() => vi.fn().mockResolvedValue({ email: 'user@test.com' }));
const mockExecuteRawUnsafe = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockQueryRaw = vi.hoisted(() => vi.fn().mockResolvedValue([]));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    adminAuditLog: {
      create: mockAuditLogCreate,
      findFirst: mockAuditLogFindFirst,
    },
    $transaction: vi.fn().mockImplementation((cb: (tx: unknown) => unknown) =>
      cb({
        $executeRawUnsafe: mockExecuteRawUnsafe,
        $queryRaw: mockQueryRaw,
        adminAuditLog: {
          findFirst: mockAuditLogFindFirst,
          create: mockAuditLogCreate,
        },
        user: { findUnique: mockUserFindUnique },
      }),
    ),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const mockDetectCostAnomalies = vi.fn();
vi.mock('@/services/admin/cost/detect-anomalies.service', () => ({
  detectCostAnomalies: mockDetectCostAnomalies,
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

const { scheduleCostAnomalyDetection } = await import('../cost-anomaly.job');
import { DingtalkService, ConfigurationError } from '@/services/admin/notifications/dingtalk.service';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('cost-anomaly.job — cron scheduling', () => {
  beforeEach(() => {
    mockQueueAdd.mockReset().mockResolvedValue({ id: 'job-1' });
    mockDetectCostAnomalies.mockReset().mockResolvedValue({ detected: 0, skipped: 0 });
    mockAuditLogCreate.mockReset().mockResolvedValue({ id: 1 });
    mockWorkerOn.mockReset();
  });

  // AC-1: cron registers with correct pattern, tz, jobId
  it('scheduleCostAnomalyDetection registers cron with pattern 15 * * * * tz Asia/Shanghai', async () => {
    await scheduleCostAnomalyDetection();

    expect(mockQueueAdd).toHaveBeenCalledWith(
      'cost-anomaly',
      {},
      expect.objectContaining({
        repeat: expect.objectContaining({
          pattern: '15 * * * *',
          tz: 'Asia/Shanghai',
        }),
        jobId: 'cost-anomaly-recurring',
      }),
    );
  });

  // AC-8: worker processor calls detectCostAnomalies
  it('worker processor calls detectCostAnomalies', async () => {
    expect(capturedProcessor).not.toBeNull();
    const mockJob = { id: 'job-123', data: {}, opts: { attempts: 3 }, attemptsMade: 1 };
    await capturedProcessor!(mockJob);
    expect(mockDetectCostAnomalies).toHaveBeenCalledOnce();
  });

  // AC-8: final failure writes audit log 'cron_failed'
  it('failed handler writes admin_audit_log cron_failed on final attempt', async () => {
    expect(capturedFailedHandler).not.toBeNull();
    const mockJob = {
      id: 'job-456',
      name: 'cost-anomaly',
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
          eventType: 'cron_failed',
          success: false,
          errorMessage: 'detect failed',
        }),
      }),
    );
  });

  // AC-8: non-final failure does NOT write audit log
  it('failed handler skips audit log on non-final attempt', async () => {
    expect(capturedFailedHandler).not.toBeNull();
    const mockJob = {
      id: 'job-789',
      name: 'cost-anomaly',
      data: {},
      opts: { attempts: 3 },
      attemptsMade: 1,
    };
    await capturedFailedHandler!(mockJob, new Error('transient error'));
    expect(mockAuditLogCreate).not.toHaveBeenCalled();
  });

  // AC-8: undefined job handled gracefully
  it('failed handler with undefined job does not throw', async () => {
    expect(capturedFailedHandler).not.toBeNull();
    await expect(capturedFailedHandler!(undefined, new Error('test'))).resolves.toBeUndefined();
    expect(mockAuditLogCreate).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// DingtalkService tests
// ---------------------------------------------------------------------------

describe('DingtalkService', () => {
  // AC-3/4: isMock=true → log warning + return {ok:true,mock:true}
  it('isMock=true returns {ok:true, mock:true} without fetching', async () => {
    const svc = new DingtalkService('', true);
    const result = await svc.send('test message');
    expect(result).toEqual({ ok: true, mock: true });
  });

  // AC-4: isMock=true with non-empty URL still mocks (isMock takes priority)
  it('isMock=true with webhookUrl set still returns mock result', async () => {
    const svc = new DingtalkService('https://dingtalk.example.com/webhook', true);
    const result = await svc.send('hello');
    expect(result).toEqual({ ok: true, mock: true });
  });

  // AC-5: isMock=false + empty webhookUrl → ConfigurationError
  it('isMock=false + empty webhookUrl throws ConfigurationError', () => {
    expect(() => new DingtalkService('', false)).toThrow(ConfigurationError);
  });

  // AC-5: ConfigurationError message
  it('ConfigurationError has descriptive message', () => {
    try {
      new DingtalkService('', false);
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigurationError);
      expect((err as Error).message).toContain('DINGTALK_WEBHOOK_URL');
    }
  });

  // AC-6: isMock=false + webhookUrl → fetch POST with DingTalk spec body
  it('isMock=false + webhookUrl sends POST with correct DingTalk body', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ errcode: 0, errmsg: 'ok' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const svc = new DingtalkService('https://dingtalk.example.com/webhook', false);
    const result = await svc.send('alert content');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://dingtalk.example.com/webhook',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ msgtype: 'text', text: { content: 'alert content' } }),
      }),
    );
    expect(result).toEqual({ ok: true, errcode: 0, errmsg: 'ok' });

    vi.unstubAllGlobals();
  });

  // AC-6: DingTalk API errcode != 0 → ok:false
  it('isMock=false + API error → returns ok:false with errcode', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ errcode: 130101, errmsg: 'invalid token' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const svc = new DingtalkService('https://dingtalk.example.com/webhook', false);
    const result = await svc.send('test');

    expect(result.ok).toBe(false);
    expect(result.errcode).toBe(130101);

    vi.unstubAllGlobals();
  });
});

