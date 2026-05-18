// PRD-13 US-004 · detectEvolutionAnomalies — 5 anomaly type detection
// SHIELD: detectAnomalies placed AFTER evolution_insight write, wrapped in try/catch (D-089)
// SHIELD: severity determined by evidence count: 1 signal=low · 2-3=medium · ≥4=high (D-089)
// SHIELD: anomaly detection is non-blocking — exception must never bubble to main flow

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import type { EvolutionAnomalyFlag } from '@prisma/client';

export type EvolutionAnomalyType =
  | 'conflicting_insights'
  | 'frequent_style_flip'
  | 'avoidlist_overflow'
  | 'flywheel_stalled'
  | 'negative_feedback_dominant';

function deriveSeverity(signalCount: number): 'low' | 'medium' | 'high' {
  if (signalCount >= 4) return 'high';
  if (signalCount >= 2) return 'medium';
  return 'low';
}

interface InsightContent {
  direction?: string;
  insights?: {
    avoidList?: string[];
    preferredCatchphrases?: string[];
    styleTone?: string;
  };
}

function parseInsightContent(raw: unknown): InsightContent {
  if (raw && typeof raw === 'object') return raw as InsightContent;
  return {};
}

// ── 1. frequent_style_flip: direction 在 7 天内翻转 ≥ 2 次 ─────────────────

async function detectFrequentStyleFlip(
  accountId: number,
  flags: EvolutionAnomalyFlag[],
): Promise<void> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const insights = await prisma.evolutionInsight.findMany({
    where: { accountId, createdAt: { gte: sevenDaysAgo } },
    orderBy: { createdAt: 'asc' },
    select: { id: true, direction: true },
  });

  if (insights.length < 3) return;

  let flipCount = 0;
  for (let i = 1; i < insights.length; i++) {
    if (insights[i]!.direction !== insights[i - 1]!.direction) flipCount++;
  }

  if (flipCount < 2) return;

  const flag = await prisma.evolutionAnomalyFlag.create({
    data: {
      accountId,
      anomalyType: 'frequent_style_flip',
      severity: deriveSeverity(flipCount),
      evidence: {
        insightIds: insights.map((i) => i.id),
        styleFlipCount: flipCount,
      },
    },
  });

  flags.push(flag);
  logger.info({ accountId, flipCount }, 'evolution.anomaly.frequent_style_flip');
}

// ── 2. avoidlist_overflow: 历史 avoidList 累计唯一词 > 50 ─────────────────

async function detectAvoidlistOverflow(
  accountId: number,
  flags: EvolutionAnomalyFlag[],
): Promise<void> {
  const insights = await prisma.evolutionInsight.findMany({
    where: { accountId },
    select: { id: true, content: true },
  });

  const uniqueTerms = new Set<string>();
  const insightIds: number[] = [];

  for (const insight of insights) {
    const parsed = parseInsightContent(insight.content);
    const avoidList = parsed.insights?.avoidList ?? [];
    if (avoidList.length > 0) {
      insightIds.push(insight.id);
      for (const term of avoidList) uniqueTerms.add(term);
    }
  }

  if (uniqueTerms.size <= 50) return;

  const flag = await prisma.evolutionAnomalyFlag.create({
    data: {
      accountId,
      anomalyType: 'avoidlist_overflow',
      severity: deriveSeverity(Math.ceil(uniqueTerms.size / 20)),
      evidence: {
        insightIds,
        avoidListCount: uniqueTerms.size,
        threshold: 50,
      },
    },
  });

  flags.push(flag);
  logger.info({ accountId, avoidListCount: uniqueTerms.size }, 'evolution.anomaly.avoidlist_overflow');
}

// ── 3. negative_feedback_dominant: 30 天 negative > positive × 2 ───────────

async function detectNegativeFeedbackDominant(
  accountId: number,
  flags: EvolutionAnomalyFlag[],
): Promise<void> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const feedbacks = await prisma.feedbackLog.findMany({
    where: { accountId, createdAt: { gte: thirtyDaysAgo } },
    select: { id: true, rating: true },
  });

  const positiveCount = feedbacks.filter((f) => f.rating === 'good').length;
  const negativeCount = feedbacks.filter((f) => f.rating === 'bad').length;

  if (negativeCount <= positiveCount * 2) return;

  const signalCount = Math.ceil(negativeCount / Math.max(positiveCount, 1));

  const flag = await prisma.evolutionAnomalyFlag.create({
    data: {
      accountId,
      anomalyType: 'negative_feedback_dominant',
      severity: deriveSeverity(signalCount),
      evidence: {
        insightIds: [],
        positiveCount,
        negativeCount,
        ratio: positiveCount > 0 ? negativeCount / positiveCount : negativeCount,
      },
    },
  });

  flags.push(flag);
  logger.info({ accountId, positiveCount, negativeCount }, 'evolution.anomaly.negative_feedback_dominant');
}

