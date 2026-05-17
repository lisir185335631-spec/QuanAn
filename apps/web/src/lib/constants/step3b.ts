/**
 * QuanQn · Step 3b 人设定制方案常量 — 字面锁
 * 命名锁: STEP3B_TEXTAREAS_3 / STEP3B_OUTPUT_H3_5 / STEP3B_AUDIENCE / STEP3B_CTA_LABEL / STEP3B_BUTTON_*
 * D1=A 红线: 所有字面量 1:1 来源 spec §7.3, 禁止改写
 * 数字锁: STEP3B_TEXTAREAS_3.length === 3 · STEP3B_OUTPUT_H3_5.length === 5(不是 6)
 */

// Step3bTextarea · 字段 id 与 Step3 同名(personalInfo)· 确保跨 step 预填链路不断
export interface Step3bTextarea {
  id: 'personalInfo' | 'advantages' | 'story';
  label: string;
  required: boolean;
  placeholder: string;
}

// STEP3B_TEXTAREAS_3 · 3 个 textarea 字面 1:1 · personalInfo/advantages/story
export const STEP3B_TEXTAREAS_3: readonly Step3bTextarea[] = [
  {
    id: 'personalInfo',
    label: '你的个人信息',
    required: true,
    placeholder: '详细描述你的个人背景、专业技能、从业经验、擅长领域、个人特点等。\n\n示例：我是一名有10年经验的美容师，擅长皮肤管理和抗衰项目...',
  },
  {
    id: 'advantages',
    label: '个人优势/特长',
    required: false,
    placeholder: '你有什么独特的优势？比如：独特的经历、专业证书、成功案例、个人特质...',
  },
  {
    id: 'story',
    label: '个人故事/经历',
    required: false,
    placeholder: '分享你的个人故事：为什么做这个行业？有什么转折点？什么经历让你与众不同？',
  },
] as const;

// STEP3B_AUDIENCE · input 字段 · 目标受众
export const STEP3B_AUDIENCE = {
  label: '目标受众',
  required: false,
  placeholder: '你想吸引什么样的粉丝？',
} as const;

// Step3bOutputBlock · 5 H3 输出模块(§7.3 5 大模块 · 严禁加 H3 '专属人设方案' 作第 6)
export interface Step3bOutputBlock {
  id: 'coreIdentity' | 'ideologySystem' | 'contentPersona' | 'trustSystem' | 'personaRoadmap';
  h3Label: string;  // H3 文字 · 字面 1:1 来源 spec §7.3
}

// STEP3B_OUTPUT_H3_5 · 5 项 H3 字面 1:1 · 严禁改写或扩充
export const STEP3B_OUTPUT_H3_5: readonly Step3bOutputBlock[] = [
  { id: 'coreIdentity',   h3Label: '1. 核心身份定位' },
  { id: 'ideologySystem', h3Label: '2. 思想体系' },
  { id: 'contentPersona', h3Label: '3. 内容人设' },
  { id: 'trustSystem',    h3Label: '4. 信任构建体系' },
  { id: 'personaRoadmap', h3Label: '5. 人设打造路线图' },
] as const;

// STEP3B_CTA · 主 CTA + 操作按钮字面 1:1
export const STEP3B_CTA_LABEL = '生成专属人设方案';
export const STEP3B_BUTTON_OPTIMIZE = '智能优化';
export const STEP3B_BUTTON_COPY_ALL = '复制全部';

// STEP3B_PAGE · 顶部 step 标签 + H1 + 副标
export const STEP3B_STEP_TAG = 'STEP 03b · 人设定制方案';
export const STEP3B_H1 = '人设定制方案';
export const STEP3B_SUBTITLE_TEMPLATE = '当前行业：{industry}。输入你的个人信息，AI 将为你量身定制专属人设方案，包含核心身份定位、思想体系、内容人设等深度解析。';
