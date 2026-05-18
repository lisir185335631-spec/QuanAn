// PRD-14 US-006 · constant-version.service.ts unit tests
// AC-4/5/6/7/8: _publishConstantVersionInTx / publishConstantVersion / rollbackConstant / updateConstantCanaryConfig / getActiveConstantVersion

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ──────────────────────────────────────────────────────────

const mockRequestApproval = vi.hoisted(() => vi.fn());

vi.mock('@/services/admin/approval/approvalGateService', () => ({
  requestApproval: mockRequestApproval,
}));

const mockPrisma = vi.hoisted(() => ({
  constantVersion: {
    findUniqueOrThrow: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    create: vi.fn(),
  },
  constantCanaryConfig: {
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
    constantType: 'case',
    constantKey: 'positioning-case-001',
    version: 2,
    content: '案例内容示例',
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
  _publishConstantVersionInTx,
  publishConstantVersion,
  rollbackConstant,
  updateConstantCanaryConfig,
  getActiveConstantVersion,
} from '../constant-version.service';

// ── Tests ──────────────────────────────────────────────────────────────────

describe('_publishConstantVersionInTx', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('throws BAD_REQUEST when status is not pending_review', async () => {
    const version = makeVersion({ status: 'draft' });
    const txMock = {
      constantVersion: { findUniqueOrThrow: vi.fn().mockResolvedValue(version) },
      constantCanaryConfig: {},
    };
    await expect(
      _publishConstantVersionInTx(txMock as any, { versionId: 1, adminId: 10, approvalRequestId: 99 }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('throws BAD_REQUEST when judgeScore < 4.0', async () => {
    const version = makeVersion({ judgeScore: '3.9' });
    const txMock = {
      constantVersion: { findUniqueOrThrow: vi.fn().mockResolvedValue(version) },
      constantCanaryConfig: {},
    };
    await expect(
      _publishConstantVersionInTx(txMock as any, { versionId: 1, adminId: 10, approvalRequestId: 99 }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('archives existing active versions and sets new one active', async () => {
    const version = makeVersion();
    const txMock = {
      constantVersion: {
        findUniqueOrThrow: vi.fn().mockResolvedValue(version),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        update: vi.fn().mockResolvedValue({ ...version, status: 'active' }),
      },
      constantCanaryConfig: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({}),
      },
    };

    await _publishConstantVersionInTx(txMock as any, { versionId: 1, adminId: 10, approvalRequestId: 99 });

    expect(txMock.constantVersion.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: 'active', id: { not: 1 } }) }),
    );
    expect(txMock.constantVersion.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'active' }) }),
    );
  });

  it('upserts canary config when existing config present', async () => {
    const version = makeVersion();
    const existingCanary = { id: 5, constantType: 'case', constantKey: 'positioning-case-001', canaryPct: 10 };
    const txMock = {
      constantVersion: {
        findUniqueOrThrow: vi.fn().mockResolvedValue(version),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        update: vi.fn().mockResolvedValue({ ...version, status: 'active' }),
      },
      constantCanaryConfig: {
        findUnique: vi.fn().mockResolvedValue(existingCanary),
        update: vi.fn().mockResolvedValue({}),
      },
    };

    await _publishConstantVersionInTx(txMock as any, { versionId: 1, adminId: 10, approvalRequestId: 99 });

    expect(txMock.constantCanaryConfig.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ currentVersionId: 1, canaryPct: 0 }) }),
    );
  });
});

