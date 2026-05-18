// PRD-12 US-003 · PIIDetectionService — local regex-based PII scanner
// AC-5: 4 regex (ID_CARD / PHONE_CN / EMAIL / BANK_CARD) · detect returns structured result
// AC-6: redact replaces matches with [X-REDACTED] placeholders for audit + UI
// No external API — privacy by design

export interface PIIDetectResult {
  idCards: string[];
  phones: string[];
  emails: string[];
  bankCards: string[];
  total: number;
}

// 18-digit Chinese national ID (last char may be X)
const RE_ID_CARD = /\b\d{17}[\dXx]\b/g;
// Chinese mobile: 1[3-9]\d{9}
const RE_PHONE_CN = /\b1[3-9]\d{9}\b/g;
// Standard email
const RE_EMAIL = /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g;
// 16-19 digit bank card (allow spaces/dashes between groups)
const RE_BANK_CARD = /\b(?:\d[ -]?){15,18}\d\b/g;

function matchAll(text: string, re: RegExp): string[] {
  return Array.from(text.matchAll(re), (m) => m[0]);
}

export class PIIDetectionService {
  detect(text: string): PIIDetectResult {
    const idCards = matchAll(text, RE_ID_CARD);
    const phones = matchAll(text, RE_PHONE_CN);
    const emails = matchAll(text, RE_EMAIL);
    const bankCards = matchAll(text, RE_BANK_CARD);
    const total = idCards.length + phones.length + emails.length + bankCards.length;
    return { idCards, phones, emails, bankCards, total };
  }

  redact(text: string): string {
    return text
      .replace(RE_ID_CARD, '[ID-REDACTED]')
      .replace(RE_PHONE_CN, '[PHONE-REDACTED]')
      .replace(RE_EMAIL, '[EMAIL-REDACTED]')
      .replace(RE_BANK_CARD, '[CARD-REDACTED]');
  }
}

// AC-7: singleton export
export const piiDetectionService = new PIIDetectionService();
