/**
 * Specialist-IO constants — PRD-5 US-001
 * HOT_ELEMENT_KEYS_22: 22 爆款元素 · 4 组分类
 * SCRIPT_TYPE_KEYS_20: 20 脚本类型
 */

// ── 22 爆款元素 · 4 组分类 ─────────────────────────────────────────────────────

/** 心理唤起 4 */
const PSYCHOLOGICAL_TRIGGER_KEYS = [
  'greed',
  'fear',
  'curiosity',
  'contrast',
] as const;

/** 社会心理 6 */
const SOCIAL_PSYCHOLOGY_KEYS = [
  'resonance',
  'empathy',
  'social_proof',
  'authority',
  'leverage',
  'worst',
] as const;

/** 修辞结构 6 */
const RHETORIC_STRUCTURE_KEYS = [
  'reveal',
  'controversy',
  'challenge',
  'transformation',
  'anger',
  'surprise',
] as const;

/** 信息密度 6 */
const INFORMATION_DENSITY_KEYS = [
  'trend',
  'list',
  'scarcity',
  'small_big',
  'low_cost_high',
  'low_cost_unknown',
] as const;

/** 22 爆款元素 keys (心理唤起4 + 社会心理6 + 修辞结构6 + 信息密度6) */
export const HOT_ELEMENT_KEYS_22 = [
  ...PSYCHOLOGICAL_TRIGGER_KEYS,
  ...SOCIAL_PSYCHOLOGY_KEYS,
  ...RHETORIC_STRUCTURE_KEYS,
  ...INFORMATION_DENSITY_KEYS,
] as const;

export type HotElementKey = (typeof HOT_ELEMENT_KEYS_22)[number];

/** 4 组分类 metadata (for UI grouping) */
export const HOT_ELEMENT_GROUPS = [
  { key: 'psychological', label: '心理唤起', keys: PSYCHOLOGICAL_TRIGGER_KEYS },
  { key: 'social', label: '社会心理', keys: SOCIAL_PSYCHOLOGY_KEYS },
  { key: 'rhetoric', label: '修辞结构', keys: RHETORIC_STRUCTURE_KEYS },
  { key: 'information', label: '信息密度', keys: INFORMATION_DENSITY_KEYS },
] as const satisfies ReadonlyArray<{
  key: string;
  label: string;
  keys: ReadonlyArray<HotElementKey>;
}>;

/** 元素中文标签映射 */
export const HOT_ELEMENT_LABELS: Record<HotElementKey, string> = {
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
} as const satisfies Record<HotElementKey, string>;

// ── 20 脚本类型 ───────────────────────────────────────────────────────────────

/** 20 脚本类型 keys */
export const SCRIPT_TYPE_KEYS_20 = [
  'tutorial',
  'review',
  'case_study',
  'pov',
  'monologue',
  'debate',
  'list_pop',
  'before_after',
  'street_interview',
  'qa_short',
  'reaction',
  'mixcut',
  'screen_record',
  'animation',
  'vlog',
  'plot',
  'voice_only',
  'comparison',
  'storytelling',
  'duo_chat',
] as const;

export type ScriptTypeKey = (typeof SCRIPT_TYPE_KEYS_20)[number];

/** 脚本类型中文标签映射 */
export const SCRIPT_TYPE_LABELS: Record<ScriptTypeKey, string> = {
  tutorial: '教程演示',
  review: '测评对比',
  case_study: '案例拆解',
  pov: '第一视角',
  monologue: '独白分享',
  debate: '辩论对话',
  list_pop: '盘点合集',
  before_after: '前后对比',
  street_interview: '街头采访',
  qa_short: '问答短片',
  reaction: '跟拍反应',
  mixcut: '混剪创意',
  screen_record: '屏幕录制',
  animation: '动画演示',
  vlog: '日常记录',
  plot: '情节短剧',
  voice_only: '纯声音',
  comparison: '横向对比',
  storytelling: '叙事故事',
  duo_chat: '双人对话',
} as const satisfies Record<ScriptTypeKey, string>;
