import { describe, it, expect } from 'vitest';
import {
  STEP6_SUBTITLE,
  STEP6_TEXTAREA,
  STEP6_TEXTAREA_MIN_CHARS,
  STEP6_CHAR_COUNTER_TEMPLATE,
  STEP6_OUTPUT_MODULES_3,
} from '../step6';
import type { Step6Result, Step6StoryboardScene } from '../step6';

describe('STEP6 constants', () => {
  it('SUBTITLE 字面严格 1:1 spec §7.7 line 1639', () => {
    expect(STEP6_SUBTITLE).toBe(
      '输入你的文案内容，AI 将自动生成完整的分镜脚本、拍摄方案和口播提词器。',
    );
  });

  it('TEXTAREA placeholder 含 \\n\\n 两段换行 · 「文案生成」全角引号 · 全角括号', () => {
    expect(STEP6_TEXTAREA.placeholder).toContain('\n\n');
    expect(STEP6_TEXTAREA.placeholder).toContain('「文案生成」');
    expect(STEP6_TEXTAREA.placeholder).toContain('（至少 10 个字）');
    expect(STEP6_TEXTAREA.placeholder).toBe(
      '粘贴你的短视频文案（至少 10 个字），AI 将基于文案生成完整的拍摄计划。\n\n你可以使用第七步「文案生成」功能先生成文案，再来这里生成拍摄计划。',
    );
  });

  it('TEXTAREA_MIN_CHARS === 10', () => {
    expect(STEP6_TEXTAREA_MIN_CHARS).toBe(10);
  });

  it('CHAR_COUNTER_TEMPLATE 字面严格 1:1 spec §7.7 line 1647', () => {
    expect(STEP6_CHAR_COUNTER_TEMPLATE).toBe('已输入 {count} 字');
  });

  it('OUTPUT_MODULES_3 length === 3 · 3 个 h3Label 字面 1:1', () => {
    expect(STEP6_OUTPUT_MODULES_3.length).toBe(3);
    expect(STEP6_OUTPUT_MODULES_3[0]!.h3Label).toBe('1. 分镜脚本');
    expect(STEP6_OUTPUT_MODULES_3[1]!.h3Label).toBe('2. 拍摄方案');
    expect(STEP6_OUTPUT_MODULES_3[2]!.h3Label).toBe('3. 口播提词器');
  });

  it('Step6Result interface 字段结构', () => {
    const scene: Step6StoryboardScene = {
      shot_number: 1,
      duration: '3s',
      scene: '室内',
      framing: '中景',
      angle: '平视',
      movement: '固定',
      emotion: '自信',
      dialogue: '大家好',
      action: '看镜头',
    };
    const result: Step6Result = {
      storyboard: [scene],
      shooting_plan: {
        props: '无',
        lighting: '自然光',
        costume: '商务',
        location: '办公室',
      },
      teleprompter: '大家好，今天分享...',
    };
    expect(result.storyboard[0]!.shot_number).toBe(1);
    expect(result.shooting_plan.props).toBe('无');
    expect(typeof result.teleprompter).toBe('string');
  });
});