describe('publishConstantVersion', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('throws BAD_REQUEST when status is not pending_review', async () => {
    mockPrisma.constantVersion.findUniqueOrThrow.mockResolvedValue(
      makeVersion({ status: 'draft' }),
    );
    await expect(publishConstantVersion(1, 10)).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('throws BAD_REQUEST when judgeScore < 4.0', async () => {
    mockPrisma.constantVersion.findUniqueOrThrow.mockResolvedValue(
      makeVersion({ status: 'pending_review', judgeScore: '3.9' }),
    );
    await expect(publishConstantVersion(1, 10)).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('throws BAD_REQUEST when judgeScore is null', async () => {
    mockPrisma.constantVersion.findUniqueOrThrow.mockResolvedValue(
      makeVersion({ status: 'pending_review', judgeScore: null }),
    );
    await expect(publishConstantVersion(1, 10)).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('calls requestApproval with publish_constant_version and dual approval when valid', async () => {
    mockPrisma.constantVersion.findUniqueOrThrow.mockResolvedValue(makeVersion());
    mockRequestApproval.mockResolvedValue({ id: 42 });

    const result = await publishConstantVersion(1, 10);

    expect(mockRequestApproval).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: 'publish_constant_version',
        requireDualApproval: true,
        riskLevel: 'high',
      }),
    );
    expect(result).toBe(42);
  });
});

describe('rollbackConstant', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('requests dual approval with rollback_constant actionType', async () => {
    mockRequestApproval.mockResolvedValue({ id: 77 });
    const result = await rollbackConstant('case', 'positioning-case-001', 10);

    expect(mockRequestApproval).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: 'rollback_constant',
        requireDualApproval: true,
      }),
    );
    expect(result).toBe(77);
  });
});

describe('updateConstantCanaryConfig', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('throws BAD_REQUEST for invalid canaryPct values', async () => {
    for (const pct of [2, 5, 25, 99]) {
      await expect(
        updateConstantCanaryConfig('case', 'positioning-case-001', 1, pct, 10),
      ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    }
  });

  it('triggers publishConstantVersion when canaryPct=100', async () => {
    mockPrisma.constantVersion.findUniqueOrThrow.mockResolvedValue(makeVersion());
    mockRequestApproval.mockResolvedValue({ id: 55 });
    await updateConstantCanaryConfig('case', 'positioning-case-001', 1, 100, 10);
    expect(mockRequestApproval).toHaveBeenCalledWith(
      expect.objectContaining({ actionType: 'publish_constant_version' }),
    );
  });

  it('updates existing canary config for valid pct', async () => {
    mockPrisma.constantCanaryConfig.findUnique.mockResolvedValue({ id: 3, canaryPct: 1 });
    mockPrisma.constantCanaryConfig.update.mockResolvedValue({});

    await updateConstantCanaryConfig('case', 'positioning-case-001', 1, 10, 10);

    expect(mockPrisma.constantCanaryConfig.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ nextVersionId: 1, canaryPct: 10 }) }),
    );
  });
});

describe('getActiveConstantVersion', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns null when no canary config found', async () => {
    mockPrisma.constantCanaryConfig.findUnique.mockResolvedValue(null);
    const result = await getActiveConstantVersion('case', 'positioning-case-001', 123);
    expect(result).toBeNull();
  });

  it('returns currentVersion when canaryPct=0', async () => {
    const currentVersion = makeVersion({ id: 1, status: 'active' });
    mockPrisma.constantCanaryConfig.findUnique.mockResolvedValue({
      id: 1,
      canaryPct: 0,
      currentVersion,
      nextVersion: null,
    });
    const result = await getActiveConstantVersion('case', 'positioning-case-001', 123);
    expect(result).toEqual(currentVersion);
  });

  it('routes deterministically by userId+constantType+constantKey hash', async () => {
    const currentVersion = makeVersion({ id: 1, status: 'active' });
    const nextVersion = makeVersion({ id: 2, status: 'active', content: 'new content' });
    mockPrisma.constantCanaryConfig.findUnique.mockResolvedValue({
      id: 1,
      canaryPct: 50,
      currentVersion,
      nextVersion,
    });

    // Same inputs should always get the same version (deterministic)
    const results = await Promise.all(
      Array.from({ length: 5 }, () => getActiveConstantVersion('case', 'positioning-case-001', 99999)),
    );
    const uniqueIds = new Set(results.map((r) => r?.id));
    expect(uniqueIds.size).toBe(1);
  });
});
