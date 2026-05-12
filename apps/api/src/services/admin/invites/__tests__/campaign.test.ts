// PRD-11 US-019 · AC-10: ≥ 8 tests — CRUD + funnel + ValidationErrors
// AC-11: pnpm test + pnpm typecheck 0 error

import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — must be hoisted above vi.mock() factory
// ---------------------------------------------------------------------------

const mockExecuteRawUnsafe = vi.fn();
const mockQueryRaw = vi.fn();
const mockFindUnique = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockFindMany = vi.fn();

const mockTx = {
  $executeRawUnsafe: mockExecuteRawUnsafe,
};

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(async (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx)),
    $queryRaw: mockQueryRaw,
    inviteCampaign: {
      create: mockCreate,
      findUnique: mockFindUnique,
      findMany: mockFindMany,
      update: mockUpdate,
      delete: mockDelete,
    },
  },
}));

// top-level await — requires "environment=node" and Vitest ESM mode
const {
  createCampaign,
  getCampaign,
  listCampaigns,
  updateCampaign,
  deleteCampaign,
  getCampaignFunnel,
  ValidationError,
  CampaignKeyConflictError,
  CampaignNotFoundError,
} = await import('@/services/admin/invites/campaign.service');

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const NOW = new Date('2026-01-01T00:00:00Z');
const LATER = new Date('2026-06-01T00:00:00Z');

const CAMPAIGN = {
  id: 1,
  campaignKey: 'launch_2026q2',
  name: 'Launch Q2',
  description: null,
  createdByAdminId: 42,
  totalQuota: 100,
  usedCount: 0,
  startsAt: NOW,
  endsAt: LATER,
  status: 'draft',
  createdAt: NOW,
  updatedAt: NOW,
};

