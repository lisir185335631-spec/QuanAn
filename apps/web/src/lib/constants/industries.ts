/**
 * QuanAn · 56 行业常量 (5 大类) — Step 1 字面锁
 * 命名锁: STEP1_TABS / STEP1_INDUSTRIES_56 / STEP1_SEARCH_PLACEHOLDER / STEP1_CTA_LABEL / STEP1_CUSTOM_*
 * D1=A 红线: 所有字面量 1:1 来源 aiipznt-spec.md §7.1 + aiipznt-deep-dom-dump.md §2.2, 禁止改写
 */

export type IndustryCategory = '生活服务' | '电商零售' | '内容创作' | '专业服务' | '产业制造';

export interface Industry {
  id: string;
  label: string;
  emoji: string;
  category: IndustryCategory;
  keywords?: readonly string[];
}

export interface Step1Tab {
  id: string;
  label: string;
  count: number;
  emoji: string;
}

// ── Step 1 字面常量 (D1=A 严锁 · 禁止改写) ──────────────────────────────────
export const STEP1_SEARCH_PLACEHOLDER = '搜索行业名称或关键词（如：美容院、餐饮、教育...）' as const;
export const STEP1_CTA_LABEL = '生成行业洞察' as const;
export const STEP1_NEXT_LABEL = '进入 IP 定位 →' as const;
export const STEP1_CTA_DISABLED_HINT = '请先选择一个行业' as const;
export const STEP1_CUSTOM_TRIGGER_LABEL = '自定义输入行业' as const;
export const STEP1_CUSTOM_MODAL_TITLE = '自定义你的行业' as const;
export const STEP1_CUSTOM_MODAL_PLACEHOLDER = '请输入你的行业名称' as const;
export const STEP1_CUSTOM_MODAL_CONFIRM = '确认使用' as const;
export const STEP1_CUSTOM_MODAL_CANCEL = '取消' as const;

// ── Step 1 tabs: 全部行业(56) + 5 大类 ──────────────────────────────────────
export const STEP1_TABS: readonly Step1Tab[] = [
  { id: 'all',    label: '全部行业', count: 56, emoji: '🌐' },
  { id: 'life',   label: '生活服务', count: 18, emoji: '🏠' },
  { id: 'ecom',   label: '电商零售', count: 13, emoji: '🛒' },
  { id: 'create', label: '内容创作', count: 7,  emoji: '✍️' },
  { id: 'pro',    label: '专业服务', count: 14, emoji: '💼' },
  { id: 'mfg',    label: '产业制造', count: 4,  emoji: '🏭' },
] as const;

