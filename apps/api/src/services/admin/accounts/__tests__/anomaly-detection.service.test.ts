// PRD-11 US-009 · AC-14: unit tests
// 4 anomaly types (detect correct) + dedupe · ≥ 8 tests

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock setup
// ---------------------------------------------------------------------------

const mockExecuteRawUnsafe = vi.fn();
const mockQueryRaw = vi.fn();
const mockFindFirst = vi.fn();
const mockCreate = vi.fn();

const mockTx = {
  $executeRawUnsafe: mockExecuteRawUnsafe,
  $queryRaw: mockQueryRaw,
  ipAccountAnomalyFlag: {
    findFirst: mockFindFirst,
    create: mockCreate,
  },
};

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(async (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx)),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn() },
}));

const { detectAccountAnomalies } = await import(
  '@/services/admin/accounts/anomaly-detection.service'
);

// ---------------------------------------------------------------------------
// Helpers: $queryRaw call ordering
// SQL-1: active accounts (histories, 7d)
// SQL-2: feedback accounts (feedback_logs, 7d)
// SQL-3: evolved accounts (evolution_profiles)
// SQL-4: recent insight accounts (evolution_insights, 7d)
// SQL-5: frequent account switch (histories JOIN ip_accounts, HAVING >= 3)
// SQL-6: cost spike (cost_log, 24h vs 30d)
// ---------------------------------------------------------------------------

