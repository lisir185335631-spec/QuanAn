// PRD-14 US-009 · adminRouter.constants unit tests
// 8 procedures: listKeys · getActiveVersion · listVersions · saveDraft · submitForReview
//               rollbackVersion · updateCanary · runLlmJudge

import { TRPCError } from '@trpc/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';


// ── Hoisted mocks ─────────────────────────────────────────────────────────

const mockEvaluateConstantVersion = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ versionId: 1, score: 4.5, isMock: true }),
);
const mockRollbackConstant = vi.hoisted(() => vi.fn().mockResolvedValue(99));
const mockUpdateConstantCanaryConfig = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockRequestApproval = vi.hoisted(() => vi.fn().mockResolvedValue({ id: 77 }));

const mockConstantVersionCreate = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    id: 1,
    version: 1,
    constantType: 'case',
    constantKey: 'opinion_beauty_01',
    content: '{"test":true}',
    contentHash: 'abc123',
    status: 'draft',
    createdByAdminId: 1,
    createdAt: new Date(),
    judgeScore: null,
    approvedAt: null,
    approvedByAdminId: null,
  }),
);
const mockConstantVersionFindFirst = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockConstantVersionFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockConstantVersionFindUniqueOrThrow = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    id: 2,
    version: 1,
    constantType: 'case',
    constantKey: 'opinion_beauty_01',
    content: '{"original":true}',
    status: 'draft',
    createdByAdminId: 1,
    createdAt: new Date(),
    judgeScore: null,
  }),
);
const mockConstantVersionUpdate = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockConstantCanaryConfigFindUnique = vi.hoisted(() => vi.fn().mockResolvedValue(null));

const mockExecuteRawUnsafe = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockTransaction = vi.hoisted(() =>
  vi.fn().mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
    const txProxy = { $executeRawUnsafe: mockExecuteRawUnsafe };
    return fn(txProxy);
  }),
);

vi.mock('@/services/admin/constant-version/llm-judge-constant.service', () => ({
  evaluateConstantVersion: mockEvaluateConstantVersion,
}));

vi.mock('@/services/admin/constant-version/constant-version.service', () => ({
  rollbackConstant: mockRollbackConstant,
  updateConstantCanaryConfig: mockUpdateConstantCanaryConfig,
}));

vi.mock('@/services/admin/approval/approvalGateService', () => ({
  requestApproval: mockRequestApproval,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: mockTransaction,
    constantVersion: {
      create: mockConstantVersionCreate,
      findFirst: mockConstantVersionFindFirst,
      findMany: mockConstantVersionFindMany,
      findUniqueOrThrow: mockConstantVersionFindUniqueOrThrow,
      update: mockConstantVersionUpdate,
    },
    constantCanaryConfig: {
      findUnique: mockConstantCanaryConfigFindUnique,
    },
  },
}));

// ── Import after mocks ────────────────────────────────────────────────────

import type { AdminLuciaSession, AdminLuciaUser } from '@/lib/auth/lucia-admin';
import { prisma } from '@/lib/prisma';
import type { AdminTRPCContext } from '@/server/context-admin';

import { constantsRouter } from '../constants';

// ── Context builder ───────────────────────────────────────────────────────

function makeCtx(role: 'super_admin' | 'admin' | 'readonly_admin' = 'admin'): AdminTRPCContext {
  return {
    req: new Request('http://localhost/trpc/admin'),
    resHeaders: new Headers(),
    adminSession: {
      id: 'sess-1',
      userId: 'user-1',
      expiresAt: new Date(Date.now() + 3600 * 1000),
      fresh: false,
    } as AdminLuciaSession,
    activeAdminUser: {
      id: 1,
      email: `${role}@test.com`,
      role,
      isActive: true,
      createdAt: new Date(),
      mfaEnabled: false,
      mfaSecret: null,
      allowedIps: [],
      updatedAt: new Date(),
      lastLoginAt: null,
      lastLoginIp: null,
      name: null,
    } as unknown as AdminLuciaUser,
    adminPrisma: prisma,
    prisma: prisma,
    traceId: 'trace-test',
  };
}

