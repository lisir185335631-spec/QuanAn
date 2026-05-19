/**
 * QuanAn · 22 爆款元素(4 组)
 * 派生自 ARCHITECTURE.md §3.6 + spec.md §Ⅹ.2 实测
 *
 * 注 · 实测含 11+2+6+4=23 项 · 部分 emoji 重复 · 去重后约 22 个
 */

export type ElementGroup = 'classic' | 'emotion' | 'content' | 'conversion';

export interface HotElement {
  key: string;
  label: string;
  emoji: string;
  group: ElementGroup;
  /** 心理学解释 · CopywritingAgent 注入 prompt 时引用 */
  psychology: string;
}

export const HOT_ELEMENTS: readonly HotElement[] = [
  // 经典元素(11)
  { key: 'greed',            emoji: '💰', label: '贪念',           group: 'classic', psychology: '激发利益最大化的欲望 · 让用户想"我也要" · 适合财富 / 收益类话题' },
  { key: 'fear',             emoji: '😨', label: '恐惧',           group: 'classic', psychology: '激发对损失 / 落后的本能反应 · 比正向激励更有效 · 但用过度反感' },
  { key: 'curiosity',        emoji: '🔍', label: '猎奇',           group: 'classic', psychology: '人天然好奇"未知的细节 / 内幕"· 留悬念让用户停留' },
  { key: 'contrast',         emoji: '🔄', label: '反差',           group: 'classic', psychology: '前后对比制造张力 · "他原来是 X · 现在是 Y" · 强化变化感' },
  { key: 'worst',            emoji: '⚠️', label: '最差',           group: 'classic', psychology: '"避免最坏"是最强动机 · 比"追求最好"更刺激行动' },
  { key: 'leverage',         emoji: '🔥', label: '借势',           group: 'classic', psychology: '蹭热点话题 · 借公共注意力的势 · 短期流量大 · 但需差异化' },
  { key: 'resonance',        emoji: '💬', label: '共鸣',           group: 'classic', psychology: '说出用户心里话 · 让他点头 · 评论区会出现"说出我的心声"' },
  { key: 'empathy',          emoji: '🤝', label: '共情',           group: 'classic', psychology: '展示真实情感 / 处境 · 让用户感受到被理解' },
  { key: 'small_big',        emoji: '🎯', label: '以小搏大',       group: 'classic', psychology: '小投入大回报 · 杠杆效应 · 适合方法论 / 投资 / 学习' },
  { key: 'low_cost_high',    emoji: '📈', label: '低成本高回报',    group: 'classic', psychology: '免费 / 低价 + 高价值的对比 · 制造"白嫖"的快感' },
  { key: 'low_cost_unknown', emoji: '🎰', label: '低成本未知回报',  group: 'classic', psychology: '小赌博心理 · 投入低 · 但有惊喜可能 · 适合内容尝鲜' },

  // 情绪驱动(2)
  { key: 'anger',            emoji: '😡', label: '愤怒',           group: 'emotion', psychology: '集体义愤激发分享欲 · 但要把火指向"系统/不公"· 不指向具体人' },
  { key: 'surprise',         emoji: '😲', label: '惊喜',           group: 'emotion', psychology: '反预期带来快乐 · 适合"反转结局" / "意外发现"' },

  // 内容策略(6)
  { key: 'trend',            emoji: '🔥', label: '热点',           group: 'content', psychology: '蹭最新事件 · 平台算法偏好新热点 · 短期推流量' },
  { key: 'controversy',      emoji: '💬', label: '争议',           group: 'content', psychology: '可辩论的话题 · 激发评论 · 但不要二元对立' },
  { key: 'reveal',           emoji: '🔓', label: '揭秘',           group: 'content', psychology: '"内幕 / 真相"满足窥探欲 · 用具体证据支撑' },
  { key: 'list',             emoji: '📋', label: '清单',           group: 'content', psychology: '信息密度高 · 收藏率高 · "5 个 / 10 个"是流量数字' },
  { key: 'challenge',        emoji: '🎯', label: '挑战',           group: 'content', psychology: '设定难度 · 用户愿意围观结果 · 适合"30 天 X"系列' },
  { key: 'transformation',   emoji: '🦋', label: '蜕变',           group: 'content', psychology: '前后对比 + 时间维度 · 励志 + 真实感强' },

  // 转化驱动(4)
  { key: 'scarcity',         emoji: '⏳', label: '稀缺',           group: 'conversion', psychology: '"仅剩 X 名 / 仅 X 天"激发紧迫感 · 但不要假装稀缺' },
  { key: 'social_proof',     emoji: '👍', label: '社会证明',        group: 'conversion', psychology: '"已有 X 万人选择"利用从众心理 · 配真实数据' },
  { key: 'authority',        emoji: '🎓', label: '权威',           group: 'conversion', psychology: '专家 / 机构背书降低决策门槛 · 引用真实资历' },
  { key: 'benefit',          emoji: '🎁', label: '利益',           group: 'conversion', psychology: '直接说"你能得到什么" · FABE 模型的 B 段' },
] as const;

export const HOT_ELEMENT_KEYS = HOT_ELEMENTS.map((e) => e.key) as readonly string[];

export const HOT_ELEMENT_BY_KEY: Record<string, HotElement> = HOT_ELEMENTS.reduce(
  (acc, e) => ({ ...acc, [e.key]: e }),
  {} as Record<string, HotElement>,
);

export const HOT_ELEMENTS_BY_GROUP: Record<ElementGroup, readonly HotElement[]> = HOT_ELEMENTS.reduce(
  (acc, e) => {
    acc[e.group] = [...(acc[e.group] ?? []), e];
    return acc;
  },
  {} as Record<ElementGroup, HotElement[]>,
);

// === 自检 · 22 元素 ===
if (HOT_ELEMENTS.length < 22 || HOT_ELEMENTS.length > 23) {
  throw new Error(`Expected 22-23 hot elements, got ${HOT_ELEMENTS.length}`);
}
