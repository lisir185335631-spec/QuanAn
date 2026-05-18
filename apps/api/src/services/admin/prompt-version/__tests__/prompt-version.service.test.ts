// PRD-13 US-003 · prompt-version.service.ts unit tests
// AC-4/5/6/7/8: _publishPromptVersionInTx / publishPromptVersion / rollbackPrompt / updateCanaryConfig / getActivePromptVersion

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ──────────────────────────────────────────────────────────

const mockRequestApproval = vi.hoisted(() => vi.fn());

vi.mock('@/services/admin/approval/approvalGateService', () => ({
  requestApproval: mockRequestApproval,
}));

const mockPrisma = vi.hoisted(() => ({
  promptVersion: {
    findUniqueOrThrow: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    create: vi.fn(),
  },
  promptCanaryConfig: {
    findUnique: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

// ── Helpers ────────────────────────────────────────────────────────────────

function makeVersion(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    specialistId: 'PositioningAgent',
    mode: 'default',
    version: 2,
    content: '你是定位顾问',
    contentHash: 'abc',
    status: 'pending_review',
    judgeScore: '4.5',
    createdByAdminId: 1,
    createdAt: new Date(),
    approvedByAdminId: null,
    approvedAt: null,
    ...overrides,
  };
}

// ── Imports (after mocks) ──────────────────────────────────────────────────

import {
  _publishPromptVersionInTx,
  publishPromptVersion,
  rollbackPrompt,
  updateCanaryConfig,
  getActivePromptVersion,
} from '../prompt-version.service';

// ── Tests ──────────────────────────────────────────────────────────────────

describe('_publishPromptVersionInTx', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('archives existing active versions and sets new one active', async () => {
    const version = makeVersion({ status: 'pending_review' });
    const txMock = {
      promptVersion: {
        findUniqueOrThrow: vi.fn().mockResolvedValue(version),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        update: vi.fn().mockResolvedValue({ ...version, status: 'active' }),
      },
      promptCanaryConfig: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({}),
      },
    };

    await _publishPromptVersionInTx(txMock as any, { versionId: 1, adminId: 10, approvalRequestId: 99 });

    expect(txMock.promptVersion.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: 'active', id: { not: 1 } }) }),
    );
    expect(txMock.promptVersion.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'active' }) }),
    );
  });

  it('upserts canary config when existing config present', async () => {
    const version = makeVersion();
    const existingCanary = { id: 5, specialistId: 'PositioningAgent', mode: 'default', canaryPct: 10 };
    const txMock = {
      promptVersion: {
        findUniqueOrThrow: vi.fn().mockResolvedValue(version),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        update: vi.fn().mockResolvedValue({ ...version, status: 'active' }),
      },
      promptCanaryConfig: {
        findUnique: vi.fn().mockResolvedValue(existingCanary),
        update: vi.fn().mockResolvedValue({}),
      },
    };

    await _publishPromptVersionInTx(txMock as any, { versionId: 1, adminId: 10, approvalRequestId: 99 });

    expect(txMock.promptCanaryConfig.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ currentVersionId: 1, canaryPct: 0 }) }),
    );
  });
});

