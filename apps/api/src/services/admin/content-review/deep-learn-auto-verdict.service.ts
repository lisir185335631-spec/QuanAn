/**
 * DeepLearn AutoVerdict Service — PRD-12 US-008
 * AC-3 logic:
 *   Strong PII (idCards + bankCards >= 1) → auto_rejected
 *   banned-word >= 1 → auto_rejected
 *   parse failed or 10% sampling → needs_review
 *   otherwise → auto_approved
 * AC-6: scanResult stores redacted text preview, not raw PII text
 */

import { bannedWordService } from './banned-word.service';
import { piiDetectionService } from './pii-detection.service';

export type DeepLearnAutoVerdict = 'auto_approved' | 'auto_rejected' | 'needs_review';

export interface DeepLearnScanResult {
  piiTotal: number;
  /** idCards.length + bankCards.length — triggers auto_rejected when >= 1 */
  piiCriticalHits: number;
  bannedWordHits: string[];
  isSampled: boolean;
  parseFailed: boolean;
  checkedAt: string;
}

export interface DeepLearnVerdictResult {
  autoVerdict: DeepLearnAutoVerdict;
  scanResult: DeepLearnScanResult;
  /** PII-redacted text — safe to store in DB */
  redactedText: string;
}

const DEFAULT_SAMPLING_RATE = 0.1; // 10%

/**
 * Compute autoVerdict for a deep-learning file upload.
 * Banned-word scan runs on redacted text to prevent PII leaking into scan logs.
 */
export async function computeDeepLearnAutoVerdict(
  text: string,
  options?: { parseFailed?: boolean; samplingRate?: number },
): Promise<DeepLearnVerdictResult> {
  const checkedAt = new Date().toISOString();
  const parseFailed = options?.parseFailed ?? false;
  const samplingRate = options?.samplingRate ?? DEFAULT_SAMPLING_RATE;

  const piiResult = piiDetectionService.detect(text);
  const redactedText = piiDetectionService.redact(text);
  const piiCriticalHits = piiResult.idCards.length + piiResult.bankCards.length;

  // Scan banned words on redacted text — prevents PII from appearing in scan logs (AC-6)
  const bannedResult = await bannedWordService.scan(redactedText);

  const scanResult: DeepLearnScanResult = {
    piiTotal: piiResult.total,
    piiCriticalHits,
    bannedWordHits: bannedResult.hits,
    isSampled: false,
    parseFailed,
    checkedAt,
  };

  // Rule 1: strong PII → auto_rejected (SHIELD: D-082)
  if (piiCriticalHits >= 1) {
    return { autoVerdict: 'auto_rejected', scanResult, redactedText };
  }

  // Rule 2: banned word hits → auto_rejected
  if (bannedResult.hits.length >= 1) {
    return { autoVerdict: 'auto_rejected', scanResult, redactedText };
  }

  // Rule 3: parse failure → needs_review (conservative)
  if (parseFailed) {
    return { autoVerdict: 'needs_review', scanResult, redactedText };
  }

  // Rule 4: 10% sampling → needs_review
  if (Math.random() < samplingRate) {
    scanResult.isSampled = true;
    return { autoVerdict: 'needs_review', scanResult, redactedText };
  }

  return { autoVerdict: 'auto_approved', scanResult, redactedText };
}
