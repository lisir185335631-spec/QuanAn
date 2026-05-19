/**
 * QuanAn · Step 5 爆款选题库常量 — 字面锁
 * 命名锁: STEP5_INPUTS_2 / STEP5_FILE_UPLOADS_2 / STEP5_CATEGORIES_5 / STEP5_TOTAL_TOPICS
 * D1=A 红线: 所有字面量 1:1 来源 spec §7.6 line 1589-1631, 禁止改写
 * 数字锁: STEP5_INPUTS_2.length === 2 · STEP5_FILE_UPLOADS_2.length === 2 · STEP5_CATEGORIES_5.length === 5
 *         STEP5_TOPICS_PER_CAT === 20 · STEP5_TOTAL_TOPICS === 100
 */

// ─── Interface Definitions ────────────────────────────────────────────────────

export interface Step5Input {
  id: string;
  label: string;
  required: boolean;
  placeholder: string;
}

export interface Step5FileUpload {
  id: string;
  label: string;
  required: boolean;
  placeholder: string;
}

export interface Step5Category {
  key: 'traffic' | 'monetize' | 'persona' | 'cognition' | 'case';
  label: string;
  description: string;
}

export interface Step5Topic {
  id: string;
  category: 'traffic' | 'monetize' | 'persona' | 'cognition' | 'case';
  title: string;
  hook: string;
  structure: string;
  formula: string;
  platform: '抖音' | '小红书' | '视频号' | '快手' | 'B站';
  difficulty: '简单' | '中等' | '困难';
  potential_stars: 1 | 2 | 3 | 4 | 5;
}

export interface Step5Result {
  topics: Step5Topic[];
  generated_at: string;
}

// ─── Page Labels ──────────────────────────────────────────────────────────────

export const STEP5_STEP_TAG = 'STEP 05 · 爆款选题库';
export const STEP5_H1 = '爆款选题库';

// STEP5_SUBTITLE · 字面严格 1:1 spec §7.6 line 1595 · 含全角括号（） · 全角逗号
export const STEP5_SUBTITLE =
  '输入你的行业和产品信息，还可以上传产品资料和人物介绍文档，AI 将结合这些素材一次性生成 5 大类爆款选题（流量型/变现型/人设型/认知型/案例型），每类 20 个选题，共 100 个。';

// ─── Form Inputs ──────────────────────────────────────────────────────────────

// STEP5_INPUTS_2 · 2 必填输入项 · AC-2 D-224 字面锁
export const STEP5_INPUTS_2: readonly Step5Input[] = [
  {
    id: 'industry',
    label: '行业领域',
    required: true,
    placeholder: '例如：美业、餐饮、教育培训、服装...',
  },
  {
    id: 'product',
    label: '产品/服务',
    required: true,
    placeholder: '例如：皮肤管理项目、火锅加盟、英语培训课...',
  },
] as const;

// ─── File Uploads ─────────────────────────────────────────────────────────────

// STEP5_FILE_UPLOADS_2 · 2 可选图片上传 · AC-2 "产品图" + "案例图"(可选 · 多张)
export const STEP5_FILE_UPLOADS_2: readonly Step5FileUpload[] = [
  {
    id: 'product_images',
    label: '产品图',
    required: false,
    placeholder: '上传产品图（可选 · 多张）',
  },
  {
    id: 'case_images',
    label: '案例图',
    required: false,
    placeholder: '上传案例图（可选 · 多张）',
  },
] as const;

// ─── File Config ──────────────────────────────────────────────────────────────

export const STEP5_FILE_MAX_MB = 20;
export const STEP5_FILE_ACCEPT = 'image/*';
export const STEP5_FILE_ACCEPT_LABEL = 'JPG、PNG、WEBP、GIF';

// ─── Buttons ──────────────────────────────────────────────────────────────────

// AC-2 CTA 字面锁: "生成爆款选题库"
export const STEP5_BUTTON_GENERATE = '生成爆款选题库';
export const STEP5_BUTTON_GO_STEP7 = '生成爆款文案';
export const STEP5_LOADING_TEXT = 'AI 正在生成 100 个爆款选题，预计 60-120 秒...';

// ─── Categories ───────────────────────────────────────────────────────────────

// STEP5_CATEGORIES_5 · 5 项 H3 字面锁 · AC-3 D-220
export const STEP5_CATEGORIES_5: readonly Step5Category[] = [
  { key: 'traffic',   label: '知识科普类选题', description: '科普行业知识，建立专业形象' },
  { key: 'monetize',  label: '产品种草类选题', description: '展示产品价值，促进购买决策' },
  { key: 'persona',   label: '情感共鸣类选题', description: '触动用户情感，增强品牌连接' },
  { key: 'cognition', label: '争议讨论类选题', description: '引发话题讨论，提升互动数据' },
  { key: 'case',      label: '干货实操类选题', description: '实用技巧分享，积累精准粉丝' },
] as const;

// ─── Numeric Constants ────────────────────────────────────────────────────────

export const STEP5_TOPICS_PER_CAT = 20;
export const STEP5_TOTAL_TOPICS = 100;
