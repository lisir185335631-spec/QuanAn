/**
 * G78 · BudgetExceededError → fallback integration test
 * D9.3: BudgetExceededError must be caught inside execute(), never exposed to users.
 *
 * Strategy: mock cost-budget-guard entirely so we control exactly when checkBudget throws.
 * MockBudgetExceededError is defined inside vi.hoisted() so it is available when the
 * vi.mock factory runs (both are hoisted to top of file by vitest).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const {
  mockComplete,
  mockStepDataFindMany,
  mockCostLogCreate,
  mockGetLatestInsight,
  mockCheckBudget,
  mockAddCost,
  mockEstimateCostUsd,
  MockBudgetExceededError,
} = vi.hoisted(() => {
  // Define the error class here so it can be referenced from vi.mock factory
  class MockBudgetExceededErrorCls extends Error {
    readonly spentUsd: number;
    readonly maxUsd: number;
    constructor(spentUsd = 0.6, maxUsd = 0.5) {
      super(`LLM budget exceeded: mock spent ${spentUsd}`);
      this.name = 'BudgetExceededError';
      this.spentUsd = spentUsd;
      this.maxUsd = maxUsd;
    }
  }

  return {
    mockComplete: vi.fn(),
    mockStepDataFindMany: vi.fn().mockResolvedValue([]),
    mockCostLogCreate: vi.fn().mockResolvedValue({ id: 1 }),
    mockGetLatestInsight: vi.fn().mockResolvedValue(null),
    mockCheckBudget: vi.fn(), // default: no-op
    mockAddCost: vi.fn(),
    mockEstimateCostUsd: vi.fn().mockReturnValue(0.001),
    MockBudgetExceededError: MockBudgetExceededErrorCls,
  };
});

vi.mock('@/lib/security/cost-budget-guard', () => ({
  runWithBudget: async (fn: () => Promise<unknown>) => fn(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  checkBudget: (...args: any[]) => (mockCheckBudget as any)(...args),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addCost: (...args: any[]) => (mockAddCost as any)(...args),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  estimateCostUsd: (...args: any[]) => (mockEstimateCostUsd as any)(...args),
  BudgetExceededError: MockBudgetExceededError,
  MAX_RUN_COST_USD: 0.5,
}));

// G77 output-guardrail: pass-through for these tests (avoids PII scan interference)
vi.mock('@/lib/security/output-guardrail', () => ({
  checkOutput: (text: unknown) => ({ sanitized: text, violations: [] }),
  scanObjectOutput: (obj: unknown) => ({ sanitized: obj, violations: [] }),
}));

vi.mock('@/workers/llm-gateway', () => ({
  llmGateway: { complete: mockComplete },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    stepData: { findMany: mockStepDataFindMany },
    userQuota: { findUnique: vi.fn().mockResolvedValue(null) },
    costLog: { create: mockCostLogCreate },
  },
}));

vi.mock('@/memory/l4-profile', () => ({
  getLatestInsight: mockGetLatestInsight,
}));

vi.mock('@/workers/rag', () => ({
  ragRetrieveWorker: { retrieve: vi.fn().mockResolvedValue([]) },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── Imports (after mocks) ─────────────────────────────────────────────────────

import { BrandingAgent } from '../BrandingAgent';

// ── Tests ─────────────────────────────────────────────────────────────────────

const TEST_ACCOUNT_ID = 9001;

describe('G78: BudgetExceededError → fallback (D9.3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStepDataFindMany.mockResolvedValue([]);
    mockCostLogCreate.mockResolvedValue({ id: 1 });
    mockGetLatestInsight.mockResolvedValue(null);
    mockEstimateCostUsd.mockReturnValue(0.001);
    mockAddCost.mockReturnValue(undefined);
    // Default: checkBudget is a no-op
    mockCheckBudget.mockReturnValue(undefined);
  });

  it('BudgetExceededError causes isFallback=true instead of throwing (persona mode)', async () => {
    // Make checkBudget throw on first call (before first invokeLLM)
    mockCheckBudget.mockImplementationOnce(() => {
      throw new MockBudgetExceededError(0.6, 0.5);
    });

    const agent = new BrandingAgent();
    const result = await agent.execute({
      accountId: TEST_ACCOUNT_ID,
      userId: 1,
      mode: 'persona',
      userInput: {},
    });

    // D9.3: BudgetExceededError must NOT bubble to caller
    expect(result.isFallback).toBe(true);
    expect(result.modelUsed).toBe('fallback');
  });

  it('fallback cost_log is written with success=false when budget exceeded', async () => {
    mockCheckBudget.mockImplementationOnce(() => {
      throw new MockBudgetExceededError(0.6, 0.5);
    });

    const capturedArgs: Array<{ data: Record<string, unknown> }> = [];
    mockCostLogCreate.mockImplementation(async (arg: { data: Record<string, unknown> }) => {
      capturedArgs.push(arg);
      return { id: 42 };
    });

    const agent = new BrandingAgent();
    const result = await agent.execute({
      accountId: TEST_ACCOUNT_ID,
      userId: 1,
      mode: 'persona',
      userInput: {},
    });

    expect(result.isFallback).toBe(true);

    // G12 / G78: fallback cost_log must record success=false
    expect(capturedArgs).toHaveLength(1);
    const written = capturedArgs[0]!.data;
    expect(written['success']).toBe(false);
    expect(written['isFallback']).toBe(true);
    expect(written['modelUsed']).toBe('fallback');
  });
});
