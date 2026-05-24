/**
 * QuanAn · Step 3b 人设定制方案常量 — 字面锁
 * 命名锁: STEP3B_TEXTAREAS_3 / STEP3B_OUTPUT_H3_6 / STEP3B_AUDIENCE / STEP3B_CTA_LABEL / STEP3B_BUTTON_*
 * D1=A 红线: 所有字面量 1:1 来源 spec §7.3 + D-220, 禁止改写
 * 数字锁: STEP3B_TEXTAREAS_3.length === 3 · STEP3B_OUTPUT_H3_6.length === 6
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
    label: '你的独特优势',
    required: false,
    placeholder: '你有什么独特的优势？比如：独特的经历、专业证书、成功案例、个人特质...',
  },
  {
    id: 'story',
    label: '你的个人故事',
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

// Step3bOutputBlock · 6 H3 输出模块(D-220 字面锁)
export interface Step3bOutputBlock {
  id: 'personaPosition' | 'personaTags' | 'contentDirection' | 'differentiationStrategy' | 'contentDirectionAdvice' | 'ipStoryFramework';
  h3Label: string;  // H3 文字 · 字面 1:1 来源 D-220
}

// STEP3B_OUTPUT_H3_6 · 6 项 H3 字面 1:1 · 严禁改写或扩充
export const STEP3B_OUTPUT_H3_6: readonly Step3bOutputBlock[] = [
  { id: 'personaPosition',         h3Label: '人设定位' },
  { id: 'personaTags',             h3Label: '人设标签' },
  { id: 'contentDirection',        h3Label: '内容方向' },
  { id: 'differentiationStrategy', h3Label: '差异化策略' },
  { id: 'contentDirectionAdvice',  h3Label: '内容方向建议' },
  { id: 'ipStoryFramework',        h3Label: 'IP 故事框架' },
] as const;

// backward-compat alias (old name had 5; now 6 — keep export so other pages don't break)
/** @deprecated use STEP3B_OUTPUT_H3_6 */
export const STEP3B_OUTPUT_H3_5 = STEP3B_OUTPUT_H3_6;

// STEP3B_LOADING_TEXT · loading 文案
export const STEP3B_LOADING_TEXT = 'AI 正在生成你的专属人设方案，预计 30-60 秒...';

// STEP3B_CTA · 主 CTA + 操作按钮字面 1:1
export const STEP3B_CTA_LABEL = '生成专属人设方案';
export const STEP3B_BUTTON_COPY = '复制';
export const STEP3B_BUTTON_REGENERATE = '重新生成';
export const STEP3B_BUTTON_OPTIMIZE = '智能优化';
export const STEP3B_BUTTON_COPY_ALL = '复制全部';
export const STEP3B_BUTTON_REGEN_ALL = '一键重新生成';

// STEP3B_PAGE · 顶部 step 标签 + H1 + 副标
export const STEP3B_STEP_TAG = 'STEP 03B · 人设定制方案';
export const STEP3B_H1 = '人设定制方案';
export const STEP3B_SUBTITLE_TEMPLATE = '当前行业：{industry}。输入你的个人信息和故事，AI 将精准识别你的独特人设、记忆点、思想体系，打造有辨识度的个人 IP。';

// PRD-20 TD-80 fix: Step3bResult heading 常量
export const STEP3B_RESULT_H2 = '专属人设方案' as const;

// ─── PRD-29.8 · 真实 5 H3 字面(根据 sally zhao demo 截图)─────────
// 旧 STEP3B_OUTPUT_H3_6 是 PRD-20 历史 schema · 字面跟实际 aiipznt 不符 · 保留 @deprecated
// 实际 aiipznt sally /step/3b 输出 5 H3 · 字面如下
export interface Step3bRealH3Block {
  id: 'coreIdentity' | 'thoughtSystem' | 'contentPersona' | 'trustSystem' | 'roadmap';
  h3Label: string;
}

export const STEP3B_OUTPUT_H3_5_REAL: readonly Step3bRealH3Block[] = [
  { id: 'coreIdentity',   h3Label: '核心身份定位' },
  { id: 'thoughtSystem',  h3Label: '思想体系' },
  { id: 'contentPersona', h3Label: '内容人设' },
  { id: 'trustSystem',    h3Label: '信任构建体系' },
  { id: 'roadmap',        h3Label: '人设打造路线图' },
] as const;

// 整页顶部 H2 (输出区域)
export const STEP3B_RESULT_H2_REAL = '专属人设方案' as const;

// 顶部 toolbar 3 button(同 /step/3)
export const STEP3B_CTA_BULK_OPTIMIZE = '智能优化';
export const STEP3B_CTA_BULK_REGENERATE = '一键重新生成';
export const STEP3B_CTA_BULK_COPY = '复制全部';

// breadcrumb
export const STEP3B_BREADCRUMB = 'STEP 03b › 人设定制方案';

// H3-5 路线图右上 button
export const STEP3B_BUTTON_VIEW_PLAN = '执行计划';
