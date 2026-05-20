/**
 * QuanAn · Step 8 直播策划常量 — 字面锁
 * 命名锁: STEP8_SUBFUNCTIONS_2 / STEP8_EXPERIENCE_3 / STEP8_OUTPUT_MODULES_6
 * D1=A 红线: 所有字面量 1:1 来源 spec §7.9 line 1748-1786, 禁止改写
 * 数字锁: STEP8_SUBFUNCTIONS_2.length === 2 · STEP8_EXPERIENCE_3.length === 3
 *         STEP8_OUTPUT_MODULES_6.length === 6
 */

export { STEP3_PLATFORMS_5 as STEP8_PLATFORMS_5 } from './step3';
export type { Step3Platform as Step8Platform } from './step3';

// ─── Interface Definitions ────────────────────────────────────────────────────

export interface Step8SubFunction {
  key: 'generate_plan' | 'optimize_script';
  h3Label: string;
}

export interface Step8GeneratePlanInput {
  id: string;
  label: string;
  required: boolean;
  type: 'textarea' | 'input';
  placeholder: string;
}

export interface Step8Experience {
  key: 'novice' | 'experienced' | 'expert';
  label: string;
}

// AC-3 · STEP8_EXPERIENCES_3 · id/label/subtitle dual-line format
export interface Step8Experience3 {
  id: 'novice' | 'experienced' | 'senior';
  label: string;
  subtitle: string;
}

export interface Step8OutputModule {
  id: 'opening' | 'interaction' | 'deal' | 'closing' | 'traffic' | 'engagement';
  h3Label: string;
}

// AC-7 · tab 2 optimize output 4 H3 blocks
export interface Step8OptimizeOutputModule {
  id: 'highlight' | 'interaction' | 'conversion' | 'notes';
  h3Label: string;
}

export interface Step8GeneratePlanResult {
  opening: string;
  interaction: string;
  deal: string;
  closing: string;
  traffic: string;
  engagement: string;
}

export interface Step8OptimizeScriptResult {
  optimized_text: string;
  optimization_notes: string;
}

export interface Step8Result {
  sub_function: 'generate_plan' | 'optimize_script';
  generate_plan?: Step8GeneratePlanResult;
  optimize_script?: Step8OptimizeScriptResult;
}

// ─── Page Labels ──────────────────────────────────────────────────────────────

export const STEP8_STEP_TAG = 'STEP 08 · 直播策划';
export const STEP8_H1 = '直播策划';

// STEP8_SUBTITLE_TEMPLATE · 字面严格 1:1 spec §7.9 line 1753 · 含全角中文冒号
export const STEP8_SUBTITLE_TEMPLATE =
  '当前行业：{industry}。AI 将生成完整的直播方案，包含详细话术、引流策略、互动设计，并支持 AI 优化直播脚本。';

// ─── Sub Functions (2) ────────────────────────────────────────────────────────

// STEP8_SUBFUNCTIONS_2 · 2 项严格 · spec line 1755 + 1766 字面 1:1 · 含全角中文冒号
export const STEP8_SUBFUNCTIONS_2: readonly Step8SubFunction[] = [
  { key: 'generate_plan',  h3Label: '子功能 1：生成直播方案' },
  { key: 'optimize_script', h3Label: '子功能 2：AI 优化直播话术' },
] as const;

// ─── Generate Plan Form ───────────────────────────────────────────────────────

// STEP8_GENERATE_PLAN_TEXTAREA · spec line 1759 · 字面 1:1
export const STEP8_GENERATE_PLAN_TEXTAREA: Step8GeneratePlanInput = {
  id: 'product_info',
  label: '产品/服务信息',
  required: false,
  type: 'textarea',
  placeholder: '描述你要在直播中推广的产品或服务...',
};

// STEP8_GENERATE_PLAN_INPUT · spec line 1760 · 字面 1:1
export const STEP8_GENERATE_PLAN_INPUT: Step8GeneratePlanInput = {
  id: 'target_audience',
  label: '目标受众',
  required: false,
  type: 'input',
  placeholder: '如：25-40岁女性...',
};

// ─── Platform ─────────────────────────────────────────────────────────────────

export const STEP8_PLATFORM_RADIO_LABEL = '直播平台';

// ─── Experience (3) ───────────────────────────────────────────────────────────

