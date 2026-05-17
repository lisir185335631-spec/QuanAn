import { describe, it, expect } from 'vitest';
import {
  STEP4B_THREE_STAGES,
  STEP4B_PRODUCT_TYPES_4,
  STEP4B_SUBTITLE_TEMPLATE,
  STEP4B_OUTPUT_H3_5,
  STEP4B_INPUTS_3,
  STEP4B_TEXTAREA,
  STEP4B_BUTTON_GENERATE,
  STEP4B_BUTTON_OPTIMIZE,
  STEP4B_BUTTON_REGENERATE,
} from '../step4b';
import type { Step4bResult } from '../step4b';

describe('STEP4B constants', () => {
  it('三阶梯 range 字面 1:1 spec §7.5 line 1546-1564', () => {
    expect(STEP4B_THREE_STAGES[0].range).toBe('0→90万');
    expect(STEP4B_THREE_STAGES[1].range).toBe('100万→1000万');
    expect(STEP4B_THREE_STAGES[2].range).toBe('1000万→1亿');
  });

  it('4 产品类型字面 1:1 spec §7.5 line 1551', () => {
    expect([...STEP4B_PRODUCT_TYPES_4]).toEqual(['引流品', '信任品', '利润品', '后端产品']);
  });

  it('SUBTITLE 字面严格 1:1 spec §7.5 line 1521', () => {
    expect(STEP4B_SUBTITLE_TEMPLATE).toBe(
      '当前行业：{industry}。AI 将为你规划三阶梯变现路径：0→90 万、100 万→1000 万、1000 万→1 亿，每个阶梯有具体的产品设计、定价策略和成交流程。',
    );
  });

  it('OUTPUT_H3_5 数量锁 · length === 5', () => {
    expect(STEP4B_OUTPUT_H3_5.length).toBe(5);
  });

  it('INPUTS_3 数量锁 · length === 3', () => {
    expect(STEP4B_INPUTS_3.length).toBe(3);
  });

  it('TEXTAREA required === true · id === product_description', () => {
    expect(STEP4B_TEXTAREA.required).toBe(true);
    expect(STEP4B_TEXTAREA.id).toBe('product_description');
  });

  it('BUTTONS 3 字面 1:1 spec §7.5 line 1532', () => {
    expect(STEP4B_BUTTON_GENERATE).toBe('生成变现路径');
    expect(STEP4B_BUTTON_OPTIMIZE).toBe('智能优化');
    expect(STEP4B_BUTTON_REGENERATE).toBe('重新生成');
  });

  it('Step4bResult interface 字段结构', () => {
    const mockStage = {
      range: '0→90万',
      title: '起步',
      duration: '6-12个月',
      coreStrategy: '积累',
      productMatrix: [],
      trafficStrategy: '私域',
      conversionFlow: [],
      keyActions: [],
      risks: [],
    };
    const result: Step4bResult = {
      market_analysis: {
        industry: '美容行业',
        marketSize: '千亿',
        competitionLevel: '高',
        monetizationPotential: '强',
      },
      three_stages: [
        mockStage,
        { ...mockStage, range: '100万→1000万', title: '扩张', duration: '12-24个月' },
        { ...mockStage, range: '1000万→1亿', title: '品牌化', duration: '24-60个月' },
      ],
      revenue_structure: [{ category: '知识付费', percent: 40, description: '课程收入' }],
      success_cases: [{ name: '张三', type: '美容', journey: '从小白到百万', result: '年入百万', insight: '坚持' }],
    };
    expect(Array.isArray(result.three_stages)).toBe(true);
    expect(result.three_stages.length).toBe(3);
    expect(Array.isArray(result.revenue_structure)).toBe(true);
    expect(Array.isArray(result.success_cases)).toBe(true);
  });
});
