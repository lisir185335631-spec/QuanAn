import { describe, it, expect } from 'vitest';

import {
  BudgetExceededError,
  runWithBudget,
  checkBudget,
  addCost,
  estimateCostUsd,
} from '../cost-budget-guard';

describe('cost-budget-guard unit', () => {
  it('estimateCostUsd calculates correctly for known models', () => {
    // claude-sonnet-4-6: input=3.0/M, output=15.0/M
    const cost = estimateCostUsd('claude-sonnet-4-6', 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(18.0, 4); // 3.0 + 15.0
  });

  it('estimateCostUsd uses fallback rates for unknown model', () => {
    // unknown model: input $1/M, output $5/M
    const cost = estimateCostUsd('unknown-model-xyz', 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(6.0, 4); // 1.0 + 5.0
  });

  it('estimateCostUsd calculates correctly for claude-haiku-4-5', () => {
    // haiku: input=0.25/M, output=1.25/M
    const cost = estimateCostUsd('claude-haiku-4-5', 2_000_000, 1_000_000);
    expect(cost).toBeCloseTo(0.5 + 1.25, 4);
  });

  it('checkBudget throws BudgetExceededError when over limit', async () => {
    await runWithBudget(async () => {
      addCost(0.45); // near limit
      // 0.45 + 0.1 = 0.55 > 0.5 (MAX_RUN_COST_USD default)
      expect(() => checkBudget(0.1)).toThrow(BudgetExceededError);
    });
  });

  it('checkBudget does not throw when under limit', async () => {
    await runWithBudget(async () => {
      addCost(0.1);
      // 0.1 + 0.1 = 0.2 < 0.5
      expect(() => checkBudget(0.1)).not.toThrow();
    });
  });

  it('checkBudget does not throw when exactly at limit', async () => {
    await runWithBudget(async () => {
      addCost(0.4);
      // 0.4 + 0.1 = 0.5 which is NOT > 0.5
      expect(() => checkBudget(0.1)).not.toThrow();
    });
  });

  it('BudgetExceededError has correct name', () => {
    const err = new BudgetExceededError(0.6, 0.5);
    expect(err.name).toBe('BudgetExceededError');
    expect(err).toBeInstanceOf(Error);
  });

  it('BudgetExceededError message mentions exceeded amount and cap', () => {
    const err = new BudgetExceededError(0.6, 0.5);
    expect(err.message).toContain('0.6');
    expect(err.message).toContain('0.5');
  });

  it('BudgetExceededError stores spentUsd and maxUsd', () => {
    const err = new BudgetExceededError(0.75, 0.5);
    expect(err.spentUsd).toBeCloseTo(0.75);
    expect(err.maxUsd).toBeCloseTo(0.5);
  });

  it('runWithBudget scopes are isolated', async () => {
    // Two concurrent runs should not share budget
    await Promise.all([
      runWithBudget(async () => {
        addCost(0.3);
        expect(() => checkBudget(0.1)).not.toThrow();
      }),
      runWithBudget(async () => {
        addCost(0.3);
        expect(() => checkBudget(0.1)).not.toThrow();
      }),
    ]);
  });

  it('addCost outside runWithBudget is no-op (no crash)', () => {
    // no ALS context — should not throw
    expect(() => addCost(100)).not.toThrow();
  });

  it('checkBudget outside runWithBudget is no-op (no crash)', () => {
    // no ALS context — even with large estimate, should not throw
    expect(() => checkBudget(100)).not.toThrow();
  });

  it('runWithBudget returns the fn return value', async () => {
    const result = await runWithBudget(async () => {
      addCost(0.1);
      return 42;
    });
    expect(result).toBe(42);
  });

  it('BudgetExceededError is instance of Error', () => {
    const err = new BudgetExceededError(1.0, 0.5);
    expect(err instanceof Error).toBe(true);
  });
});
