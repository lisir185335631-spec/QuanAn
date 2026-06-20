import { describe, it, expect } from 'vitest';

import { checkOutput, scanObjectOutput, detectAdLawViolation } from '../output-guardrail';

describe('checkOutput unit', () => {
  it('masks phone number in output', () => {
    const result = checkOutput('联系13800138000了解详情');
    expect(result.sanitized).not.toContain('13800138000');
    expect(result.sanitized).toContain('<PHONE>');
  });

  it('masks email in output', () => {
    const result = checkOutput('联系 test@example.com 了解');
    expect(result.sanitized).not.toContain('test@example.com');
    expect(result.sanitized).toContain('<EMAIL>');
  });

  it('detects and softens 保证 promise', () => {
    const result = checkOutput('保证月入50万');
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.sanitized).not.toContain('保证');
    expect(result.sanitized).toContain('[预计/建议目标]');
  });

  it('detects 稳赚 promise', () => {
    const result = checkOutput('投资稳赚不亏');
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.sanitized).toContain('[预计/建议目标]');
  });

  it('detects 100%成交', () => {
    const result = checkOutput('方法100%成交客户');
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.sanitized).toContain('[预计/建议目标]');
  });

  it('detects 100%涨粉', () => {
    const result = checkOutput('这个方法100%涨粉');
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it('detects 包赚 promise', () => {
    const result = checkOutput('投资包赚回来');
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it('F-3: bare 包涨 no longer triggers (bare stock idiom, no conversion/earnings context)', () => {
    // F-3 narrowing: 包涨 (bare) removed — only 包赚 and 包涨粉 remain as explicit gain idioms
    const result = checkOutput('这支股包涨');
    expect(result.violations.length).toBe(0);
  });

  it('F-3: bare 一定 no longer triggers (avoids false positive on "一定程度上")', () => {
    // F-3 narrowing: bare 一定 removed — requires quantified/conversion context
    const result = checkOutput('一定能成功');
    expect(result.violations.length).toBe(0);
  });

  it('normal text has empty violations', () => {
    const result = checkOutput('这是正常的内容创作建议，有望提升粉丝量');
    expect(result.violations).toHaveLength(0);
    expect(result.sanitized).toBe('这是正常的内容创作建议，有望提升粉丝量');
  });

  it('empty string returns empty violations and same text', () => {
    const result = checkOutput('');
    expect(result.violations).toHaveLength(0);
    expect(result.sanitized).toBe('');
  });

  it('combined: phone + promise → both sanitized', () => {
    const result = checkOutput('联系13800138000 保证月入50万');
    expect(result.sanitized).not.toContain('13800138000');
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it('multiple promises in text → multiple violations', () => {
    const result = checkOutput('保证月入50万，稳赚不亏');
    expect(result.violations.length).toBeGreaterThanOrEqual(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// G71: 广告法第九条 绝对化用语 — detectAdLawViolation unit tests
// ─────────────────────────────────────────────────────────────────────────────
describe('detectAdLawViolation — 广告法第九条 绝对化用语', () => {
  // ── Positive (正向): must detect ──────────────────────────────────────────

  it('[正向] 全网第一 — 排他性极限词', () => {
    const v = detectAdLawViolation('这是全网第一品牌');
    expect(v.length).toBeGreaterThan(0);
    expect(v.some((x) => x.type === 'ad_law_superlative')).toBe(true);
  });

  it('[正向] 行业第一 — 排他性极限词', () => {
    const v = detectAdLawViolation('行业第一的服务体验');
    expect(v.length).toBeGreaterThan(0);
  });

  it('[正向] 国家级品质 — 国家级/世界级绝对化', () => {
    const v = detectAdLawViolation('国家级品质认证产品');
    expect(v.length).toBeGreaterThan(0);
    expect(v[0]?.label).toContain('国家级');
  });

  it('[正向] 世界级服务 — 世界级绝对化', () => {
    const v = detectAdLawViolation('世界级服务标准');
    expect(v.length).toBeGreaterThan(0);
  });

  it('[负向] 最佳选择 — G71 fix: 选择非商品名词，收窄后不命中', () => {
    // After G71 fix: Cat3 requires commercial noun context. "选择" is not in the commercial noun set.
    const v = detectAdLawViolation('这是您的最佳选择');
    expect(v).toHaveLength(0);
  });

  it('[正向] 全网最低 — 全网+最高级绝对化', () => {
    const v = detectAdLawViolation('全网最低价格出售');
    expect(v.length).toBeGreaterThan(0);
  });

  it('[正向] 独家秘方 — 排他性极限词-独家', () => {
    const v = detectAdLawViolation('采用独家秘方调配');
    expect(v.length).toBeGreaterThan(0);
    expect(v[0]?.label).toContain('独家');
  });

  it('[正向] 唯一授权 — 排他性极限词-唯一', () => {
    const v = detectAdLawViolation('全国唯一授权代理商');
    expect(v.length).toBeGreaterThan(0);
  });

  it('[正向] 史无前例 — 史无前例类绝对化成语', () => {
    const v = detectAdLawViolation('史无前例的优惠活动');
    expect(v.length).toBeGreaterThan(0);
    expect(v[0]?.label).toContain('史无前例');
  });

  it('[正向] 前所未有 — 史无前例类', () => {
    const v = detectAdLawViolation('前所未有的使用体验');
    expect(v.length).toBeGreaterThan(0);
  });

  it('[正向] 绝无仅有 — 史无前例类', () => {
    const v = detectAdLawViolation('绝无仅有的限量产品');
    expect(v.length).toBeGreaterThan(0);
  });

  it('[正向] 顶级品质 — 顶级/极致程度绝对化', () => {
    const v = detectAdLawViolation('顶级品质的护肤品');
    expect(v.length).toBeGreaterThan(0);
    expect(v[0]?.label).toContain('顶级');
  });

  it('[正向] 全国领先品牌 — 市场领导地位绝对化', () => {
    const v = detectAdLawViolation('全国领先品牌');
    expect(v.length).toBeGreaterThan(0);
    expect(v[0]?.label).toContain('市场领导');
  });

  // ── Negative (负向): must NOT detect (false positive prevention) ────────

  it('[负向] 第一步 — 序数/流程语境，非绝对化', () => {
    const v = detectAdLawViolation('第一步先了解产品功能');
    expect(v).toHaveLength(0);
  });

  it('[负向] 第一次 — 序数语境', () => {
    const v = detectAdLawViolation('这是第一次购买的用户');
    expect(v).toHaveLength(0);
  });

  it('[负向] 第一个问题 — 序数语境', () => {
    const v = detectAdLawViolation('我们来看第一个问题');
    expect(v).toHaveLength(0);
  });

  it('[负向] 最近的问题 — 时间副词，非绝对化', () => {
    const v = detectAdLawViolation('最近的问题比较多');
    expect(v).toHaveLength(0);
  });

  it('[负向] 最后一条 — 终止语境，非绝对化', () => {
    const v = detectAdLawViolation('请看最后一条提示');
    expect(v).toHaveLength(0);
  });

  it('[负向] 品质优良 — 普通正面描述，非极限', () => {
    const v = detectAdLawViolation('产品品质优良，性价比高');
    expect(v).toHaveLength(0);
  });

  it('[负向] 用户好评 — 普通正面描述', () => {
    const v = detectAdLawViolation('收到了很多用户好评');
    expect(v).toHaveLength(0);
  });

  it('[负向] 第一步先做需求分析（完整句）', () => {
    const v = detectAdLawViolation('第一步先做需求分析，第二步再规划实施路径');
    expect(v).toHaveLength(0);
  });

  it('[负向] 最多三次机会 — 数量副词', () => {
    const v = detectAdLawViolation('每人最多三次机会');
    expect(v).toHaveLength(0);
  });

  // ── G71 fix: 新增负向 case — 收窄后不命中 ─────────────────────────────────

  it('[负向] 最专业的建议 — 建议非商品名词，不命中', () => {
    const v = detectAdLawViolation('给您最专业的建议');
    expect(v).toHaveLength(0);
  });

  it('[负向] 最佳实践 — 实践非商品名词，不命中', () => {
    const v = detectAdLawViolation('遵循最佳实践来开发');
    expect(v).toHaveLength(0);
  });

  it('[负向] 最好的方法 — 方法非商品名词，不命中', () => {
    const v = detectAdLawViolation('这是最好的方法');
    expect(v).toHaveLength(0);
  });

  it('[负向] 最快提升粉丝量 — 提升非商品名词，不命中', () => {
    const v = detectAdLawViolation('帮你最快提升粉丝量');
    expect(v).toHaveLength(0);
  });

  it('[负向] 服务一流 — 一流已从后置列表移除，不命中', () => {
    const v = detectAdLawViolation('我们的服务一流，值得信赖');
    expect(v).toHaveLength(0);
  });

  it('[负向] 体验一流 — 一流已从后置列表移除，不命中', () => {
    const v = detectAdLawViolation('产品体验一流');
    expect(v).toHaveLength(0);
  });

  it('[负向] 无敌可爱 — 可爱非商品名词，不命中', () => {
    const v = detectAdLawViolation('这个设计真是无敌可爱');
    expect(v).toHaveLength(0);
  });

  it('[负向] 无可替代的人才优势 — 人才优势非商品名词，不命中', () => {
    const v = detectAdLawViolation('这是无可替代的人才优势');
    expect(v).toHaveLength(0);
  });

  it('[负向] 全国第一届创作者大赛 — 届已加入排除后缀，不命中', () => {
    const v = detectAdLawViolation('全国第一届创作者大赛');
    expect(v).toHaveLength(0);
  });

  it('[负向] 全球第一批用户 — 批已加入排除后缀，不命中', () => {
    const v = detectAdLawViolation('感谢全球第一批用户的支持');
    expect(v).toHaveLength(0);
  });

  // ── G71 fix: 保留正向仍命中 ────────────────────────────────────────────────

  it('[正向] 最好的产品 — 产品是商品名词，命中', () => {
    const v = detectAdLawViolation('这是最好的产品');
    expect(v.length).toBeGreaterThan(0);
    expect(v.some((x) => x.label.includes('最高级'))).toBe(true);
  });

  it('[正向] 最专业的服务 — 服务是商品名词，命中', () => {
    const v = detectAdLawViolation('提供最专业的服务');
    expect(v.length).toBeGreaterThan(0);
  });

  it('[正向] 最低价格 — 价格是商品名词，命中', () => {
    const v = detectAdLawViolation('保证最低价格');
    expect(v.length).toBeGreaterThan(0);
  });

  it('[正向] 全网第一品牌 — 品牌后缀，仍命中', () => {
    const v = detectAdLawViolation('全网第一品牌认证');
    expect(v.length).toBeGreaterThan(0);
  });

  it('[正向] 遥遥领先 — 新增词条，命中', () => {
    const v = detectAdLawViolation('我们的技术遥遥领先同行');
    expect(v.length).toBeGreaterThan(0);
    expect(v.some((x) => x.label.includes('史无前例'))).toBe(true);
  });

  it('[正向] 无敌品质 — 品质是商品名词，仍命中', () => {
    const v = detectAdLawViolation('无敌品质令人折服');
    expect(v.length).toBeGreaterThan(0);
  });

  it('[正向] 天下第一品牌 — 品牌是商品名词，仍命中', () => {
    const v = detectAdLawViolation('号称天下第一品牌');
    expect(v.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// G71: checkOutput integration — Ad Law + existing over-promise together
// ─────────────────────────────────────────────────────────────────────────────
describe('checkOutput — G71 Ad Law integration', () => {
  it('[正向] 全网第一 → checkOutput 检出并软化', () => {
    const result = checkOutput('这是全网第一品牌，质量有保障');
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations.some((v) => v.includes('ad_law_superlative'))).toBe(true);
    expect(result.sanitized).not.toContain('全网第一');
    expect(result.sanitized).toContain('[合规替换]');
  });

  it('[负向] 最佳选择 → checkOutput G71 fix: 选择非商品名词，零违规', () => {
    // After G71 fix: "最佳选择" no longer triggers — 选择 is not a commercial noun.
    const result = checkOutput('为您推荐最佳选择');
    expect(result.violations.filter((v) => v.includes('ad_law_superlative'))).toHaveLength(0);
    expect(result.sanitized).toContain('最佳选择');
  });

  it('[正向] 独家秘方 → checkOutput 检出', () => {
    const result = checkOutput('本品采用独家秘方精心调配');
    expect(result.violations.some((v) => v.includes('ad_law_superlative'))).toBe(true);
    expect(result.sanitized).toContain('[合规替换]');
  });

  it('[正向] Ad Law + over-promise 同时出现 → 两类都记录', () => {
    const result = checkOutput('全网第一品牌，保证月入50万');
    const adLawHits = result.violations.filter((v) => v.includes('ad_law_superlative'));
    const overPromiseHits = result.violations.filter((v) => !v.includes('ad_law_superlative'));
    expect(adLawHits.length).toBeGreaterThan(0);
    expect(overPromiseHits.length).toBeGreaterThan(0);
  });

  it('[负向] 品质优良+第一步 → checkOutput 零违规', () => {
    const result = checkOutput('产品品质优良，第一步先完成注册');
    expect(result.violations).toHaveLength(0);
    expect(result.sanitized).toBe('产品品质优良，第一步先完成注册');
  });
});

describe('scanObjectOutput unit', () => {
  it('scans string fields in nested object', () => {
    const obj = {
      title: '保证月入50万的秘诀',
      metadata: { note: '普通内容' },
    };
    const result = scanObjectOutput(obj);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(String(result.sanitized['title'])).not.toContain('保证月入50万');
    expect(String((result.sanitized['metadata'] as Record<string, unknown>)['note'])).toBe('普通内容');
  });

  it('leaves non-string fields untouched', () => {
    const obj = { count: 42, active: true, data: null };
    const result = scanObjectOutput(obj);
    expect(result.violations).toHaveLength(0);
    expect(result.sanitized['count']).toBe(42);
    expect(result.sanitized['active']).toBe(true);
    expect(result.sanitized['data']).toBeNull();
  });

  it('scans string values in arrays', () => {
    const obj = { items: ['正常文字', '保证涨粉100%成交'] };
    const result = scanObjectOutput(obj);
    expect(result.violations.length).toBeGreaterThan(0);
    const items = result.sanitized['items'] as string[];
    expect(items[0]).toBe('正常文字');
    expect(items[1]).not.toContain('保证');
  });

  it('clean object returns empty violations', () => {
    const obj = { message: '建议优化内容质量', score: 85 };
    const result = scanObjectOutput(obj);
    expect(result.violations).toHaveLength(0);
    expect(result.sanitized['message']).toBe('建议优化内容质量');
  });

  it('deeply nested object scans all string fields', () => {
    const obj = {
      level1: {
        level2: {
          text: '稳赚保证',
        },
      },
    };
    const result = scanObjectOutput(obj);
    expect(result.violations.length).toBeGreaterThan(0);
    const l1 = result.sanitized['level1'] as Record<string, unknown>;
    const l2 = l1['level2'] as Record<string, unknown>;
    expect(String(l2['text'])).not.toContain('稳赚');
  });
});
