import { describe, it, expect } from 'vitest';

import {
  DIAGNOSIS_DIMENSIONS_8,
  DIAGNOSIS_STAGES_4,
  DIAGNOSIS_H1,
  DIAGNOSIS_SUBTITLE,
  REPORT_DIMENSIONS_7,
} from '../diagnosis';

describe('DIAGNOSIS_DIMENSIONS_8', () => {
  it('8 dimensions 数量', () => {
    expect(DIAGNOSIS_DIMENSIONS_8).toHaveLength(8);
  });

  it('first dimension is basic (Step 1 基本信息)', () => {
    expect(DIAGNOSIS_DIMENSIONS_8[0]!.id).toBe('basic');
    expect(DIAGNOSIS_DIMENSIONS_8[0]!.label).toBe('基本信息');
    expect(DIAGNOSIS_DIMENSIONS_8[0]!.checkboxes).toHaveLength(0);
  });

  it('19 checkbox 总数 (spec §8.5.1 实际: 3+3+2+2+3+3+3=19)', () => {
    // AC-2 写 "16" 是笔误 · spec §8.5.1 实际数量 = 19
    const total = DIAGNOSIS_DIMENSIONS_8.reduce((sum, d) => sum + d.checkboxes.length, 0);
    expect(total).toBe(19);
  });

  it('positioning 3 checkboxes · 字面 1:1 spec §8.5.1', () => {
    const dim = DIAGNOSIS_DIMENSIONS_8.find((d) => d.id === 'positioning')!;
    expect(dim.checkboxes).toHaveLength(3);
    expect(dim.checkboxes[0]).toBe('已确定赛道方向');
    expect(dim.checkboxes[1]).toBe('产品定位明确，知道卖什么');
    expect(dim.checkboxes[2]).toBe('产品链条清晰（引流品→利润品→高端品）');
  });

  it('branding 3 checkboxes · 字面锁', () => {
    const dim = DIAGNOSIS_DIMENSIONS_8.find((d) => d.id === 'branding')!;
    expect(dim.checkboxes).toHaveLength(3);
    expect(dim.checkboxes[0]).toBe('头像是生活化的真人照片');
  });

  it('traffic 2 checkboxes · 字面锁', () => {
    const dim = DIAGNOSIS_DIMENSIONS_8.find((d) => d.id === 'traffic')!;
    expect(dim.checkboxes).toHaveLength(2);
    expect(dim.checkboxes[1]).toBe('有单条视频破10万播放');
  });

  it('value 2 checkboxes · 字面锁', () => {
    const dim = DIAGNOSIS_DIMENSIONS_8.find((d) => d.id === 'value')!;
    expect(dim.checkboxes).toHaveLength(2);
    expect(dim.checkboxes[1]).toBe('有单条视频播放量超过20万');
  });

  it('case 3 checkboxes · 字面锁', () => {
    const dim = DIAGNOSIS_DIMENSIONS_8.find((d) => d.id === 'case')!;
    expect(dim.checkboxes).toHaveLength(3);
    expect(dim.checkboxes[2]).toBe('有真实的用户评价/反馈');
  });

  it('persona 3 checkboxes · 字面锁', () => {
    const dim = DIAGNOSIS_DIMENSIONS_8.find((d) => d.id === 'persona')!;
    expect(dim.checkboxes).toHaveLength(3);
    expect(dim.checkboxes[0]).toBe('有对人对事的态度/观点类内容');
  });

  it('authentic 3 checkboxes · 字面锁', () => {
    const dim = DIAGNOSIS_DIMENSIONS_8.find((d) => d.id === 'authentic')!;
    expect(dim.checkboxes).toHaveLength(3);
    expect(dim.checkboxes[1]).toBe('说话是口语化的，不是念稿/播音腔');
  });
});

describe('DIAGNOSIS_STAGES_4', () => {
  it('4 阶段字面 · 含中点 · · spec §8.5.1', () => {
    expect(DIAGNOSIS_STAGES_4).toHaveLength(4);
    expect(DIAGNOSIS_STAGES_4[0].label).toBe('起步期 · 刚开始做 IP，还在摸索中');
    expect(DIAGNOSIS_STAGES_4[1].label).toBe('成长期 · 有一定内容了，但变现不稳定');
    expect(DIAGNOSIS_STAGES_4[2].label).toBe('爆发期 · 内容有爆款，正在放大变现');
    expect(DIAGNOSIS_STAGES_4[3].label).toBe('瓶颈期 · 遇到增长瓶颈，需要突破');
  });

  it('4 阶段 value 字段存在且唯一', () => {
    const values = DIAGNOSIS_STAGES_4.map((s) => s.value);
    expect(new Set(values).size).toBe(4);
  });
});

describe('REPORT_DIMENSIONS_7', () => {
  it('7 report dimensions (slice off basic)', () => {
    expect(REPORT_DIMENSIONS_7).toHaveLength(7);
    expect(REPORT_DIMENSIONS_7[0]!.id).toBe('positioning');
    expect(REPORT_DIMENSIONS_7[6]!.id).toBe('authentic');
  });
});

describe('Literal strings', () => {
  it('H1 字面锁', () => {
    expect(DIAGNOSIS_H1).toBe('7 维度 IP 诊断报告');
  });

  it('subtitle 字面锁', () => {
    expect(DIAGNOSIS_SUBTITLE).toBe(
      '像老师一样诊断你的 IP，找出问题，给出具体可执行的改进方案',
    );
  });
});
