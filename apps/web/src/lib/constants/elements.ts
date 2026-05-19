/**
 * elements.ts — 22 爆款元素 4 组常量 · PRD-22 US-001
 * D1A 字面锁 · spec §Ⅹ.2 · classic(11)/emotion(2)/content(6)/conversion(4)
 */

export interface ElementItem {
  key: string;
  emoji: string;
  label: string;
}

export interface ElementGroup {
  key: 'classic' | 'emotion' | 'content' | 'conversion';
  label: string;
  items: readonly ElementItem[];
}

export const HOT_ELEMENTS = {
  classic: [
    { key: 'greed',           emoji: '💰', label: '贪念' },
    { key: 'fear',            emoji: '😨', label: '恐惧' },
    { key: 'curiosity',       emoji: '🔍', label: '猎奇' },
    { key: 'contrast',        emoji: '🔄', label: '反差' },
    { key: 'worst',           emoji: '⚠️', label: '最差' },
    { key: 'leverage',        emoji: '🔥', label: '借势' },
    { key: 'resonance',       emoji: '💬', label: '共鸣' },
    { key: 'empathy',         emoji: '🤝', label: '共情' },
    { key: 'small_big',       emoji: '🎯', label: '以小搏大' },
    { key: 'low_cost_high',   emoji: '📈', label: '低成本高回报' },
    { key: 'low_cost_unknown',emoji: '🎰', label: '低成本未知回报' },
  ],
  emotion: [
    { key: 'anger',   emoji: '😡', label: '愤怒' },
    { key: 'surprise',emoji: '😲', label: '惊喜' },
  ],
  content: [
    { key: 'trend',         emoji: '🔥', label: '热点' },
    { key: 'controversy',   emoji: '💬', label: '争议' },
    { key: 'reveal',        emoji: '🔓', label: '揭秘' },
    { key: 'list',          emoji: '📋', label: '清单' },
    { key: 'challenge',     emoji: '🎯', label: '挑战' },
    { key: 'transformation',emoji: '🦋', label: '蜕变' },
  ],
  conversion: [
    { key: 'scarcity',    emoji: '⏳', label: '稀缺' },
    { key: 'social_proof',emoji: '👍', label: '社会证明' },
    { key: 'authority',   emoji: '🎓', label: '权威' },
    { key: 'benefit',     emoji: '🎁', label: '利益' },
  ],
} as const;

export const HOT_ELEMENT_GROUPS: readonly ElementGroup[] = [
  { key: 'classic',    label: '经典元素', items: HOT_ELEMENTS.classic },
  { key: 'emotion',    label: '情绪驱动', items: HOT_ELEMENTS.emotion },
  { key: 'content',    label: '内容策略', items: HOT_ELEMENTS.content },
  { key: 'conversion', label: '转化驱动', items: HOT_ELEMENTS.conversion },
];

export const ALL_ELEMENTS: readonly ElementItem[] = [
  ...HOT_ELEMENTS.classic,
  ...HOT_ELEMENTS.emotion,
  ...HOT_ELEMENTS.content,
  ...HOT_ELEMENTS.conversion,
];
