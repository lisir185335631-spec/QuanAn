/**
 * QuanAn · Step 6 拍摄计划常量 — 字面锁
 * 命名锁: STEP6_TEXTAREA / STEP6_OUTPUT_MODULES_3 / STEP6_TEXTAREA_MIN_CHARS
 * D1=A 红线: 所有字面量 1:1 来源 spec §7.7 line 1634-1661, 禁止改写
 * 数字锁: STEP6_TEXTAREA_MIN_CHARS === 10 · STEP6_OUTPUT_MODULES_3.length === 3
 */

// ─── Interface Definitions ────────────────────────────────────────────────────

export interface Step6Textarea {
  id: string;
  label: string;
  required: boolean;
  placeholder: string;
}

export interface Step6OutputModule {
  id: string;
  h3Label: string;
}

export interface Step6StoryboardScene {
  shot_number: number;
  duration: string;
  scene: string;
  framing: string;
  angle: string;
  movement: string;
  emotion: string;
  dialogue: string;
  action: string;
}

export interface Step6Result {
  storyboard: Step6StoryboardScene[];
  shooting_plan: {
    props: string;
    lighting: string;
    costume: string;
    location: string;
  };
  teleprompter: string;
}

// ─── Page Labels ──────────────────────────────────────────────────────────────

// AC-5 字面锁: "STEP 06 · 拍摄计划"
export const STEP6_STEP_TAG = 'STEP 06 · 拍摄计划';
export const STEP6_H1 = '拍摄计划';

// STEP6_SUBTITLE · 字面严格 1:1 spec §7.7 line 1639 · 含全角句号
export const STEP6_SUBTITLE =
  '输入你的文案内容，AI 将自动生成完整的分镜脚本、拍摄方案和口播提词器。';

// ─── Form Textarea ────────────────────────────────────────────────────────────

// STEP6_TEXTAREA · 1 必填 textarea · spec §7.7 line 1643-1646
// placeholder 含 \n\n 两段换行 · 含「」全角引号 · 含全角括号（）· 末尾全角句号
// AC-6 字面锁: label="短视频文案" · placeholder 无空格"（至少10个字）"
export const STEP6_TEXTAREA: Step6Textarea = {
  id: 'copywriting_text',
  label: '短视频文案',
  required: true,
  placeholder:
    '粘贴你的短视频文案（至少10个字），AI 将基于文案生成完整的拍摄计划。\n\n你可以使用第七步「文案生成」功能先生成文案，再来这里生成拍摄计划。',
} as const;

// ─── Numeric & Template Constants ─────────────────────────────────────────────

// spec §7.7 line 1647 · 严格 1:1 · 禁止改写为 '当前 {count} 字' 或 '已输入 {count} 个字'
export const STEP6_TEXTAREA_MIN_CHARS = 10;
export const STEP6_CHAR_COUNTER_TEMPLATE = '已输入 {count} 字';

// ─── Buttons ──────────────────────────────────────────────────────────────────

export const STEP6_BUTTON_GENERATE = '生成拍摄计划';
export const STEP6_LOADING_TEXT = 'AI 正在生成拍摄计划，预计 30-60 秒...';

// ─── Output Modules ───────────────────────────────────────────────────────────

// STEP6_OUTPUT_MODULES_3 · 3 项严格字面 1:1 spec §7.7 line 1658-1660
// 禁止 '分镜表' 或 '拍摄计划' 等同义改写
export const STEP6_OUTPUT_MODULES_3: readonly Step6OutputModule[] = [
  { id: 'storyboard',    h3Label: '1. 分镜脚本' },
  { id: 'shooting_plan', h3Label: '2. 拍摄方案' },
  { id: 'teleprompter',  h3Label: '3. 口播提词器' },
] as const;
