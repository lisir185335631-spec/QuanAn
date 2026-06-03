import { describe, it, expect } from 'vitest';

import {
  DIAGNOSIS_DIMENSIONS_8,
  DIAGNOSIS_STAGES_4,
  DIAGNOSIS_H1,
  DIAGNOSIS_SUBTITLE,
  DIAGNOSIS_CHIP_LABEL,
  DIAGNOSIS_STEP1_LABELS,
  DIAGNOSIS_DIMENSION_PLACEHOLDERS,
  DIAGNOSIS_BUTTONS,
  DIAGNOSIS_MOCK_REPORT,
  REPORT_HEADING_PRIORITY,
  REPORT_HEADING_WEEKLY,
  REPORT_HEADING_ACTION_PLAN,
  REPORT_HEADING_CORE_ISSUES,
  REPORT_HEADING_DETAILED,
  REPORT_LABEL_SCORE_TOTAL,
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
  it('4 阶段 value 字段存在且唯一', () => {
    const values = DIAGNOSIS_STAGES_4.map((s) => s.value);
    expect(new Set(values).size).toBe(4);
  });

  it('4 阶段 label 字面锁(无中点 · 有 desc 字段)', () => {
    expect(DIAGNOSIS_STAGES_4).toHaveLength(4);
    expect(DIAGNOSIS_STAGES_4[0].label).toBe('起步期');
    expect(DIAGNOSIS_STAGES_4[0].desc).toBe('刚开始做IP，还在摸索中');
    expect(DIAGNOSIS_STAGES_4[1].label).toBe('成长期');
    expect(DIAGNOSIS_STAGES_4[1].desc).toBe('有一定内容了，但变现不稳定');
    expect(DIAGNOSIS_STAGES_4[2].label).toBe('爆发期');
    expect(DIAGNOSIS_STAGES_4[2].desc).toBe('内容有爆款，正在放大变现');
    expect(DIAGNOSIS_STAGES_4[3].label).toBe('瓶颈期');
    expect(DIAGNOSIS_STAGES_4[3].desc).toBe('遇到增长瓶颈，需要突破');
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
  it('H1 字面锁(无空格)', () => {
    expect(DIAGNOSIS_H1).toBe('7维度IP诊断报告');
  });

  it('subtitle 字面锁(无空格 · 全角标点)', () => {
    expect(DIAGNOSIS_SUBTITLE).toBe(
      '像老师一样诊断你的IP，找出问题，给出具体可执行的改进方案',
    );
  });

  it('DIAGNOSIS_CHIP_LABEL 字面锁', () => {
    expect(DIAGNOSIS_CHIP_LABEL).toBe('IP健康度诊断');
  });

  it('DIAGNOSIS_STEP1_LABELS 字面锁', () => {
    expect(DIAGNOSIS_STEP1_LABELS.industry).toBe('你的行业');
    expect(DIAGNOSIS_STEP1_LABELS.product).toBe('你的产品/服务');
    expect(DIAGNOSIS_STEP1_LABELS.stage).toBe('你目前的阶段');
  });

  it('DIAGNOSIS_DIMENSION_PLACEHOLDERS 7 维度', () => {
    expect(Object.keys(DIAGNOSIS_DIMENSION_PLACEHOLDERS)).toHaveLength(7);
    expect(DIAGNOSIS_DIMENSION_PLACEHOLDERS['positioning']).toContain('美业赛道');
    expect(DIAGNOSIS_DIMENSION_PLACEHOLDERS['branding']).toContain('昵称');
  });

  it('DIAGNOSIS_BUTTONS 字面锁', () => {
    expect(DIAGNOSIS_BUTTONS.generate).toBe('生成诊断报告');
    expect(DIAGNOSIS_BUTTONS.restart).toBe('重新诊断');
    expect(DIAGNOSIS_BUTTONS.history).toBe('诊断历史');
    expect(DIAGNOSIS_BUTTONS.todayTasks).toBe('查看今日任务');
  });

  it('REPORT_HEADING_* 字面锁', () => {
    expect(REPORT_HEADING_PRIORITY).toBe('优先级排序及行动计划');
    expect(REPORT_HEADING_WEEKLY).toBe('本周立即行动任务清单');
    expect(REPORT_HEADING_ACTION_PLAN).toBe('行动计划');
    expect(REPORT_HEADING_CORE_ISSUES).toBe('核心问题');
    expect(REPORT_HEADING_DETAILED).toBe('详细诊断报告');
    expect(REPORT_LABEL_SCORE_TOTAL).toBe('IP健康度总分');
  });
});

describe('DIAGNOSIS_MOCK_REPORT', () => {
  it('7 dimensionScores', () => {
    expect(DIAGNOSIS_MOCK_REPORT.dimensionScores).toHaveLength(7);
  });

  it('4 coreIssues · 字面首条锁', () => {
    expect(DIAGNOSIS_MOCK_REPORT.coreIssues).toHaveLength(4);
    expect(DIAGNOSIS_MOCK_REPORT.coreIssues[0]).toBe('定位模糊，缺乏明确的目标客户和产品价值主张。');
  });

  it('5 details · 字面首条 label 锁', () => {
    expect(DIAGNOSIS_MOCK_REPORT.details).toHaveLength(5);
    expect(DIAGNOSIS_MOCK_REPORT.details[0]!.label).toBe('定位清晰度');
    expect(DIAGNOSIS_MOCK_REPORT.details[4]!.label).toBe('案例型内容');
  });

  it('5 prioritySteps', () => {
    expect(DIAGNOSIS_MOCK_REPORT.prioritySteps).toHaveLength(5);
    expect(DIAGNOSIS_MOCK_REPORT.prioritySteps[0]!.title).toBe('第一步（本周内）：定位清晰度');
  });

  it('4 weeklyTasks · heading 字面锁', () => {
    expect(DIAGNOSIS_MOCK_REPORT.weeklyTasks).toHaveLength(4);
    expect(DIAGNOSIS_MOCK_REPORT.weeklyTasks[0]!.heading).toBe('明确细分赛道：');
  });

  it('5 actionPlans · 期限字面锁', () => {
    expect(DIAGNOSIS_MOCK_REPORT.actionPlans).toHaveLength(5);
    expect(DIAGNOSIS_MOCK_REPORT.actionPlans[0]!.deadline).toBe('本周内');
    expect(DIAGNOSIS_MOCK_REPORT.actionPlans[4]!.deadline).toBe('4周内');
  });
});
