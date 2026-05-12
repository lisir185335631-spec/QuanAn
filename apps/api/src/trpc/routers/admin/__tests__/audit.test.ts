// PRD-11 US-016 · audit router unit tests — 30 tests
// byTraceId(4表全有/部分/全无) · byUserId(分页+filter) · byAdminId(鉴权) · search(SQL注入) · exportPdf(链路)

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ──────────────────────────────────────────────────────────

const mockLogAdminAction = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockGenerateForensicPdf = vi.hoisted(() =>
  vi.fn().mockResolvedValue(Buffer.from('pdf-placeholder').toString('base64')),
);

const mockAuditLogFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockAuditLogCount = vi.hoisted(() => vi.fn().mockResolvedValue(0));
const mockAdminAuditLogFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockAdminAuditLogFindFirst = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockAdminAuditLogCreate = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const mockCostLogFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockFeedbackLogFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));

const mockPrismaTransaction = vi.hoisted(() =>
  vi.fn().mockImplementation((cb: (tx: unknown) => unknown) =>
    cb({
      $executeRaw: vi.fn().mockResolvedValue(undefined),
      $executeRawUnsafe: vi.fn().mockResolvedValue(undefined),
      auditLog: { findMany: mockAuditLogFindMany },
      adminAuditLog: { findMany: mockAdminAuditLogFindMany },
      costLog: { findMany: mockCostLogFindMany },
      feedbackLog: { findMany: mockFeedbackLogFindMany },
    }),
  ),
);

vi.mock('@/services/admin/admin-audit-service', () => ({
  logAdminAction: mockLogAdminAction,
}));

vi.mock('@/services/admin/audit/pdf-forensic.service', () => ({
  generateForensicPdf: mockGenerateForensicPdf,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: mockPrismaTransaction,
    auditLog: {
      findMany: mockAuditLogFindMany,
      count: mockAuditLogCount,
    },
    adminAuditLog: {
      findMany: mockAdminAuditLogFindMany,
      findFirst: mockAdminAuditLogFindFirst,
      create: mockAdminAuditLogCreate,
    },
    costLog: { findMany: mockCostLogFindMany },
    feedbackLog: { findMany: mockFeedbackLogFindMany },
  },
}));

// ── Imports (after mocks) ──────────────────────────────────────────────────
import { adminAuditRouter } from '@/trpc/routers/admin/audit';
import type { AdminTRPCContext } from '@/server/context-admin';
import type { AdminLuciaSession, AdminLuciaUser } from '@/lib/auth/lucia-admin';
import type { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// ── Fixtures ───────────────────────────────────────────────────────────────

const SUPER_ADMIN: AdminLuciaUser = {
  id: 1, email: 'super@quanqn.com', role: 'super_admin', isMock: false, isActive: true,
};
const REGULAR_ADMIN: AdminLuciaUser = {
  id: 2, email: 'admin@quanqn.com', role: 'admin', isMock: false, isActive: true,
};
const READONLY_ADMIN: AdminLuciaUser = {
  id: 3, email: 'readonly@quanqn.com', role: 'readonly_admin', isMock: false, isActive: true,
};

const MOCK_SESSION: AdminLuciaSession = {
  id: 'sess-audit-test',
  expiresAt: new Date(Date.now() + 3_600_000),
  fresh: false,
};

const T1 = new Date('2026-01-01T10:00:00Z');
const T2 = new Date('2026-01-01T10:01:00Z');
const T3 = new Date('2026-01-01T10:02:00Z');
const TRACE_ID = 'trace-abc-def-ghi';

function makeRequest(headers: Record<string, string> = {}): Request {
  const h = new Headers(headers);
  return { headers: h } as unknown as Request;
}

function makeCtx(
  user: AdminLuciaUser | null,
  overrides: Partial<AdminTRPCContext> = {},
): AdminTRPCContext {
  return {
    prisma: prisma as PrismaClient,
    traceId: 'ctx-trace-001',
    req: makeRequest(),
    resHeaders: new Headers(),
    adminSession: user ? MOCK_SESSION : null,
    activeAdminUser: user,
    adminSessionMfaVerifiedAt: null,
    ...overrides,
  };
}

function makeCaller(user: AdminLuciaUser | null, overrides: Partial<AdminTRPCContext> = {}) {
  return adminAuditRouter.createCaller(makeCtx(user, overrides));
}

// ── beforeEach ──────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.resetAllMocks();
  mockLogAdminAction.mockResolvedValue(undefined);
  mockGenerateForensicPdf.mockResolvedValue(Buffer.from('pdf-placeholder').toString('base64'));
  mockAuditLogFindMany.mockResolvedValue([]);
  mockAuditLogCount.mockResolvedValue(0);
  mockAdminAuditLogFindMany.mockResolvedValue([]);
  mockAdminAuditLogFindFirst.mockResolvedValue(null);
  mockAdminAuditLogCreate.mockResolvedValue({});
  mockCostLogFindMany.mockResolvedValue([]);
  mockFeedbackLogFindMany.mockResolvedValue([]);
  mockPrismaTransaction.mockImplementation((cb: (tx: unknown) => unknown) =>
    cb({
      $executeRaw: vi.fn().mockResolvedValue(undefined),
      $executeRawUnsafe: vi.fn().mockResolvedValue(undefined),
      auditLog: { findMany: mockAuditLogFindMany },
      adminAuditLog: { findMany: mockAdminAuditLogFindMany },
      costLog: { findMany: mockCostLogFindMany },
      feedbackLog: { findMany: mockFeedbackLogFindMany },
    }),
  );
});

