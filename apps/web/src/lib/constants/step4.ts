/**
 * QuanAn · Step 4 执行计划常量 — 字面锁
 * 命名锁: STEP4_PLATFORMS_5 / STEP4_INPUTS_3 / STEP4_OUTPUT_H3_3 / STEP4_SUBTITLE_TEMPLATE
 * D1=A 红线: 所有字面量 1:1 来源 spec §7.4 line 1487-1513, 禁止改写
 */

// STEP4_PLATFORMS_5 · re-export from step3 · 严禁重复定义
export { STEP3_PLATFORMS_5 as STEP4_PLATFORMS_5 } from './step3';
export type { Step3Platform as Step4Platform } from './step3';

// Step4Input · 表单输入项接口
export interface Step4Input {
  id: string;
  label: string;
  required: boolean;
  type: 'input' | 'textarea';
  placeholder: string;
}

// STEP4_INPUTS_3 · 3 输入项字面 1:1 来源 spec §7.4 — PRD-22 US-008 字面锁更新
export const STEP4_INPUTS_3: readonly Step4Input[] = [
  {
    id: 'follower_count',
    label: '当前粉丝量',
    required: false,
    type: 'input',
    placeholder: '如：0 / 500 / 1万 / 10万',
  },
  {
    id: 'goal',
    label: '目标(如：6个月做到5万粉)',
    required: false,
    type: 'input',
    placeholder: '如：3个月涨粉1万、月入5万',
  },
  {
    id: 'personal_info',
    label: '详细描述你的情况',
    required: false,
    type: 'textarea',
    placeholder: '描述你的情况，比如：\n- 每天可投入2小时\n- 有实体店/线上课程\n- 擅长口播/拍摄',
  },
] as const;

// STEP4_PAGE · 顶部 step 标签 + H1 + 副标 + 按钮字面 1:1 来源 spec §7.4 — D-224 字面锁
export const STEP4_STEP_TAG = 'STEP 04 · 执行计划';
export const STEP4_H1 = '执行计划';
export const STEP4_BUTTON_GENERATE = '生成执行计划';
export const STEP4_RADIO_LABEL = '选择平台';
export const STEP4_RADIO_REQUIRED = true;
export const STEP4_LOADING_TEXT = 'AI 正在生成你的执行计划，预计 30-60 秒...';
export const STEP4_BUTTON_COPY = '复制';

// STEP4_SUBTITLE_TEMPLATE · 字面严格 1:1 来源 spec §7.4 line 1492 · 含全角中文冒号 · 末尾全角句号
export const STEP4_SUBTITLE_TEMPLATE = '当前行业：{industry}。AI 将为你制定每天具体做什么、每周里程碑、每个阶段 KPI 的可执行运营计划。';

// STEP4_OUTPUT_H3_3 · 3 H3 输出模块字面 — D-220 字面锁 · PRD-22 US-008 更新
export interface Step4OutputBlock {
  id: string;
  h3Label: string;
}

export const STEP4_OUTPUT_H3_3 = [
  { id: 'daily_kpi',  h3Label: '每日 KPI' },
  { id: 'weekly_kpi', h3Label: '每周 KPI' },
  { id: 'phase_kpi',  h3Label: '阶段 KPI' },
] as const;

// Step4Result · 结构化 AI 输出接口
export interface Step4Result {
  daily_tasks: string[];
  weekly_milestones: string[];
  phase_kpis: Array<{
    phase: string;
    kpi: string;
    target: string;
  }>;
}

// Step4KpiResult · PRD-22 US-008 新增 · 3 KPI H3 块数据
export interface Step4KpiResult {
  daily_kpi: string[];
  weekly_kpi: string[];
  phase_kpi: string[];
}

// ─── PRD-29.9 · 真实字面(根据 sally zhao /step/4 demo 截图)─────────
// 旧 STEP4_OUTPUT_H3_3 / STEP4_INPUTS_3 是 PRD-22 历史 schema · 跟实际 aiipznt 不符 · 保留 @deprecated
// 实际 aiipznt sally /step/4 输出 · form 4 字段 + 6 output sub-component

// 顶部 breadcrumb + H1
export const STEP4_BREADCRUMB_REAL = 'STEP 04 › 制定执行计划' as const;
export const STEP4_H1_REAL = '执行计划' as const;
export const STEP4_OUTPUT_H2 = '你的专属执行计划' as const;

// CTA 字面
export const STEP4_CTA_GENERATE = '生成执行计划' as const;
export const STEP4_CTA_BULK_OPTIMIZE = '智能优化' as const;
export const STEP4_CTA_BULK_REGENERATE = '重新生成' as const;  // 注意: 不是"一键重新生成"
export const STEP4_CTA_BULK_COPY = '复制全部' as const;

// footer
export const STEP4_FOOTER_FEEDBACK_QUESTION = '这个结果对你有帮助吗？' as const;
export const STEP4_FOOTER_COMPLETION_TITLE = '执行计划 已完成 🎉' as const;
export const STEP4_FOOTER_COMPLETION_DESC = '分析结果已保存。建议继续下一步「变现路径」，让AI为你生成更精准的方案。' as const;
export const STEP4_FOOTER_BUTTON_NEXT = '继续下一步：变现路径 >' as const;
export const STEP4_FOOTER_BUTTON_VIEW_IP = '查看我的IP方案' as const;

// 总览 5 字段 label
export const STEP4_OVERVIEW_LABELS = {
  currentStage: '当前阶段',
  coreGoal: '核心目标',
  timeline: '总体时间线',
  mainPlatform: '主攻平台',
  coreAdvantages: '核心优势',
} as const;