// STEP8_EXPERIENCE_3 · 3 项严格 · spec §7.9 line 1762 字面 1:1
// 中点 · (U+00B7) + 两侧半角空格 · 严禁改为 ' - ' 或 ', '
export const STEP8_EXPERIENCE_3: readonly Step8Experience[] = [
  { key: 'novice',      label: '新手 · 刚开始做直播' },
  { key: 'experienced', label: '有经验 · 有一定直播经验' },
  { key: 'expert',      label: '资深 · 直播经验丰富' },
] as const;

// STEP8_EXPERIENCES_3 · AC-3 · id/label/subtitle format · dual-line display
export const STEP8_EXPERIENCES_3: readonly Step8Experience3[] = [
  { id: 'novice',      label: '新手',    subtitle: '刚开始做直播' },
  { id: 'experienced', label: '有经验',  subtitle: '有一定直播经验' },
  { id: 'senior',      label: '资深',    subtitle: '直播经验丰富' },
] as const;

export const STEP8_EXPERIENCE_RADIO_LABEL = '直播经验';
export const STEP8_BUTTON_GENERATE_PLAN = '生成直播方案';

// ─── Optimize Script Form ─────────────────────────────────────────────────────

// STEP8_OPTIMIZE_TEXTAREA · spec line 1770 · 含全角括号
export const STEP8_OPTIMIZE_TEXTAREA: Step8GeneratePlanInput = {
  id: 'product_info',
  label: '直播话术脚本',
  required: true,
  type: 'textarea',
  placeholder: '粘贴你的直播话术脚本（至少 10 个字），AI 将深度优化话术表达、互动设计和转化逻辑...',
};

// STEP8_OPTIMIZE_INPUT · spec line 1771 · 含全角括号
export const STEP8_OPTIMIZE_INPUT: Step8GeneratePlanInput = {
  id: 'target_audience',
  label: '优化目标',
  required: false,
  type: 'input',
  placeholder: '优化目标（可选），如：提升互动率、增强转化、更有感染力...',
};

export const STEP8_BUTTON_OPTIMIZE_SCRIPT = 'AI 优化话术';
export const STEP8_OPTIMIZE_MIN_CHARS = 10;
export const STEP8_OPTIMIZE_CHAR_COUNTER_TEMPLATE = '已输入 {count} 字';

// ─── Loading Texts ────────────────────────────────────────────────────────────

export const STEP8_GENERATE_LOADING_TEXT = 'AI 正在生成直播方案，预计 60-120 秒...';
export const STEP8_OPTIMIZE_LOADING_TEXT = 'AI 正在优化话术，预计 30-60 秒...';

// ─── Output Modules (6) ───────────────────────────────────────────────────────

// STEP8_OUTPUT_MODULES_6 · 6 项严格 · spec §7.9 line 1782 字面 1:1 · AC-5 plain labels
export const STEP8_OUTPUT_MODULES_6: readonly Step8OutputModule[] = [
  { id: 'opening',     h3Label: '开场话术' },
  { id: 'interaction', h3Label: '中场互动' },
  { id: 'deal',        h3Label: '成交话术' },
  { id: 'closing',     h3Label: '收尾' },
  { id: 'traffic',     h3Label: '引流策略' },
  { id: 'engagement',  h3Label: '互动设计' },
] as const;

// STEP8_OPTIMIZE_OUTPUT_MODULES_4 · AC-7 · tab 2 stub output 4 H3 blocks
export const STEP8_OPTIMIZE_OUTPUT_MODULES_4: readonly Step8OptimizeOutputModule[] = [
  { id: 'highlight',   h3Label: '优化亮点' },
  { id: 'interaction', h3Label: '互动设计' },
  { id: 'conversion',  h3Label: '转化关键' },
  { id: 'notes',       h3Label: '注意事项' },
] as const;

// ─── Optimize Script Output Labels (2) ── TD-77 fix · 常量化防 hardcode ────────

// STEP8_OPTIMIZE_OUTPUT_LABELS_2 · 2 项严格 · TD-77: InfoCard label 禁止 hardcode 中文
export const STEP8_OPTIMIZE_OUTPUT_LABELS_2 = [
  { id: 'optimized_text',      label: '优化后文案' },
  { id: 'optimization_notes',  label: '优化说明' },
] as const;

export type Step8OptimizeLabel = (typeof STEP8_OPTIMIZE_OUTPUT_LABELS_2)[number];