describe('publishPromptVersion', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('throws BAD_REQUEST when status is not pending_review', async () => {
    mockPrisma.promptVersion.findUniqueOrThrow.mockResolvedValue(
      makeVersion({ status: 'draft' }),
    );
    await expect(publishPromptVersion(1, 10)).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('throws BAD_REQUEST when judgeScore < 4.0', async () => {
    mockPrisma.promptVersion.findUniqueOrThrow.mockResolvedValue(
      makeVersion({ status: 'pending_review', judgeScore: '3.9' }),
    );
    await expect(publishPromptVersion(1, 10)).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('throws BAD_REQUEST when judgeScore is null', async () => {
    mockPrisma.promptVersion.findUniqueOrThrow.mockResolvedValue(
      makeVersion({ status: 'pending_review', judgeScore: null }),
    );
    await expect(publishPromptVersion(1, 10)).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('calls requestApproval with dual approval when valid', async () => {
    mockPrisma.promptVersion.findUniqueOrThrow.mockResolvedValue(makeVersion());
    mockRequestApproval.mockResolvedValue({ id: 42 });

    const result = await publishPromptVersion(1, 10);

    expect(mockRequestApproval).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: 'publish_prompt',
        requireDualApproval: true,
        riskLevel: 'high',
      }),
    );
    expect(result).toBe(42);
  });
});

describe('rollbackPrompt', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('requests dual approval and returns approvalRequestId', async () => {
    mockRequestApproval.mockResolvedValue({ id: 77 });
    const result = await rollbackPrompt('PositioningAgent', 'default', 10);

    expect(mockRequestApproval).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: 'rollback_prompt',
        requireDualApproval: true,
      }),
    );
    expect(result).toBe(77);
  });
});

describe('updateCanaryConfig', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('throws BAD_REQUEST for invalid canaryPct values', async () => {
    mockPrisma.promptVersion.findUniqueOrThrow.mockResolvedValue(makeVersion());
    for (const pct of [2, 5, 25, 99]) {
      await expect(updateCanaryConfig('PositioningAgent', 1, pct, 10)).rejects.toMatchObject({
        code: 'BAD_REQUEST',
      });
    }
  });

  it('triggers publishPromptVersion when canaryPct=100', async () => {
    mockPrisma.promptVersion.findUniqueOrThrow.mockResolvedValue(makeVersion());
    mockRequestApproval.mockResolvedValue({ id: 55 });
    await updateCanaryConfig('PositioningAgent', 1, 100, 10);
    expect(mockRequestApproval).toHaveBeenCalledWith(
      expect.objectContaining({ actionType: 'publish_prompt' }),
    );
  });

  it('updates existing canary config for valid pct', async () => {
    mockPrisma.promptVersion.findUniqueOrThrow.mockResolvedValue(makeVersion());
    mockPrisma.promptCanaryConfig.findUnique.mockResolvedValue({ id: 3, canaryPct: 1 });
    mockPrisma.promptCanaryConfig.update.mockResolvedValue({});

    await updateCanaryConfig('PositioningAgent', 1, 10, 10);

    expect(mockPrisma.promptCanaryConfig.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ nextVersionId: 1, canaryPct: 10 }) }),
    );
  });
});

describe('getActivePromptVersion', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns null when no canary config found', async () => {
    mockPrisma.promptCanaryConfig.findUnique.mockResolvedValue(null);
    const result = await getActivePromptVersion('PositioningAgent', 123);
    expect(result).toBeNull();
  });

  it('returns currentVersion when canaryPct=0', async () => {
    const currentVersion = makeVersion({ id: 1, status: 'active' });
    mockPrisma.promptCanaryConfig.findUnique.mockResolvedValue({
      id: 1,
      canaryPct: 0,
      currentVersion,
      nextVersion: null,
    });
    const result = await getActivePromptVersion('PositioningAgent', 123);
    expect(result).toEqual(currentVersion);
  });

  it('routes deterministically by userId hash — same input always same result', async () => {
    const currentVersion = makeVersion({ id: 1, status: 'active' });
    const nextVersion = makeVersion({ id: 2, status: 'active', content: 'new content' });
    mockPrisma.promptCanaryConfig.findUnique.mockResolvedValue({
      id: 1,
      canaryPct: 50,
      currentVersion,
      nextVersion,
    });

    // Same userId should always get the same version
    const results = await Promise.all(
      Array.from({ length: 5 }, () => getActivePromptVersion('PositioningAgent', 99999)),
    );
    const uniqueIds = new Set(results.map((r) => r?.id));
    expect(uniqueIds.size).toBe(1); // deterministic: always same version for same userId
  });
});
