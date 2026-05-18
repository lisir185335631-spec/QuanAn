// PRD-14 US-002 · significance.service — Chi-square + Welch t-test + 多维分析
// AC-1: chiSquareTest + welchTTest + computeExperimentSignificance
// AC-3: @stdlib chisquareCdf df=1 two-sided p-value
// AC-4: @stdlib tCdf Welch t-test bilateral
// SHIELD: SampleSize < 30 → inconclusive (no p-value calc)
// SHIELD: @stdlib · no self-implementation
// SHIELD: Promise.all parallel fetch for metrics

import chisquareCdf from '@stdlib/stats-base-dists-chisquare-cdf';
import tCdf from '@stdlib/stats-base-dists-t-cdf';

import { prisma } from '@/lib/prisma';

// ---------------------------------------------------------------------------
// Types — AC-2
// ---------------------------------------------------------------------------

export type Recommendation = 'continue' | 'stop_winner' | 'stop_loser' | 'inconclusive';
export type AbVariant = 'control' | 'variant_a' | 'variant_b';

export interface SignificanceTestResult {
  metric: string;
  testType: 'chi_square' | 'welch_t';
  pValue: number | null;
  isSignificant: boolean;
  effect: number | null;
  sampleSize: number;
  confidence: number;
  recommendation: Recommendation;
}

/** AC-6: admin custom metric · query per variant → array of numeric values */
export interface CustomMetric {
  key: string;
  type: 'conversion' | 'continuous';
  query: (variant: AbVariant) => Promise<number[]>;
}

// ---------------------------------------------------------------------------
// chiSquareTest — AC-3
// 2×2 contingency table: control (binary 0/1) vs variant (binary 0/1)
// chi2 = Σ (O-E)²/E over 4 cells · df=1 · p-value = 1 - CDF(chi2, 1)
// ---------------------------------------------------------------------------

export function chiSquareTest(
  control: number[],
  variant: number[],
): { pValue: number; effect: number } {
  const a = control.reduce((s, v) => s + v, 0); // control converted
  const b = control.length - a; // control not converted
  const c = variant.reduce((s, v) => s + v, 0); // variant converted
  const d = variant.length - c; // variant not converted

  const n = a + b + c + d;
  if (n === 0) return { pValue: 1, effect: 0 };

  const rowControl = a + b;
  const rowVariant = c + d;
  const colConverted = a + c;
  const colNot = b + d;

  const Ea = (rowControl * colConverted) / n;
  const Eb = (rowControl * colNot) / n;
  const Ec = (rowVariant * colConverted) / n;
  const Ed = (rowVariant * colNot) / n;

  if (Ea === 0 || Eb === 0 || Ec === 0 || Ed === 0) {
    return { pValue: 1, effect: 0 };
  }

  const chi2 =
    (a - Ea) ** 2 / Ea + (b - Eb) ** 2 / Eb + (c - Ec) ** 2 / Ec + (d - Ed) ** 2 / Ed;

  // Two-sided p-value: chi-square is inherently two-sided for independence test
  const pValue = 1 - chisquareCdf(chi2, 1);

  // Effect: relative change in conversion rate (variant vs control)
  const controlRate = rowControl === 0 ? 0 : a / rowControl;
  const variantRate = rowVariant === 0 ? 0 : c / rowVariant;
  const effect = controlRate === 0 ? 0 : (variantRate - controlRate) / controlRate;

  return { pValue, effect };
}

// ---------------------------------------------------------------------------
// welchTTest — AC-4
// Welch t-test for unequal variances · bilateral p-value
// ---------------------------------------------------------------------------

export function welchTTest(
  control: number[],
  variant: number[],
): { pValue: number; effect: number } {
  const n1 = control.length;
  const n2 = variant.length;

  if (n1 < 2 || n2 < 2) return { pValue: 1, effect: 0 };

  const mean1 = control.reduce((s, v) => s + v, 0) / n1;
  const mean2 = variant.reduce((s, v) => s + v, 0) / n2;

  const var1 = control.reduce((s, v) => s + (v - mean1) ** 2, 0) / (n1 - 1);
  const var2 = variant.reduce((s, v) => s + (v - mean2) ** 2, 0) / (n2 - 1);

  const se2 = var1 / n1 + var2 / n2;
  if (se2 === 0) return { pValue: 1, effect: 0 };

  const se = Math.sqrt(se2);
  const t = (mean1 - mean2) / se;

  // Welch–Satterthwaite df
  const v1 = var1 / n1;
  const v2 = var2 / n2;
  const df = (v1 + v2) ** 2 / (v1 ** 2 / (n1 - 1) + v2 ** 2 / (n2 - 1));

  // Two-sided: 2 * (1 - tCdf(|t|, df))
  const pValue = 2 * (1 - tCdf(Math.abs(t), df));

  // Effect: relative change (variant - control) / |control| mean
  const effect = mean1 === 0 ? 0 : (mean2 - mean1) / Math.abs(mean1);

  return { pValue, effect };
}

// ---------------------------------------------------------------------------
// Internal helpers — recommendation logic
// ---------------------------------------------------------------------------

type MetricDirection = 'higher_is_better' | 'lower_is_better';

function computeRecommendation(
  pValue: number,
  effect: number,
  direction: MetricDirection,
  sampleSize: number,
): Recommendation {
  // AC-7: SampleSize < 30 → inconclusive
  if (sampleSize < 30) return 'inconclusive';
  // AC-8
  if (pValue >= 0.05) return 'continue';
  const isVariantBetter =
    direction === 'higher_is_better' ? effect > 0 : effect < 0;
  const isVariantWorseBy10Pct =
    direction === 'higher_is_better' ? effect < -0.1 : effect > 0.1;
  if (isVariantBetter) return 'stop_winner';
  if (isVariantWorseBy10Pct) return 'stop_loser';
  return 'continue';
}

