/**
 * QuanQn · 56 行业常量 (5 大类) — web 端副本
 * 派生自 apps/api/src/lib/constants/industries.ts
 */

export type IndustryCategory = '生活服务' | '电商零售' | '内容创作' | '专业服务' | '产业制造';

export interface Industry {
  key: string;
  label: string;
  emoji: string;
  category: IndustryCategory;
  keywords?: readonly string[];
}

export const INDUSTRIES: readonly Industry[] = [
  // 🏠 生活服务(18)
  { key: 'beauty',         emoji: '💅', label: '美业',      category: '生活服务', keywords: ['美容院', '美发', '美甲', '美睫', '纹绣'] },
  { key: 'cosmetics',      emoji: '💄', label: '美妆护肤',  category: '生活服务' },
  { key: 'food',           emoji: '🍜', label: '餐饮美食',  category: '生活服务' },
  { key: 'tea_coffee',     emoji: '☕', label: '茶饮咖啡',  category: '生活服务' },
  { key: 'liquor',         emoji: '🍷', label: '酒水',      category: '生活服务' },
  { key: 'health',         emoji: '🏥', label: '健康养生',  category: '生活服务' },
  { key: 'medical',        emoji: '🩺', label: '医疗健康',  category: '生活服务' },
  { key: 'psychology',     emoji: '🧠', label: '心理咨询',  category: '生活服务' },
  { key: 'fitness',        emoji: '💪', label: '运动健身',  category: '生活服务' },
  { key: 'sports',         emoji: '⚽', label: '体育运动',  category: '生活服务' },
  { key: 'baby_parenting', emoji: '👶', label: '母婴亲子',  category: '生活服务' },
  { key: 'travel',         emoji: '✈️', label: '旅游出行',  category: '生活服务' },
  { key: 'pet',            emoji: '🐾', label: '宠物',      category: '生活服务' },
  { key: 'wedding',        emoji: '💍', label: '婚庆婚嫁',  category: '生活服务' },
  { key: 'local',          emoji: '📍', label: '本地生活',  category: '生活服务' },
  { key: 'cleaning',       emoji: '🧹', label: '家政服务',  category: '生活服务' },
  { key: 'logistics',      emoji: '📦', label: '物流快递',  category: '生活服务' },
  { key: 'auto_service',   emoji: '🔧', label: '汽车服务',  category: '生活服务' },

  // 🛒 电商零售(13)
  { key: 'apparel',        emoji: '👗', label: '服装穿搭',  category: '电商零售' },
  { key: 'luxury',         emoji: '👜', label: '奢侈品',    category: '电商零售' },
  { key: 'shoes_bags',     emoji: '👟', label: '鞋靴箱包',  category: '电商零售' },
  { key: 'auto',           emoji: '🚗', label: '汽车',      category: '电商零售' },
  { key: 'ecommerce',      emoji: '🛒', label: '电商零售',  category: '电商零售' },
  { key: 'fresh',          emoji: '🥬', label: '生鲜配送',  category: '电商零售' },
  { key: 'home_appliance', emoji: '📺', label: '家电',      category: '电商零售' },
  { key: 'home',           emoji: '🛋️', label: '家装家居',  category: '电商零售' },
  { key: 'jewelry',        emoji: '💎', label: '珠宝饰品',  category: '电商零售' },
  { key: 'supplement',     emoji: '💊', label: '营养保健',  category: '电商零售' },
  { key: 'daily',          emoji: '🧴', label: '日用百货',  category: '电商零售' },
  { key: 'books',          emoji: '📖', label: '图书文创',  category: '电商零售' },
  { key: 'second_hand',    emoji: '♻️', label: '二手闲置',  category: '电商零售' },

  // ✍️ 内容创作(7)
  { key: 'self_media',     emoji: '📲', label: '自媒体运营', category: '内容创作' },
  { key: 'photo',          emoji: '📷', label: '摄影摄像',   category: '内容创作' },
  { key: 'design',         emoji: '🎨', label: '设计创意',   category: '内容创作' },
  { key: 'game',           emoji: '🎮', label: '游戏',       category: '内容创作' },
  { key: 'entertainment',  emoji: '🎬', label: '娱乐',       category: '内容创作' },
  { key: 'media',          emoji: '📰', label: '文化传媒',   category: '内容创作' },
  { key: 'social',         emoji: '❤️', label: '情感社交',   category: '内容创作' },

  // 💼 专业服务(14)
  { key: 'edu',            emoji: '📚', label: '教育培训',   category: '专业服务' },
  { key: 'k12',            emoji: '🎒', label: 'K12教育',    category: '专业服务' },
  { key: 'preschool',      emoji: '🧒', label: '早教托育',   category: '专业服务' },
  { key: 'art_edu',        emoji: '🎨', label: '艺术培训',   category: '专业服务' },
  { key: 'language',       emoji: '🌍', label: '语言培训',   category: '专业服务' },
  { key: 'it_edu',         emoji: '💻', label: 'IT培训',     category: '专业服务' },
  { key: 'real_estate',    emoji: '🏠', label: '房产',       category: '专业服务' },
  { key: 'finance',        emoji: '💰', label: '金融理财',   category: '专业服务' },
  { key: 'tech',           emoji: '📱', label: '科技数码',   category: '专业服务' },
  { key: 'law',            emoji: '⚖️', label: '法律咨询',   category: '专业服务' },
  { key: 'franchise',      emoji: '🤝', label: '招商加盟',   category: '专业服务' },
  { key: 'recruitment',    emoji: '👔', label: '人力招聘',   category: '专业服务' },
  { key: 'enterprise',     emoji: '🏢', label: '企业服务',   category: '专业服务' },
  { key: 'gov',            emoji: '🏛️', label: '政务公益',   category: '专业服务' },

  // 🏭 产业制造(4)
  { key: 'agriculture',    emoji: '🌾', label: '农业农村',   category: '产业制造' },
  { key: 'manufacturing',  emoji: '🏭', label: '工业制造',   category: '产业制造' },
  { key: 'construction',   emoji: '🏗️', label: '建筑工程',   category: '产业制造' },
  { key: 'other',          emoji: '🔧', label: '其他行业',   category: '产业制造' },
];

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
