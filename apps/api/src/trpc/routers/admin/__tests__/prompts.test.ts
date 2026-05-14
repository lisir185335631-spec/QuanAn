// PRD-13 US-008 · adminRouter.prompts unit tests — 3 new procedures
// updateCanary · rollback · runLlmJudge

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';

// ── Hoisted mocks ──────────────────────────────────────────────────────────

const mockLogAdminAction = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

const mockRequestApproval = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ id: 42 }),
);
const mockEvaluatePromptVersion = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ versionId: 1, score: 4.5, isMock: true }),
);

const mockExecuteRawUnsafe = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockAuditFindFirst = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockAuditCreate = vi.hoisted(() => vi.fn().mockResolvedValue({}));

const mockPromptVersionFindFirst = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockPromptVersionFindUniqueOrThrow = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    id: 1,
    specialistId: 'PositioningAgent',
    mode: 'default',
    version: 17,
    status: 'draft',
  }),
);
const mockPromptVersionFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockPromptVersionCreate = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ id: 1, status: 'draft' }),
);
const mockPromptVersionUpdate = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const mockCanaryConfigFindUnique = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockCanaryConfigUpdateMany = vi.hoisted(() => vi.fn().mockResolvedValue({ count: 1 }));
const mockCanaryConfigUpsert = vi.hoisted(() => vi.fn().mockResolvedValue({}));

// tx proxy must be a function so we can re-init after resetAllMocks
const mockPrismaTransaction = vi.hoisted(() =>
  vi.fn().mockImplementation((cb: (tx: unknown) => unknown) =>
    cb({
      $executeRawUnsafe: mockExecuteRawUnsafe,
      adminAuditLog: {
        findFirst: mockAuditFindFirst,
        create: mockAuditCreate,
      },
    }),
  ),
);

vi.mock('@/services/admin/admin-audit-service', () => ({
  logAdminAction: mockLogAdminAction,
}));

vi.mock('@/services/admin/approval/approvalGateService', () => ({
  requestApproval: mockRequestApproval,
}));

vi.mock('@/services/admin/prompt-version/llm-judge.service', () => ({
  evaluatePromptVersion: mockEvaluatePromptVersion,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: mockPrismaTransaction,
    promptVersion: {
      findFirst: mockPromptVersionFindFirst,
      findUniqueOrThrow: mockPromptVersionFindUniqueOrThrow,
      findMany: mockPromptVersionFindMany,
      create: mockPromptVersionCreate,
      update: mockPromptVersionUpdate,
    },
    promptCanaryConfig: {
      findUnique: mockCanaryConfigFindUnique,
      updateMany: mockCanaryConfigUpdateMany,
      upsert: mockCanaryConfigUpsert,
    },
    adminAuditLog: {
      findFirst: mockAuditFindFirst,
      create: mockAuditCreate,
    },
  },
}));

// ── Imports ────────────────────────────────────────────────────────────────

import { promptsRouter } from '@/trpc/routers/admin/prompts';
import type { AdminTRPCContext } from '@/server/context-admin';
import type { AdminLuciaSession, AdminLuciaUser } from '@/lib/auth/lucia-admin';
import type { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// ── Fixtures ───────────────────────────────────────────────────────────────

const SUPER_ADMIN: AdminLuciaUser = {
  id: 1, email: 'super@quanqn.com', role: 'super_admin', isMock: true, isActive: true,
};
const REGULAR_ADMIN: AdminLuciaUser = {
  id: 2, email: 'admin@quanqn.com', role: 'admin', isMock: true, isActive: true,
};

const MOCK_SESSION: AdminLuciaSession = {
  id: 'sess-prompts-test',
  expiresAt: new Date(Date.now() + 3_600_000),
  fresh: false,
};

function makeCtx(user: AdminLuciaUser | null): AdminTRPCContext {
  return {
    prisma: prisma as PrismaClient,
    traceId: 'ctx-trace-prompts',
    req: { headers: new Headers() } as unknown as Request,
    resHeaders: new Headers(),
    adminSession: user ? MOCK_SESSION : null,
    activeAdminUser: user,
    adminSessionMfaVerifiedAt: null,
  };
}

function makeCaller(user: AdminLuciaUser | null) {
  return promptsRouter.createCaller(makeCtx(user));
}

// ── beforeEach ──────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.resetAllMocks();
  // Re-inject implementations cleared by resetAllMocks
  mockPrismaTransaction.mockImplementation((cb: (tx: unknown) => unknown) =>
    cb({
      $executeRawUnsafe: mockExecuteRawUnsafe,
      adminAuditLog: {
        findFirst: mockAuditFindFirst,
        create: mockAuditCreate,
      },
    }),
  );
  mockExecuteRawUnsafe.mockResolvedValue(undefined);
  mockAuditCreate.mockResolvedValue({});
  mockAuditFindFirst.mockResolvedValue(null);
  mockLogAdminAction.mockResolvedValue(undefined);
  mockRequestApproval.mockResolvedValue({ id: 42 });
  mockEvaluatePromptVersion.mockResolvedValue({ versionId: 1, score: 4.5, isMock: true });
  mockCanaryConfigUpdateMany.mockResolvedValue({ count: 1 });
  mockCanaryConfigUpsert.mockResolvedValue({});
  // Default active version for updateCanary tests
  mockPromptVersionFindFirst.mockResolvedValue({
    id: 1, specialistId: 'PositioningAgent', mode: 'default', version: 17, status: 'active',
  });
  mockPromptVersionFindUniqueOrThrow.mockResolvedValue({
    id: 1,
    specialistId: 'PositioningAgent',
    mode: 'default',
    version: 17,
    status: 'draft',
  });
});

