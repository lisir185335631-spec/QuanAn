/**
 * QuanQn · Step 4 执行计划常量 — 字面锁
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

// STEP4_INPUTS_3 · 3 输入项字面 1:1 来源 spec §7.4 line 1497-1507
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
    label: '目标',
    required: false,
    type: 'input',
    placeholder: '如：3个月涨粉1万、月入5万',
  },
  {
    id: 'personal_info',
    label: '个人信息',
    required: false,
    type: 'textarea',
    placeholder: '描述你的情况，比如：\n- 每天可投入2小时\n- 有实体店/线上课程\n- 擅长口播/拍摄',
  },
] as const;

// STEP4_PAGE · 顶部 step 标签 + H1 + 副标 + 按钮字面 1:1 来源 spec §7.4
export const STEP4_STEP_TAG = 'STEP 04 · 制定执行计划';
export const STEP4_H1 = '执行计划';
export const STEP4_BUTTON_GENERATE = '生成执行计划';
export const STEP4_RADIO_LABEL = '选择平台';
export const STEP4_RADIO_REQUIRED = true;
export const STEP4_LOADING_TEXT = 'AI 正在生成你的执行计划，预计 30-60 秒...';
export const STEP4_BUTTON_COPY = '复制';

// STEP4_SUBTITLE_TEMPLATE · 字面严格 1:1 来源 spec §7.4 line 1492 · 含全角中文冒号 · 末尾全角句号
export const STEP4_SUBTITLE_TEMPLATE = '当前行业：{industry}。AI 将为你制定每天具体做什么、每周里程碑、每个阶段 KPI 的可执行运营计划。';

// STEP4_OUTPUT_H3_3 · 3 H3 输出模块字面 1:1 来源 spec §7.4
export interface Step4OutputBlock {
  id: string;
  h3Label: string;
}

export const STEP4_OUTPUT_H3_3 = [
  { id: 'daily_tasks',        h3Label: '1. 每日任务表' },
  { id: 'weekly_milestones',  h3Label: '2. 每周里程碑' },
  { id: 'phase_kpis',         h3Label: '3. 阶段 KPI' },
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
