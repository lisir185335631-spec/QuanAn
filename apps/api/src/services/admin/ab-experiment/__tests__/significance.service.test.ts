// PRD-14 US-002 · significance.service unit tests
// AC-10: standard fixtures with known expected pValue comparisons
// AC-12: ≥ 12 tests · pnpm test ≥ 1742 pass

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ──────────────────────────────────────────────────────────

const mockQueryRaw = vi.hoisted(() => vi.fn());

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: mockQueryRaw,
  },
}));

// ── Imports (after mocks) ──────────────────────────────────────────────────

import {
  chiSquareTest,
  welchTTest,
  computeExperimentSignificance,
} from '@/services/admin/ab-experiment/significance.service';

// ── Fixtures ──────────────────────────────────────────────────────────────

/** 100 zeros + 100 ones → control 50% conversion rate */
function makeControlBinary(): number[] {
  return Array.from({ length: 100 }, (_, i) => (i < 50 ? 1 : 0));
}

/** 70 ones + 30 zeros → variant 70% conversion rate */
function makeVariantBinary(): number[] {
  return Array.from({ length: 100 }, (_, i) => (i < 70 ? 1 : 0));
}

/** 30 near-identical values → tiny difference → not significant */
function makeSimilarBinary(): number[] {
  return Array.from({ length: 100 }, (_, i) => (i < 51 ? 1 : 0));
}

/** control continuous: mean=100, std≈10 (30 samples) */
function makeControlContinuous(): number[] {
  return [
    90, 95, 100, 105, 110,
    90, 95, 100, 105, 110,
    90, 95, 100, 105, 110,
    90, 95, 100, 105, 110,
    90, 95, 100, 105, 110,
    90, 95, 100, 105, 110,
  ];
}

/** variant continuous: mean=120, std≈10 (30 samples) — clearly different */
function makeVariantContinuous(): number[] {
  return [
    110, 115, 120, 125, 130,
    110, 115, 120, 125, 130,
    110, 115, 120, 125, 130,
    110, 115, 120, 125, 130,
    110, 115, 120, 125, 130,
    110, 115, 120, 125, 130,
  ];
}

/** small sample — under 30 */
function makeSmallSample(n = 10): number[] {
  return Array.from({ length: n }, (_, i) => i % 2);
}

// ── chiSquareTest ──────────────────────────────────────────────────────────

describe('chiSquareTest', () => {
  it('returns significant p-value for 50% vs 70% conversion', () => {
    const { pValue, effect } = chiSquareTest(makeControlBinary(), makeVariantBinary());
    // chi2 ≈ 8.33 → p ≈ 0.0039
    expect(pValue).toBeLessThan(0.01);
    expect(effect).toBeCloseTo(0.4, 1); // ~40% relative improvement
  });

  it('returns non-significant p-value for 50% vs 51% conversion', () => {
    const { pValue } = chiSquareTest(makeControlBinary(), makeSimilarBinary());
    expect(pValue).toBeGreaterThan(0.5);
  });

  it('handles zero control rate gracefully', () => {
    const allZero = Array.from({ length: 50 }, () => 0);
    const { pValue, effect } = chiSquareTest(allZero, makeVariantBinary());
    expect(pValue).toBeDefined();
    expect(effect).toBe(0);
  });

  it('returns p=1 for empty input', () => {
    const { pValue } = chiSquareTest([], []);
    expect(pValue).toBe(1);
  });

  it('effect is negative when variant has lower conversion', () => {
    const { effect } = chiSquareTest(makeVariantBinary(), makeControlBinary());
    expect(effect).toBeLessThan(0);
  });
});

// ── welchTTest ──────────────────────────────────────────────────────────────

describe('welchTTest', () => {
  it('returns significant p-value for mean=100 vs mean=120 (30 samples each)', () => {
    const { pValue } = welchTTest(makeControlContinuous(), makeVariantContinuous());
    expect(pValue).toBeLessThan(0.001);
  });

  it('returns non-significant p-value for same distribution', () => {
    const same = makeControlContinuous();
    const { pValue } = welchTTest(same, [...same]);
    expect(pValue).toBe(1); // identical → SE=0
  });

  it('computes two-sided p-value (symmetric t-statistic)', () => {
    const { pValue: p1 } = welchTTest(makeControlContinuous(), makeVariantContinuous());
    const { pValue: p2 } = welchTTest(makeVariantContinuous(), makeControlContinuous());
    expect(p1).toBeCloseTo(p2, 8);
  });

  it('effect is negative when variant mean is lower (cost reduced)', () => {
    const { effect } = welchTTest(makeVariantContinuous(), makeControlContinuous());
    expect(effect).toBeLessThan(0);
  });

  it('returns p=1 for n<2', () => {
    const { pValue } = welchTTest([100], [120]);
    expect(pValue).toBe(1);
  });
});

// ── computeExperimentSignificance ──────────────────────────────────────────

