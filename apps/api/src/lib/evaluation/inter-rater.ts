// PRD-28 US-007 · inter-rater agreement utilities (D-270 字面锁)
// Cohen's kappa (categorical binarize ≤5/≥6) + Pearson + mulberry32 seeded subset

/** Mulberry32 PRNG — reproducible, good enough for subset selection */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Java-style string hash → uint32 */
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

/**
 * Reproducibly select up to `n` sample IDs from `allIds` seeded by `runId`.
 * Same arguments always return the same ordered subset.
 */
export function listInterRaterSubset(allIds: number[], runId: string, n = 30): number[] {
  const rand = mulberry32(hashString(runId));
  const pool = [...allIds];
  const take = Math.min(n, pool.length);
  for (let i = 0; i < take; i++) {
    const j = i + Math.floor(rand() * (pool.length - i));
    const tmp = pool[i]!;
    pool[i] = pool[j]!;
    pool[j] = tmp;
  }
  return pool.slice(0, take);
}

/**
 * Cohen's kappa (categorical).
 * Binarizes scores: ≤5 → 0, ≥6 → 1.
 * κ = (Po − Pe) / (1 − Pe)
 */
export function cohenKappa(llmScores: number[], humanScores: number[]): number {
  const n = llmScores.length;
  if (n === 0) return 0;

  const llmBin = llmScores.map((s) => (s <= 5 ? 0 : 1));
  const humBin = humanScores.map((s) => (s <= 5 ? 0 : 1));

  let agree = 0;
  for (let i = 0; i < n; i++) {
    if (llmBin[i] === humBin[i]) agree++;
  }
  const po = agree / n;

  const llmLow = llmBin.filter((x) => x === 0).length / n;
  const llmHigh = 1 - llmLow;
  const humLow = humBin.filter((x) => x === 0).length / n;
  const humHigh = 1 - humLow;
  const pe = llmLow * humLow + llmHigh * humHigh;

  if (1 - pe < 1e-10) return 1;
  return (po - pe) / (1 - pe);
}

/** Pearson correlation coefficient */
export function pearsonCorrelation(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n === 0) return 0;

  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let dx2 = 0;
  let dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i]! - mx;
    const dy = ys[i]! - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  const denom = Math.sqrt(dx2 * dy2);
  if (denom < 1e-10) return 0;
  return num / denom;
}

/** Human-readable kappa interpretation */
export function interpretKappa(kappa: number): string {
  if (kappa >= 0.8) return 'almost perfect';
  if (kappa >= 0.6) return 'substantial';
  if (kappa >= 0.4) return 'moderate';
  if (kappa >= 0.2) return 'fair';
  if (kappa >= 0) return 'slight';
  return 'poor';
}
