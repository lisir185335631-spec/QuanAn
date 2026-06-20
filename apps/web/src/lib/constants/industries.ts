/**
 * QuanAn · 56 行业常量 (5 大类) — Step 1 字面锁
 * 命名锁: STEP1_TABS / STEP1_INDUSTRIES_56 / STEP1_SEARCH_PLACEHOLDER / STEP1_CTA_LABEL / STEP1_CUSTOM_*
 * D1=A 红线: 所有字面量 1:1 来源 aiipznt-spec.md §7.1 + aiipznt-deep-dom-dump.md §2.2, 禁止改写
 */

export type IndustryCategory = '生活服务' | '电商零售' | '内容创作' | '专业服务' | '产业制造';

export interface SubIndustry {
  id: string;
  label: string;
}

export interface Industry {
  id: string;
  label: string;
  emoji: string;
  category: IndustryCategory;
  keywords?: readonly string[];
  subIndustries?: readonly SubIndustry[];
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
  { id: 'beauty',         emoji: '💅', label: '美业',       category: '生活服务', keywords: ['美容院', '美发', '美甲', '美睫', '纹绣'], subIndustries: [{ id: 'beauty_salon', label: '美容院' }, { id: 'hair', label: '美发' }, { id: 'nail', label: '美甲' }, { id: 'lash', label: '美睫' }, { id: 'tattoo', label: '纹绣' }, { id: 'other', label: '其他' }] },
  { id: 'cosmetics',      emoji: '💄', label: '美妆护肤',   category: '生活服务', subIndustries: [{ id: 'skincare', label: '护肤' }, { id: 'makeup', label: '彩妆' }, { id: 'perfume', label: '香水' }, { id: 'tools', label: '美妆工具' }, { id: 'other', label: '其他' }] },
  { id: 'food',           emoji: '🍜', label: '餐饮美食',   category: '生活服务', keywords: ['餐饮', '美食', '餐厅', '外卖'], subIndustries: [{ id: 'restaurant', label: '餐厅' }, { id: 'takeout', label: '外卖' }, { id: 'snack', label: '小吃快餐' }, { id: 'baking', label: '烘焙甜品' }, { id: 'other', label: '其他' }] },
  { id: 'tea_coffee',     emoji: '☕', label: '茶饮咖啡',   category: '生活服务', subIndustries: [{ id: 'milk_tea', label: '奶茶' }, { id: 'coffee', label: '咖啡' }, { id: 'tea', label: '茶' }, { id: 'juice', label: '果汁饮品' }, { id: 'other', label: '其他' }] },
  { id: 'liquor',         emoji: '🍷', label: '酒水',       category: '生活服务', subIndustries: [{ id: 'baijiu', label: '白酒' }, { id: 'wine', label: '红酒/葡萄酒' }, { id: 'beer', label: '啤酒' }, { id: 'spirits', label: '洋酒' }, { id: 'other', label: '其他' }] },
  { id: 'health',         emoji: '🏥', label: '健康养生',   category: '生活服务', subIndustries: [{ id: 'tcm', label: '中医调理' }, { id: 'diet', label: '饮食健康' }, { id: 'sleep', label: '睡眠改善' }, { id: 'detox', label: '排毒养生' }, { id: 'other', label: '其他' }] },
  { id: 'medical',        emoji: '🩺', label: '医疗健康',   category: '生活服务', subIndustries: [{ id: 'clinic', label: '诊所/门诊' }, { id: 'dental', label: '口腔牙科' }, { id: 'cosmetic_med', label: '医疗美容' }, { id: 'pharmacy', label: '药店/药房' }, { id: 'other', label: '其他' }] },
  { id: 'psychology',     emoji: '🧠', label: '心理咨询',   category: '生活服务', subIndustries: [{ id: 'individual', label: '个人心理咨询' }, { id: 'couple', label: '情感/婚姻咨询' }, { id: 'teen', label: '青少年心理' }, { id: 'corporate', label: '职场心理' }, { id: 'other', label: '其他' }] },
  { id: 'fitness',        emoji: '💪', label: '运动健身',   category: '生活服务', subIndustries: [{ id: 'gym', label: '健身房/力量训练' }, { id: 'yoga', label: '瑜伽/普拉提' }, { id: 'dance', label: '舞蹈' }, { id: 'hiit', label: 'HIIT/有氧' }, { id: 'other', label: '其他' }] },
  { id: 'sports',         emoji: '⚽', label: '体育运动',   category: '生活服务', subIndustries: [{ id: 'ball', label: '球类运动' }, { id: 'outdoor', label: '户外运动' }, { id: 'martial', label: '武术/格斗' }, { id: 'swimming', label: '游泳' }, { id: 'other', label: '其他' }] },
  { id: 'baby_parenting', emoji: '👶', label: '母婴亲子',   category: '生活服务', subIndustries: [{ id: 'baby_product', label: '母婴用品' }, { id: 'parenting', label: '育儿知识' }, { id: 'kids_food', label: '辅食/儿童餐' }, { id: 'maternity', label: '孕产' }, { id: 'other', label: '其他' }] },
  { id: 'travel',         emoji: '✈️', label: '旅游出行',   category: '生活服务', subIndustries: [{ id: 'domestic', label: '国内旅游' }, { id: 'overseas', label: '出境旅游' }, { id: 'self_drive', label: '自驾露营' }, { id: 'hotel', label: '酒店/民宿' }, { id: 'other', label: '其他' }] },
  { id: 'pet',            emoji: '🐾', label: '宠物',       category: '生活服务', subIndustries: [{ id: 'dog', label: '宠物狗' }, { id: 'cat', label: '宠物猫' }, { id: 'pet_food', label: '宠物食品' }, { id: 'pet_service', label: '宠物医疗/美容' }, { id: 'other', label: '其他' }] },
  { id: 'wedding',        emoji: '💍', label: '婚庆婚嫁',   category: '生活服务', subIndustries: [{ id: 'photo_video', label: '婚纱摄影' }, { id: 'ceremony', label: '婚礼策划' }, { id: 'dress', label: '婚纱/礼服' }, { id: 'honeymoon', label: '蜜月旅行' }, { id: 'other', label: '其他' }] },
  { id: 'local',          emoji: '📍', label: '本地生活',   category: '生活服务', subIndustries: [{ id: 'explore', label: '探店打卡' }, { id: 'delivery', label: '同城配送' }, { id: 'activity', label: '本地活动' }, { id: 'discount', label: '本地优惠' }, { id: 'other', label: '其他' }] },
  { id: 'cleaning',       emoji: '🧹', label: '家政服务',   category: '生活服务', subIndustries: [{ id: 'house_clean', label: '保洁/打扫' }, { id: 'nanny', label: '保姆/月嫂' }, { id: 'appliance_repair', label: '家电维修' }, { id: 'moving', label: '搬家服务' }, { id: 'other', label: '其他' }] },
  { id: 'logistics',      emoji: '📦', label: '物流快递',   category: '生活服务', subIndustries: [{ id: 'express', label: '快递配送' }, { id: 'freight', label: '货运物流' }, { id: 'cold_chain', label: '冷链运输' }, { id: 'international', label: '跨境物流' }, { id: 'other', label: '其他' }] },
  { id: 'auto_service',   emoji: '🔧', label: '汽车服务',   category: '生活服务', subIndustries: [{ id: 'repair', label: '汽车维修' }, { id: 'wash', label: '洗车美容' }, { id: 'insurance', label: '汽车保险' }, { id: 'rental', label: '租车' }, { id: 'other', label: '其他' }] },

