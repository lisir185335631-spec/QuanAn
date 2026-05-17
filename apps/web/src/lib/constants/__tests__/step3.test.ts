import { describe, it, expect } from 'vitest';
import { STEP3_PLATFORMS_5, STEP3_OUTPUT_H3_6 } from '../step3';

describe('STEP3 constants', () => {
  it('5 platforms', () => expect(STEP3_PLATFORMS_5.length).toBe(5));
  it('6 H3 output blocks', () => expect(STEP3_OUTPUT_H3_6.length).toBe(6));
  it('all platforms have emoji prefix', () => {
    STEP3_PLATFORMS_5.forEach(p => {
      expect(p.label).toMatch(/^[\u{1F300}-\u{1F9FF}]/u);
    });
  });
  it('output H3 labels start with number 1-6', () => {
    STEP3_OUTPUT_H3_6.forEach((block, idx) => {
      expect(block.h3Label.startsWith(`${idx + 1}. `)).toBe(true);
    });
  });
});
