/**
 * TrendingAutoVerdict Service — PRD-12 US-002
 * AC-3: autoVerdict 三态 · banned_word→auto_rejected · 抽样未中→auto_approved · else→needs_review
 * AC-5 / D-081: scanResult null → needs_review (保守策略)
 */

import type { PrismaClient } from '@prisma/client';

export type AutoVerdict = 'auto_approved' | 'auto_rejected' | 'needs_review';

export interface ScanResult {
  bannedWordHits: string[];
  samplingRate: number;
  isSampled: boolean;
  checkedAt: string;
}

export interface AutoVerdictResult {
  autoVerdict: AutoVerdict;
  scanResult: ScanResult;
}

/** Pure computation — testable without DB */
export function computeAutoVerdict(
  rawContent: Record<string, unknown>,
  bannedWords: string[],
  samplingRate: number,
): AutoVerdictResult {
  const checkedAt = new Date().toISOString();

  // Stringify rawContent for word-matching
  const contentText = JSON.stringify(rawContent).toLowerCase();

  const bannedWordHits = bannedWords.filter((w) => contentText.includes(w.toLowerCase()));

  // 命中违禁词 → auto_rejected
  if (bannedWordHits.length > 0) {
    return {
      autoVerdict: 'auto_rejected',
      scanResult: { bannedWordHits, samplingRate, isSampled: false, checkedAt },
    };
  }

  // 无命中 · 按抽样率决定是否人工复核
  const isSampled = Math.random() < samplingRate;

  // 0 hit + 抽样未中 → auto_approved
  if (!isSampled) {
    return {
      autoVerdict: 'auto_approved',
      scanResult: { bannedWordHits: [], samplingRate, isSampled: false, checkedAt },
    };
  }

  // 抽样中 → needs_review
  return {
    autoVerdict: 'needs_review',
    scanResult: { bannedWordHits: [], samplingRate, isSampled: true, checkedAt },
  };
}

/**
 * DB-facing: load rules → run scan → return verdict
 * AC-5 / D-081: rawContent 若无法扫描(prisma error等) → needs_review
 */
export async function runAutoVerdictForContent(
  rawContent: Record<string, unknown>,
  prismaClient: Pick<PrismaClient, 'autoReviewRule'>,
): Promise<AutoVerdictResult> {
  let bannedWords: string[] = [];
  let samplingRate = 0;

  try {
    const rules = await prismaClient.autoReviewRule.findMany({
      where: { enabled: true, ruleType: { in: ['banned_word', 'sampling_rate'] } },
    });

    for (const rule of rules) {
      if (rule.ruleType === 'banned_word') {
        const val = rule.ruleValue as { words?: string[] };
        if (Array.isArray(val?.words)) {
          bannedWords = bannedWords.concat(val.words);
        }
      } else if (rule.ruleType === 'sampling_rate') {
        const val = rule.ruleValue as { rate?: number };
        if (typeof val?.rate === 'number') {
          samplingRate = val.rate;
        }
      }
    }
  } catch {
    // AC-5 / D-081: 规则加载失败 → 保守 needs_review
    return {
      autoVerdict: 'needs_review',
      scanResult: {
        bannedWordHits: [],
        samplingRate: 0,
        isSampled: false,
        checkedAt: new Date().toISOString(),
      },
    };
  }

  return computeAutoVerdict(rawContent, bannedWords, samplingRate);
}
