import { describe, it, expect } from 'vitest';
import {
  STEP3B_TEXTAREAS_3,
  STEP3B_OUTPUT_H3_5,
} from '../step3b';

describe('STEP3B constants', () => {
  it('3 textareas', () => expect(STEP3B_TEXTAREAS_3.length).toBe(3));
  it('5 H3 output blocks', () => expect(STEP3B_OUTPUT_H3_5.length).toBe(5));

  it('first textarea (personalInfo) is required', () => {
    const [first] = STEP3B_TEXTAREAS_3;
    expect(first!.id).toBe('personalInfo');
    expect(first!.required).toBe(true);
  });

  it('advantages and story are not required', () => {
    const [, advantages, story] = STEP3B_TEXTAREAS_3;
    expect(advantages!.id).toBe('advantages');
    expect(advantages!.required).toBe(false);
    expect(story!.id).toBe('story');
    expect(story!.required).toBe(false);
  });

  it('H3 labels start with number 1-5', () => {
    STEP3B_OUTPUT_H3_5.forEach((block, idx) => {
      expect(block.h3Label.startsWith(`${idx + 1}. `)).toBe(true);
    });
  });
});
