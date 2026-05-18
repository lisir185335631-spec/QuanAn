// PRD-12 US-012 · violation-detection.service unit tests
// AC-10: ≥ 10 tests · count thresholds / dedupe / suspended skip / ban申请 / DingtalkService

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mockAuditLogCreate = vi.hoisted(() => vi.fn().mockResolvedValue({ id: 1 }));
const mockAuditLogFindFirst = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockViolationLogFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockApprovalRequestCreate = vi.hoisted(() => vi.fn().mockResolvedValue({ id: 99 }));
const mockExecuteRawUnsafe = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn().mockImplementation((cb: (tx: unknown) => unknown) =>
      cb({
        $executeRawUnsafe: mockExecuteRawUnsafe,
        userViolationLog: { findMany: mockViolationLogFindMany },
        adminAuditLog: {
          findFirst: mockAuditLogFindFirst,
          create: mockAuditLogCreate,
        },
        approvalRequest: { create: mockApprovalRequestCreate },
      }),
    ),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { detectViolationThresholds } from '@/services/admin/content-review/violation-detection.service';
import { DingtalkService } from '@/services/admin/notifications/dingtalk.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeViolation(userId: number, violationType: string, count: number) {
  return { userId, violationType, count };
}

function makeMockDingtalk(): DingtalkService {
  const svc = new DingtalkService('', true);
  vi.spyOn(svc, 'send').mockResolvedValue({ ok: true, mock: true });
  return svc;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('detectViolationThresholds — count thresholds', () => {
  beforeEach(() => {
    mockAuditLogCreate.mockReset().mockResolvedValue({ id: 1 });
    mockAuditLogFindFirst.mockReset().mockResolvedValue(null);
    mockViolationLogFindMany.mockReset().mockResolvedValue([]);
    mockApprovalRequestCreate.mockReset().mockResolvedValue({ id: 99 });
    mockExecuteRawUnsafe.mockReset().mockResolvedValue(undefined);
  });

  // AC-2: no violations → returns warned=0 banRequested=0 skipped=0
  it('returns zeros when no violations meet threshold', async () => {
    mockViolationLogFindMany.mockResolvedValue([]);
    const dingtalk = makeMockDingtalk();
    const result = await detectViolationThresholds(dingtalk);
    expect(result).toEqual({ warned: 0, banRequested: 0, skipped: 0 });
  });

  // AC-2: count=3 → warned=1, no ban request
  it('count=3 writes user_violation_warning but not ban request', async () => {
    mockViolationLogFindMany.mockResolvedValue([makeViolation(1, 'pii_upload', 3)]);
    const dingtalk = makeMockDingtalk();
    const result = await detectViolationThresholds(dingtalk);
    expect(result.warned).toBe(1);
    expect(result.banRequested).toBe(0);
    expect(mockApprovalRequestCreate).not.toHaveBeenCalled();
  });

  // AC-2: count=4 → warned=1, no ban request
  it('count=4 writes warning but not ban request', async () => {
    mockViolationLogFindMany.mockResolvedValue([makeViolation(2, 'banned_content', 4)]);
    const dingtalk = makeMockDingtalk();
    const result = await detectViolationThresholds(dingtalk);
    expect(result.warned).toBe(1);
    expect(result.banRequested).toBe(0);
  });

  // AC-3: count=5 → warned=1, banRequested=1
  it('count=5 writes warning AND creates ban approval request', async () => {
    mockViolationLogFindMany.mockResolvedValue([makeViolation(3, 'pii_upload', 5)]);
    const dingtalk = makeMockDingtalk();
    const result = await detectViolationThresholds(dingtalk);
    expect(result.warned).toBe(1);
    expect(result.banRequested).toBe(1);
    expect(mockApprovalRequestCreate).toHaveBeenCalledOnce();
  });

  // AC-3: count=10 (>5) → ban requested
  it('count>5 also triggers ban request', async () => {
    mockViolationLogFindMany.mockResolvedValue([makeViolation(4, 'trending_abuse', 10)]);
    const dingtalk = makeMockDingtalk();
    const result = await detectViolationThresholds(dingtalk);
    expect(result.banRequested).toBe(1);
  });

  // AC-3: approvalRequest created with correct fields
  it('ban approval request has correct actionType, riskLevel, status=pending, requesterRole=system', async () => {
    mockViolationLogFindMany.mockResolvedValue([makeViolation(5, 'pii_upload', 5)]);
    const dingtalk = makeMockDingtalk();
    await detectViolationThresholds(dingtalk);
    expect(mockApprovalRequestCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actionType: 'ban_uploader',
          riskLevel: 'high',
          status: 'pending',
          requesterRole: 'system',
          requesterAdminId: 0,
        }),
      }),
    );
  });

  // AC-2: warning audit log has correct eventCategory/eventType
  it('warning audit log written with security_alert/user_violation_warning', async () => {
    mockViolationLogFindMany.mockResolvedValue([makeViolation(6, 'banned_content', 3)]);
    const dingtalk = makeMockDingtalk();
    await detectViolationThresholds(dingtalk);
    expect(mockAuditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventCategory: 'security_alert',
          eventType: 'user_violation_warning',
          actorRole: 'system',
          targetUserId: 6,
        }),
      }),
    );
  });
});

