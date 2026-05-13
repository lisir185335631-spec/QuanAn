// PRD-12 US-003 AC-10 · PIIDetectionService unit tests — 10+ cases

import { describe, expect, it } from 'vitest';

import { PIIDetectionService } from '@/services/admin/content-review/pii-detection.service';

const svc = new PIIDetectionService();

describe('PIIDetectionService · detect', () => {
  it('空文本 → total=0 全部空数组', () => {
    const r = svc.detect('');
    expect(r.total).toBe(0);
    expect(r.idCards).toHaveLength(0);
    expect(r.phones).toHaveLength(0);
    expect(r.emails).toHaveLength(0);
    expect(r.bankCards).toHaveLength(0);
  });

  it('检出单个身份证号', () => {
    const r = svc.detect('身份证: 110101199003077777');
    expect(r.idCards).toContain('110101199003077777');
    expect(r.total).toBeGreaterThanOrEqual(1);
  });

  it('身份证末位 X 也能识别', () => {
    const r = svc.detect('ID: 11010119900307771X');
    expect(r.idCards).toHaveLength(1);
    expect(r.idCards[0]).toMatch(/X$/i);
  });

  it('检出单个中国手机号', () => {
    const r = svc.detect('联系方式: 13812345678');
    expect(r.phones).toContain('13812345678');
  });

  it('手机号段 1[3-9] 覆盖: 138/159/180/199', () => {
    const text = '138-1234-5678 159-8765-4321 180-0000-0000 199-1111-1111';
    const r = svc.detect(text.replace(/-/g, ''));
    expect(r.phones.length).toBeGreaterThanOrEqual(4);
  });

  it('检出 email 地址', () => {
    const r = svc.detect('请发邮件到 user@example.com 联系我');
    expect(r.emails).toContain('user@example.com');
  });

  it('检出银行卡号(16位)', () => {
    const r = svc.detect('卡号 6222021234567890');
    expect(r.bankCards.length).toBeGreaterThanOrEqual(1);
  });

  it('混合 PII 文本 → total = 各类之和', () => {
    const text = '用户 13812345678 email: a@b.cn 身份证 110101199003077777';
    const r = svc.detect(text);
    expect(r.total).toBe(r.idCards.length + r.phones.length + r.emails.length + r.bankCards.length);
    expect(r.total).toBeGreaterThanOrEqual(3);
  });

  it('无 PII 文本 → total=0', () => {
    const r = svc.detect('这只是一段普通文字，没有任何敏感信息');
    expect(r.total).toBe(0);
  });
});

describe('PIIDetectionService · redact', () => {
  it('身份证 → [ID-REDACTED]', () => {
    const out = svc.redact('身份证: 110101199003077777');
    expect(out).toContain('[ID-REDACTED]');
    expect(out).not.toContain('110101199003077777');
  });

  it('手机 → [PHONE-REDACTED]', () => {
    const out = svc.redact('电话: 13812345678');
    expect(out).toContain('[PHONE-REDACTED]');
    expect(out).not.toContain('13812345678');
  });

  it('email → [EMAIL-REDACTED]', () => {
    const out = svc.redact('邮箱: user@example.com');
    expect(out).toContain('[EMAIL-REDACTED]');
    expect(out).not.toContain('user@example.com');
  });

  it('混合 PII 全部被替换', () => {
    const text = '用户 13812345678 邮箱 a@b.cn 身份证 110101199003077777';
    const out = svc.redact(text);
    expect(out).toContain('[PHONE-REDACTED]');
    expect(out).toContain('[EMAIL-REDACTED]');
    expect(out).toContain('[ID-REDACTED]');
    expect(out).not.toContain('13812345678');
    expect(out).not.toContain('a@b.cn');
    expect(out).not.toContain('110101199003077777');
  });

  it('无 PII 文本 redact → 原样返回', () => {
    const text = '这是普通文字';
    expect(svc.redact(text)).toBe(text);
  });
});