// ── 4. flywheel_stalled: 7 天无新 insight ────────────────────────────────────

async function detectFlywheelStalled(
  accountId: number,
  flags: EvolutionAnomalyFlag[],
): Promise<void> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const recentInsight = await prisma.evolutionInsight.findFirst({
    where: { accountId, createdAt: { gte: sevenDaysAgo } },
    select: { id: true },
  });

  if (recentInsight) return;

  // Only flag if account has any insights at all (active users with stalled flywheel)
  const anyInsight = await prisma.evolutionInsight.findFirst({
    where: { accountId },
    select: { id: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  if (!anyInsight) return;

  const daysSinceLastInsight = Math.floor(
    (Date.now() - anyInsight.createdAt.getTime()) / (24 * 60 * 60 * 1000),
  );

  const flag = await prisma.evolutionAnomalyFlag.create({
    data: {
      accountId,
      anomalyType: 'flywheel_stalled',
      severity: deriveSeverity(Math.ceil(daysSinceLastInsight / 7)),
      evidence: {
        insightIds: [anyInsight.id],
        daysSinceLastInsight,
        stalledSince: new Date(anyInsight.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    },
  });

  flags.push(flag);
  logger.info({ accountId, daysSinceLastInsight }, 'evolution.anomaly.flywheel_stalled');
}

// ── 5. conflicting_insights: 同 direction 含相反 avoidList/preferredCatchphrases ─

async function detectConflictingInsights(
  accountId: number,
  flags: EvolutionAnomalyFlag[],
): Promise<void> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const insights = await prisma.evolutionInsight.findMany({
    where: { accountId, createdAt: { gte: thirtyDaysAgo } },
    select: { id: true, direction: true, content: true },
    orderBy: { createdAt: 'desc' },
  });

  if (insights.length < 2) return;

  // Group by direction
  const byDirection = new Map<string, typeof insights>();
  for (const insight of insights) {
    const dir = insight.direction;
    if (!byDirection.has(dir)) byDirection.set(dir, []);
    byDirection.get(dir)!.push(insight);
  }

  const conflictingInsightIds: number[] = [];

  for (const [, group] of byDirection) {
    if (group.length < 2) continue;

    // Collect all avoidList and preferredCatchphrases per insight
    const avoidSets = group.map((ins) => {
      const parsed = parseInsightContent(ins.content);
      return new Set(parsed.insights?.avoidList ?? []);
    });
    const preferredSets = group.map((ins) => {
      const parsed = parseInsightContent(ins.content);
      return new Set(parsed.insights?.preferredCatchphrases ?? []);
    });

    // Check if any term appears in preferredCatchphrases of one insight
    // but in avoidList of another (same direction)
    let hasConflict = false;
    for (let i = 0; i < group.length && !hasConflict; i++) {
      for (const term of preferredSets[i] ?? []) {
        for (let j = 0; j < group.length; j++) {
          if (i !== j && avoidSets[j]?.has(term)) {
            hasConflict = true;
            conflictingInsightIds.push(group[i]!.id, group[j]!.id);
            break;
          }
        }
        if (hasConflict) break;
      }
    }
  }

  if (conflictingInsightIds.length === 0) return;

  const uniqueIds = [...new Set(conflictingInsightIds)];

  const flag = await prisma.evolutionAnomalyFlag.create({
    data: {
      accountId,
      anomalyType: 'conflicting_insights',
      severity: deriveSeverity(uniqueIds.length),
      evidence: {
        insightIds: uniqueIds,
        conflictCount: uniqueIds.length / 2,
      },
    },
  });

  flags.push(flag);
  logger.info({ accountId, conflictCount: uniqueIds.length / 2 }, 'evolution.anomaly.conflicting_insights');
}

// ── Public entrypoint ─────────────────────────────────────────────────────────

/**
 * AC-3: detectEvolutionAnomalies — runs 5 anomaly checks for accountId
 * Returns array of created EvolutionAnomalyFlag records (may be empty).
 * Non-blocking: caller should wrap in try/catch.
 */
export async function detectEvolutionAnomalies(accountId: number): Promise<EvolutionAnomalyFlag[]> {
  const flags: EvolutionAnomalyFlag[] = [];

  await Promise.allSettled([
    detectFrequentStyleFlip(accountId, flags),
    detectAvoidlistOverflow(accountId, flags),
    detectNegativeFeedbackDominant(accountId, flags),
    detectFlywheelStalled(accountId, flags),
    detectConflictingInsights(accountId, flags),
  ]);

  return flags;
}