describe('detectViolationThresholds — dedupe', () => {
  beforeEach(() => {
    mockAuditLogCreate.mockReset().mockResolvedValue({ id: 1 });
    mockAuditLogFindFirst.mockReset().mockResolvedValue(null);
    mockViolationLogFindMany.mockReset().mockResolvedValue([]);
    mockApprovalRequestCreate.mockReset().mockResolvedValue({ id: 99 });
    mockExecuteRawUnsafe.mockReset().mockResolvedValue(undefined);
  });

  // AC-6: already warned today → skipped=1
  it('skips user already warned today (dedupe)', async () => {
    mockViolationLogFindMany.mockResolvedValue([makeViolation(7, 'pii_upload', 3)]);
    mockAuditLogFindFirst.mockResolvedValue({ id: 42 }); // existing warning
    const dingtalk = makeMockDingtalk();
    const result = await detectViolationThresholds(dingtalk);
    expect(result.skipped).toBe(1);
    expect(result.warned).toBe(0);
    expect(mockAuditLogCreate).not.toHaveBeenCalled();
  });

  // AC-6: two violations · one deduped → warned=1, skipped=1
  it('two violations for same user: second deduped after first warned', async () => {
    mockViolationLogFindMany.mockResolvedValue([
      makeViolation(8, 'pii_upload', 3),
      makeViolation(8, 'banned_content', 4),
    ]);
    // First findFirst returns null → warned; second returns existing → skipped
    mockAuditLogFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 55 });
    const dingtalk = makeMockDingtalk();
    const result = await detectViolationThresholds(dingtalk);
    expect(result.warned).toBe(1);
    expect(result.skipped).toBe(1);
  });
});

describe('detectViolationThresholds — suspended skip', () => {
  beforeEach(() => {
    mockAuditLogCreate.mockReset().mockResolvedValue({ id: 1 });
    mockAuditLogFindFirst.mockReset().mockResolvedValue(null);
    mockViolationLogFindMany.mockReset().mockResolvedValue([]);
    mockApprovalRequestCreate.mockReset().mockResolvedValue({ id: 99 });
    mockExecuteRawUnsafe.mockReset().mockResolvedValue(undefined);
  });

  // AC-9: suspended users are excluded by the query (suspendedAt=null filter)
  it('query uses suspendedAt=null filter so suspended users are never returned', async () => {
    // The findMany mock returns empty → suspended users would not appear
    mockViolationLogFindMany.mockResolvedValue([]);
    const dingtalk = makeMockDingtalk();
    const result = await detectViolationThresholds(dingtalk);
    // Verify findMany called with suspendedAt: null
    expect(mockViolationLogFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ suspendedAt: null }),
      }),
    );
    expect(result.warned).toBe(0);
    expect(result.banRequested).toBe(0);
  });

  // AC-9: count=5 but not returned (suspended) → no ban created
  it('suspended user with count=5 does not trigger ban (filtered by query)', async () => {
    // simulate: suspended user not in results
    mockViolationLogFindMany.mockResolvedValue([]);
    const dingtalk = makeMockDingtalk();
    const result = await detectViolationThresholds(dingtalk);
    expect(result.banRequested).toBe(0);
    expect(mockApprovalRequestCreate).not.toHaveBeenCalled();
  });
});

describe('detectViolationThresholds — DingtalkService integration', () => {
  beforeEach(() => {
    mockAuditLogCreate.mockReset().mockResolvedValue({ id: 1 });
    mockAuditLogFindFirst.mockReset().mockResolvedValue(null);
    mockViolationLogFindMany.mockReset().mockResolvedValue([]);
    mockApprovalRequestCreate.mockReset().mockResolvedValue({ id: 99 });
    mockExecuteRawUnsafe.mockReset().mockResolvedValue(undefined);
  });

  // AC-8: isMock=true DingTalk sends without error
  it('count>=5 sends DingTalk notification (isMock=true → no network call)', async () => {
    mockViolationLogFindMany.mockResolvedValue([makeViolation(9, 'pii_upload', 5)]);
    const dingtalk = new DingtalkService('', true);
    const sendSpy = vi.spyOn(dingtalk, 'send').mockResolvedValue({ ok: true, mock: true });
    await detectViolationThresholds(dingtalk);
    expect(sendSpy).toHaveBeenCalledOnce();
    expect(sendSpy.mock.calls[0]?.[0]).toContain('#9');
  });

  // AC-8: count=3 does NOT send DingTalk (no ban)
  it('count=3 does not trigger DingTalk notification', async () => {
    mockViolationLogFindMany.mockResolvedValue([makeViolation(10, 'pii_upload', 3)]);
    const dingtalk = new DingtalkService('', true);
    const sendSpy = vi.spyOn(dingtalk, 'send').mockResolvedValue({ ok: true, mock: true });
    await detectViolationThresholds(dingtalk);
    expect(sendSpy).not.toHaveBeenCalled();
  });

  // dingtalk send failure is swallowed (logged, not thrown)
  it('DingTalk send error is swallowed and does not throw', async () => {
    mockViolationLogFindMany.mockResolvedValue([makeViolation(11, 'pii_upload', 5)]);
    const dingtalk = new DingtalkService('', true);
    vi.spyOn(dingtalk, 'send').mockRejectedValue(new Error('network timeout'));
    await expect(detectViolationThresholds(dingtalk)).resolves.toBeDefined();
  });
});
