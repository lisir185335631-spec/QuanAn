/**
 * G77 · output-guardrail — LLM output compliance scanner
 * L3 marketing compliance: PII masking + over-promise detection + Ad Law superlative detection
 *
 * checkOutput(text): { sanitized, violations }
 * - PII: runs pii-mask on the text
 * - Over-promise regex: detects quantified/absolute marketing guarantees only
 *   F-3 fix: narrowed to require earnings/conversion context or quantification near promise words.
 *   Bare 保证/一定/必 without a monetization/conversion qualifier no longer trigger
 *   (avoids false positives on "一定程度上" / "质量保证" / "不保证准确")
 * - Ad Law (广告法第九条) superlative detection: detects absolute/extreme terms banned by PRC Ad Law
 *   G71 fix: covers 9 categories of 绝对化用语 with narrowing to avoid false positives on
 *   ordinal/sequential uses like "第一步" / "最后一条" / "最近的问题"
 * - Softens matched promises: replaces with softer alternatives
 * - Does NOT integrate banned-word service (remote webhook, not suitable for synchronous output scan)
 */

// F-7: output-guardrail uses its own strict phone rules (maskOutputString below)
// rather than the broad pii-mask input functions, to avoid masking business amounts.

// G71: 广告法第九条 绝对化用语极限词 patterns
// 9 categories with context-narrowing to avoid false positives.
//
// Narrowing rules (similar to F-3 over-promise approach):
//   - 第一: must be preceded by non-ordinal context (exclude: 第一步/第一次/第一个/第一章/第一节/第一轮/第一关)
//     Pattern: 第一 only when followed by 品牌/名/位 or when preceded by 全网/行业/品类/市场/全国/全球
//   - 最: exclude 最近/最后/最终/最多用于/最少/最大/最小 when used as quantity/time descriptors
//     Include: 最好/最佳/最优/最强/最快/最便宜/最低价/最高端/最专业 as marketing superlatives
//   - 国家级/国际级: flag as absolute claim (genuinely rare in legit content)
//   - 唯一/独家/专属: flag when used as marketing exclusivity claims
//   - 史无前例/空前绝后/前所未有/绝无仅有: idioms always absolute
//   - 顶级/极致/完美/卓越: flag when preceding 品质/体验/效果/服务 (marketing superlative context)
//   - 全网/全国/全球 + 最: combined absolute claim
//   - 领先/领导: flag only when 全国/行业/全球 precedes (absolute market claim)
//
// NOT matched (false positive avoidance):
//   第一步, 第一次, 第一个, 第一章, 第一节 (ordinal/sequential)
//   最近, 最后, 最终, 最多(数量), 最少, 最大(尺寸), 最小 (non-marketing quantity/time)
//   国家级别(administrative context without marketing connotation alone)
//   唯一问题, 独家报道(news/journalism usage — but marketing contexts still caught)

