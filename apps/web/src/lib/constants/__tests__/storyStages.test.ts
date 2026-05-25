/**
 * storyStages.test.ts — 4 entry 字面锁
 * SPEC §11 D6
 */

import { describe, expect, it } from 'vitest';

import { STORY_FOOTER_TITLE, STORY_STAGES } from '@/lib/constants/storyStages';

describe('STORY_STAGES', () => {
  it('共 4 条', () => {
    expect(STORY_STAGES.length).toBe(4);
  });

  it('key 顺序正确: qi / cheng / zhuan / he', () => {
    const keys = STORY_STAGES.map((s) => s.key);
    expect(keys).toEqual(['qi', 'cheng', 'zhuan', 'he']);
  });

  it('label 字面锁 · 起 / 承 / 转 / 合', () => {
    const labels = STORY_STAGES.map((s) => s.label);
    expect(labels).toContain('起：黄金3秒');
    expect(labels).toContain('承：内容发展');
    expect(labels).toContain('转：高潮转折');
    expect(labels).toContain('合：有力结尾');
  });

  it('color 字面锁', () => {
    const colors = STORY_STAGES.map((s) => s.color);
    expect(colors).toContain('text-red-400');
    expect(colors).toContain('text-yellow-400');
    expect(colors).toContain('text-green-400');
    expect(colors).toContain('text-orange-400');
  });

  it('每条 desc 非空', () => {
    for (const s of STORY_STAGES) {
      expect(s.desc.length).toBeGreaterThan(0);
    }
  });
});

describe('STORY_FOOTER_TITLE', () => {
  it('字面为 "起承转合 · 文案结构"', () => {
    expect(STORY_FOOTER_TITLE).toBe('起承转合 · 文案结构');
  });
});
