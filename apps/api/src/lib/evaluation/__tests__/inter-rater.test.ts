import { describe, expect, it } from 'vitest';

import { cohenKappa, listInterRaterSubset, pearsonCorrelation } from '../inter-rater';

describe('cohenKappa', () => {
  it('κ = 1 when all raters agree perfectly', () => {
    const scores = [1, 7, 5, 8, 2, 9, 3, 6];
    expect(cohenKappa(scores, scores)).toBeCloseTo(1);
  });

  it('κ < 0 when raters systematically disagree (50/50 opposite split)', () => {
    // 50% LLM high → human always low for those, and vice versa → po=0, pe=0.5 → κ=-1
    const llm   = [8, 8, 8, 8, 8, 2, 2, 2, 2, 2];
    const human = [2, 2, 2, 2, 2, 8, 8, 8, 8, 8];
    expect(cohenKappa(llm, human)).toBeLessThan(0);
  });

  it('κ below 0.4 for raters with low agreement', () => {
    const llm = Array.from({ length: 20 }, (_, i) => (i < 10 ? 3 : 8));
    const human = Array.from({ length: 20 }, (_, i) => (i < 10 ? 8 : 3));
    expect(cohenKappa(llm, human)).toBeLessThan(0.4);
  });

  it('κ ≈ 0 for raters with chance-level agreement', () => {
    // po=0.5, pe=0.5*0.5+0.5*0.5=0.5 → κ=(0.5-0.5)/(1-0.5)=0
    const llm   = [2, 2, 2, 2, 2, 8, 8, 8, 8, 8];
    const human = [2, 2, 8, 8, 8, 2, 8, 8, 2, 8];
    expect(cohenKappa(llm, human)).toBeCloseTo(0, 1);
  });

  it('κ in valid range [−1, 1] for mixed data', () => {
    const llm = [3, 7, 5, 8, 2, 9, 4, 6, 1, 10];
    const human = [4, 6, 5, 7, 3, 8, 4, 7, 2, 9];
    const k = cohenKappa(llm, human);
    expect(k).toBeGreaterThanOrEqual(-1);
    expect(k).toBeLessThanOrEqual(1);
  });
});

describe('listInterRaterSubset', () => {
  it('same runId returns same ids (reproducible)', () => {
    const ids = Array.from({ length: 100 }, (_, i) => i + 1);
    const r1 = listInterRaterSubset(ids, 'run-abc-123');
    const r2 = listInterRaterSubset(ids, 'run-abc-123');
    expect(r1).toEqual(r2);
  });

  it('different runId returns different subset', () => {
    const ids = Array.from({ length: 100 }, (_, i) => i + 1);
    const r1 = listInterRaterSubset(ids, 'run-abc-123');
    const r2 = listInterRaterSubset(ids, 'run-xyz-456');
    expect(r1).not.toEqual(r2);
  });

  it('returns exactly 30 when pool ≥ 30', () => {
    const ids = Array.from({ length: 100 }, (_, i) => i + 1);
    expect(listInterRaterSubset(ids, 'test-run')).toHaveLength(30);
  });

  it('returns all items when pool < 30', () => {
    const ids = [1, 2, 3];
    expect(listInterRaterSubset(ids, 'test-run')).toHaveLength(3);
  });
});

describe('pearsonCorrelation', () => {
  it('returns 1 for perfect positive correlation', () => {
    expect(pearsonCorrelation([1, 2, 3, 4, 5], [2, 4, 6, 8, 10])).toBeCloseTo(1);
  });

  it('returns −1 for perfect negative correlation', () => {
    expect(pearsonCorrelation([1, 2, 3, 4, 5], [5, 4, 3, 2, 1])).toBeCloseTo(-1);
  });

  it('returns 0 for empty arrays', () => {
    expect(pearsonCorrelation([], [])).toBe(0);
  });

  it('returns value in [−1, 1] for mixed data', () => {
    const r = pearsonCorrelation([3, 7, 5, 8, 2], [4, 6, 5, 7, 3]);
    expect(r).toBeGreaterThanOrEqual(-1);
    expect(r).toBeLessThanOrEqual(1);
  });
});
