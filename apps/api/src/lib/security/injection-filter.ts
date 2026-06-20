/**
 * QuanAn · Prompt Injection Filter (G74 · tool-arg-guard · 0.7A layer)
 *
 * 防间接 prompt 注入: RAG knowledge_chunks + stepData 可能携带注入模式
 * (如 "忽略以上指令" / "system: 你现在是…")，在进入 ContextAssembler 前拦截。
 *
 * 设计原则:
 * - 替换注入片段为 [已过滤]，保留周围内容语义
 * - 不整体删除字符串(防断句/防上下文丢失)
 * - 正常内容 flagged=false 时完全透传，零改动
 * - F-5 fix: normalize full-width chars + zero-width chars before matching
 */

export interface InjectionFilterResult {
  /** 替换注入片段后的安全文本 */
  sanitized: string;
  /** 是否检测到注入模式 */
  flagged: boolean;
  /** 命中的模式名列表 */
  patterns: string[];
}

// ── 注入模式定义 ──────────────────────────────────────────────────────────────

/**
 * 指令覆盖: 试图让 LLM 忽略之前的系统指令
 * 中英双覆盖
 * F-5 fix: added 忘记(以前|之前|前面|上面)的?(指令|要求|设定) for Chinese "forget" variant
 */
const PATTERN_INSTRUCTION_OVERRIDE = {
  name: 'instruction-override',
  re: /忽略(?:以上|之前|前面)|忘记(?:以前|之前|前面|上面)的?(?:指令|要求|设定)|ignore\s+(?:previous|above|prior)|disregard\s+(?:the\s+)?(?:above|previous)|forget\s+(?:your\s+|the\s+)?instructions/gi,
};

/**
 * 角色劫持: 试图重置 LLM 身份或注入新 system/assistant 块
 * F-4 fix: "act as a/an" narrowed to adversarial/privileged role names only.
 *   Covered roles: admin, administrator, system, developer, root, the assistant,
 *                  DAN, unrestricted, jailbreak, jailbroken, hacker, AI without restrictions, etc.
 *   Bare "act as a bridge", "act as a connector", "act as a liaison" no longer trigger.
 *   Strategy: enumerate known hijack nouns — more precise than a blocklist.
 *
 * RH-09 fix: added |jailbroken to cover irregular past participle "jailbroken"
 *   ("jailbreak(?:ed)?" only matched jailbreak/jailbreaked, not jailbroken).
 */
const PATTERN_ROLE_HIJACK = {
  name: 'role-hijack',
  re: /system\s*[:：]|assistant\s*[:：]|你现在是|从现在起你是|act\s+as\s+(?:a\s+|an\s+)?(?:admin(?:istrator)?|system|developer|root|the\s+assistant|DAN|unrestricted|jailbreak(?:ed)?|jailbroken|hacker|evil|malicious|unfiltered\s+AI|AI\s+without\s+restrictions)|pretend\s+to\s+be|new\s+instructions?\s*[:：]/gi,
};

/**
 * 提示词泄露: 试图让 LLM 输出自身系统提示
 *
 * PL-03 fix: added 告诉我你的(?:所有)?(?:系统)?(?:提示词?|指令) to catch
 *   "告诉我你的所有系统提示" and similar Chinese "tell me your ..." prompt-leak patterns.
 *   Object narrowed to 提示词?|指令 only — avoids false-positives on
 *   "告诉我你的想法/建议/产品" (无注入语义的正常对话).
 *
 * Known soft spot (design trade-off, not fixed):
 *   II-02 "AI系统:" prefix — widening to match 中文 "AI系统:/智能系统:" would
 *   create false positives on marketing copy like "智能系统:xxx功能介绍".
 *   This conflicts with injection-filter's "narrowing over false-positives" design
 *   philosophy (established in F-4/F-5 fixes). The injection-filter operates on
 *   RAG/stepData middle layer; a single indirect injection blind spot is acceptable
 *   since LLM-layer defenses provide additional coverage.
 */
const PATTERN_PROMPT_LEAK = {
  name: 'prompt-leak',
  re: /repeat\s+(?:the\s+)?(?:above|your)\s+(?:instructions|prompt)|print\s+your\s+(?:system\s+)?prompt|输出你的(?:系统)?(?:提示|指令)|告诉我你的(?:所有)?(?:系统)?(?:提示词?|指令)/gi,
};

/**
 * 分隔符逃逸: 试图用代码块语法注入虚假 system/assistant 角色
 * 注意: ``` + system/assistant 或 """ + system/忽略 才命中，普通代码块不命中
 */
const PATTERN_DELIMITER_ESCAPE = {
  name: 'delimiter-escape',
  re: /```\s*(?:system|assistant)|"""\s*(?:system|忽略)/gi,
};

const ALL_PATTERNS = [
  PATTERN_INSTRUCTION_OVERRIDE,
  PATTERN_ROLE_HIJACK,
  PATTERN_PROMPT_LEAK,
  PATTERN_DELIMITER_ESCAPE,
] as const;

const FILTER_PLACEHOLDER = '[已过滤]';

// ── 核心函数 ──────────────────────────────────────────────────────────────────

/**
 * 检测并过滤文本中的 prompt 注入模式。
 *
 * @param text 输入文本(RAG chunk.content / stepData JSON 字符串)
 * @returns { sanitized, flagged, patterns }
 *
 * 行为:
 * - 无注入时: sanitized === text (原文完整透传，不做任何修改), flagged=false, patterns=[]
 * - 有注入时: sanitized 为替换后文本, flagged=true, patterns 含命中名
 *
 * F-5 fix: normalizes full-width characters (NFKC) and removes zero-width chars
 * for DETECTION ONLY — preventing bypass via ｆｕｌｌ-ｗｉｄｔｈ or U+200B insertion.
 * When no injection is found, the ORIGINAL text is returned unchanged (no NFKC side-effect).
 * When injection is found, patterns are replaced in the normalized string (safe — the injection
 * was normalized to ASCII anyway; returning normalized sanitized text is acceptable).
 */
export function detectInjection(text: string): InjectionFilterResult {
  // F-5: Build normalized form for detection only.
  // NFKC: full-width → ASCII (ｓｙｓｔｅｍ → system, ｆ → f, etc.)
  // Zero-width chars: U+200B–U+200F, U+FEFF stripped
  const normalized = text.normalize('NFKC').replace(/[​-‏﻿]/g, '');

  const hitPatterns: string[] = [];

  for (const { name, re } of ALL_PATTERNS) {
    // 重置 lastIndex 保证每次从头匹配(全局正则复用时必须)
    re.lastIndex = 0;
    if (re.test(normalized)) {
      hitPatterns.push(name);
    }
  }

  if (hitPatterns.length === 0) {
    // No injection detected → return original text UNCHANGED (zero side-effects on clean input)
    return { sanitized: text, flagged: false, patterns: [] };
  }

  // Injection detected → apply replacements on normalized form
  // (full-width bypass chars already gone; normalized string is safe to return)
  let sanitized = normalized;
  for (const { name, re } of ALL_PATTERNS) {
    if (hitPatterns.includes(name)) {
      re.lastIndex = 0;
      sanitized = sanitized.replace(re, FILTER_PLACEHOLDER);
    }
  }

  return {
    sanitized,
    flagged: true,
    patterns: hitPatterns,
  };
}
