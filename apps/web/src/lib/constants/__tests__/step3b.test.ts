import { describe, it, expect } from 'vitest';

import {
  STEP3B_TEXTAREAS_3,
  STEP3B_OUTPUT_H3_6,
} from '../step3b';

describe('STEP3B constants', () => {
  it('3 textareas', () => expect(STEP3B_TEXTAREAS_3.length).toBe(3));
  it('6 H3 output blocks', () => expect(STEP3B_OUTPUT_H3_6.length).toBe(6));

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

  it('H3 labels match D-220 字面锁', () => {
    const expected = ['人设定位', '人设标签', '内容方向', '差异化策略', '内容方向建议', 'IP 故事框架'];
    STEP3B_OUTPUT_H3_6.forEach((block, idx) => {
      expect(block.h3Label).toBe(expected[idx]);
    });
  });
});