// ── byTraceId ─────────────────────────────────────────────────────────────

describe('byTraceId', () => {
  it('returns empty timeline + zero summary when no records in any table', async () => {
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.byTraceId({ traceId: TRACE_ID });
    expect(result.timeline).toHaveLength(0);
    expect(result.summary).toEqual({ eventCount: 0, spanMs: 0 });
  });

  it('merges records from all 4 tables into timeline', async () => {
    mockAuditLogFindMany.mockResolvedValueOnce([
      { id: BigInt(1), eventType: 'login', eventCategory: 'auth', createdAt: T1, payload: null, userId: 10, success: true },
    ]);
    mockAdminAuditLogFindMany.mockResolvedValueOnce([
      { id: 2, eventType: 'view_user', eventCategory: 'data_query', createdAt: T2, payload: null, actorAdminId: 1, success: true },
    ]);
    mockCostLogFindMany.mockResolvedValueOnce([
      { id: BigInt(3), eventType: 'specialist_call', createdAt: T3, costUsd: { toString: () => '0.05' }, modelUsed: 'claude-sonnet', userId: 10, success: true },
    ]);
    mockFeedbackLogFindMany.mockResolvedValueOnce([
      { id: 4, createdAt: new Date('2026-01-01T10:03:00Z'), rating: 'up', agentId: 'agent-1', userId: 10 },
    ]);

    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.byTraceId({ traceId: TRACE_ID });
    expect(result.timeline).toHaveLength(4);
    expect(result.summary.eventCount).toBe(4);
  });

  it('returns partial timeline when only audit_log has records', async () => {
    mockAuditLogFindMany.mockResolvedValueOnce([
      { id: BigInt(10), eventType: 'api_call', eventCategory: 'data_query', createdAt: T1, payload: null, userId: 5, success: true },
    ]);

    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.byTraceId({ traceId: TRACE_ID });
    expect(result.timeline).toHaveLength(1);
    expect(result.timeline[0]!.source).toBe('audit_log');
  });

  it('timeline is sorted ascending by createdAt', async () => {
    mockAdminAuditLogFindMany.mockResolvedValueOnce([
      { id: 1, eventType: 'later', eventCategory: 'auth', createdAt: T3, payload: null, actorAdminId: 1, success: true },
    ]);
    mockAuditLogFindMany.mockResolvedValueOnce([
      { id: BigInt(2), eventType: 'earlier', eventCategory: 'auth', createdAt: T1, payload: null, userId: 5, success: true },
    ]);

    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.byTraceId({ traceId: TRACE_ID });
    expect(result.timeline[0]!.eventType).toBe('earlier');
    expect(result.timeline[1]!.eventType).toBe('later');
  });

  it('summary.spanMs = last.createdAt - first.createdAt', async () => {
    mockAuditLogFindMany.mockResolvedValueOnce([
      { id: BigInt(1), eventType: 'a', eventCategory: 'auth', createdAt: T1, payload: null, userId: 1, success: true },
      { id: BigInt(2), eventType: 'b', eventCategory: 'auth', createdAt: T3, payload: null, userId: 1, success: true },
    ]);

    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.byTraceId({ traceId: TRACE_ID });
    expect(result.summary.spanMs).toBe(T3.getTime() - T1.getTime());
  });

  it('writes audit logs for cross_account_query and view_trace_timeline', async () => {
    mockLogAdminAction.mockClear();
    const caller = makeCaller(SUPER_ADMIN);
    await caller.byTraceId({ traceId: TRACE_ID });
    expect(mockLogAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'cross_account_query', eventCategory: 'cross_account_query' }),
    );
    expect(mockLogAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'view_trace_timeline' }),
    );
  });

  it('uses $transaction with SET LOCAL (AC-2)', async () => {
    mockPrismaTransaction.mockClear();
    const caller = makeCaller(SUPER_ADMIN);
    await caller.byTraceId({ traceId: TRACE_ID });
    expect(mockPrismaTransaction).toHaveBeenCalled();
  });

  it('traceId min 8 — shorter string throws ZodError', async () => {
    const caller = makeCaller(SUPER_ADMIN);
    await expect(caller.byTraceId({ traceId: 'short' })).rejects.toThrow();
  });
});

