// PRD-11 US-015 · detect-anomalies.service + DingtalkService unit tests
// AC-12: ≥8 test · dingtalk(isMock=true/false × webhookUrl有无) + detect(0/1/$5.01/dedupe)

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted mocks for prisma
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------

import { detectCostAnomalies } from '@/services/admin/cost/detect-anomalies.service';
import { DingtalkService, ConfigurationError } from '@/services/admin/notifications/dingtalk.service';

// ---------------------------------------------------------------------------
// DingtalkService tests (AC-3/4/5/6)
// ---------------------------------------------------------------------------

describe('DingtalkService', () => {
  // AC-4: isMock=true → log warning + return {ok:true,mock:true}
  it('isMock=true returns {ok:true, mock:true} without fetching', async () => {
    const svc = new DingtalkService('', true);
    const result = await svc.send('test message');
    expect(result).toEqual({ ok: true, mock: true });
  });

  // AC-4: isMock=true with webhookUrl set still mocks
  it('isMock=true with webhookUrl set still returns mock result', async () => {
    const svc = new DingtalkService('https://dingtalk.example.com/webhook', true);
    const result = await svc.send('hello');
    expect(result).toEqual({ ok: true, mock: true });
  });

  // AC-5: isMock=false + empty webhookUrl → ConfigurationError
  it('isMock=false + empty webhookUrl throws ConfigurationError', () => {
    expect(() => new DingtalkService('', false)).toThrow(ConfigurationError);
  });

  // AC-5: ConfigurationError message contains DINGTALK_WEBHOOK_URL
  it('ConfigurationError has descriptive message', () => {
    let caught: unknown;
    try {
      new DingtalkService('', false);
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(ConfigurationError);
    expect((caught as Error).message).toContain('DINGTALK_WEBHOOK_URL');
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

// ---------------------------------------------------------------------------
// detectCostAnomalies tests (AC-2/7/9)
// ---------------------------------------------------------------------------

describe('detectCostAnomalies', () => {
  const mockDingtalk = new DingtalkService('', true);

  beforeEach(() => {
    mockExecuteRawUnsafe.mockReset();
    mockExecuteRawUnsafe.mockResolvedValue(undefined);
    mockQueryRaw.mockReset();
    mockQueryRaw.mockResolvedValue([]);
    mockAuditLogFindFirst.mockReset();
    mockAuditLogFindFirst.mockResolvedValue(null);
    mockAuditLogCreate.mockReset();
    mockAuditLogCreate.mockResolvedValue({ id: 1 });
    mockUserFindUnique.mockReset();
    mockUserFindUnique.mockResolvedValue({ email: 'user@test.com' });
  });

  // 0 anomaly — no audit writes
  it('returns {detected:0, skipped:0} when no users exceed threshold', async () => {
    mockQueryRaw.mockResolvedValue([]);
    const result = await detectCostAnomalies(mockDingtalk);
    expect(result).toEqual({ detected: 0, skipped: 0 });
    expect(mockAuditLogCreate).not.toHaveBeenCalled();
  });

  // 1 anomaly $5.01 — creates audit log with correct fields
  it('detects 1 anomaly at $5.01 and writes security_alert audit log', async () => {
    mockQueryRaw.mockResolvedValue([{ userId: 42, total: '5.010000' }]);
    mockAuditLogFindFirst.mockResolvedValue(null);
    mockUserFindUnique.mockResolvedValue({ email: 'costly@test.com' });

    const result = await detectCostAnomalies(mockDingtalk);

    expect(result.detected).toBe(1);
    expect(result.skipped).toBe(0);
    expect(mockAuditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventCategory: 'security_alert',
          eventType: 'cost_anomaly_detected',
          targetUserId: 42,
          actorRole: 'system',
          success: true,
        }),
      }),
    );
  });

  // dedupe — same user same day already alerted → skipped
  it('skips user when already alerted today (dedupe)', async () => {
    mockQueryRaw.mockResolvedValue([{ userId: 99, total: '7.000000' }]);
    mockAuditLogFindFirst.mockResolvedValue({ id: 5 }); // already exists

    const result = await detectCostAnomalies(mockDingtalk);

    expect(result.detected).toBe(0);
    expect(result.skipped).toBe(1);
    expect(mockAuditLogCreate).not.toHaveBeenCalled();
  });

  // mixed: 1 new + 1 deduped
  it('counts detected and skipped correctly when mix of new and deduped', async () => {
    mockQueryRaw.mockResolvedValue([
      { userId: 10, total: '6.000000' },
      { userId: 20, total: '8.500000' },
    ]);
    // userId 20 already alerted today
    mockAuditLogFindFirst
      .mockResolvedValueOnce(null)     // userId 10: not deduped
      .mockResolvedValueOnce({ id: 3 }); // userId 20: deduped
    mockUserFindUnique.mockResolvedValue({ email: 'u@test.com' });

    const result = await detectCostAnomalies(mockDingtalk);
    expect(result.detected).toBe(1);
    expect(result.skipped).toBe(1);
  });
});
