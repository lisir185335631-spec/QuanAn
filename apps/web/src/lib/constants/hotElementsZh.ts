/**
 * hotElementsZh — 22 爆款元素中文映射 · PRD-5 US-010
 * Manually synced with packages/schemas/src/specialist-io/constants.ts HOT_ELEMENT_LABELS
 * audit grep diff: grep -n "greed\|fear\|curiosity" packages/schemas/src/specialist-io/constants.ts
 */

export const HOT_ELEMENTS_ZH = {
  greed: '贪念',
  fear: '恐惧',
  curiosity: '猎奇',
  contrast: '反差',
  resonance: '共鸣',
  empathy: '共情',
  social_proof: '社会证明',
  authority: '权威',
  leverage: '借势',
  worst: '最差',
  reveal: '揭秘',
  controversy: '争议',
  challenge: '挑战',
  transformation: '蜕变',
  anger: '愤怒',
  surprise: '惊喜',
  trend: '热点',
  list: '清单',
  scarcity: '稀缺',
  small_big: '以小搏大',
  low_cost_high: '低成本高回报',
  low_cost_unknown: '低成本未知回报',
} as const satisfies Record<string, string>;

export type HotElementZhKey = keyof typeof HOT_ELEMENTS_ZH;
