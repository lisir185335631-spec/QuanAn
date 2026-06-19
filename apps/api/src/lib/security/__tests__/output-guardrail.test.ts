import { describe, it, expect } from 'vitest';

import { checkOutput, scanObjectOutput } from '../output-guardrail';

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
