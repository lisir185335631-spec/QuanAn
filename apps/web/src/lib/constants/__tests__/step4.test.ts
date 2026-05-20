import { describe, it, expect } from 'vitest';

import {
  STEP4_PLATFORMS_5,
  STEP4_INPUTS_3,
  STEP4_OUTPUT_H3_3,
  STEP4_SUBTITLE_TEMPLATE,
} from '../step4';

import type { Step4Result } from '../step4';

describe('STEP4 constants', () => {
  it('SUBTITLE 字面严格 1:1 spec §7.4 line 1492', () => {
    expect(STEP4_SUBTITLE_TEMPLATE).toBe(
      '当前行业：{industry}。AI 将为你制定每天具体做什么、每周里程碑、每个阶段 KPI 的可执行运营计划。',
    );
  });

  it('INPUTS_3 数量锁 · length === 3', () => {
    expect(STEP4_INPUTS_3.length).toBe(3);
  });

  it('OUTPUT_H3_3 数量锁 · length === 3', () => {
    expect(STEP4_OUTPUT_H3_3.length).toBe(3);
  });

  it('PLATFORMS_5 re-export · length === 5', () => {
    expect(STEP4_PLATFORMS_5.length).toBe(5);
  });

  it('Step4Result interface 字段结构', () => {
    const result: Step4Result = {
      daily_tasks: ['task1'],
      weekly_milestones: ['milestone1'],
      phase_kpis: [{ phase: 'P1', kpi: 'followers', target: '1000' }],
    };
    expect(Array.isArray(result.daily_tasks)).toBe(true);
    expect(Array.isArray(result.weekly_milestones)).toBe(true);
    expect(Array.isArray(result.phase_kpis)).toBe(true);
    expect(result.phase_kpis[0]).toHaveProperty('phase');
    expect(result.phase_kpis[0]).toHaveProperty('kpi');
    expect(result.phase_kpis[0]).toHaveProperty('target');
  });
});