// ── 56 行业完整列表 (字面 1:1 · 数字锁 · 顺序锁) ────────────────────────────
export const STEP1_INDUSTRIES_56: readonly Industry[] = [
  // 🏠 生活服务 (18)
  { id: 'beauty',         emoji: '💅', label: '美业',       category: '生活服务', keywords: ['美容院', '美发', '美甲', '美睫', '纹绣'] },
  { id: 'cosmetics',      emoji: '💄', label: '美妆护肤',   category: '生活服务' },
  { id: 'food',           emoji: '🍜', label: '餐饮美食',   category: '生活服务', keywords: ['餐饮', '美食', '餐厅', '外卖'] },
  { id: 'tea_coffee',     emoji: '☕', label: '茶饮咖啡',   category: '生活服务' },
  { id: 'liquor',         emoji: '🍷', label: '酒水',       category: '生活服务' },
  { id: 'health',         emoji: '🏥', label: '健康养生',   category: '生活服务' },
  { id: 'medical',        emoji: '🩺', label: '医疗健康',   category: '生活服务' },
  { id: 'psychology',     emoji: '🧠', label: '心理咨询',   category: '生活服务' },
  { id: 'fitness',        emoji: '💪', label: '运动健身',   category: '生活服务' },
  { id: 'sports',         emoji: '⚽', label: '体育运动',   category: '生活服务' },
  { id: 'baby_parenting', emoji: '👶', label: '母婴亲子',   category: '生活服务' },
  { id: 'travel',         emoji: '✈️', label: '旅游出行',   category: '生活服务' },
  { id: 'pet',            emoji: '🐾', label: '宠物',       category: '生活服务' },
  { id: 'wedding',        emoji: '💍', label: '婚庆婚嫁',   category: '生活服务' },
  { id: 'local',          emoji: '📍', label: '本地生活',   category: '生活服务' },
  { id: 'cleaning',       emoji: '🧹', label: '家政服务',   category: '生活服务' },
  { id: 'logistics',      emoji: '📦', label: '物流快递',   category: '生活服务' },
  { id: 'auto_service',   emoji: '🔧', label: '汽车服务',   category: '生活服务' },

  // 🛒 电商零售 (13)
  { id: 'apparel',        emoji: '👗', label: '服装穿搭',   category: '电商零售' },
  { id: 'luxury',         emoji: '👜', label: '奢侈品',     category: '电商零售' },
  { id: 'shoes_bags',     emoji: '👟', label: '鞋靴箱包',   category: '电商零售' },
  { id: 'auto',           emoji: '🚗', label: '汽车',       category: '电商零售' },
  { id: 'ecommerce',      emoji: '🛒', label: '电商零售',   category: '电商零售' },
  { id: 'fresh',          emoji: '🥬', label: '生鲜配送',   category: '电商零售' },
  { id: 'home_appliance', emoji: '📺', label: '家电',       category: '电商零售' },
  { id: 'home',           emoji: '🛋️', label: '家装家居',   category: '电商零售' },
  { id: 'jewelry',        emoji: '💎', label: '珠宝饰品',   category: '电商零售' },
  { id: 'supplement',     emoji: '💊', label: '营养保健',   category: '电商零售' },
  { id: 'daily',          emoji: '🧴', label: '日用百货',   category: '电商零售' },
  { id: 'books',          emoji: '📖', label: '图书文创',   category: '电商零售' },
  { id: 'second_hand',    emoji: '♻️', label: '二手闲置',   category: '电商零售' },

  // ✍️ 内容创作 (7)
  { id: 'self_media',     emoji: '📲', label: '自媒体运营', category: '内容创作' },
  { id: 'photo',          emoji: '📷', label: '摄影摄像',   category: '内容创作' },
  { id: 'design',         emoji: '🎨', label: '设计创意',   category: '内容创作' },
  { id: 'game',           emoji: '🎮', label: '游戏',       category: '内容创作' },
  { id: 'entertainment',  emoji: '🎬', label: '娱乐',       category: '内容创作' },
  { id: 'media',          emoji: '📰', label: '文化传媒',   category: '内容创作' },
  { id: 'social',         emoji: '❤️', label: '情感社交',   category: '内容创作' },

  // 💼 专业服务 (14)
  { id: 'edu',            emoji: '📚', label: '教育培训',   category: '专业服务', keywords: ['教育', '培训', '课程'] },
  { id: 'k12',            emoji: '🎒', label: 'K12教育',    category: '专业服务' },
  { id: 'preschool',      emoji: '🧒', label: '早教托育',   category: '专业服务' },
  { id: 'art_edu',        emoji: '🎨', label: '艺术培训',   category: '专业服务' },
  { id: 'language',       emoji: '🌍', label: '语言培训',   category: '专业服务' },
  { id: 'it_edu',         emoji: '💻', label: 'IT培训',     category: '专业服务' },
  { id: 'real_estate',    emoji: '🏠', label: '房产',       category: '专业服务' },
  { id: 'finance',        emoji: '💰', label: '金融理财',   category: '专业服务' },
  { id: 'tech',           emoji: '📱', label: '科技数码',   category: '专业服务' },
  { id: 'law',            emoji: '⚖️', label: '法律咨询',   category: '专业服务' },
  { id: 'franchise',      emoji: '🤝', label: '招商加盟',   category: '专业服务' },
  { id: 'recruitment',    emoji: '👔', label: '人力招聘',   category: '专业服务' },
  { id: 'enterprise',     emoji: '🏢', label: '企业服务',   category: '专业服务' },
  { id: 'gov',            emoji: '🏛️', label: '政务公益',   category: '专业服务' },

  // 🏭 产业制造 (4)
  { id: 'agriculture',    emoji: '🌾', label: '农业农村',   category: '产业制造' },
  { id: 'manufacturing',  emoji: '🏭', label: '工业制造',   category: '产业制造' },
  { id: 'construction',   emoji: '🏗️', label: '建筑工程',   category: '产业制造' },
  { id: 'other',          emoji: '🔧', label: '其他行业',   category: '产业制造' },
];

// ── 向后兼容别名 (IndustryDropdown 等现有消费方) ────────────────────────────
export const INDUSTRIES: readonly Industry[] = STEP1_INDUSTRIES_56;

export const INDUSTRY_CATEGORIES: readonly IndustryCategory[] = [
  '生活服务',
  '电商零售',
  '内容创作',
  '专业服务',
  '产业制造',
];

export const INDUSTRY_CATEGORY_EMOJI: Record<IndustryCategory, string> = {
  '生活服务': '🏠',
  '电商零售': '🛒',
  '内容创作': '✍️',
  '专业服务': '💼',
  '产业制造': '🏭',
};

// PRD-20 TD-80 fix: Step1Result 结果区 heading 常量
export const STEP1_RESULT_H2 = '行业洞察报告' as const;
export const STEP1_RESULT_H3_3 = ['市场分析', '竞争程度', '定位建议'] as const;
