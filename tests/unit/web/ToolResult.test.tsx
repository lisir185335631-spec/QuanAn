/**
 * ToolResult tests — PRD-5 US-001 AC-20
 * Node environment — source inspection (no React render)
 * Tests: switch by toolKey 4 cases + safety checks
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '../../../');
const TOOL_RESULT_DIR = `${ROOT}/apps/web/src/components/ToolResult`;

function readComponent(name: string): string {
  return readFileSync(`${TOOL_RESULT_DIR}/${name}`, 'utf-8');
}

function assertNoDangerousHtml(src: string, name: string) {
  expect(
    src.includes('dangerouslySetInnerHTML'),
    `${name} must not use dangerouslySetInnerHTML`,
  ).toBe(false);
}

// ── ToolResult switch coverage ────────────────────────────────────────────────

describe('ToolResult: switch by toolKey', () => {
  it('handles generate case → FreeGenerateResult', () => {
    const src = readComponent('ToolResult.tsx');
    expect(src).toContain("case 'generate'");
    expect(src).toContain('FreeGenerateResult');
  });

  it('handles boom-generate case → BoomGenerateResult', () => {
    const src = readComponent('ToolResult.tsx');
    expect(src).toContain("case 'boom-generate'");
    expect(src).toContain('BoomGenerateResult');
  });

  it('handles analysis case → AnalysisResult', () => {
    const src = readComponent('ToolResult.tsx');
    expect(src).toContain("case 'analysis'");
    expect(src).toContain('AnalysisResult');
  });

  it('handles video-analysis case → VideoAnalysisResult', () => {
    const src = readComponent('ToolResult.tsx');
    expect(src).toContain("case 'video-analysis'");
    expect(src).toContain('VideoAnalysisResult');
  });
});

// ── Safety: no dangerouslySetInnerHTML ────────────────────────────────────────

describe('ToolResult: no dangerouslySetInnerHTML in any result component', () => {
  it('ToolResult.tsx is safe', () => {
    assertNoDangerousHtml(readComponent('ToolResult.tsx'), 'ToolResult');
  });

  it('FreeGenerateResult.tsx is safe', () => {
    assertNoDangerousHtml(readComponent('FreeGenerateResult.tsx'), 'FreeGenerateResult');
  });

  it('BoomGenerateResult.tsx is safe', () => {
    assertNoDangerousHtml(readComponent('BoomGenerateResult.tsx'), 'BoomGenerateResult');
  });

  it('AnalysisResult.tsx is safe', () => {
    assertNoDangerousHtml(readComponent('AnalysisResult.tsx'), 'AnalysisResult');
  });

  it('VideoAnalysisResult.tsx is safe', () => {
    assertNoDangerousHtml(readComponent('VideoAnalysisResult.tsx'), 'VideoAnalysisResult');
  });
});

// ── data-testid presence ──────────────────────────────────────────────────────

describe('ToolResult: data-testid in each sub-component', () => {
  it('FreeGenerateResult has data-testid', () => {
    expect(readComponent('FreeGenerateResult.tsx')).toContain('tool-result-generate');
  });

  it('BoomGenerateResult has data-testid', () => {
    expect(readComponent('BoomGenerateResult.tsx')).toContain('tool-result-boom-generate');
  });

  it('AnalysisResult has data-testid', () => {
    expect(readComponent('AnalysisResult.tsx')).toContain('tool-result-analysis');
  });

  it('VideoAnalysisResult has data-testid', () => {
    expect(readComponent('VideoAnalysisResult.tsx')).toContain('tool-result-video-analysis');
  });
});
