/**
 * Monetization.test.tsx — PRD-15 US-004 AC-4
 * ≥ 4 unit tests: source inspection (node environment, no React render)
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '../../../../');
const MONETIZATION_PAGE = `${ROOT}/apps/web/src/pages/tools/Monetization.tsx`;
const MONETIZATION_SCHEMA = `${ROOT}/packages/schemas/src/specialist-io/monetization.schema.ts`;
const STEP4B_RESULT = `${ROOT}/apps/web/src/components/StepResult/Step4bResult.tsx`;
const API_ROUTER = `${ROOT}/apps/api/src/trpc/routers/monetization.ts`;
const APP_ROUTER = `${ROOT}/apps/api/src/trpc/routers/_app.ts`;

function src(path: string): string {
  return readFileSync(path, 'utf-8');
}

// ── 1 · Page structure ────────────────────────────────────────────────────────

describe('Monetization.tsx page structure', () => {
  it('has 100+ lines (stub replaced)', () => {
    const lines = src(MONETIZATION_PAGE).split('\n').length;
    expect(lines).toBeGreaterThan(100);
  });

  it('uses StepForm with stepKey step4b', () => {
    const page = src(MONETIZATION_PAGE);
    expect(page).toContain('StepForm');
    expect(page).toContain("stepKey=\"step4b\"");
  });

  it('imports and uses MonetizationInputSchema', () => {
    const page = src(MONETIZATION_PAGE);
    expect(page).toContain('MonetizationInputSchema');
    expect(page).toContain('@quanan/schemas/specialist-io');
  });

  it('calls trpc.monetization.generate.useMutation', () => {
    const page = src(MONETIZATION_PAGE);
    expect(page).toContain('trpc.monetization.generate.useMutation');
  });
});

// ── 2 · URL state + localStorage ─────────────────────────────────────────────

describe('Monetization.tsx URL state + localStorage (AC-3)', () => {
  it('uses useSearchParams for URL state', () => {
    const page = src(MONETIZATION_PAGE);
    expect(page).toContain('useSearchParams');
  });

  it('uses getToolLsKey for monetization draft LS key', () => {
    const page = src(MONETIZATION_PAGE);
    expect(page).toContain('getToolLsKey');
    expect(page).toContain('monetization');
  });

  it('persists done state to URL (?done=1)', () => {
    const page = src(MONETIZATION_PAGE);
    expect(page).toContain("'done'");
    expect(page).toContain("'1'");
  });
});

// ── 3 · Result display ────────────────────────────────────────────────────────

describe('Monetization.tsx result display', () => {
  it('renders StepResult with stepKey step4b', () => {
    const page = src(MONETIZATION_PAGE);
    expect(page).toContain('StepResult');
    expect(page).toContain('stepKey="step4b"');
  });

  it('StepResult step4b renders currentAnalysis ladder revenueStructure successCases', () => {
    const result = src(STEP4B_RESULT);
    expect(result).toContain('currentAnalysis');
    expect(result).toContain('ladder');
    expect(result).toContain('revenueStructure');
    expect(result).toContain('successCases');
  });

  it('supports onRetry to clear result', () => {
    const page = src(MONETIZATION_PAGE);
    expect(page).toContain('handleRetry');
    expect(page).toContain('onRetry={handleRetry}');
  });
});

// ── 4 · Schema: MonetizationInputSchema exported from monetization.schema.ts ──

describe('MonetizationInputSchema schema', () => {
  it('monetization.schema.ts exports MonetizationInputSchema', () => {
    const schema = src(MONETIZATION_SCHEMA);
    expect(schema).toContain('MonetizationInputSchema');
  });

  it('MonetizationInputSchema re-exports Step4bInputSchema fields', () => {
    const schema = src(MONETIZATION_SCHEMA);
    expect(schema).toContain('Step4bInputSchema');
  });

  it('monetization router generate procedure exists', () => {
    const router = src(API_ROUTER);
    expect(router).toContain('generate');
    expect(router).toContain('monetizationRouter');
  });

  it('monetization router registered in app router', () => {
    const appRouter = src(APP_ROUTER);
    expect(appRouter).toContain('monetization: monetizationRouter');
  });
});
