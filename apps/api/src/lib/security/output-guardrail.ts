/**
 * G77 · output-guardrail — LLM output compliance scanner
 * L3 marketing compliance: PII masking + over-promise detection on LLM output
 *
 * checkOutput(text): { sanitized, violations }
 * - PII: runs pii-mask on the text
 * - Over-promise regex: detects quantified/absolute marketing guarantees only
 *   F-3 fix: narrowed to require earnings/conversion context or quantification near promise words.
 *   Bare 保证/一定/必 without a monetization/conversion qualifier no longer trigger
 *   (avoids false positives on "一定程度上" / "质量保证" / "不保证准确")
 * - Softens matched promises: replaces with softer alternatives
 * - Does NOT integrate banned-word service (remote webhook, not suitable for synchronous output scan)
 */

// F-7: output-guardrail uses its own strict phone rules (maskOutputString below)
// rather than the broad pii-mask input functions, to avoid masking business amounts.

// F-3 fix: narrowed over-promise patterns — require quantified or absolute conversion/earnings context.
// Pattern breakdown:
//   1. 保证.{0,8}(成交|涨粉|月入|收益|赚|转化)  — 保证 only when followed by conversion/earnings within 8 chars
//   2. 月入\d+万(必|保证|稳)?                   — quantified income claims
//   3. 100%\s*(成交|涨粉|回款|转化|赚)           — absolute conversion/return rate
//   4. 稳赚|包(?:赚|涨粉)|必赚                  — absolute gain idioms
//   5. 必(?:达|赚|成)                           — 必 with explicit earn/achieve suffix (not bare 必)
// NOT matched: 一定程度上, 质量保证, 不保证准确, "act as a bridge"
const OVER_PROMISE_RE =
  /保证.{0,8}?(?:成交|涨粉|月入|收益|赚|转化)|月入\d+万(?:必|保证|稳)?|100%\s*(?:成交|涨粉|回款|转化|赚)|稳赚|包(?:赚|涨粉)|必赚|必(?:达|赚|成)/g;

// F-7 fix: strict phone patterns for OUTPUT scanning only (not input pii-mask).
// pii-mask input side uses a broad PHONE_RE_INTL that catches international numbers with separators —
// that's correct for input scrubbing. But for output scanning we use stricter rules to avoid
// masking business numbers like "预算约5000元" or "月均1500元" (4-10 digit amounts).
// Output phone detection: Chinese 11-digit mobile (1[3-9]XXXXXXXXX) or E.164 international (+XX...).
const STRICT_PHONE_CN_RE = /\b1[3-9]\d{9}\b/g;
const STRICT_PHONE_INTL_RE = /\+\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}\b/g;

/**
 * F-7 fix: strict PII masking for output — only masks Chinese mobile phones (11-digit 1[3-9]X)
 * and E.164 international numbers. Does NOT mask bare 4-10 digit business amounts.
 * Email, ID card, bank card still use the shared maskString (those patterns are precise).
 */
function maskOutputString(text: string): { text: string; hits: Array<{ type: string; count: number }> } {
  // Run full maskString first (handles email, id_card, bank_card, phone_cn correctly)
  // then re-apply strict phone rule to avoid PHONE_RE_INTL over-masking business numbers.
  // Strategy: use maskString but then undo PHONE_RE_INTL's broad match by using our stricter INTL rule.
  // Simpler approach: inline the masks we want in output context.
  const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  const ID_CARD_RE = /\b[1-9]\d{5}(?:18|19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx]\b/g;
  const BANK_CARD_RE = /\b\d{16,19}\b/g;

  const hits: Array<{ type: string; count: number }> = [];
  let out = text;

  const apply = (re: RegExp, type: string, placeholder: string) => {
    const matches = out.match(re);
    if (matches?.length) {
      hits.push({ type, count: matches.length });
      out = out.replace(re, placeholder);
    }
  };

  // Same order as pii-mask (long fixed patterns first to avoid partial matches)
  apply(EMAIL_RE,            'email',      '<EMAIL>');
  apply(ID_CARD_RE,          'id_card',    '<ID_CARD>');
  apply(BANK_CARD_RE,        'bank_card',  '<BANK_CARD>');
  // F-7: strict phone only — 11-digit Chinese mobile or E.164 international (with leading +)
  apply(STRICT_PHONE_CN_RE,  'phone_cn',   '<PHONE>');
  apply(STRICT_PHONE_INTL_RE,'phone_intl', '<PHONE>');

  return { text: out, hits };
}

/**
 * Scans a string for PII and over-promise violations.
 * Returns the sanitized text and a list of violation strings.
 * F-7 fix: uses strict output phone rules (maskOutputString) instead of broad maskString
 * to avoid masking business amounts like "预算约5000元".
 */
export function checkOutput(text: string): { sanitized: string; violations: string[] } {
  // Step 1: PII masking (F-7: strict output phone rules)
  const { text: piiMasked } = maskOutputString(text);

  // Step 2: Over-promise scan on PII-masked text
  const violations: string[] = [];
  const sanitized = piiMasked.replace(OVER_PROMISE_RE, (match) => {
    violations.push(match);
    return '[预计/建议目标]';
  });

  return { sanitized, violations };
}

/**
 * Recursively scans all string fields in an object for PII and over-promise violations.
 * Non-string values are passed through unchanged.
 */
export function scanObjectOutput(obj: Record<string, unknown>): {
  sanitized: Record<string, unknown>;
  violations: string[];
} {
  const allViolations: string[] = [];

  function scan(v: unknown): unknown {
    if (typeof v === 'string') {
      const result = checkOutput(v);
      allViolations.push(...result.violations);
      return result.sanitized;
    }
    if (Array.isArray(v)) return v.map(scan);
    if (v && typeof v === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, val] of Object.entries(v)) out[k] = scan(val);
      return out;
    }
    return v;
  }

  return { sanitized: scan(obj) as Record<string, unknown>, violations: allViolations };
}
