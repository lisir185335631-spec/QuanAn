/**
 * stepConfig unit tests — PRD-3 US-006
 * Validates the 9-step configuration map used by step pages and StepProgress.
 */

import { describe, it, expect } from 'vitest';

import { stepConfig } from '../../../apps/web/src/lib/stepConfig';

const EXPECTED_KEYS = ['step1', 'step2', 'step3', 'step4', 'step5', 'step6', 'step7', 'step8', 'step9'] as const;

describe('stepConfig', () => {
  it('has exactly 9 entries', () => {
    expect(stepConfig.size).toBe(9);
  });

  it('contains all expected step keys', () => {
    for (const key of EXPECTED_KEYS) {
      expect(stepConfig.has(key)).toBe(true);
    }
  });

  it('every entry has non-empty title', () => {
    for (const [, meta] of stepConfig) {
      expect(meta.title.length).toBeGreaterThan(0);
    }
  });

  it('every entry has non-empty description', () => {
    for (const [, meta] of stepConfig) {
      expect(meta.description.length).toBeGreaterThan(0);
    }
  });

  it('every entry has non-empty phase', () => {
    for (const [, meta] of stepConfig) {
      expect(meta.phase.length).toBeGreaterThan(0);
    }
  });

  it('step1 has correct title', () => {
    expect(stepConfig.get('step1')?.title).toBe('IP 定位与身份建立');
  });

  it('step9 has correct title', () => {
    expect(stepConfig.get('step9')?.title).toBe('品牌商业化与社群运营');
  });

  it('step5 phase is 运营', () => {
    expect(stepConfig.get('step5')?.phase).toBe('运营');
  });

  it('returns undefined for unknown key', () => {
    expect(stepConfig.get('step99' as 'step1')).toBeUndefined();
  });
});