  // 🛒 电商零售 (13)
  { id: 'apparel',        emoji: '👗', label: '服装穿搭',   category: '电商零售', subIndustries: [{ id: 'women', label: '女装' }, { id: 'men', label: '男装' }, { id: 'kids', label: '童装' }, { id: 'sport', label: '运动服饰' }, { id: 'other', label: '其他' }] },
  { id: 'luxury',         emoji: '👜', label: '奢侈品',     category: '电商零售', subIndustries: [{ id: 'bag', label: '名牌包' }, { id: 'watch', label: '名表' }, { id: 'luxury_apparel', label: '奢侈服饰' }, { id: 'vintage', label: '二手奢品' }, { id: 'other', label: '其他' }] },
  { id: 'shoes_bags',     emoji: '👟', label: '鞋靴箱包',   category: '电商零售', subIndustries: [{ id: 'sneaker', label: '运动鞋' }, { id: 'heels', label: '高跟鞋/女鞋' }, { id: 'boots', label: '靴子' }, { id: 'luggage', label: '箱包' }, { id: 'other', label: '其他' }] },
  { id: 'auto',           emoji: '🚗', label: '汽车',       category: '电商零售', subIndustries: [{ id: 'new_car', label: '新车销售' }, { id: 'used_car', label: '二手车' }, { id: 'ev', label: '新能源汽车' }, { id: 'accessory', label: '汽车配件' }, { id: 'other', label: '其他' }] },
  { id: 'ecommerce',      emoji: '🛒', label: '电商零售',   category: '电商零售', subIndustries: [{ id: 'tmall', label: '天猫/淘宝' }, { id: 'jd', label: '京东' }, { id: 'pinduoduo', label: '拼多多' }, { id: 'cross_border', label: '跨境电商' }, { id: 'other', label: '其他' }] },
  { id: 'fresh',          emoji: '🥬', label: '生鲜配送',   category: '电商零售', subIndustries: [{ id: 'vegetable', label: '蔬菜水果' }, { id: 'meat', label: '肉禽蛋' }, { id: 'seafood', label: '水产海鲜' }, { id: 'organic', label: '有机食品' }, { id: 'other', label: '其他' }] },
  { id: 'home_appliance', emoji: '📺', label: '家电',       category: '电商零售', subIndustries: [{ id: 'tv', label: '电视/显示器' }, { id: 'kitchen', label: '厨房电器' }, { id: 'washing', label: '洗衣机/空调' }, { id: 'smart', label: '智能家居' }, { id: 'other', label: '其他' }] },
  { id: 'home',           emoji: '🛋️', label: '家装家居',   category: '电商零售', subIndustries: [{ id: 'furniture', label: '家具' }, { id: 'decor', label: '家居装饰' }, { id: 'bedding', label: '床品/寝具' }, { id: 'renovation', label: '装修' }, { id: 'other', label: '其他' }] },
  { id: 'jewelry',        emoji: '💎', label: '珠宝饰品',   category: '电商零售', subIndustries: [{ id: 'gold', label: '黄金/足金' }, { id: 'diamond', label: '钻石/铂金' }, { id: 'jade', label: '翡翠/玉石' }, { id: 'fashion_jewelry', label: '时尚饰品' }, { id: 'other', label: '其他' }] },
  { id: 'supplement',     emoji: '💊', label: '营养保健',   category: '电商零售', subIndustries: [{ id: 'vitamin', label: '维生素/矿物质' }, { id: 'protein', label: '蛋白粉' }, { id: 'slimming', label: '减脂/代餐' }, { id: 'immunity', label: '免疫调节' }, { id: 'other', label: '其他' }] },
  { id: 'daily',          emoji: '🧴', label: '日用百货',   category: '电商零售', subIndustries: [{ id: 'cleaning_supply', label: '清洁用品' }, { id: 'paper', label: '纸品' }, { id: 'personal_care', label: '个护用品' }, { id: 'storage', label: '收纳整理' }, { id: 'other', label: '其他' }] },
  { id: 'books',          emoji: '📖', label: '图书文创',   category: '电商零售', subIndustries: [{ id: 'novel', label: '小说/文学' }, { id: 'education_book', label: '教辅/学习' }, { id: 'stationery', label: '文具/文创' }, { id: 'art_supply', label: '画材/艺术' }, { id: 'other', label: '其他' }] },
  { id: 'second_hand',    emoji: '♻️', label: '二手闲置',   category: '电商零售', subIndustries: [{ id: 'electronics', label: '二手数码' }, { id: 'clothing', label: '二手服饰' }, { id: 'furniture_used', label: '二手家具' }, { id: 'collectibles', label: '藏品/收藏' }, { id: 'other', label: '其他' }] },

