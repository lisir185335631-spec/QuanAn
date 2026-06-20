// step-inputs.schema.ts — 9 step input schemas (DATA-MODEL §4.3)
// Single source of truth shared across web + api (no direct API imports)
import { z } from 'zod';

// ── Constants (mirrors apps/api/src/lib/constants/ — kept in sync manually) ──

export const STEP_INDUSTRY_KEYS = [
  // 生活服务(18)
  'beauty', 'cosmetics', 'food', 'tea_coffee', 'liquor', 'health', 'medical',
  'psychology', 'fitness', 'sports', 'baby_parenting', 'travel', 'pet', 'wedding',
  'local', 'cleaning', 'logistics', 'auto_service',
  // 电商零售(13)
  'apparel', 'luxury', 'shoes_bags', 'auto', 'ecommerce', 'fresh', 'home_appliance',
  'home', 'jewelry', 'supplement', 'daily', 'books', 'second_hand',
  // 内容创作(7)
  'self_media', 'photo', 'design', 'game', 'entertainment', 'media', 'social',
  // 专业服务(14)
  'edu', 'k12', 'preschool', 'art_edu', 'language', 'it_edu', 'real_estate',
  'finance', 'tech', 'law', 'franchise', 'recruitment', 'enterprise', 'gov',
  // 产业制造(4)
  'agriculture', 'manufacturing', 'construction', 'other',
] as const satisfies readonly [string, ...string[]];

export type StepIndustryKey = (typeof STEP_INDUSTRY_KEYS)[number];

export const STEP_PLATFORM_KEYS = [
  'douyin', 'xiaohongshu', 'shipinhao', 'kuaishou', 'bilibili',
] as const satisfies readonly [string, ...string[]];

export type StepPlatformKey = (typeof STEP_PLATFORM_KEYS)[number];

export const STEP_CATEGORY_KEYS = [
  'traffic', 'monetize', 'persona', 'cognition', 'case',
] as const satisfies readonly [string, ...string[]];

export type StepCategoryKey = (typeof STEP_CATEGORY_KEYS)[number];

export const STEP_SCRIPT_TYPE_KEYS = [
  'opinion', 'process', 'knowledge', 'story', 'comedy', 'product', 'review',
  'expose', 'challenge', 'interview', 'daily', 'transform', 'debate', 'list',
  'reaction', 'qna', 'collab', 'behind', 'trend_news', 'motivation',
] as const satisfies readonly [string, ...string[]];

export type StepScriptTypeKey = (typeof STEP_SCRIPT_TYPE_KEYS)[number];

export const STEP_HOT_ELEMENT_KEYS = [
  'greed', 'fear', 'curiosity', 'contrast', 'worst', 'leverage', 'resonance',
  'empathy', 'small_big', 'low_cost_high', 'low_cost_unknown', 'anger', 'surprise',
  'trend', 'controversy', 'reveal', 'list', 'challenge', 'transformation',
  'scarcity', 'social_proof', 'authority', 'benefit',
] as const satisfies readonly [string, ...string[]];

export type StepHotElementKey = (typeof STEP_HOT_ELEMENT_KEYS)[number];

// ── Step 1: 行业定位 ──────────────────────────────────────────────────────────

// z.string().min(1) allows both enum keys and custom industry strings; rejects empty (AC-14)
// PRD-37 US-P04: 加两层行业字段(optional · 向后兼容 · 保留 lastIndustry 双写)
// PRD-37 US-P08: 加文件 Asset ID 列表(optional · 上传前置 Step1 → 前端写入 productMaterialAssetIds/personaFileAssetIds)
export const Step1InputSchema = z.object({
  lastIndustry: z.string().min(1, { message: '行业必填' }),
  lastIndustryCategory: z.string().optional(),
  lastIndustrySub: z.string().optional(),
  productMaterialAssetIds: z.array(z.number()).optional(),
  personaFileAssetIds: z.array(z.number()).optional(),
});

export type Step1Input = z.infer<typeof Step1InputSchema>;

// ── Step 3: 账号包装 ──────────────────────────────────────────────────────────

export const Step3InputSchema = z.object({
  lastPlatform: z.enum(STEP_PLATFORM_KEYS, {
    errorMap: () => ({ message: '请选择平台' }),
  }),
  lastPersonalInfo: z.string().min(20, { message: '个人信息至少20字' }).max(500),
  lastTargetAudience: z.string().min(5, { message: '目标受众至少5字' }).max(200),
  lastCurrentAccount: z.string().max(50).default('新账号'),
});

export type Step3Input = z.infer<typeof Step3InputSchema>;

// ── Step 3b: 人设深化 ─────────────────────────────────────────────────────────

