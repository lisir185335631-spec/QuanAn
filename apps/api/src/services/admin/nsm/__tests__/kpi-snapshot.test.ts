// PRD-11 US-001 · AC-11: unit tests for computeSnapshot
// 4 tests: full snapshot / upsert duplicate / empty feedback / adminRLS bypass effective

import { Decimal } from '@prisma/client/runtime/library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock setup
// ---------------------------------------------------------------------------

const mockExecuteRawUnsafe = vi.fn();
const mockQueryRaw = vi.fn();
const mockUpsert = vi.fn();

const mockTx = {
  $executeRawUnsafe: mockExecuteRawUnsafe,
  $queryRaw: mockQueryRaw,
};

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(async (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx)),
    kpiSnapshot: {
      upsert: mockUpsert,
    },
  },
}));

const {
  computeSnapshot,
  ValidationError,
  AdminRLSBypassError,
  SnapshotComputationTimeout,
} = await import('@/services/admin/nsm/kpi-snapshot.service');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PAST_DATE = new Date('2026-01-01T00:00:00Z');

// Default mock responses for the 7 SQL calls (persona, industry, platform are in SQL-6)
function setupDefaultMocks(): void {
  mockUpsert.mockResolvedValue({ id: 1 });

  // SQL-1: activeAccounts7d
  // SQL-2: step9CompleteRate
  // SQL-3: feedbackRate
  // SQL-4: evolutionUpgradeRate
  // SQL-5: d30Retention
  // SQL-6a: persona distribution
  // SQL-6b: industry distribution
  // SQL-6c: platform distribution
  // SQL-7: funnelData
  // Total $queryRaw calls per computeSnapshot = 9 (7 main, SQL-6 has 3 sub-queries)
  let callIndex = 0;
  mockQueryRaw.mockImplementation(() => {
    const responses: unknown[][] = [
      [{ cnt: 10n }],                                  // SQL-1: activeAccounts7d
      [{ total: 100n, completed: 80n }],               // SQL-2: step9CompleteRate → 0.8
      [{ total: 100n, with_feedback: 70n }],           // SQL-3: feedbackRate → 0.7
      [{ total: 100n, upgraded: 20n }],                // SQL-4: evolutionUpgradeRate → 0.2
      [{ total: 50n, retained: 40n }],                 // SQL-5: d30Retention → 0.8
      [{ bucket: 'traditional', cnt: 60n }],           // SQL-6a: persona
      [{ industry: 'tech', cnt: 30n }, { industry: 'media', cnt: 20n }],  // SQL-6b: industry
      [{ platform: 'douyin', cnt: 50n }],              // SQL-6c: platform
      [{ total: 100n, step1: 90n, step3: 70n, step3b: 60n, step7: 40n, feedback: 30n }], // SQL-7: funnel
    ];
    return Promise.resolve(responses[callIndex++] ?? [{}]);
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('computeSnapshot', () => {
  beforeEach(() => {
    mockExecuteRawUnsafe.mockReset();
    mockQueryRaw.mockReset();
    mockUpsert.mockReset();
    mockExecuteRawUnsafe.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Test 1: full snapshot — all fields populated correctly
  // -------------------------------------------------------------------------
  it('returns full snapshot with all 13 fields populated', async () => {
    setupDefaultMocks();

    const result = await computeSnapshot(PAST_DATE, 'day');

    expect(result.snapshotDate).toEqual(PAST_DATE);
    expect(result.granularity).toBe('day');
    expect(result.activeAccounts7d).toBe(10);
    expect(result.step9CompleteRate).toBeInstanceOf(Decimal);
    expect(Number(result.step9CompleteRate)).toBe(0.8);
    expect(Number(result.feedbackRate)).toBe(0.7);
    expect(Number(result.evolutionUpgradeRate)).toBe(0.2);
    expect(Number(result.d30Retention)).toBe(0.8);

    // distribution
    expect(result.userPersonaDistribution).toMatchObject({ traditional: 60, ipBuilder: 0, opc: 0, mcn: 0 });
    expect(result.industryDistribution).toMatchObject({ tech: 30, media: 20 });
    expect(result.platformDistribution).toMatchObject({ douyin: 50 });

    // funnel: 6 integers (AC-9)
    expect(result.funnelData).toHaveLength(6);
    expect(result.funnelData).toEqual([100, 90, 70, 60, 40, 30]);

    // upsert called once
    expect(mockUpsert).toHaveBeenCalledOnce();
  });

  // -------------------------------------------------------------------------
  // Test 2: upsert duplicate — second call with same date+granularity → UPDATE not error
  // -------------------------------------------------------------------------
  it('upserts without duplicate error when called twice with same date and granularity', async () => {
    setupDefaultMocks();
    await computeSnapshot(PAST_DATE, 'day');

    // Reset mocks and call again — should succeed (UPDATE path)
    mockQueryRaw.mockReset();
    mockUpsert.mockReset();
    setupDefaultMocks();

    await expect(computeSnapshot(PAST_DATE, 'day')).resolves.not.toThrow();
    expect(mockUpsert).toHaveBeenCalledOnce();
    const upsertArgs = mockUpsert.mock.calls[0]?.[0];
    expect(upsertArgs?.where?.snapshotDate_granularity).toEqual({
      snapshotDate: PAST_DATE,
      granularity: 'day',
    });
    // Both create and update paths should be present in the upsert call
    expect(upsertArgs?.update).toBeDefined();
    expect(upsertArgs?.create).toBeDefined();
  });

  // -------------------------------------------------------------------------
  // Test 3: empty feedback_log → feedbackRate = 0.0000, no division by zero (AC-7)
  // -------------------------------------------------------------------------
  it('returns feedbackRate = 0.0000 when feedback_log is empty', async () => {
    let callIndex = 0;
    mockQueryRaw.mockImplementation(() => {
      const responses: unknown[][] = [
        [{ cnt: 5n }],                                          // SQL-1
        [{ total: 50n, completed: 30n }],                       // SQL-2
        [{ total: 50n, with_feedback: 0n }],                    // SQL-3: empty feedback
        [{ total: 50n, upgraded: 5n }],                         // SQL-4
        [{ total: 20n, retained: 15n }],                        // SQL-5
        [{ bucket: 'traditional', cnt: 50n }],                  // SQL-6a
        [],                                                     // SQL-6b: empty industry
        [{ platform: 'weibo', cnt: 10n }],                      // SQL-6c
        [{ total: 50n, step1: 40n, step3: 30n, step3b: 20n, step7: 10n, feedback: 0n }], // SQL-7
      ];
      return Promise.resolve(responses[callIndex++] ?? [{}]);
    });
    mockUpsert.mockResolvedValue({ id: 2 });

    const result = await computeSnapshot(PAST_DATE, 'week');

    // feedbackRate must be exactly 0.0000, not a division error
    expect(Number(result.feedbackRate)).toBe(0);
    expect(result.feedbackRate).toBeInstanceOf(Decimal);
  });

  // -------------------------------------------------------------------------
  // Test 4: adminRLS bypass effective — SET LOCAL used, AdminRLSBypassError on failure
  // -------------------------------------------------------------------------
  it('calls SET LOCAL app.role = admin and throws AdminRLSBypassError if bypass fails', async () => {
    // Verify correct SET LOCAL call on success path
    setupDefaultMocks();
    await computeSnapshot(PAST_DATE, 'month');

    expect(mockExecuteRawUnsafe).toHaveBeenCalledWith("SET LOCAL app.role = 'admin'");

    // Now simulate adminRLS bypass failure
    mockExecuteRawUnsafe.mockRejectedValueOnce(new Error('permission denied'));

    await expect(computeSnapshot(PAST_DATE, 'day')).rejects.toThrow(AdminRLSBypassError);
  });

  // -------------------------------------------------------------------------
  // AC-7 edge cases (not in the 4 required but important for correctness)
  // -------------------------------------------------------------------------
  it('throws ValidationError for future date', async () => {
    const future = new Date(Date.now() + 1_000_000);
    await expect(computeSnapshot(future, 'day')).rejects.toThrow(ValidationError);
  });

  it('throws ValidationError for invalid granularity', async () => {
    await expect(computeSnapshot(PAST_DATE, 'hour')).rejects.toThrow(ValidationError);
  });
});

export { ValidationError, AdminRLSBypassError, SnapshotComputationTimeout };