  // ✍️ 内容创作 (7)
  { id: 'self_media',     emoji: '📲', label: '自媒体运营', category: '内容创作', subIndustries: [{ id: 'video', label: '短视频运营' }, { id: 'wechat_mp', label: '公众号' }, { id: 'live', label: '直播' }, { id: 'community', label: '社群运营' }, { id: 'other', label: '其他' }] },
  { id: 'photo',          emoji: '📷', label: '摄影摄像',   category: '内容创作', subIndustries: [{ id: 'portrait', label: '人像摄影' }, { id: 'product_photo', label: '商业产品' }, { id: 'wedding_photo', label: '婚礼跟拍' }, { id: 'video_prod', label: '视频制作' }, { id: 'other', label: '其他' }] },
  { id: 'design',         emoji: '🎨', label: '设计创意',   category: '内容创作', subIndustries: [{ id: 'graphic', label: '平面设计' }, { id: 'ui', label: 'UI/UX设计' }, { id: 'brand', label: '品牌视觉' }, { id: 'illustration', label: '插画' }, { id: 'other', label: '其他' }] },
  { id: 'game',           emoji: '🎮', label: '游戏',       category: '内容创作', subIndustries: [{ id: 'mobile_game', label: '手游' }, { id: 'pc_game', label: 'PC/主机游戏' }, { id: 'game_strategy', label: '游戏攻略' }, { id: 'esports', label: '电竞' }, { id: 'other', label: '其他' }] },
  { id: 'entertainment',  emoji: '🎬', label: '娱乐',       category: '内容创作', subIndustries: [{ id: 'celebrity', label: '明星娱乐' }, { id: 'variety', label: '综艺/影视' }, { id: 'music', label: '音乐' }, { id: 'comedy', label: '搞笑/段子' }, { id: 'other', label: '其他' }] },
  { id: 'media',          emoji: '📰', label: '文化传媒',   category: '内容创作', subIndustries: [{ id: 'news', label: '新闻资讯' }, { id: 'culture', label: '文化/历史' }, { id: 'reading', label: '读书/书评' }, { id: 'podcast', label: '播客' }, { id: 'other', label: '其他' }] },
  { id: 'social',         emoji: '❤️', label: '情感社交',   category: '内容创作', subIndustries: [{ id: 'love', label: '恋爱情感' }, { id: 'family', label: '家庭/婚姻' }, { id: 'friendship', label: '人际关系' }, { id: 'selfgrowth', label: '自我成长' }, { id: 'other', label: '其他' }] },

