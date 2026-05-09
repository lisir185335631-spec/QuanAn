/**
 * ToolForm tests — PRD-5 US-001 AC-19
 * Node environment — pure logic tests (no React render)
 * Tests: schema validation, LS key naming, dual-write logic, component source inspection
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import { getToolLsKey } from '../../../apps/web/src/lib/ls-namespace';
import {
  copywritingFreeGenerateInput,
  generateBoomInput,
  analysisStructuralInput,
  analyzeVideoInput,
} from '../../../packages/schemas/src/specialist-io/index';

const ROOT = resolve(__dirname, '../../../');
const TOOL_FORM_DIR = `${ROOT}/apps/web/src/components/ToolForm`;

function readComponent(name: string): string {
  return readFileSync(`${TOOL_FORM_DIR}/${name}`, 'utf-8');
}

// ── LS namespace: getToolLsKey ────────────────────────────────────────────────

describe('getToolLsKey (D-031)', () => {
  it('generates correct LS key format', () => {
    expect(getToolLsKey(42, 'generate', 'form')).toBe(
      'aiip_memory_acc_42_tool_generate_form',
    );
  });

  it('includes toolKey in the namespace (not stepKey pattern)', () => {
    const key = getToolLsKey(1, 'boom-generate', 'form');
    expect(key).toContain('tool_boom-generate');
    expect(key).not.toContain('_step_');
  });

  it('includes accountId in the namespace for isolation', () => {
    const key1 = getToolLsKey(1, 'analysis', 'form');
    const key2 = getToolLsKey(2, 'analysis', 'form');
    expect(key1).not.toBe(key2);
  });

  it('includes suffix parameter', () => {
    const key = getToolLsKey(5, 'video-analysis', 'result');
    expect(key).toBe('aiip_memory_acc_5_tool_video-analysis_result');
  });
});

// ── Schema validation for each tool ──────────────────────────────────────────

describe('generate tool schema (copywritingFreeGenerateInput)', () => {
  it('passes with valid scriptType + elements + topic', () => {
    const r = copywritingFreeGenerateInput.safeParse({
      scriptType: 'tutorial',
      elements: ['fear', 'curiosity'],
      topic: '减肥打卡',
    });
    expect(r.success).toBe(true);
  });

  it('fails with invalid scriptType', () => {
    const r = copywritingFreeGenerateInput.safeParse({
      scriptType: 'invalid_type',
      elements: ['fear'],
      topic: '话题',
    });
    expect(r.success).toBe(false);
  });

  it('fails with more than 8 elements', () => {
    const r = copywritingFreeGenerateInput.safeParse({
      scriptType: 'tutorial',
      elements: ['greed', 'fear', 'curiosity', 'contrast', 'resonance', 'empathy', 'social_proof', 'authority', 'leverage'],
      topic: '话题',
    });
    expect(r.success).toBe(false);
  });
});

describe('boom-generate tool schema (generateBoomInput)', () => {
  it('passes with elements only', () => {
    const r = generateBoomInput.safeParse({ elements: ['greed'] });
    expect(r.success).toBe(true);
  });

  it('accepts optional industry and theme', () => {
    const r = generateBoomInput.safeParse({
      elements: ['fear', 'social_proof'],
      industry: '健康养生',
      theme: '减肥逆袭',
    });
    expect(r.success).toBe(true);
  });
});

describe('analysis tool schema (analysisStructuralInput)', () => {
  it('passes with valid copy', () => {
    const r = analysisStructuralInput.safeParse({ copy: '这是一段足够长的文案内容供分析' });
    expect(r.success).toBe(true);
  });

  it('fails with copy shorter than 10 chars', () => {
    const r = analysisStructuralInput.safeParse({ copy: '太短' });
    expect(r.success).toBe(false);
  });
});

describe('video-analysis tool schema (analyzeVideoInput)', () => {
  it('passes with lastCopy', () => {
    const r = analyzeVideoInput.safeParse({ lastCopy: '这是爆款文案的完整内容超过十个字' });
    expect(r.success).toBe(true);
  });

  it('accepts optional lastTitle', () => {
    const r = analyzeVideoInput.safeParse({
      lastTitle: '爆款标题',
      lastCopy: '这是爆款文案完整内容',
    });
    expect(r.success).toBe(true);
  });
});

// ── ToolForm component source inspection ─────────────────────────────────────

describe('ToolForm component (source inspection)', () => {
  it('uses AbortController on unmount', () => {
    const src = readComponent('ToolForm.tsx');
    expect(src).toContain('AbortController');
    expect(src).toContain('abort()');
  });

  it('implements LS-first dual-write (REJ-035)', () => {
    const src = readComponent('ToolForm.tsx');
    expect(src).toContain('localStorage.setItem');
    expect(src).toContain('getToolLsKey');
  });

  it('keeps LS on DB fail and shows toast (not rollback)', () => {
    const src = readComponent('ToolForm.tsx');
    // LS write happens before DB write, and error shows toast
    expect(src).toContain('toast.error');
    // Should NOT rollback LS (removeItem) on error
    expect(src).not.toContain('localStorage.removeItem');
  });

  it('accepts defaultValues prop', () => {
    const src = readComponent('ToolForm.tsx');
    expect(src).toContain('defaultValues');
  });

  it('uses zodResolver', () => {
    const src = readComponent('ToolForm.tsx');
    expect(src).toContain('zodResolver');
  });

  it('has data-testid for each toolKey', () => {
    const src = readComponent('ToolForm.tsx');
    expect(src).toContain('tool-form-');
  });

  it('handles all 4 toolKeys in switch statement', () => {
    const src = readComponent('ToolForm.tsx');
    expect(src).toContain("case 'generate'");
    expect(src).toContain("case 'boom-generate'");
    expect(src).toContain("case 'analysis'");
    expect(src).toContain("case 'video-analysis'");
  });
});
