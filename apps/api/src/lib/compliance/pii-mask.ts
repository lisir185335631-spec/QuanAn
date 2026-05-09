/**
 * QuanQn · PII 脱敏(LD-018 · R-14 · ADR-018)
 * 派生自 PROMPTS.md §0.6 + AGENTS §3 LD-018
 *
 * ContextAssembler 在拼 prompt 前必跑 · 防 PII 入 LLM
 */

const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const PHONE_RE_CN = /\b1[3-9]\d{9}\b/g;
const PHONE_RE_INTL = /\b\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}\b/g;
const ID_CARD_RE = /\b[1-9]\d{5}(?:18|19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx]\b/g;
const BANK_CARD_RE = /\b\d{16,19}\b/g;

export interface PiiMaskResult {
  text: string;
  hits: Array<{ type: string; count: number }>;
}

/** 字符串脱敏 */
export function maskString(input: string): PiiMaskResult {
  const hits: Array<{ type: string; count: number }> = [];
  let text = input;

  const apply = (re: RegExp, type: string, placeholder: string) => {
    const matches = text.match(re);
    if (matches?.length) {
      hits.push({ type, count: matches.length });
      text = text.replace(re, placeholder);
    }
  };

  apply(EMAIL_RE,      'email',      '<EMAIL>');
  apply(PHONE_RE_CN,   'phone_cn',   '<PHONE>');
  apply(PHONE_RE_INTL, 'phone_intl', '<PHONE>');
  apply(ID_CARD_RE,    'id_card',    '<ID_CARD>');
  apply(BANK_CARD_RE,  'bank_card',  '<BANK_CARD>');

  return { text, hits };
}

/** 递归对象脱敏(给 ContextAssembler 用) */
export function piiMask<T>(input: T): T {
  if (typeof input === 'string') {
    return maskString(input).text as unknown as T;
  }
  if (Array.isArray(input)) {
    return (input as unknown[]).map((v: unknown) => piiMask(v)) as unknown as T;
  }
  if (input && typeof input === 'object') {
    // 白名单 · 特殊对象不递归 · 防破坏内部状态
    if (
      input instanceof Date ||
      input instanceof RegExp ||
      input instanceof Map ||
      input instanceof Set ||
      input instanceof Error ||
      (typeof Buffer !== 'undefined' && Buffer.isBuffer(input))
    ) {
      return input;
    }
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input)) out[k] = piiMask(v);
    return out as unknown as T;
  }
  return input;
}