// ── updateCanary ──────────────────────────────────────────────────────────

describe('prompts.updateCanary', () => {
  it('non-super_admin → FORBIDDEN', async () => {
    const caller = makeCaller(REGULAR_ADMIN);
    await expect(
      caller.updateCanary({ specialistId: 'PositioningAgent', mode: 'default', canaryPct: 10 }),
    ).rejects.toThrow(TRPCError);
  });

  it('invalid canaryPct → validation error', async () => {
    const caller = makeCaller(SUPER_ADMIN);
    await expect(
      caller.updateCanary({ specialistId: 'PositioningAgent', mode: 'default', canaryPct: 15 } as never),
    ).rejects.toThrow();
  });

  it('canaryPct=10 → direct DB upsert, no approval', async () => {
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.updateCanary({
      specialistId: 'PositioningAgent',
      mode: 'default',
      canaryPct: 10,
    });
    expect(result.canaryPct).toBe(10);
    expect(result.approvalRequestId).toBeNull();
    expect(mockCanaryConfigUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { specialistId_mode: { specialistId: 'PositioningAgent', mode: 'default' } },
        update: { canaryPct: 10, updatedByAdminId: 1 },
      }),
    );
    expect(mockRequestApproval).not.toHaveBeenCalled();
  });

  it('canaryPct=0 → direct DB upsert (暂停灰度)', async () => {
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.updateCanary({
      specialistId: 'PositioningAgent',
      mode: 'default',
      canaryPct: 0,
    });
    expect(result.canaryPct).toBe(0);
    expect(mockCanaryConfigUpsert).toHaveBeenCalled();
    expect(mockRequestApproval).not.toHaveBeenCalled();
  });

  it('canaryPct=100 → requestApproval(dual=true), no direct DB update', async () => {
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.updateCanary({
      specialistId: 'PositioningAgent',
      mode: 'default',
      canaryPct: 100,
    });
    expect(result.approvalRequestId).toBe(42);
    expect(result.canaryPct).toBeNull();
    expect(mockRequestApproval).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: 'publish_prompt',
        requireDualApproval: true,
        riskLevel: 'high',
      }),
    );
    expect(mockCanaryConfigUpsert).not.toHaveBeenCalled();
  });
});

// ── rollback ──────────────────────────────────────────────────────────────

describe('prompts.rollback', () => {
  it('non-super_admin → FORBIDDEN', async () => {
    const caller = makeCaller(REGULAR_ADMIN);
    await expect(
      caller.rollback({
        specialistId: 'PositioningAgent',
        mode: 'default',
        reason: '回滚原因：版本评分下降 · 需要紧急切回',
      }),
    ).rejects.toThrow(TRPCError);
  });

  it('reason < 20 chars → validation error', async () => {
    const caller = makeCaller(SUPER_ADMIN);
    await expect(
      caller.rollback({ specialistId: 'PositioningAgent', mode: 'default', reason: '太短' }),
    ).rejects.toThrow();
  });

  it('valid reason → requestApproval(rollback_prompt, dual=true)', async () => {
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.rollback({
      specialistId: 'PositioningAgent',
      mode: 'default',
      reason: '回滚原因：新版本评分异常下降到 3.0 以下，需紧急切回',
    });
    expect(result.approvalRequestId).toBe(42);
    expect(mockRequestApproval).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: 'rollback_prompt',
        requireDualApproval: true,
        riskLevel: 'high',
      }),
    );
  });
});

// ── runLlmJudge ──────────────────────────────────────────────────────────

describe('prompts.runLlmJudge', () => {
  it('non-super_admin → FORBIDDEN', async () => {
    const caller = makeCaller(REGULAR_ADMIN);
    await expect(
      caller.runLlmJudge({ versionId: 1 }),
    ).rejects.toThrow(TRPCError);
  });

  it('super_admin → evaluatePromptVersion called + score returned', async () => {
    const caller = makeCaller(SUPER_ADMIN);
    const result = await caller.runLlmJudge({ versionId: 7, isMock: true });
    expect(result.score).toBe(4.5);
    expect(result.isMock).toBe(true);
    expect(result.runAt).toBeInstanceOf(Date);
    expect(mockEvaluatePromptVersion).toHaveBeenCalledWith(7, true);
  });
});
