/**
 * DeepLearning.test.tsx — PRD-15 US-003 AC-7
 * ≥ 6 unit tests: source inspection (no React render)
 * Node environment — pure logic + source inspection tests
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '../../../../');
const DEEP_LEARNING_PAGE = `${ROOT}/apps/web/src/pages/tools/DeepLearning.tsx`;
const DEEP_LEARNING_TABS = `${ROOT}/apps/web/src/pages/tools/components/DeepLearningTabs.tsx`;
const DEEP_LEARNING_ROUTER = `${ROOT}/apps/api/src/trpc/routers/deepLearning.ts`;

function src(path: string): string {
  return readFileSync(path, 'utf-8');
}

// ── 1 · Page structure ────────────────────────────────────────────────────────

describe('DeepLearning.tsx page structure', () => {
  it('has 150+ lines (stub replaced)', () => {
    const lines = src(DEEP_LEARNING_PAGE).split('\n').length;
    expect(lines).toBeGreaterThan(150);
  });

  it('uses useSearchParams for URL state (AC-5 SHIELD #2)', () => {
    const page = src(DEEP_LEARNING_PAGE);
    expect(page).toContain('useSearchParams');
    expect(page).toContain("'tab'");
  });

  it('supports ?tab=learn|library|apply URL values', () => {
    const page = src(DEEP_LEARNING_PAGE);
    expect(page).toContain("'learn'");
    expect(page).toContain("'library'");
    expect(page).toContain("'apply'");
  });

  it('renders 3 Tabs (学习/我的库/公式应用)', () => {
    const page = src(DEEP_LEARNING_PAGE);
    expect(page).toContain('TabsList');
    expect(page).toContain('TabsTrigger');
    expect(page).toContain('TabsContent');
  });

  it('imports LearnTab, LibraryTab, ApplyFormulaTab from components', () => {
    const page = src(DEEP_LEARNING_PAGE);
    expect(page).toContain('LearnTab');
    expect(page).toContain('LibraryTab');
    expect(page).toContain('ApplyFormulaTab');
  });

  it('passes onSaved callback to LearnTab for library navigation', () => {
    const page = src(DEEP_LEARNING_PAGE);
    expect(page).toContain('onSaved={handleSaved}');
    expect(page).toContain("handleTabChange('library')");
  });
});

// ── 2 · Tab components structure ─────────────────────────────────────────────

describe('DeepLearningTabs.tsx structure', () => {
  it('LearnTab calls trpc.deepLearning.parse.useMutation (AC-2)', () => {
    const tabs = src(DEEP_LEARNING_TABS);
    expect(tabs).toContain('trpc.deepLearning.parse.useMutation');
  });

  it('LearnTab textarea has ≥100 char validation (AC-2)', () => {
    const tabs = src(DEEP_LEARNING_TABS);
    expect(tabs).toContain('sample.length < 100');
  });

  it('parse result shows coreFormula, hookType, structurePattern, emotionalArc, keywords (AC-2)', () => {
    const tabs = src(DEEP_LEARNING_TABS);
    expect(tabs).toContain('coreFormula');
    expect(tabs).toContain('hookType');
    expect(tabs).toContain('structurePattern');
    expect(tabs).toContain('emotionalArc');
    expect(tabs).toContain('keywords');
  });

  it('LibraryTab calls trpc.deepLearning.list.useQuery (AC-3)', () => {
    const tabs = src(DEEP_LEARNING_TABS);
    expect(tabs).toContain('trpc.deepLearning.list.useQuery');
  });

  it('LibraryTab shows 截取文案 80字 truncation logic (AC-3)', () => {
    const tabs = src(DEEP_LEARNING_TABS);
    expect(tabs).toContain('slice(0, 80)');
  });

  it('LibraryTab has delete button calling trpc.deepLearning.delete (AC-3)', () => {
    const tabs = src(DEEP_LEARNING_TABS);
    expect(tabs).toContain('trpc.deepLearning.delete.useMutation');
  });

  it('ApplyFormulaTab calls trpc.deepLearning.applyFormula.useMutation (AC-4)', () => {
    const tabs = src(DEEP_LEARNING_TABS);
    expect(tabs).toContain('trpc.deepLearning.applyFormula.useMutation');
  });
});

// ── 3 · Backend router ────────────────────────────────────────────────────────

describe('deepLearning router', () => {
  it('exports deepLearningRouter with parse procedure (AC-6)', () => {
    const router = src(DEEP_LEARNING_ROUTER);
    expect(router).toContain('parse:');
    expect(router).toContain('parseInput');
  });

  it('exports deepLearningRouter with applyFormula procedure (AC-6)', () => {
    const router = src(DEEP_LEARNING_ROUTER);
    expect(router).toContain('applyFormula:');
  });

  it('parse input requires sample ≥100 chars (AC-2)', () => {
    const router = src(DEEP_LEARNING_ROUTER);
    expect(router).toContain('min(100)');
  });

  it('does NOT call deepLearningArchive.create (LD-A-5)', () => {
    const router = src(DEEP_LEARNING_ROUTER);
    expect(router).not.toContain('deepLearningArchive.create');
  });

  it('parse uses mockAnalysis for P1 (DeepLearnAgent留PRD-7+)', () => {
    const router = src(DEEP_LEARNING_ROUTER);
    expect(router).toContain('mockAnalysis');
  });
});