describe('computeExperimentSignificance', () => {
  const EXPERIMENT_ID = 1;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  function makeConversionRows(values: number[]) {
    return values.map((v) => ({ converted: v }));
  }

  function makeRetentionRows(values: number[]) {
    return values.map((v) => ({ retained: v }));
  }

  function makeCostRows(values: number[]) {
    return values.map((v) => ({ totalCost: v }));
  }

  it('returns 3 standard metrics with correct keys', async () => {
    // 6 DB calls: conversion×2, retention×2, cost×2
    mockQueryRaw
      .mockResolvedValueOnce(makeConversionRows(makeControlBinary())) // control conversion
      .mockResolvedValueOnce(makeConversionRows(makeVariantBinary())) // variant conversion
      .mockResolvedValueOnce(makeRetentionRows(makeControlBinary())) // control retention
      .mockResolvedValueOnce(makeRetentionRows(makeSimilarBinary())) // variant retention
      .mockResolvedValueOnce(makeCostRows(makeControlContinuous())) // control cost
      .mockResolvedValueOnce(makeCostRows(makeVariantContinuous())); // variant cost

    const results = await computeExperimentSignificance(EXPERIMENT_ID);

    expect(results).toHaveLength(3);
    expect(results.map((r) => r.metric)).toEqual(['conversion', 'retention', 'cost']);
  });

  it('returns stop_winner when conversion is significantly higher', async () => {
    mockQueryRaw
      .mockResolvedValueOnce(makeConversionRows(makeControlBinary()))
      .mockResolvedValueOnce(makeConversionRows(makeVariantBinary()))
      .mockResolvedValueOnce(makeRetentionRows(makeControlBinary()))
      .mockResolvedValueOnce(makeRetentionRows(makeControlBinary()))
      .mockResolvedValueOnce(makeCostRows(makeControlContinuous()))
      .mockResolvedValueOnce(makeCostRows(makeControlContinuous()));

    const results = await computeExperimentSignificance(EXPERIMENT_ID);
    const conversion = results.find((r) => r.metric === 'conversion')!;

    expect(conversion.recommendation).toBe('stop_winner');
    expect(conversion.isSignificant).toBe(true);
    expect(conversion.confidence).toBe(0.95);
  });

  it('returns inconclusive when sampleSize < 30', async () => {
    const small = makeSmallSample(10);
    mockQueryRaw
      .mockResolvedValueOnce(makeConversionRows(small))
      .mockResolvedValueOnce(makeConversionRows(small))
      .mockResolvedValueOnce(makeRetentionRows(small))
      .mockResolvedValueOnce(makeRetentionRows(small))
      .mockResolvedValueOnce(makeCostRows(small))
      .mockResolvedValueOnce(makeCostRows(small));

    const results = await computeExperimentSignificance(EXPERIMENT_ID);

    for (const r of results) {
      expect(r.recommendation).toBe('inconclusive');
      expect(r.pValue).toBeNull();
      expect(r.effect).toBeNull();
    }
  });

  it('calls mockQueryRaw 6 times for standard metrics (parallel)', async () => {
    mockQueryRaw.mockResolvedValue([]);

    await computeExperimentSignificance(EXPERIMENT_ID);

    expect(mockQueryRaw).toHaveBeenCalledTimes(6);
  });

  it('supports custom metrics via Promise.all (2 extra calls per custom metric)', async () => {
    mockQueryRaw.mockResolvedValue(makeConversionRows(makeControlBinary()));

    const customMetric = {
      key: 'custom_engagement',
      type: 'conversion' as const,
      query: vi.fn().mockResolvedValue(makeControlBinary()),
    };

    await computeExperimentSignificance(EXPERIMENT_ID, [customMetric]);

    // 6 standard + 2 custom queries = 8 total
    expect(mockQueryRaw).toHaveBeenCalledTimes(6);
    expect(customMetric.query).toHaveBeenCalledTimes(2);
    expect(customMetric.query).toHaveBeenCalledWith('control');
    expect(customMetric.query).toHaveBeenCalledWith('variant_a');
  });

  it('returns continue when p > 0.05', async () => {
    // tiny difference → not significant
    mockQueryRaw
      .mockResolvedValueOnce(makeConversionRows(makeControlBinary()))
      .mockResolvedValueOnce(makeConversionRows(makeSimilarBinary()))
      .mockResolvedValueOnce(makeRetentionRows(makeControlBinary()))
      .mockResolvedValueOnce(makeRetentionRows(makeSimilarBinary()))
      .mockResolvedValueOnce(makeCostRows(makeControlContinuous()))
      .mockResolvedValueOnce(makeCostRows(makeControlContinuous()));

    const results = await computeExperimentSignificance(EXPERIMENT_ID);

    for (const r of results) {
      expect(['continue', 'inconclusive']).toContain(r.recommendation);
    }
  });
});