function setupQueryRawResults(
  activeAccounts: { accountId: number }[],
  feedbackAccounts: { accountId: number }[],
  evolvedAccounts: { accountId: number }[],
  recentInsights: { accountId: number }[],
  switchCandidates: { userId: number; accountIds: number[] }[],
  costSpikes: { accountId: number; recentCost: string; avgDailyCost: string }[],
): void {
  let callIndex = 0;
  mockQueryRaw.mockImplementation(() => {
    const responses = [
      activeAccounts,   // SQL-1
      feedbackAccounts, // SQL-2
      evolvedAccounts,  // SQL-3
      recentInsights,   // SQL-4
      switchCandidates, // SQL-5
      costSpikes,       // SQL-6
    ];
    return Promise.resolve(responses[callIndex++] ?? []);
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('detectAccountAnomalies', () => {
  beforeEach(() => {
    mockExecuteRawUnsafe.mockResolvedValue(undefined);
    mockFindFirst.mockResolvedValue(null); // default: no existing flag
    mockCreate.mockResolvedValue({ id: 1 });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Test 1: inactive_no_feedback — detects account with history but no feedback
  // -------------------------------------------------------------------------
  it('detects inactive_no_feedback when account has history but no feedback in 7d', async () => {
    setupQueryRawResults(
      [{ accountId: 10 }], // active
      [],                  // no feedback
      [],                  // no evolution profiles
      [],                  // no recent insights
      [],                  // no switch candidates
      [],                  // no cost spikes
    );

    const result = await detectAccountAnomalies();

    expect(result.detected).toBe(1);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          accountId: 10,
          anomalyType: 'inactive_no_feedback',
          severity: 'low',
        }),
      }),
    );
  });

  // -------------------------------------------------------------------------
  // Test 2: inactive_no_feedback — does NOT detect if feedback exists
  // -------------------------------------------------------------------------
  it('does not flag inactive_no_feedback when account has recent feedback', async () => {
    setupQueryRawResults(
      [{ accountId: 10 }],
      [{ accountId: 10 }], // has feedback
      [],
      [],
      [],
      [],
    );

    const result = await detectAccountAnomalies();

    expect(result.detected).toBe(0);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Test 3: inactive_no_feedback — dedupe: no duplicate if unresolved flag today
  // -------------------------------------------------------------------------
  it('deduplicates inactive_no_feedback: skips if unresolved flag exists today', async () => {
    setupQueryRawResults([{ accountId: 10 }], [], [], [], [], []);

    mockFindFirst.mockResolvedValueOnce({ id: 99, resolvedAt: null }); // already flagged

    const result = await detectAccountAnomalies();

    expect(result.detected).toBe(0);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Test 4: evolution_stalled — detects when profile exists but no recent insight
  // -------------------------------------------------------------------------
  it('detects evolution_stalled when account has profile but no recent insight', async () => {
    setupQueryRawResults(
      [],                  // no active accounts
      [],
      [{ accountId: 20 }], // has evolution profile
      [],                  // no recent insights
      [],
      [],
    );

    const result = await detectAccountAnomalies();

    expect(result.detected).toBe(1);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          accountId: 20,
          anomalyType: 'evolution_stalled',
          severity: 'medium',
        }),
      }),
    );
  });

  // -------------------------------------------------------------------------
  // Test 5: evolution_stalled — does NOT detect if has recent insight
  // -------------------------------------------------------------------------
  it('does not flag evolution_stalled when recent insight exists in 7d', async () => {
    setupQueryRawResults(
      [],
      [],
      [{ accountId: 20 }],
      [{ accountId: 20 }], // has recent insight
      [],
      [],
    );

    const result = await detectAccountAnomalies();

    expect(result.detected).toBe(0);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Test 6: frequent_account_switch — detects user with 3+ active accounts
  // -------------------------------------------------------------------------
  it('detects frequent_account_switch for each account of a multi-switcher user', async () => {
    setupQueryRawResults(
      [],
      [],
      [],
      [],
      [{ userId: 1, accountIds: [30, 31, 32] }], // 3 accounts
      [],
    );

    const result = await detectAccountAnomalies();

    expect(result.detected).toBe(3);
    const createCalls = mockCreate.mock.calls.filter(
      (c) => c[0]?.data?.anomalyType === 'frequent_account_switch',
    );
    expect(createCalls).toHaveLength(3);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(createCalls[0]![0].data.evidence).toMatchObject({
      userId: 1,
      activeAccountCount: 3,
    });
  });

  // -------------------------------------------------------------------------
  // Test 7: cost_spike — detects account with >3x avg daily cost
  // -------------------------------------------------------------------------
  it('detects cost_spike when last-24h cost exceeds 3x avg daily', async () => {
    setupQueryRawResults(
      [],
      [],
      [],
      [],
      [],
      [{ accountId: 40, recentCost: '1.5', avgDailyCost: '0.3' }], // 5x spike
    );

    const result = await detectAccountAnomalies();

    expect(result.detected).toBe(1);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          accountId: 40,
          anomalyType: 'cost_spike',
          severity: 'high',
        }),
      }),
    );
  });

  // -------------------------------------------------------------------------
  // Test 8: cost_spike dedupe — skips if unresolved flag already exists today
  // -------------------------------------------------------------------------
  it('deduplicates cost_spike: skips if unresolved flag already exists today', async () => {
    setupQueryRawResults([], [], [], [], [], [
      { accountId: 40, recentCost: '1.5', avgDailyCost: '0.3' },
    ]);

    mockFindFirst.mockResolvedValue({ id: 88, resolvedAt: null }); // cost_spike already flagged

    const result = await detectAccountAnomalies();

    expect(result.detected).toBe(0);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Test 9: SET LOCAL — always called first in transaction
  // -------------------------------------------------------------------------
  it('calls SET LOCAL app.role admin at start of transaction', async () => {
    setupQueryRawResults([], [], [], [], [], []);

    await detectAccountAnomalies();

    expect(mockExecuteRawUnsafe).toHaveBeenCalledWith("SET LOCAL app.role = 'admin'");
  });

  // -------------------------------------------------------------------------
  // Test 10: resolved flag — allows re-detection after resolve (resolvedAt != null)
  // -------------------------------------------------------------------------
  it('re-detects anomaly after prior flag was resolved', async () => {
    setupQueryRawResults([{ accountId: 10 }], [], [], [], [], []);

    // findFirst returns null (no unresolved flag today) → should create
    mockFindFirst.mockResolvedValue(null);

    const result = await detectAccountAnomalies();

    expect(result.detected).toBe(1);
    expect(mockCreate).toHaveBeenCalledOnce();
  });
});