const AD_LAW_PATTERNS: Array<{ re: RegExp; label: string }> = [
  // Category 1: 国家级/国际级/世界级 — explicit governmental/global scope claims
  {
    re: /(?:国家级|国际级|世界级|全球级)(?:品质|标准|服务|产品|品牌|认证|技术|水准|水平)/g,
    label: '国家级/世界级绝对化',
  },

  // Category 2: 排他性 — 第一/唯一/独家 (narrowed)
  // 第一: only catch "全网第一", "行业第一", "品类第一", "市场第一", "全国第一", "全球第一"
  // G71 fix: also exclude 届季批系列 to avoid false positive on "全国第一届/全球第一批"
  {
    re: /(?:全网|行业|品类|市场|全国|全球|销量|口碑)第一(?![步次个章节轮关期天月年届季批系列])/g,
    label: '排他性极限词-第一',
  },
  // 唯一/独家: catch marketing exclusivity but NOT "唯一问题"/"唯一方式是" in non-marketing contexts
  // Narrowing: require it to precede/follow 品牌/产品/服务/渠道/供应商/代理/平台/授权/配方/技术
  {
    re: /唯一(?:品牌|产品|服务|渠道|供应商|代理|平台|授权|配方|技术|合作|入口|通道)|(?:品牌|产品|服务|渠道|供应商|代理|平台|授权|配方|技术|合作|入口|通道)唯一/g,
    label: '排他性极限词-唯一',
  },
  {
    re: /独家(?:品牌|产品|服务|配方|技术|授权|代理|供应|渠道|秘方|合作|入口)|(?:品牌|产品|服务|配方|技术|授权|代理|供应|渠道|秘方|合作|入口)独家/g,
    label: '排他性极限词-独家',
  },

  // Category 3: 最高级形容词 — 最好/最佳/最优/最强/最快/最便宜/最低价/最高端/最专业
  // G71 fix: require commercial noun context to avoid false positive on "最专业的建议/最佳实践/最好的方法/最快提升"
  // Must be followed by (optional 的) + commercial noun from the set below.
  // This means "最专业的建议" does NOT trigger (建议 is not in the noun set),
  // but "最专业的服务" DOES trigger (服务 is in the noun set).
  {
    re: /最(?:好|佳|优|强|快|便宜|低价|高端|专业|权威|先进|顶尖|完美|卓越|出色)的?(?:品牌|产品|商品|服务|效果|品质|质量|价格|配方|技术|工艺|体验|口碑|平台|课程)/g,
    label: '最高级形容词',
  },
  // 全网最 + superlative (combined absolute)
  {
    re: /(?:全网|全国|全球|行业|市场)最(?:低|高|便宜|贵|优惠|快|慢|好|强)/g,
    label: '全网/全国+最高级绝对化',
  },

  // Category 4: 顶级/极致 + 品质/效果/服务/体验 (marketing superlative context)
  {
    re: /(?:顶级|极致|完美|卓绝|无与伦比|登峰造极|炉火纯青)(?:品质|效果|服务|体验|技术|工艺|配方|成分)/g,
    label: '顶级/极致程度绝对化',
  },
  // 品质/效果/服务 + 顶级/极致 (post-noun position)
  // G71 fix: 一流 removed from post-noun list — "服务一流/体验一流" is normal marketing phrasing, not extreme
  {
    re: /(?:品质|效果|服务|体验|技术|工艺|配方|成分)(?:顶级|极致|完美|无双)/g,
    label: '顶级/极致程度绝对化(后置)',
  },

  // Category 5: 史无前例/绝无仅有类成语 — always absolute, no narrowing needed
  // 遥遥领先 added: confirmed enforcement cases (华为 trademark case + regulator citations)
  {
    re: /史无前例|空前绝后|前所未有|绝无仅有|亘古未有|古往今来(?:之最|第一)|旷世(?:之作|奇才|罕见)|遥遥领先/g,
    label: '史无前例类绝对化成语',
  },

  // Category 6: 全国/行业领导/领先 (absolute market leadership claim)
  {
    re: /(?:全国|全球|行业|市场|领域)(?:领先|领导|领跑)(?:品牌|企业|平台|产品|服务)/g,
    label: '市场领导地位绝对化',
  },

  // Category 7: 极限/封顶类 — 最低价格 / 价格最低 / 零差价 / 买贵退差
  {
    re: /(?:最低价格|价格最低|历史最低价|史上最低|全网最低|保证最低|最优惠价格|绝对低价)/g,
    label: '价格极限词',
  },

  // Category 8: 无敌/无与伦比 — G71 fix: require commercial noun suffix (non-optional)
  // "无敌" / "天下第一" bare do NOT trigger; "无敌品质" / "天下第一品牌" DO trigger.
  // "无可替代" bare also excluded — e.g. "无可替代的人才优势" should not flag.
  {
    re: /(?:无敌|无可比拟|无可替代|举世无双|天下无双|独步天下|天下第一)(?:品质|服务|产品|效果|技术|配方|体验|口感|品牌)/g,
    label: '无敌/无可比拟绝对化',
  },

  // Category 9: 纯正/正宗 with superlative (common in food/beauty marketing abuse)
  {
    re: /(?:最正宗|最纯正|唯一正宗|绝对纯正|百分百纯正|百分之百正宗)/g,
    label: '正宗/纯正绝对化',
  },
];

/**
 * G71: Detects 广告法第九条 绝对化用语 (Ad Law superlative terms) in marketing text.
 * Returns violations with type='ad_law_superlative'.
 * Narrowing avoids false positives: ordinal 第一步/次/个, time 最近/最后/最终, quantity 最多/最少/最大/最小.
 */
export function detectAdLawViolation(text: string): Array<{ type: string; match: string; label: string }> {
  const violations: Array<{ type: string; match: string; label: string }> = [];
  for (const { re, label } of AD_LAW_PATTERNS) {
    // Reset lastIndex since all patterns use /g flag
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      violations.push({ type: 'ad_law_superlative', match: m[0], label });
    }
  }
  return violations;
}

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
  const afterOverPromise = piiMasked.replace(OVER_PROMISE_RE, (match) => {
    violations.push(match);
    return '[预计/建议目标]';
  });

  // Step 3: G71 — 广告法第九条 绝对化用语 scan
  // Softens matched terms with [广告法合规建议替换] placeholder and records violation.
  // Runs after over-promise so both categories are independently caught.
  let sanitized = afterOverPromise;
  const adLawViolations = detectAdLawViolation(afterOverPromise);
  if (adLawViolations.length > 0) {
    // Build a combined replacement regex from all matched terms (escaped, longest first to avoid partial clobber)
    const matchedTerms = [...new Set(adLawViolations.map((v) => v.match))].sort(
      (a, b) => b.length - a.length,
    );
    for (const term of matchedTerms) {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      sanitized = sanitized.replace(new RegExp(escaped, 'g'), '[合规替换]');
    }
    for (const v of adLawViolations) {
      violations.push(`[ad_law_superlative:${v.label}] ${v.match}`);
    }
  }

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
