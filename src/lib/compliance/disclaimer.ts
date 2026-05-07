/**
 * QuanQn · 行业免责声明(LD-018 · R-14 · ADR-018)
 * 派生自 PROMPTS §3.6 + AGENTS §3 LD-018
 *
 * 敏感行业 Specialist 输出后必跑 · 自动加底部免责
 */

import { isSensitiveIndustry } from '@/lib/constants/industries';

const DISCLAIMERS = {
  medical: '\n\n---\n*本内容仅供参考 · 不构成医疗建议 · 具体诊疗请咨询执业医师*',
  legal:   '\n\n---\n*本内容仅供参考 · 不构成法律意见 · 具体事项请咨询执业律师*',
  finance: '\n\n---\n*本内容仅供参考 · 不构成投资建议 · 投资有风险 · 决策需谨慎*',
} as const;

/** 给 markdown 内容加底部免责(根据 industry 自动判断) */
export function appendDisclaimerIfSensitive(content: string, industry: string): string {
  const sensitive = isSensitiveIndustry(industry);
  if (!sensitive) return content;
  return content + DISCLAIMERS[sensitive];
}

/** 给 JSON 结构加 _disclaimer 字段(给前端单独渲染) */
export function attachDisclaimerMeta<T extends Record<string, unknown>>(
  result: T,
  industry: string,
): T & { _disclaimer?: string } {
  const sensitive = isSensitiveIndustry(industry);
  if (!sensitive) return result;
  return { ...result, _disclaimer: DISCLAIMERS[sensitive] };
}