function makeCaller(role: 'super_admin' | 'admin' | 'readonly_admin' = 'admin') {
  return constantsRouter.createCaller(makeCtx(role));
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe('constantsRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConstantVersionFindFirst.mockResolvedValue(null);
    mockConstantVersionFindMany.mockResolvedValue([]);
    mockConstantCanaryConfigFindUnique.mockResolvedValue(null);
    mockConstantVersionFindUniqueOrThrow.mockResolvedValue({
      id: 2,
      version: 1,
      constantType: 'case',
      constantKey: 'opinion_beauty_01',
      content: '{"original":true}',
      status: 'draft',
      createdByAdminId: 1,
      createdAt: new Date(),
      judgeScore: null,
    });
  });

  // ── listKeys ──────────────────────────────────────────────────────────────

  it('listKeys: case → 67 keys', async () => {
    const caller = makeCaller();
    const result = await caller.listKeys({ constantType: 'case' });
    expect(result.keys.length).toBe(67);
    expect(result.keys[0]).toHaveProperty('key');
    expect(result.keys[0]).toHaveProperty('label');
  });

  it('listKeys: formula → 23 keys', async () => {
    const caller = makeCaller();
    const result = await caller.listKeys({ constantType: 'formula' });
    expect(result.keys.length).toBe(23);
  });

  it('listKeys: element → 22 or 23 keys', async () => {
    const caller = makeCaller();
    const result = await caller.listKeys({ constantType: 'element' });
    expect(result.keys.length).toBeGreaterThanOrEqual(22);
    expect(result.keys.length).toBeLessThanOrEqual(23);
  });

  // ── getActiveVersion ──────────────────────────────────────────────────────

  it('getActiveVersion: returns null version when none exists', async () => {
    mockConstantVersionFindFirst.mockResolvedValue(null);
    const caller = makeCaller();
    const result = await caller.getActiveVersion({ constantType: 'case', constantKey: 'opinion_beauty_01' });
    expect(result.version).toBeNull();
    expect(result.canaryConfig).toBeNull();
  });

  it('getActiveVersion: returns active version + canary config', async () => {
    const fakeVersion = { id: 5, version: 2, status: 'active', judgeScore: '4.5', createdByAdminId: 1, createdAt: new Date() };
    const fakeCanary = { id: 1, canaryPct: 10 };
    mockConstantVersionFindFirst.mockResolvedValue(fakeVersion);
    mockConstantCanaryConfigFindUnique.mockResolvedValue(fakeCanary);
    const caller = makeCaller();
    const result = await caller.getActiveVersion({ constantType: 'case', constantKey: 'opinion_beauty_01' });
    expect(result.version).toEqual(fakeVersion);
    expect(result.canaryConfig).toEqual(fakeCanary);
  });

  // ── listVersions ──────────────────────────────────────────────────────────

  it('listVersions: returns empty array when no versions', async () => {
    const caller = makeCaller();
    const result = await caller.listVersions({ constantType: 'case', constantKey: 'opinion_beauty_01' });
    expect(result.versions).toEqual([]);
  });

  it('listVersions: returns versions sorted by version desc', async () => {
    const versions = [
      { id: 3, version: 2, status: 'active' },
      { id: 1, version: 1, status: 'archived' },
    ];
    mockConstantVersionFindMany.mockResolvedValue(versions);
    const caller = makeCaller();
    const result = await caller.listVersions({ constantType: 'case', constantKey: 'opinion_beauty_01' });
    expect(result.versions).toHaveLength(2);
  });

  // ── saveDraft ─────────────────────────────────────────────────────────────

  it('saveDraft: creates draft with version = 1 when no prior versions', async () => {
    const caller = makeCaller();
    const result = await caller.saveDraft({
      constantType: 'case',
      constantKey: 'opinion_beauty_01',
      content: '{"key":"value"}',
    });
    expect(result.version.status).toBe('draft');
    expect(mockConstantVersionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          constantType: 'case',
          constantKey: 'opinion_beauty_01',
          version: 1,
          status: 'draft',
        }),
      }),
    );
  });

  it('saveDraft: increments version when prior version exists', async () => {
    mockConstantVersionFindFirst.mockResolvedValue({ version: 3 });
    const caller = makeCaller();
    await caller.saveDraft({
      constantType: 'formula',
      constantKey: 'pain_hook',
      content: 'updated content',
    });
    expect(mockConstantVersionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ version: 4 }),
      }),
    );
  });

  it('saveDraft: readonly_admin gets FORBIDDEN', async () => {
    const caller = makeCaller('readonly_admin');
    await expect(
      caller.saveDraft({ constantType: 'case', constantKey: 'opinion_beauty_01', content: 'x' }),
    ).rejects.toThrow(TRPCError);
  });

  // ── submitForReview ───────────────────────────────────────────────────────

  it('submitForReview: transitions draft → pending_review and calls requestApproval', async () => {
    const caller = makeCaller();
    const result = await caller.submitForReview({ versionId: 2 });
    expect(mockConstantVersionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 2 },
        data: { status: 'pending_review' },
      }),
    );
    expect(mockRequestApproval).toHaveBeenCalledWith(
      expect.objectContaining({ requireDualApproval: true }),
    );
    expect(result.approvalRequestId).toBe(77);
  });

  it('submitForReview: rejects non-draft version with BAD_REQUEST', async () => {
    mockConstantVersionFindUniqueOrThrow.mockResolvedValue({
      id: 2, version: 1, constantType: 'case', constantKey: 'opinion_beauty_01',
      content: '{}', status: 'active', createdByAdminId: 1, createdAt: new Date(), judgeScore: null,
    });
    const caller = makeCaller();
    await expect(caller.submitForReview({ versionId: 2 })).rejects.toThrow(TRPCError);
  });

  // ── rollbackVersion ───────────────────────────────────────────────────────

  it('rollbackVersion: super_admin can rollback', async () => {
    const caller = makeCaller('super_admin');
    const result = await caller.rollbackVersion({ constantType: 'case', constantKey: 'opinion_beauty_01' });
    expect(mockRollbackConstant).toHaveBeenCalledWith('case', 'opinion_beauty_01', 1);
    expect(result.approvalRequestId).toBe(99);
  });

  it('rollbackVersion: non-super_admin gets FORBIDDEN', async () => {
    const caller = makeCaller('admin');
    await expect(
      caller.rollbackVersion({ constantType: 'case', constantKey: 'opinion_beauty_01' }),
    ).rejects.toThrow(TRPCError);
  });

  // ── updateCanary ──────────────────────────────────────────────────────────

  it('updateCanary: super_admin can set canary pct', async () => {
    const caller = makeCaller('super_admin');
    const result = await caller.updateCanary({
      constantType: 'case',
      constantKey: 'opinion_beauty_01',
      nextVersionId: 5,
      canaryPct: 10,
    });
    expect(mockUpdateConstantCanaryConfig).toHaveBeenCalledWith('case', 'opinion_beauty_01', 5, 10, 1);
    expect(result.canaryPct).toBe(10);
  });

  it('updateCanary: non-super_admin gets FORBIDDEN', async () => {
    const caller = makeCaller('admin');
    await expect(
      caller.updateCanary({
        constantType: 'case',
        constantKey: 'opinion_beauty_01',
        nextVersionId: 5,
        canaryPct: 10,
      }),
    ).rejects.toThrow(TRPCError);
  });

  it('updateCanary: rejects invalid canaryPct', async () => {
    const caller = makeCaller('super_admin');
    await expect(
      caller.updateCanary({
        constantType: 'case',
        constantKey: 'opinion_beauty_01',
        nextVersionId: 5,
        canaryPct: 25,
      }),
    ).rejects.toThrow();
  });

  // ── runLlmJudge ───────────────────────────────────────────────────────────

  it('runLlmJudge: super_admin can run judge (isMock=true)', async () => {
    const caller = makeCaller('super_admin');
    const result = await caller.runLlmJudge({ versionId: 3, isMock: true });
    expect(mockEvaluateConstantVersion).toHaveBeenCalledWith(3, true);
    expect(result.score).toBe(4.5);
    expect(result.isMock).toBe(true);
    expect(result.runAt).toBeInstanceOf(Date);
  });

  it('runLlmJudge: non-super_admin gets FORBIDDEN', async () => {
    const caller = makeCaller('admin');
    await expect(caller.runLlmJudge({ versionId: 3 })).rejects.toThrow(TRPCError);
  });
});