  // 💼 专业服务 (14)
  { id: 'edu',            emoji: '📚', label: '教育培训',   category: '专业服务', keywords: ['教育', '培训', '课程'], subIndustries: [{ id: 'online', label: '线上课程' }, { id: 'offline', label: '线下培训' }, { id: 'vocational', label: '职业技能' }, { id: 'exam', label: '考证/备考' }, { id: 'other', label: '其他' }] },
  { id: 'k12',            emoji: '🎒', label: 'K12教育',    category: '专业服务', subIndustries: [{ id: 'primary', label: '小学' }, { id: 'middle', label: '初中' }, { id: 'high', label: '高中' }, { id: 'gaokao', label: '高考辅导' }, { id: 'other', label: '其他' }] },
  { id: 'preschool',      emoji: '🧒', label: '早教托育',   category: '专业服务', subIndustries: [{ id: 'early_edu', label: '早教中心' }, { id: 'daycare', label: '托育/托管' }, { id: 'kindergarten', label: '幼儿园' }, { id: 'parenting_class', label: '亲子课程' }, { id: 'other', label: '其他' }] },
  { id: 'art_edu',        emoji: '🎨', label: '艺术培训',   category: '专业服务', subIndustries: [{ id: 'music_edu', label: '音乐/乐器' }, { id: 'painting', label: '绘画/美术' }, { id: 'dance_edu', label: '舞蹈' }, { id: 'drama', label: '戏剧/表演' }, { id: 'other', label: '其他' }] },
  { id: 'language',       emoji: '🌍', label: '语言培训',   category: '专业服务', subIndustries: [{ id: 'english', label: '英语' }, { id: 'japanese', label: '日语' }, { id: 'korean', label: '韩语' }, { id: 'other_lang', label: '其他语种' }, { id: 'other', label: '其他' }] },
  { id: 'it_edu',         emoji: '💻', label: 'IT培训',     category: '专业服务', subIndustries: [{ id: 'programming', label: '编程开发' }, { id: 'ai_ml', label: 'AI/大数据' }, { id: 'design_tool', label: '设计软件' }, { id: 'product', label: '产品/运营' }, { id: 'other', label: '其他' }] },
  { id: 'real_estate',    emoji: '🏠', label: '房产',       category: '专业服务', subIndustries: [{ id: 'buy_sell', label: '二手房买卖' }, { id: 'new_house', label: '新房' }, { id: 'rental', label: '租房' }, { id: 'commercial', label: '商业地产' }, { id: 'other', label: '其他' }] },
  { id: 'finance',        emoji: '💰', label: '金融理财',   category: '专业服务', subIndustries: [{ id: 'stock', label: '股票/基金' }, { id: 'insurance', label: '保险' }, { id: 'loan', label: '贷款/信贷' }, { id: 'wealth', label: '财富管理' }, { id: 'other', label: '其他' }] },
  { id: 'tech',           emoji: '📱', label: '科技数码',   category: '专业服务', subIndustries: [{ id: 'mobile', label: '手机/平板' }, { id: 'laptop', label: '电脑/配件' }, { id: 'wearable', label: '可穿戴设备' }, { id: 'tech_review', label: '科技评测' }, { id: 'other', label: '其他' }] },
  { id: 'law',            emoji: '⚖️', label: '法律咨询',   category: '专业服务', subIndustries: [{ id: 'civil', label: '民事诉讼' }, { id: 'criminal', label: '刑事辩护' }, { id: 'labor', label: '劳动法' }, { id: 'corporate_law', label: '公司/商业' }, { id: 'other', label: '其他' }] },
  { id: 'franchise',      emoji: '🤝', label: '招商加盟',   category: '专业服务', subIndustries: [{ id: 'food_franchise', label: '餐饮加盟' }, { id: 'retail_franchise', label: '零售加盟' }, { id: 'service_franchise', label: '服务业加盟' }, { id: 'invest', label: '招商引资' }, { id: 'other', label: '其他' }] },
  { id: 'recruitment',    emoji: '👔', label: '人力招聘',   category: '专业服务', subIndustries: [{ id: 'job_hunting', label: '求职/找工作' }, { id: 'headhunt', label: '猎头/高端招聘' }, { id: 'hr', label: 'HR管理' }, { id: 'campus', label: '校园招聘' }, { id: 'other', label: '其他' }] },
  { id: 'enterprise',     emoji: '🏢', label: '企业服务',   category: '专业服务', subIndustries: [{ id: 'saas', label: 'SaaS/软件' }, { id: 'marketing', label: '营销推广' }, { id: 'accounting', label: '财税记账' }, { id: 'consulting', label: '管理咨询' }, { id: 'other', label: '其他' }] },
  { id: 'gov',            emoji: '🏛️', label: '政务公益',   category: '专业服务', subIndustries: [{ id: 'public_service', label: '公共服务' }, { id: 'charity', label: '公益慈善' }, { id: 'social_org', label: '社会组织' }, { id: 'policy', label: '政策宣传' }, { id: 'other', label: '其他' }] },

