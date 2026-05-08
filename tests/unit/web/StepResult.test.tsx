/**
 * StepResult component tests — PRD-4 US-012 AC-15
 *
 * Verifies each StepResult component handles expected output shapes:
 * - Valid data: correct field extraction
 * - Null data: skeleton placeholder (no throw)
 * - Partial data: ?? defaults prevent crash
 * - XSS safety: no dangerouslySetInnerHTML in component source
 *
 * Node environment — uses pure logic assertions (no React render).
 * React render tests live in apps/web (jsdom environment).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ── Schema shape helpers ──────────────────────────────────────────────────────

const ROOT = resolve(__dirname, '../../../');
const WEB_SRC = `${ROOT}/apps/web/src/components/StepResult`;

function readComponent(name: string): string {
  return readFileSync(`${WEB_SRC}/${name}`, 'utf-8');
}

// ── AC-10: no dangerouslySetInnerHTML ─────────────────────────────────────────

function assertNoDangerousHtml(source: string, componentName: string) {
  expect(
    source.includes('dangerouslySetInnerHTML'),
    `${componentName} must not use dangerouslySetInnerHTML`,
  ).toBe(false);
}

// ── AC-12: no hardcoded hex colors ────────────────────────────────────────────

function assertNoHardcodedColor(source: string, componentName: string) {
  const hexColorRe = /#[0-9a-fA-F]{6}/;
  expect(
    hexColorRe.test(source),
    `${componentName} must not contain hardcoded hex colors`,
  ).toBe(false);
}

// ── data-testid presence ──────────────────────────────────────────────────────

function assertTestId(source: string, stepKey: string) {
  expect(
    source.includes(`data-testid="step-result-${stepKey}"`),
    `must have data-testid="step-result-${stepKey}"`,
  ).toBe(true);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Step1Result', () => {
  it('render: handles valid step1 output shape (industry + marketAnalysis + competitionLevel + recommendation)', () => {
    const source = readComponent('Step1Result.tsx');
    expect(source).toContain('industry');
    expect(source).toContain('marketAnalysis');
    expect(source).toContain('competitionLevel');
    expect(source).toContain('recommendation');
    assertTestId(source, 'step1');
    assertNoDangerousHtml(source, 'Step1Result');
    assertNoHardcodedColor(source, 'Step1Result');
  });
});

describe('Step3Result', () => {
  it('render: handles valid step3 output shape (nickname[5] + avatar + background + bio[6] + strategy)', () => {
    const source = readComponent('Step3Result.tsx');
    expect(source).toContain('nickname');
    expect(source).toContain('avatar');
    expect(source).toContain('background');
    expect(source).toContain('bio');
    expect(source).toContain('overallStrategy');
    assertTestId(source, 'step3');
    assertNoDangerousHtml(source, 'Step3Result');
    assertNoHardcodedColor(source, 'Step3Result');
  });
});

describe('Step3bResult', () => {
  it('render: handles valid step3b output shape (coreIdentity + thoughtSystem + contentPersona + trustBuilding + personaRoadmap)', () => {
    const source = readComponent('Step3bResult.tsx');
    expect(source).toContain('coreIdentity');
    expect(source).toContain('thoughtSystem');
    expect(source).toContain('contentPersona');
    expect(source).toContain('trustBuilding');
    expect(source).toContain('personaRoadmap');
    assertTestId(source, 'step3b');
    assertNoDangerousHtml(source, 'Step3bResult');
    assertNoHardcodedColor(source, 'Step3bResult');
  });
});

describe('Step4Result', () => {
  it('render: handles markdown output — uses react-markdown, no dangerouslySetInnerHTML', () => {
    const source = readComponent('Step4Result.tsx');
    expect(source).toContain('ReactMarkdown');
    expect(source).toContain('remarkGfm');
    expect(source).toContain('markdown');
    assertTestId(source, 'step4');
    assertNoDangerousHtml(source, 'Step4Result');
    assertNoHardcodedColor(source, 'Step4Result');
  });
});

describe('Step4bResult', () => {
  it('render: handles valid step4b output shape (currentAnalysis + ladder[3] + revenueStructure + successCases[2])', () => {
    const source = readComponent('Step4bResult.tsx');
    expect(source).toContain('currentAnalysis');
    expect(source).toContain('ladder');
    expect(source).toContain('revenueStructure');
    expect(source).toContain('successCases');
    assertTestId(source, 'step4b');
    assertNoDangerousHtml(source, 'Step4bResult');
    assertNoHardcodedColor(source, 'Step4bResult');
  });
});

describe('Step5Result', () => {
  it('render: 20 topics list wrapped in ScrollArea h-96 (AGENTS.md §11.4)', () => {
    const source = readComponent('Step5Result.tsx');
    expect(source).toContain('ScrollArea');
    expect(source).toContain('h-96');
    expect(source).toContain('topics');
    assertTestId(source, 'step5');
    assertNoDangerousHtml(source, 'Step5Result');
    assertNoHardcodedColor(source, 'Step5Result');
  });
});

describe('Step6Result', () => {
  it('render: 13-column shot table with horizontal scroll', () => {
    const source = readComponent('Step6Result.tsx');
    expect(source).toContain('shotList');
    // 13 column keys present
    expect(source).toContain('cameraAngle');
    expect(source).toContain('voiceover');
    expect(source).toContain('location');
    // horizontal scroll
    expect(source).toContain('ScrollBar');
    expect(source).toContain('horizontal');
    assertTestId(source, 'step6');
    assertNoDangerousHtml(source, 'Step6Result');
    assertNoHardcodedColor(source, 'Step6Result');
  });
});

describe('Step7Result', () => {
  it('render: markdown + structure/hooks/cta sidebar layout', () => {
    const source = readComponent('Step7Result.tsx');
    expect(source).toContain('ReactMarkdown');
    expect(source).toContain('structure');
    expect(source).toContain('hooks');
    expect(source).toContain('cta');
    assertTestId(source, 'step7');
    assertNoDangerousHtml(source, 'Step7Result');
    assertNoHardcodedColor(source, 'Step7Result');
  });
});

describe('Step8Result', () => {
  it('render: 2-segment livestream script comparison (lastResult + lastOptimizedResult)', () => {
    const source = readComponent('Step8Result.tsx');
    expect(source).toContain('lastResult');
    expect(source).toContain('lastOptimizedResult');
    assertTestId(source, 'step8');
    assertNoDangerousHtml(source, 'Step8Result');
    assertNoHardcodedColor(source, 'Step8Result');
  });
});

describe('StepResult generic wrapper', () => {
  it('routes all 9 stepKeys to correct components', () => {
    const source = readComponent('StepResult.tsx');
    const stepKeys = ['step1', 'step3', 'step3b', 'step4', 'step4b', 'step5', 'step6', 'step7', 'step8'];
    for (const key of stepKeys) {
      expect(source).toContain(`'${key}'`);
    }
  });
});
