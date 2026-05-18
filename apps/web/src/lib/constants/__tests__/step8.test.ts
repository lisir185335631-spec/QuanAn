import { describe, it, expect } from 'vitest';
import {
  STEP8_SUBTITLE_TEMPLATE,
  STEP8_SUBFUNCTIONS_2,
  STEP8_EXPERIENCE_3,
  STEP8_OUTPUT_MODULES_6,
  STEP8_OPTIMIZE_OUTPUT_LABELS_2,
  STEP8_PLATFORMS_5,
  STEP8_BUTTON_GENERATE_PLAN,
  STEP8_BUTTON_OPTIMIZE_SCRIPT,
  STEP8_OPTIMIZE_MIN_CHARS,
} from '../step8';
import type { Step8Result } from '../step8';

describe('STEP8 constants', () => {
  it('SUBTITLE_TEMPLATE 字面 1:1 spec §7.9 line 1753 · 含全角中文冒号', () => {
    expect(STEP8_SUBTITLE_TEMPLATE).toBe(
      '当前行业：{industry}。AI 将生成完整的直播方案，包含详细话术、引流策略、互动设计，并支持 AI 优化直播脚本。',
    );
  });

  it('SUBFUNCTIONS_2 · 2 个 h3Label 字面 1:1 · 含全角冒号', () => {
    expect(STEP8_SUBFUNCTIONS_2.length).toBe(2);
    expect(STEP8_SUBFUNCTIONS_2[0]!.key).toBe('generate_plan');
    expect(STEP8_SUBFUNCTIONS_2[0]!.h3Label).toBe('子功能 1：生成直播方案');
    expect(STEP8_SUBFUNCTIONS_2[1]!.key).toBe('optimize_script');
    expect(STEP8_SUBFUNCTIONS_2[1]!.h3Label).toBe('子功能 2：AI 优化直播话术');
  });

  it('EXPERIENCE_3 · 3 个 label 含中点 · · 严禁 hyphen 或逗号', () => {
    expect(STEP8_EXPERIENCE_3.length).toBe(3);
    expect(STEP8_EXPERIENCE_3[0]!.label).toBe('新手 · 刚开始做直播');
    expect(STEP8_EXPERIENCE_3[1]!.label).toBe('有经验 · 有一定直播经验');
    expect(STEP8_EXPERIENCE_3[2]!.label).toBe('资深 · 直播经验丰富');
    // 严禁 hyphen
    STEP8_EXPERIENCE_3.forEach(e => expect(e.label).not.toContain(' - '));
  });

  it('OUTPUT_MODULES_6 · 6 个 h3Label 字面 1:1 spec §7.9 line 1782', () => {
    expect(STEP8_OUTPUT_MODULES_6.length).toBe(6);
    expect(STEP8_OUTPUT_MODULES_6[0]!.h3Label).toBe('1. 开场话术');
    expect(STEP8_OUTPUT_MODULES_6[1]!.h3Label).toBe('2. 中场互动');
    expect(STEP8_OUTPUT_MODULES_6[2]!.h3Label).toBe('3. 成交话术');
    expect(STEP8_OUTPUT_MODULES_6[3]!.h3Label).toBe('4. 收尾');
    expect(STEP8_OUTPUT_MODULES_6[4]!.h3Label).toBe('5. 引流策略');
    expect(STEP8_OUTPUT_MODULES_6[5]!.h3Label).toBe('6. 互动设计');
  });

  it('PLATFORMS_5 re-export from step3 · length === 5', () => {
    expect(STEP8_PLATFORMS_5.length).toBe(5);
    expect(STEP8_PLATFORMS_5[0]!.id).toBe('douyin');
  });

  it('BUTTON_GENERATE_PLAN + BUTTON_OPTIMIZE_SCRIPT 字面 1:1', () => {
    expect(STEP8_BUTTON_GENERATE_PLAN).toBe('生成直播方案');
    expect(STEP8_BUTTON_OPTIMIZE_SCRIPT).toBe('AI 优化话术');
  });

  it('OPTIMIZE_MIN_CHARS === 10', () => {
    expect(STEP8_OPTIMIZE_MIN_CHARS).toBe(10);
  });

  it('STEP8_OPTIMIZE_OUTPUT_LABELS_2 · TD-77 fix · length === 2 · 禁 hardcode', () => {
    expect(STEP8_OPTIMIZE_OUTPUT_LABELS_2.length).toBe(2);
    expect(STEP8_OPTIMIZE_OUTPUT_LABELS_2[0]!.id).toBe('optimized_text');
    expect(STEP8_OPTIMIZE_OUTPUT_LABELS_2[0]!.label).toBe('优化后文案');
    expect(STEP8_OPTIMIZE_OUTPUT_LABELS_2[1]!.id).toBe('optimization_notes');
    expect(STEP8_OPTIMIZE_OUTPUT_LABELS_2[1]!.label).toBe('优化说明');
  });

  it('Step8Result interface · generate_plan + optimize_script 两分支', () => {
    const r1: Step8Result = {
      sub_function: 'generate_plan',
      generate_plan: {
        opening: '开场话术内容',
        interaction: '中场互动内容',
        deal: '成交话术内容',
        closing: '收尾内容',
        traffic: '引流策略内容',
        engagement: '互动设计内容',
      },
    };
    expect(r1.sub_function).toBe('generate_plan');
    expect(r1.generate_plan?.opening).toBeTruthy();

    const r2: Step8Result = {
      sub_function: 'optimize_script',
      optimize_script: {
        optimized_text: '优化后话术',
        optimization_notes: '优化说明',
      },
    };
    expect(r2.sub_function).toBe('optimize_script');
    expect(r2.optimize_script?.optimized_text).toBeTruthy();
  });
});
