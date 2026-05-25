/**
 * openingFormulas.test.ts — 23 entry 字面锁
 * SPEC §11 D6
 */

import { describe, expect, it } from 'vitest';

import { OPENING_FORMULAS } from '@/lib/constants/openingFormulas';

describe('OPENING_FORMULAS', () => {
  it('共 23 条', () => {
    expect(OPENING_FORMULAS.length).toBe(23);
  });

  it('num 1-23 连续不重复', () => {
    const nums = OPENING_FORMULAS.map((f) => f.num).sort((a, b) => a - b);
    for (let i = 0; i < 23; i++) {
      expect(nums[i]).toBe(i + 1);
    }
  });

  it('每条 name/formula/example 非空', () => {
    for (const f of OPENING_FORMULAS) {
      expect(f.name.length).toBeGreaterThan(0);
      expect(f.formula.length).toBeGreaterThan(0);
      expect(f.example.length).toBeGreaterThan(0);
    }
  });

  it('首条 name 为 "设置疑问"', () => {
    expect(OPENING_FORMULAS.at(0)?.name).toBe('设置疑问');
  });

  it('末条 name 为 "时间限制"', () => {
    expect(OPENING_FORMULAS.at(-1)?.name).toBe('时间限制');
  });
});