// PRD-37 US-P06: 新增产品四品 + 公司介绍字段(optional · 向后兼容)
export const Step3bInputSchema = z.object({
  lastPlatform: z.enum(STEP_PLATFORM_KEYS, {
    errorMap: () => ({ message: '请选择平台' }),
  }),
  lastPersonalInfo: z.string().min(50, { message: '个人信息至少50字' }).max(800),
  lastTargetAudience: z.string().max(200).default(''),
  lastStrengths: z.string().max(200).default(''),
  lastStory: z.string().max(500).default(''),
  productIntro: z.object({
    drainage: z.string().max(200).default(''),
    bestseller: z.string().max(200).default(''),
    profit: z.string().max(200).default(''),
    image: z.string().max(200).default(''),
  }).optional(),
  companyInfo: z.string().max(500).optional(),
});

export type Step3bInput = z.infer<typeof Step3bInputSchema>;

// ── Step 4: 执行策略 ──────────────────────────────────────────────────────────

export const Step4InputSchema = z.object({
  lastPlatform: z.enum(STEP_PLATFORM_KEYS, {
    errorMap: () => ({ message: '请选择平台' }),
  }),
  lastFollowers: z.enum(['0-1000', '1000-10000', '10000-100000', '100000+'] as const, {
    errorMap: () => ({ message: '请选择粉丝数量' }),
  }),
  lastPersonalInfo: z.string().min(50, { message: '个人信息至少50字' }),
  lastGoals: z.enum(['start', 'monetize', 'scale', 'reposition'] as const, {
    errorMap: () => ({ message: '请选择目标' }),
  }),
});

export type Step4Input = z.infer<typeof Step4InputSchema>;

// ── Step 4b: 变现规划 ─────────────────────────────────────────────────────────

export const Step4bInputSchema = z.object({
  lastProductDesc: z.string().min(20, { message: '产品描述至少20字' }).max(300),
  lastTargetAudience: z.string().max(200).default(''),
  lastIpPositioning: z.string().max(100).default(''),
  lastCurrentRevenue: z.enum(
    ['pre_revenue', '10万以下', '10-30万', '30-100万', '100万+'] as const,
    { errorMap: () => ({ message: '请选择当前营收' }) },
  ),
});

export type Step4bInput = z.infer<typeof Step4bInputSchema>;

// ── Step 5: 选题策略 ──────────────────────────────────────────────────────────

export const Step5InputSchema = z.object({
  lastIndustry: z.string().min(1, { message: '行业必填' }),
  lastProduct: z.string().min(5, { message: '产品描述至少5字' }).max(200),
  lastCategory: z.enum(STEP_CATEGORY_KEYS, {
    errorMap: () => ({ message: '请选择选题类别' }),
  }),
});

export type Step5Input = z.infer<typeof Step5InputSchema>;

// ── Step 6: 视频拍摄 ──────────────────────────────────────────────────────────

export const Step6InputSchema = z.object({
  lastSourceCopy: z.string().min(50, { message: '原稿至少50字' }).max(5000),
});

export type Step6Input = z.infer<typeof Step6InputSchema>;

// ── Step 7: 文案生成 ──────────────────────────────────────────────────────────

// PRD-37 US-P09 AC6: 增 sourceTrendingId/viralStructure (optional · 向后兼容)
// sourceTrendingId: 来源选题 ID(Step5 爆款选题 id·可选)
// viralStructure: AnalysisAgent viral mode 输出的顶层结构(hook/body/cta·可选)
export const Step7InputSchema = z.object({
  lastScriptType: z.enum(STEP_SCRIPT_TYPE_KEYS, {
    errorMap: () => ({ message: '请选择脚本类型' }),
  }),
  lastElements: z.array(
    z.enum(STEP_HOT_ELEMENT_KEYS, { errorMap: () => ({ message: '无效元素' }) }),
  ).max(5),
  lastTopic: z.string().min(2, { message: '话题至少2字' }).max(200),
  sourceTrendingId: z.string().optional(),
  viralStructure: z.unknown().optional(),
});

export type Step7Input = z.infer<typeof Step7InputSchema>;

// ── Step 8: 直播话术 ──────────────────────────────────────────────────────────

export const Step8InputSchema = z.object({
  lastPlatform: z.enum(STEP_PLATFORM_KEYS, {
    errorMap: () => ({ message: '请选择平台' }),
  }),
  lastProductInfo: z.string().max(500).default(''),
  lastTargetAudience: z.string().max(200).default(''),
  lastExperience: z.enum(['beginner', 'intermediate', 'advanced'] as const, {
    errorMap: () => ({ message: '请选择经验等级' }),
  }),
});

export type Step8Input = z.infer<typeof Step8InputSchema>;