function buildResult(
  metric: string,
  testType: 'chi_square' | 'welch_t',
  direction: MetricDirection,
  control: number[],
  variant: number[],
): SignificanceTestResult {
  const sampleSize = Math.min(control.length, variant.length);

  if (sampleSize < 30) {
    return {
      metric,
      testType,
      pValue: null,
      isSignificant: false,
      effect: null,
      sampleSize,
      confidence: 0.95,
      recommendation: 'inconclusive',
    };
  }

  const { pValue, effect } =
    testType === 'chi_square'
      ? chiSquareTest(control, variant)
      : welchTTest(control, variant);

  const isSignificant = pValue < 0.05;
  const recommendation = computeRecommendation(pValue, effect, direction, sampleSize);

  return {
    metric,
    testType,
    pValue,
    isSignificant,
    effect,
    sampleSize,
    confidence: 0.95,
    recommendation,
  };
}

// ---------------------------------------------------------------------------
// Standard metric DB fetch functions — AC-5
// Each returns binary (0/1) array for chi-square or float array for Welch t
// ---------------------------------------------------------------------------

async function fetchConversionData(
  experimentId: number,
  variant: AbVariant,
): Promise<number[]> {
  // conversion: users with ≥7 distinct completed step_keys across all ip_accounts
  const rows = await prisma.$queryRaw<{ converted: number }[]>`
    SELECT
      CASE
        WHEN COUNT(DISTINCT sd.step_key) FILTER (WHERE sd.status = 'completed') >= 7
        THEN 1 ELSE 0
      END AS converted
    FROM ab_assignments a
    LEFT JOIN ip_accounts ia ON ia.user_id = a.user_id
    LEFT JOIN step_data sd ON sd.account_id = ia.id
    WHERE a.experiment_id = ${experimentId}
      AND a.variant = ${variant}
    GROUP BY a.user_id
  `;
  return rows.map((r) => Number(r.converted));
}

async function fetchRetentionData(
  experimentId: number,
  variant: AbVariant,
): Promise<number[]> {
  // retention: users who logged in within 7 days of assignment
  const rows = await prisma.$queryRaw<{ retained: number }[]>`
    SELECT
      CASE
        WHEN u.last_login_at IS NOT NULL
          AND u.last_login_at >= a.assigned_at + INTERVAL '7 days'
        THEN 1 ELSE 0
      END AS retained
    FROM ab_assignments a
    JOIN users u ON u.id = a.user_id
    WHERE a.experiment_id = ${experimentId}
      AND a.variant = ${variant}
  `;
  return rows.map((r) => Number(r.retained));
}

async function fetchCostData(
  experimentId: number,
  variant: AbVariant,
): Promise<number[]> {
  // cost: per-user total cost_usd as float
  const rows = await prisma.$queryRaw<{ totalCost: number }[]>`
    SELECT
      COALESCE(SUM(c.cost_usd), 0)::float8 AS "totalCost"
    FROM ab_assignments a
    LEFT JOIN cost_log c ON c.user_id = a.user_id
    WHERE a.experiment_id = ${experimentId}
      AND a.variant = ${variant}
    GROUP BY a.user_id
  `;
  return rows.map((r) => Number(r.totalCost));
}

// ---------------------------------------------------------------------------
// computeExperimentSignificance — AC-5 + AC-6
// 3 standard metrics + optional custom metrics · Promise.all parallel fetch
// ---------------------------------------------------------------------------

export async function computeExperimentSignificance(
  experimentId: number,
  metrics: CustomMetric[] = [],
): Promise<SignificanceTestResult[]> {
  // AC-6: Promise.all parallel fetch for all metrics
  const allQueries: Promise<number[]>[] = [
    fetchConversionData(experimentId, 'control'),
    fetchConversionData(experimentId, 'variant_a'),
    fetchRetentionData(experimentId, 'control'),
    fetchRetentionData(experimentId, 'variant_a'),
    fetchCostData(experimentId, 'control'),
    fetchCostData(experimentId, 'variant_a'),
    ...metrics.flatMap((m): Promise<number[]>[] => [m.query('control'), m.query('variant_a')]),
  ];

  const data = await Promise.all(allQueries);

  const controlConversion = data[0] ?? [];
  const variantConversion = data[1] ?? [];
  const controlRetention = data[2] ?? [];
  const variantRetention = data[3] ?? [];
  const controlCost = data[4] ?? [];
  const variantCost = data[5] ?? [];

  const results: SignificanceTestResult[] = [
    buildResult('conversion', 'chi_square', 'higher_is_better', controlConversion, variantConversion),
    buildResult('retention', 'chi_square', 'higher_is_better', controlRetention, variantRetention),
    buildResult('cost', 'welch_t', 'lower_is_better', controlCost, variantCost),
  ];

  // Custom metrics
  for (let i = 0; i < metrics.length; i++) {
    const m = metrics[i]!;
    const controlData = data[6 + i * 2] ?? [];
    const variantData = data[6 + i * 2 + 1] ?? [];
    const testType = m.type === 'conversion' ? 'chi_square' : 'welch_t';
    // continuous metrics: assume lower_is_better is not guaranteed, default to higher
    const direction: MetricDirection = 'higher_is_better';
    results.push(buildResult(m.key, testType, direction, controlData, variantData));
  }

  return results;
}
