/**
 * coreFormulas.test.ts — 23 entry 字面锁
 * SPEC §11 D6
 */

import { describe, expect, it } from 'vitest';

import { CORE_FORMULAS } from '@/lib/constants/coreFormulas';

describe('CORE_FORMULAS', () => {
  it('共 23 条', () => {
    expect(CORE_FORMULAS.length).toBe(23);
  });

  it('每条 name 非空', () => {
    for (const f of CORE_FORMULAS) {
      expect(f.name.length).toBeGreaterThan(0);
    }
  });

  it('每条 flow 至少 2 步', () => {
    for (const f of CORE_FORMULAS) {
      expect(f.flow.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('每条 example 非空', () => {
    for (const f of CORE_FORMULAS) {
      expect(f.example.length).toBeGreaterThan(0);
    }
  });

  it('首条 name 为 "场景痛点公式"', () => {
    expect(CORE_FORMULAS.at(0)?.name).toBe('场景痛点公式');
  });

  it('末条 name 为 "产品种草公式"', () => {
    expect(CORE_FORMULAS.at(-1)?.name).toBe('产品种草公式');
  });
});