// ---------------------------------------------------------------------------
// Per-test reset — clearAllMocks preserves mock implementations; resetAll kills them
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockExecuteRawUnsafe.mockResolvedValue(undefined);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createCampaign', () => {
  it('creates campaign with valid inputs and uses SET LOCAL (AC-4 SHIELD)', async () => {
    mockCreate.mockResolvedValue(CAMPAIGN);

    const result = await createCampaign({
      campaignKey: 'launch_2026q2',
      name: 'Launch Q2',
      createdByAdminId: 42,
      totalQuota: 100,
      startsAt: NOW,
      endsAt: LATER,
    });

    expect(result).toEqual(CAMPAIGN);
    expect(mockCreate).toHaveBeenCalledOnce();
    expect(mockExecuteRawUnsafe).toHaveBeenCalledWith("SET LOCAL app.role = 'admin'");
  });

  it('throws ValidationError when totalQuota = 0 (AC-7)', async () => {
    await expect(
      createCampaign({
        campaignKey: 'bad',
        name: 'Bad',
        createdByAdminId: 1,
        totalQuota: 0,
        startsAt: NOW,
        endsAt: LATER,
      }),
    ).rejects.toThrow(ValidationError);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('throws ValidationError when totalQuota < 0 (AC-7)', async () => {
    await expect(
      createCampaign({
        campaignKey: 'bad',
        name: 'Bad',
        createdByAdminId: 1,
        totalQuota: -5,
        startsAt: NOW,
        endsAt: LATER,
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('throws ValidationError with correct message when endsAt <= startsAt (AC-8)', async () => {
    await expect(
      createCampaign({
        campaignKey: 'bad',
        name: 'Bad',
        createdByAdminId: 1,
        totalQuota: 10,
        startsAt: LATER,
        endsAt: NOW,
      }),
    ).rejects.toThrow('endsAt must be > startsAt');
  });

  it('throws CampaignKeyConflictError on P2002 unique violation (AC-6)', async () => {
    const uniqueErr = Object.assign(new Error('Unique constraint'), { code: 'P2002' });
    mockCreate.mockRejectedValue(uniqueErr);

    await expect(
      createCampaign({
        campaignKey: 'launch_2026q2',
        name: 'Duplicate',
        createdByAdminId: 1,
        totalQuota: 10,
        startsAt: NOW,
        endsAt: LATER,
      }),
    ).rejects.toThrow(CampaignKeyConflictError);
  });
});

describe('getCampaign', () => {
  it('returns campaign when found', async () => {
    mockFindUnique.mockResolvedValue(CAMPAIGN);
    const result = await getCampaign('launch_2026q2');
    expect(result).toEqual(CAMPAIGN);
  });

  it('throws CampaignNotFoundError when not found', async () => {
    mockFindUnique.mockResolvedValue(null);
    await expect(getCampaign('ghost')).rejects.toThrow(CampaignNotFoundError);
  });
});

describe('updateCampaign', () => {
  it('updates name successfully', async () => {
    mockFindUnique.mockResolvedValue(CAMPAIGN);
    mockUpdate.mockResolvedValue({ ...CAMPAIGN, name: 'Updated' });

    const result = await updateCampaign('launch_2026q2', { name: 'Updated' });
    expect(result.name).toBe('Updated');
    expect(mockUpdate).toHaveBeenCalledOnce();
  });

  it('throws ValidationError for forbidden status transition ended→active (AC-9)', async () => {
    mockFindUnique.mockResolvedValue({ ...CAMPAIGN, status: 'ended' });

    await expect(
      updateCampaign('launch_2026q2', { status: 'active' }),
    ).rejects.toThrow(ValidationError);

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('allows draft→active status transition (AC-9)', async () => {
    mockFindUnique.mockResolvedValue({ ...CAMPAIGN, status: 'draft' });
    mockUpdate.mockResolvedValue({ ...CAMPAIGN, status: 'active' });

    const result = await updateCampaign('launch_2026q2', { status: 'active' });
    expect(result.status).toBe('active');
  });

  it('throws ValidationError when totalQuota = 0 on update (AC-7)', async () => {
    await expect(
      updateCampaign('launch_2026q2', { totalQuota: 0 }),
    ).rejects.toThrow(ValidationError);
    expect(mockFindUnique).not.toHaveBeenCalled();
  });
});

describe('deleteCampaign', () => {
  it('deletes campaign when found', async () => {
    mockFindUnique.mockResolvedValue(CAMPAIGN);
    mockDelete.mockResolvedValue(CAMPAIGN);

    const result = await deleteCampaign('launch_2026q2');
    expect(result).toEqual(CAMPAIGN);
    expect(mockDelete).toHaveBeenCalledOnce();
  });

  it('throws CampaignNotFoundError when deleting non-existent', async () => {
    mockFindUnique.mockResolvedValue(null);
    await expect(deleteCampaign('ghost')).rejects.toThrow(CampaignNotFoundError);
    expect(mockDelete).not.toHaveBeenCalled();
  });
});

describe('getCampaignFunnel', () => {
  it('returns 4-stage funnel counts (AC-5)', async () => {
    mockFindUnique.mockResolvedValue(CAMPAIGN);
    mockQueryRaw.mockResolvedValue([
      { registered: 50n, activated: 30n, step9_completed: 15n, d30_retained: 10n },
    ]);

    const result = await getCampaignFunnel('launch_2026q2');

    expect(result.campaignKey).toBe('launch_2026q2');
    expect(result.stages.registered).toBe(50);
    expect(result.stages.activated).toBe(30);
    expect(result.stages.step9Completed).toBe(15);
    expect(result.stages.d30Retained).toBe(10);
  });

  it('returns zero counts when campaign has no invite code usage', async () => {
    mockFindUnique.mockResolvedValue(CAMPAIGN);
    mockQueryRaw.mockResolvedValue([
      { registered: 0n, activated: 0n, step9_completed: 0n, d30_retained: 0n },
    ]);

    const result = await getCampaignFunnel('launch_2026q2');
    expect(result.stages.registered).toBe(0);
    expect(result.stages.d30Retained).toBe(0);
  });

  it('throws CampaignNotFoundError for unknown campaignKey', async () => {
    mockFindUnique.mockResolvedValue(null);
    await expect(getCampaignFunnel('ghost')).rejects.toThrow(CampaignNotFoundError);
    expect(mockQueryRaw).not.toHaveBeenCalled();
  });
});

describe('listCampaigns', () => {
  it('returns all campaigns without filters', async () => {
    mockFindMany.mockResolvedValue([CAMPAIGN]);
    const result = await listCampaigns();
    expect(result).toHaveLength(1);
    expect(mockFindMany).toHaveBeenCalledOnce();
  });

  it('filters by status', async () => {
    mockFindMany.mockResolvedValue([]);
    await listCampaigns({ status: 'active' });
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: 'active' }) }),
    );
  });
});
