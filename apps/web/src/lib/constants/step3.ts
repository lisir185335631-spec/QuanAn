/**
 * QuanAn · Step 3 账号包装方案常量 — 字面锁
 * 命名锁: STEP3_PLATFORMS_5 / STEP3_OUTPUT_H3_6 / STEP3_FORM / STEP3_CTA_LABEL / STEP3_BUTTON_*
 * D1=A 红线: 所有字面量 1:1 来源 spec §7.2, 禁止改写
 */

// STEP3_PLATFORMS_5 · 5 platform radio 字面 1:1 含 emoji 来源 spec §7.2
export interface Step3Platform {
  id: 'douyin' | 'xiaohongshu' | 'shipinhao' | 'kuaishou' | 'bilibili';
  label: string;       // 含 emoji · 如 '📱 抖音'
  name: string;        // 纯名 · 如 '抖音'
}

export const STEP3_PLATFORMS_5: readonly Step3Platform[] = [
  { id: 'douyin',       label: '📱 抖音',     name: '抖音' },
  { id: 'xiaohongshu',  label: '📕 小红书',   name: '小红书' },
  { id: 'shipinhao',    label: '📺 视频号',   name: '视频号' },
  { id: 'kuaishou',     label: '🎬 快手',     name: '快手' },
  { id: 'bilibili',     label: '📺 B站',      name: 'B站' },
] as const;

// STEP3_OUTPUT_H3_6 · 6 H3 输出模块字面 1:1 来源 spec §7.2 "6 大模块"
export interface Step3OutputBlock {
  id: 'videoReferences' | 'nickname' | 'avatar' | 'background' | 'bio' | 'strategy';
  h3Label: string;       // H3 文字 · 如 '1. 视频参考案例'
  hint: string;          // 副标提示
}

export const STEP3_OUTPUT_H3_6: readonly Step3OutputBlock[] = [
  { id: 'videoReferences', h3Label: '视频参考案例',   hint: 'AI 推荐 3 个本行业的爆款视频参考(含标题、描述、搜索词)' },
  { id: 'nickname',        h3Label: '昵称推荐',       hint: '5 个备选昵称 + 命名策略 + 各平台调整建议' },
  { id: 'avatar',          h3Label: '头像设计方案',   hint: '风格 / 配色 / 表情 / 必含元素 / 禁忌 / AI 绘图 prompt' },
  { id: 'background',      h3Label: '背景图设计方案', hint: '风格 / 布局 / 配色 / 文案 / 3 平台尺寸适配 / AI 绘图 prompt' },
  { id: 'bio',             h3Label: '简介文案方案',   hint: '简介公式 + 6 个版本(3 平台 × 主号副号)+ SEO 关键词' },
  { id: 'strategy',        h3Label: '整体包装策略',   hint: '视觉一致性 / 第一印象 / 转化路径 / 平台优先级' },
] as const;

// STEP3_BUTTONS_3 · 每 H3 子模块右侧 3 按钮 + 头像/背景图 加 [生成参考图]
export const STEP3_BUTTON_COPY = '复制';
export const STEP3_BUTTON_REGENERATE = '重新生成';
export const STEP3_BUTTON_OPTIMIZE = '智能优化';
export const STEP3_BUTTON_GEN_IMAGE = '生成参考图';

// 顶部右侧 · [一键重新生成] [复制全部]
export const STEP3_HEADER_BUTTON_REGEN_ALL = '一键重新生成';
export const STEP3_HEADER_BUTTON_COPY_ALL = '复制全部';

// Step7 输出顶部 · [复制全部] — AC-3 命名锁
export const STEP3_BUTTON_COPY_ALL = '复制全部';

// STEP3_FORM_LABELS · 表单字段 label + placeholder 字面 1:1 来源 spec §7.2
export const STEP3_FORM = {
  personalInfo: {
    label: '你的个人信息',
    required: true,
    placeholder: '详细描述你的个人背景、专业技能、从业经验、擅长领域、个人特点等。\n\n示例：我是一名有10年经验的美容师，擅长皮肤管理和抗衰项目...',
  },
  platform: {
    label: '目标平台',
    required: true,
  },
  audience: {
    label: '目标受众',
    required: false,
    placeholder: '你想吸引什么样的粉丝？',
  },
  accountStatus: {
    label: '现有账号情况',
    required: false,
    placeholder: '新账号/已有账号的粉丝量等',
  },
} as const;

// STEP3_CTA · 主 CTA 字面 1:1
export const STEP3_CTA_LABEL = '生成账号包装方案';
export const STEP3_CTA_DISABLED_HINT = '请填写"你的个人信息"并选择目标平台';

// STEP3_PAGE · 顶部 step 标签 + H1 + 副标
export const STEP3_STEP_TAG = 'STEP 03 · 账号包装方案';
export const STEP3_H1 = '账号包装方案';
export const STEP3_SUBTITLE_TEMPLATE = '当前行业：{industry}。输入你的个人信息，AI 将为你生成极其详细的账号包装方案，包含昵称、头像参考图、背景图参考、简介等全方位深度解析。';

// STEP3_LOADING_TEXT · loading 文案
export const STEP3_LOADING_TEXT = 'AI 正在生成你的账号包装方案，预计 30-60 秒...';

// PRD-20 TD-80 fix: Step3Result heading + Optimize button 常量
export const STEP3_RESULT_H2 = '账号包装方案' as const;
export const STEP3_OPTIMIZE_CONFIRM_BUTTON = '确认优化' as const;
