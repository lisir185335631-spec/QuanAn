/**
 * G78 · cost-budget-guard — single-run LLM cost cap
 * D9.3: BudgetExceededError must be caught inside execute(), never exposed to users.
 *
 * Design:
 * - MAX_RUN_COST_USD: env-configurable cap per specialist run (default $0.50)
 * - runWithBudget(fn): starts an AsyncLocalStorage scope with { spentUsd: 0 }
 * - addCost(usd): accumulates actual cost into current scope
 * - checkBudget(estimateUsd): throws BudgetExceededError if spent + estimate > cap
 * - estimateCostUsd(model, promptTokens, completionTokens): same rates as BaseSpecialist
 */

import { AsyncLocalStorage } from 'node:async_hooks';

// Read at module load time; exported for test inspection
export const MAX_RUN_COST_USD = Number(process.env['LLM_MAX_RUN_COST_USD'] ?? 0.5);

// Same rate table as BaseSpecialist COST_PER_M_USD (kept in sync manually)
const COST_PER_M_USD: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-6': { input: 3.0, output: 15.0 },
  'claude-haiku-4-5':  { input: 0.25, output: 1.25 },
  'gpt-4o':            { input: 2.5, output: 10.0 },
  'gpt-4o-mini':       { input: 0.15, output: 0.60 },
};

export class BudgetExceededError extends Error {
  readonly spentUsd: number;
  readonly maxUsd: number;

  constructor(spentUsd: number, maxUsd: number) {
    super(`LLM budget exceeded: spent $${spentUsd.toFixed(4)} + estimate exceeds cap $${maxUsd.toFixed(4)}`);
    this.name = 'BudgetExceededError';
    this.spentUsd = spentUsd;
    this.maxUsd = maxUsd;
  }
}

interface BudgetStore {
  spentUsd: number;
}

const budgetAls = new AsyncLocalStorage<BudgetStore>();

/**
 * Enters an ALS scope with a fresh budget counter.
 * All addCost / checkBudget calls inside fn() share this scope.
 */
export function runWithBudget<T>(fn: () => Promise<T>): Promise<T> {
  return budgetAls.run({ spentUsd: 0 }, fn);
}

/**
 * Accumulates actual cost into the current scope.
 * No-op if called outside a runWithBudget scope.
 */
export function addCost(usd: number): void {
  const store = budgetAls.getStore();
  if (!store) return;
  store.spentUsd += usd;
}

/**
 * Checks whether spent + nextEstimateUsd would exceed the cap.
 * Throws BudgetExceededError if so. No-op outside a runWithBudget scope.
 */
export function checkBudget(nextEstimateUsd: number): void {
  const store = budgetAls.getStore();
  if (!store) return;
  if (store.spentUsd + nextEstimateUsd > MAX_RUN_COST_USD) {
    throw new BudgetExceededError(store.spentUsd + nextEstimateUsd, MAX_RUN_COST_USD);
  }
}

/**
 * Estimates cost in USD for a given model and token counts.
 * Falls back to conservative rates (input $1/M, output $5/M) for unknown models.
 */
export function estimateCostUsd(
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const rates = COST_PER_M_USD[model] ?? { input: 1.0, output: 5.0 };
  return (promptTokens * rates.input + completionTokens * rates.output) / 1_000_000;
}
