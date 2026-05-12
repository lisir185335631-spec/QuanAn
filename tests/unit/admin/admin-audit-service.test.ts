// PRD-10 US-004 · admin-audit-service unit tests (AC-11: 6 tests)
// logAdminAction + idempotent + status enum
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFindFirst = vi.fn();
const mockCreate = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    adminAuditLog: {
      findFirst: mockFindFirst,
      create: mockCreate,
    },
  },
}));

// Import AFTER mocks are set up
const { logAdminAction } = await import('@/services/admin/admin-audit-service');

const BASE_INPUT = {
  actorAdminId: 1,
  actorRole: 'super_admin',
  eventCategory: 'auth',
  eventType: 'admin_login',
  traceId: 'trace-test-001',
  ip: '127.0.0.1',
  userAgent: 'test-agent',
  sessionId: 'sess-abc',
  success: true,
} as const;

beforeEach(() => {
  mockFindFirst.mockReset();
  mockCreate.mockReset();
  mockFindFirst.mockResolvedValue(null); // default: no duplicate
  mockCreate.mockResolvedValue({ id: 1 });
});

describe('logAdminAction', () => {
  it('creates a row in adminAuditLog', async () => {
    await logAdminAction(BASE_INPUT);
    expect(mockCreate).toHaveBeenCalledOnce();
    const data = mockCreate.mock.calls[0]?.[0]?.data;
    expect(data?.actorAdminId).toBe(1);
    expect(data?.eventType).toBe('admin_login');
    expect(data?.traceId).toBe('trace-test-001');
  });

  it('is idempotent — skips create when traceId+eventType already exists', async () => {
    mockFindFirst.mockResolvedValue({ id: 99 }); // duplicate found
    await logAdminAction(BASE_INPUT);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('redacts sensitive fields in payload before writing', async () => {
    await logAdminAction({
      ...BASE_INPUT,
      payload: { email: 'a@b.com', password: 'secret123', token: 'tok-xyz' },
    });
    const data = mockCreate.mock.calls[0]?.[0]?.data;
    const payload = data?.payload as Record<string, unknown>;
    expect(payload?.email).toBe('a@b.com');
    expect(payload?.password).toBe('[REDACTED]');
    expect(payload?.token).toBe('[REDACTED]');
  });

  it('handles DB write failure without throwing (logs to console.error)', async () => {
    mockCreate.mockRejectedValue(new Error('DB connection lost'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(logAdminAction(BASE_INPUT)).resolves.toBeUndefined();
    expect(consoleSpy).toHaveBeenCalledWith('[ADMIN AUDIT WRITE FAILED]', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('sets correct eventCategory and eventType from input', async () => {
    await logAdminAction({
      ...BASE_INPUT,
      eventCategory: 'cross_account_query',
      eventType: 'cross_account_query',
    });
    const data = mockCreate.mock.calls[0]?.[0]?.data;
    expect(data?.eventCategory).toBe('cross_account_query');
    expect(data?.eventType).toBe('cross_account_query');
  });

  it('generates payloadHash as non-empty SHA-256 string', async () => {
    await logAdminAction({ ...BASE_INPUT, payload: { key: 'val' } });
    const data = mockCreate.mock.calls[0]?.[0]?.data;
    expect(typeof data?.payloadHash).toBe('string');
    expect(data?.payloadHash).toHaveLength(64); // SHA-256 hex
  });
});
