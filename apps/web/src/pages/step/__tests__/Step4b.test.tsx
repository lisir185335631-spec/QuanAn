import { describe, it, expect } from 'vitest';

import { adaptStep4bResult } from '../Step4b';

describe('adaptStep4bResult', () => {
  const mockRaw = {
    currentAnalysis: '当前变现阶段分析：你的行业竞争激烈，但垂直细分领域仍有增长空间。',
    ladder: [
      { stage: '0→90万阶段·冷启动', revenue: '0-9万/月', action: '积累私域，验证产品-市场契合' },
      { stage: '100万→1000万阶段·规模化', revenue: '10-80万/月', action: '扩张团队，标准化产品体系' },
      { stage: '1000万→1亿阶段·品牌化', revenue: '100万+/月', action: '品牌IP化，资本运作' },
    ],
    revenueStructure: {
      primary: '课程/知识付费',
      secondary: ['品牌合作/赞助', '代理/分销'],
    },
    successCases: [
      { title: '张教练', summary: '从健身房教练到线上IP，18个月年收入200万' },
      { title: '李美妆', summary: '美妆博主起号，私域3000人，月入10万' },
    ],
  };

  it('maps currentAnalysis to market_analysis', () => {
    const result = adaptStep4bResult(mockRaw, '美容行业');
    expect(result.market_analysis.industry).toBe('美容行业');
    expect(result.market_analysis.marketSize).toContain('当前变现阶段分析');
  });

  it('maps ladder to three_stages with STEP4B_THREE_STAGES ranges', () => {
    const result = adaptStep4bResult(mockRaw, '美容行业');
    expect(result.three_stages.length).toBe(3);
    expect(result.three_stages[0].range).toBe('0→90万');
    expect(result.three_stages[1].range).toBe('100万→1000万');
    expect(result.three_stages[2].range).toBe('1000万→1亿');
  });

  it('maps ladder[i].action to coreStrategy', () => {
    const result = adaptStep4bResult(mockRaw, '美容行业');
    expect(result.three_stages[0].coreStrategy).toBe('积累私域，验证产品-市场契合');
    expect(result.three_stages[1].coreStrategy).toBe('扩张团队，标准化产品体系');
  });

  it('maps revenueStructure primary at 60% and secondary at 25%/15%', () => {
    const result = adaptStep4bResult(mockRaw, '美容行业');
    expect(result.revenue_structure[0]!.category).toBe('课程/知识付费');
    expect(result.revenue_structure[0]!.percent).toBe(60);
    expect(result.revenue_structure[1]!.category).toBe('品牌合作/赞助');
    expect(result.revenue_structure[1]!.percent).toBe(25);
    expect(result.revenue_structure[2]!.category).toBe('代理/分销');
    expect(result.revenue_structure[2]!.percent).toBe(15);
  });

  it('maps successCases title/summary to name/result fields', () => {
    const result = adaptStep4bResult(mockRaw, '美容行业');
    expect(result.success_cases[0]!.name).toBe('张教练');
    expect(result.success_cases[0]!.result).toContain('年收入200万');
    expect(result.success_cases[1]!.name).toBe('李美妆');
  });

  it('handles empty ladder gracefully', () => {
    const emptyRaw = { currentAnalysis: '分析内容', ladder: [], revenueStructure: {}, successCases: [] };
    const result = adaptStep4bResult(emptyRaw, '通用行业');
    expect(result.three_stages.length).toBe(3);
    expect(result.three_stages[0].coreStrategy).toBe('');
    expect(result.revenue_structure.length).toBe(0);
    expect(result.success_cases.length).toBe(0);
  });

  it('revenue_structure uses simple percent numbers · 0 recharts dependency', () => {
    const result = adaptStep4bResult(mockRaw, '美容行业');
    result.revenue_structure.forEach((item) => {
      expect(typeof item.percent).toBe('number');
      expect(item.percent).toBeGreaterThan(0);
      expect(item.percent).toBeLessThanOrEqual(100);
    });
  });
});