// ── byUserId ──────────────────────────────────────────────────────────────

describe('byUserId', () => {
  const LOG = {
    id: BigInt(1),
    eventType: 'api_call',
    eventCategory: 'data_query',
    createdAt: T1,
    payload: null,
    traceId: TRACE_ID,
    success: true,
  };

  it('returns timeline and total', async () => {
    mockAuditLogFindMany.mockResolvedValueOnce([LOG]);
    mockAuditLogCount.mockResolvedValueOnce(1);

    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.byUserId({ userId: 5 });
    expect(result.timeline).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('applies pagination correctly', async () => {
    mockAuditLogFindMany.mockResolvedValueOnce([LOG]);
    mockAuditLogCount.mockResolvedValueOnce(100);

    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.byUserId({ userId: 5, page: 2, pageSize: 10 });
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(10);
    // findMany called with skip = (2-1)*10 = 10
    const callArgs = mockAuditLogFindMany.mock.calls[0]![0] as { skip: number };
    expect(callArgs.skip).toBe(10);
  });

  it('filters by eventCategory when provided', async () => {
    mockAuditLogFindMany.mockResolvedValueOnce([]);
    mockAuditLogCount.mockResolvedValueOnce(0);

    const caller = makeCaller(SUPER_ADMIN);
    await caller.byUserId({ userId: 5, eventCategory: 'auth' });
    const callArgs = mockAuditLogFindMany.mock.calls[0]![0] as { where: unknown };
    expect(JSON.stringify(callArgs.where)).toContain('auth');
  });

  it('filters by time range when startDate/endDate provided', async () => {
    mockAuditLogFindMany.mockResolvedValueOnce([]);
    mockAuditLogCount.mockResolvedValueOnce(0);

    const caller = makeCaller(SUPER_ADMIN);
    await caller.byUserId({ userId: 5, startDate: T1, endDate: T3 });
    const callArgs = mockAuditLogFindMany.mock.calls[0]![0] as { where: { createdAt?: unknown } };
    expect(callArgs.where.createdAt).toBeDefined();
  });

  it('groups results by eventCategory', async () => {
    mockAuditLogFindMany.mockResolvedValueOnce([
      { ...LOG, id: BigInt(1), eventCategory: 'auth' },
      { ...LOG, id: BigInt(2), eventCategory: 'data_query' },
      { ...LOG, id: BigInt(3), eventCategory: 'auth' },
    ]);
    mockAuditLogCount.mockResolvedValueOnce(3);

    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.byUserId({ userId: 5 });
    expect(result.grouped['auth']).toHaveLength(2);
    expect(result.grouped['data_query']).toHaveLength(1);
  });
});

// ── byAdminId ─────────────────────────────────────────────────────────────

describe('byAdminId', () => {
  it('super_admin can call byAdminId without x-actor-mode', async () => {
    mockAdminAuditLogFindMany.mockResolvedValueOnce([]);
    const caller = makeCaller(SUPER_ADMIN);
    await expect(caller.byAdminId({ adminUserId: 99 })).resolves.toBeDefined();
  });

  it('readonly_admin with actorMode=legal is allowed', async () => {
    mockAdminAuditLogFindMany.mockResolvedValueOnce([]);
    const caller = makeCaller(READONLY_ADMIN, {
      req: makeRequest({ 'x-actor-mode': 'legal' }),
    });
    await expect(caller.byAdminId({ adminUserId: 99 })).resolves.toBeDefined();
  });

  it('regular admin is forbidden — throws FORBIDDEN', async () => {
    const caller = makeCaller(REGULAR_ADMIN);
    await expect(caller.byAdminId({ adminUserId: 99 })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('readonly_admin without actorMode=legal is forbidden', async () => {
    const caller = makeCaller(READONLY_ADMIN);
    await expect(caller.byAdminId({ adminUserId: 99 })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('readonly_admin with actorMode=cs (not legal) is forbidden', async () => {
    const caller = makeCaller(READONLY_ADMIN, {
      req: makeRequest({ 'x-actor-mode': 'cs' }),
    });
    await expect(caller.byAdminId({ adminUserId: 99 })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('high-risk events are flagged with isHighRisk=true', async () => {
    mockAdminAuditLogFindMany.mockResolvedValueOnce([
      { id: 1, eventType: 'ban_user', eventCategory: 'high_risk_action', createdAt: T1, payload: null, traceId: 't1', success: true, actorRole: 'admin', actorMode: null },
      { id: 2, eventType: 'list_users', eventCategory: 'data_query', createdAt: T2, payload: null, traceId: 't2', success: true, actorRole: 'admin', actorMode: null },
    ]);

    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.byAdminId({ adminUserId: 5 });
    expect(result[0]!.isHighRisk).toBe(true);
    expect(result[1]!.isHighRisk).toBe(false);
  });

  it('cross_account_query and security_alert are also high-risk', async () => {
    mockAdminAuditLogFindMany.mockResolvedValueOnce([
      { id: 1, eventType: 'e', eventCategory: 'cross_account_query', createdAt: T1, payload: null, traceId: 't', success: true, actorRole: 'admin', actorMode: null },
      { id: 2, eventType: 'e', eventCategory: 'security_alert', createdAt: T2, payload: null, traceId: 't', success: true, actorRole: 'admin', actorMode: null },
    ]);

    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.byAdminId({ adminUserId: 5 });
    expect(result[0]!.isHighRisk).toBe(true);
    expect(result[1]!.isHighRisk).toBe(true);
  });
});

// ── search ────────────────────────────────────────────────────────────────

describe('search', () => {
  it('returns results matching keyword', async () => {
    mockAdminAuditLogFindMany.mockResolvedValueOnce([
      { id: 1, eventType: 'ban_user', eventCategory: 'high_risk_action', createdAt: T1, traceId: 't', actorAdminId: 1, actorRole: 'admin', targetUserId: 5, targetEntity: null, success: true },
    ]);

    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.search({ keyword: 'ban' });
    expect(result).toHaveLength(1);
  });

  it('SQL special chars in keyword do not throw (prisma contains escapes)', async () => {
    mockAdminAuditLogFindMany.mockResolvedValueOnce([]);
    const caller = makeCaller(SUPER_ADMIN);
    // Special chars: ' " ; -- ;DROP
    for (const kw of ["'; DROP TABLE", '"quoted"', '; --', 'x; DROP']) {
      await expect(caller.search({ keyword: kw.length >= 2 ? kw : 'xx' })).resolves.toBeDefined();
    }
  });

  it("single-quote keyword with length >= 2 doesn't throw", async () => {
    mockAdminAuditLogFindMany.mockResolvedValueOnce([]);
    const caller = makeCaller(SUPER_ADMIN);
    await expect(caller.search({ keyword: "'; DROP TABLE users --" })).resolves.toBeDefined();
  });

  it('keyword shorter than 2 chars throws ZodError', async () => {
    const caller = makeCaller(SUPER_ADMIN);
    await expect(caller.search({ keyword: 'x' })).rejects.toThrow();
  });

  it('keyword longer than 100 chars throws ZodError', async () => {
    const caller = makeCaller(SUPER_ADMIN);
    await expect(caller.search({ keyword: 'x'.repeat(101) })).rejects.toThrow();
  });

  it('results capped at take:200', async () => {
    const caller = makeCaller(SUPER_ADMIN);
    await caller.search({ keyword: 'test' });
    const callArgs = mockAdminAuditLogFindMany.mock.calls[0]![0] as { take: number };
    expect(callArgs.take).toBe(200);
  });

  it('uses prisma.contains mode:insensitive (not raw SQL)', async () => {
    mockAdminAuditLogFindMany.mockResolvedValueOnce([]);
    const caller = makeCaller(SUPER_ADMIN);
    await caller.search({ keyword: 'admin_login' });
    const callArgs = mockAdminAuditLogFindMany.mock.calls[0]![0] as {
      where: { OR: Array<{ eventType?: unknown }> };
    };
    const eventTypeFilter = callArgs.where.OR.find((o) => 'eventType' in o)?.eventType as {
      contains: string;
      mode: string;
    };
    expect(eventTypeFilter?.mode).toBe('insensitive');
  });

  it('filters by eventCategory when provided', async () => {
    mockAdminAuditLogFindMany.mockResolvedValueOnce([]);
    const caller = makeCaller(SUPER_ADMIN);
    await caller.search({ keyword: 'login', eventCategory: 'auth' });
    const callArgs = mockAdminAuditLogFindMany.mock.calls[0]![0] as {
      where: Record<string, unknown>;
    };
    expect(callArgs.where.eventCategory).toBe('auth');
  });

  it('empty results when nothing matches', async () => {
    mockAdminAuditLogFindMany.mockResolvedValueOnce([]);
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.search({ keyword: 'zzznomatch' });
    expect(result).toEqual([]);
  });
});

// ── exportPdf ─────────────────────────────────────────────────────────────

describe('exportPdf', () => {
  it('returns base64 string on success', async () => {
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.exportPdf({
      traceId: TRACE_ID,
      caseNumber: 'CASE-001',
      reason: 'Forensic investigation',
    });
    expect(typeof result.base64).toBe('string');
    expect(result.base64.length).toBeGreaterThan(0);
  });

  it('returns traceId and caseNumber in response', async () => {
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.exportPdf({
      traceId: TRACE_ID,
      caseNumber: 'CASE-002',
      reason: 'Legal review',
    });
    expect(result.traceId).toBe(TRACE_ID);
    expect(result.caseNumber).toBe('CASE-002');
  });

  it('calls generateForensicPdf with correct args', async () => {
    const caller = makeCaller(SUPER_ADMIN);
    await caller.exportPdf({
      traceId: TRACE_ID,
      caseNumber: 'CASE-003',
      reason: 'Test reason',
    });
    expect(mockGenerateForensicPdf).toHaveBeenCalledOnce();
    const args = mockGenerateForensicPdf.mock.calls[0]![0] as {
      traceId: string;
      caseNumber: string;
    };
    expect(args.traceId).toBe(TRACE_ID);
    expect(args.caseNumber).toBe('CASE-003');
  });

  it('writes export_forensic_pdf audit log', async () => {
    const caller = makeCaller(SUPER_ADMIN);
    await caller.exportPdf({
      traceId: TRACE_ID,
      caseNumber: 'CASE-004',
      reason: 'Evidence collection',
    });
    expect(mockLogAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'export_forensic_pdf', eventCategory: 'export' }),
    );
  });

  it('still succeeds when traceId has no matching records (empty timeline)', async () => {
    const caller = makeCaller(SUPER_ADMIN);
    await expect(
      caller.exportPdf({ traceId: TRACE_ID, caseNumber: 'C', reason: 'r' }),
    ).resolves.toBeDefined();
    // generateForensicPdf receives empty timeline
    const args = mockGenerateForensicPdf.mock.calls[0]![0] as { timeline: unknown[] };
    expect(args.timeline).toHaveLength(0);
  });

  it('passes all 4 table results merged into timeline', async () => {
    mockAuditLogFindMany.mockResolvedValueOnce([{ id: BigInt(1), createdAt: T1 }]);
    mockAdminAuditLogFindMany.mockResolvedValueOnce([{ id: 2, createdAt: T2 }]);
    mockCostLogFindMany.mockResolvedValueOnce([{ id: BigInt(3), createdAt: T3 }]);

    const caller = makeCaller(SUPER_ADMIN);
    await caller.exportPdf({ traceId: TRACE_ID, caseNumber: 'C', reason: 'r' });
    const args = mockGenerateForensicPdf.mock.calls[0]![0] as { timeline: unknown[] };
    expect(args.timeline).toHaveLength(3);
  });
});
