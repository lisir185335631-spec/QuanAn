import { describe, it, expect } from 'vitest';
import { STEP1_INDUSTRIES_56, STEP1_TABS } from '../industries';

describe('STEP1_INDUSTRIES_56', () => {
  it('total count is 56', () => {
    expect(STEP1_INDUSTRIES_56.length).toBe(56);
  });

  it('生活服务 count is 18', () => {
    expect(STEP1_INDUSTRIES_56.filter((i) => i.category === '生活服务').length).toBe(18);
  });

  it('电商零售 count is 13', () => {
    expect(STEP1_INDUSTRIES_56.filter((i) => i.category === '电商零售').length).toBe(13);
  });
});

describe('STEP1_TABS', () => {
  it('non-all tab counts sum to 56', () => {
    const sum = STEP1_TABS.filter((t) => t.id !== 'all').reduce((s, t) => s + t.count, 0);
    expect(sum).toBe(56);
  });
});
