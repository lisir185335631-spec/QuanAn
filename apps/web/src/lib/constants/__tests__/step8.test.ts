/**
 * PRD-23 US-003 · step8 constants unit tests
 * AC-12: ≥ 3 tests · STEP8_EXPERIENCES_3 字面 / 6 H3 输出常量 / PlatformInlineRadio import
 */
import { describe, it, expect } from 'vitest';

import { PlatformInlineRadio } from '@/components/inline-pickers/PlatformInlineRadio';

import {
  STEP8_EXPERIENCES_3,
  STEP8_OPTIMIZE_OUTPUT_MODULES_4,
  STEP8_OUTPUT_MODULES_6,
  STEP8_PLATFORMS_5,
  STEP8_SUBTITLE_TEMPLATE,
} from '../step8';

import type { Step8Result } from '../step8';

describe('STEP8 constants', () => {
  it('STEP8_EXPERIENCES_3 · 3 entries · id/label/subtitle 字面锁 (AC-3)', () => {
    expect(STEP8_EXPERIENCES_3.length).toBe(3);
    expect(STEP8_EXPERIENCES_3[0]).toMatchObject({ id: 'novice', label: '新手', subtitle: '刚开始做直播' });
    expect(STEP8_EXPERIENCES_3[1]).toMatchObject({ id: 'experienced', label: '有经验', subtitle: '有一定直播经验' });
    expect(STEP8_EXPERIENCES_3[2]).toMatchObject({ id: 'senior', label: '资深', subtitle: '直播经验丰富' });
  });

  it('STEP8_OUTPUT_MODULES_6 · plain labels no numbers · length === 6 (AC-5)', () => {
    expect(STEP8_OUTPUT_MODULES_6.length).toBe(6);
    expect(STEP8_OUTPUT_MODULES_6[0]!.h3Label).toBe('开场话术');
    expect(STEP8_OUTPUT_MODULES_6[1]!.h3Label).toBe('中场互动');
    expect(STEP8_OUTPUT_MODULES_6[2]!.h3Label).toBe('成交话术');
    expect(STEP8_OUTPUT_MODULES_6[3]!.h3Label).toBe('收尾');
    expect(STEP8_OUTPUT_MODULES_6[4]!.h3Label).toBe('引流策略');
    expect(STEP8_OUTPUT_MODULES_6[5]!.h3Label).toBe('互动设计');
    // 严禁数字前缀
    STEP8_OUTPUT_MODULES_6.forEach((m) => expect(m.h3Label).not.toMatch(/^\d/));
  });

  it('STEP8_PLATFORMS_5 · length === 5 · PlatformInlineRadio import 合法', () => {
    expect(STEP8_PLATFORMS_5.length).toBe(5);
    expect(STEP8_PLATFORMS_5[0]!.id).toBe('douyin');
    expect(typeof PlatformInlineRadio).toBe('function');
  });

  it('SUBTITLE_TEMPLATE 字面 1:1 spec §7.9 line 1753 · 含全角中文冒号', () => {
    expect(STEP8_SUBTITLE_TEMPLATE).toBe(
      '当前行业：{industry}。AI 将生成完整的直播方案，包含详细话术、引流策略、互动设计，并支持 AI 优化直播脚本。',
    );
  });

  it('STEP8_OPTIMIZE_OUTPUT_MODULES_4 · 4 H3 labels 字面锁 (AC-7)', () => {
    expect(STEP8_OPTIMIZE_OUTPUT_MODULES_4.length).toBe(4);
    expect(STEP8_OPTIMIZE_OUTPUT_MODULES_4[0]!.h3Label).toBe('优化亮点');
    expect(STEP8_OPTIMIZE_OUTPUT_MODULES_4[1]!.h3Label).toBe('互动设计');
    expect(STEP8_OPTIMIZE_OUTPUT_MODULES_4[2]!.h3Label).toBe('转化关键');
    expect(STEP8_OPTIMIZE_OUTPUT_MODULES_4[3]!.h3Label).toBe('注意事项');
  });

  it('Step8Result interface · generate_plan + optimize_script 两分支', () => {
    const r1: Step8Result = {
      sub_function: 'generate_plan',
      generate_plan: {
        opening: '开场话术',
        interaction: '中场互动',
        deal: '成交话术',
        closing: '收尾',
        traffic: '引流策略',
        engagement: '互动设计',
      },
    };
    expect(r1.sub_function).toBe('generate_plan');

    const r2: Step8Result = {
      sub_function: 'optimize_script',
      optimize_script: { optimized_text: '优化后话术', optimization_notes: '说明' },
    };
    expect(r2.sub_function).toBe('optimize_script');
  });
});