  // 🏭 产业制造 (4)
  { id: 'agriculture',    emoji: '🌾', label: '农业农村',   category: '产业制造', subIndustries: [{ id: 'crop', label: '种植/粮食' }, { id: 'livestock', label: '养殖/畜牧' }, { id: 'agri_product', label: '农产品销售' }, { id: 'rural_tourism', label: '乡村旅游' }, { id: 'other', label: '其他' }] },
  { id: 'manufacturing',  emoji: '🏭', label: '工业制造',   category: '产业制造', subIndustries: [{ id: 'electronics_mfg', label: '电子制造' }, { id: 'machinery', label: '机械设备' }, { id: 'textile', label: '纺织服装' }, { id: 'chemical', label: '化工原料' }, { id: 'other', label: '其他' }] },
  { id: 'construction',   emoji: '🏗️', label: '建筑工程',   category: '产业制造', subIndustries: [{ id: 'civil_eng', label: '土木工程' }, { id: 'interior', label: '室内装修' }, { id: 'infra', label: '基础设施' }, { id: 'landscape', label: '园林景观' }, { id: 'other', label: '其他' }] },
  { id: 'other',          emoji: '🔧', label: '其他行业',   category: '产业制造', subIndustries: [{ id: 'cross_sector', label: '跨行业' }, { id: 'niche', label: '细分赛道' }, { id: 'new_biz', label: '新兴业态' }, { id: 'other', label: '其他' }] },
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

// /step/1 page-specific 字面常量(D1 锁 · sally aiipznt 1:1)
export const STEP1_BREADCRUMB_CHIP = 'STEP 01' as const;
export const STEP1_BREADCRUMB_LABEL = '选择行业赛道' as const;
export const STEP1_PAGE_H1 = '选择你的行业赛道' as const;
export const STEP1_PAGE_H1_EMOJI = '🌐' as const;
export const STEP1_SUBTITLE_PART1 = '覆盖抖音、视频号等主流平台的 ' as const;
export const STEP1_SUBTITLE_COUNT = '56+' as const;
export const STEP1_SUBTITLE_PART2 = ' 个细分行业。 你也可以 ' as const;
export const STEP1_SUBTITLE_CUSTOM_LINK = '自定义输入行业' as const;
export const STEP1_SUBTITLE_PART3 = ' 。' as const;
export const STEP1_BANNER_PREFIX = '已选择：' as const;
export const STEP1_BANNER_KW_PREFIX = '关键词：' as const;
export const STEP1_CUSTOM_TAG = '（自定义）' as const;
export const STEP1_PAGE_CTA = '确认并进入下一步' as const;
export const STEP1_STICKY_PREFIX = '已选择' as const;
