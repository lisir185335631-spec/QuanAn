// PRD-12 US-002 AC-9: ≥ 5 tests · trending-auto-verdict.service

import { describe, expect, it } from 'vitest';

import { computeAutoVerdict } from '@/services/admin/content-review/trending-auto-verdict.service';

const RAW = { title: '正常内容', description: '这是一段正常的描述' };
const RAW_WITH_BANNED = { title: '色情内容', description: '这段含违禁词' };

describe('computeAutoVerdict', () => {
  it('命中违禁词 → auto_rejected', () => {
    const result = computeAutoVerdict(RAW_WITH_BANNED, ['色情'], 0);
    expect(result.autoVerdict).toBe('auto_rejected');
    expect(result.scanResult.bannedWordHits).toContain('色情');
  });

  it('0 hit + 抽样率=0 → auto_approved', () => {
    const result = computeAutoVerdict(RAW, [], 0);
    expect(result.autoVerdict).toBe('auto_approved');
    expect(result.scanResult.bannedWordHits).toHaveLength(0);
    expect(result.scanResult.isSampled).toBe(false);
  });

  it('0 hit + 抽样率=1 → needs_review (必然被抽中)', () => {
    const result = computeAutoVerdict(RAW, [], 1);
    expect(result.autoVerdict).toBe('needs_review');
    expect(result.scanResult.isSampled).toBe(true);
  });

  it('scanResult 含 checkedAt ISO 时间戳', () => {
    const result = computeAutoVerdict(RAW, [], 0);
    expect(result.scanResult.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('bannedWords 大小写不敏感匹配', () => {
    const raw = { title: 'PORNO content here', desc: 'normal' };
    const result = computeAutoVerdict(raw, ['porno'], 0);
    expect(result.autoVerdict).toBe('auto_rejected');
  });

  it('多条违禁词全部记录在 bannedWordHits', () => {
    const raw = { title: '色情 暴力 内容' };
    const result = computeAutoVerdict(raw, ['色情', '暴力', '正常词'], 0);
    expect(result.autoVerdict).toBe('auto_rejected');
    expect(result.scanResult.bannedWordHits).toContain('色情');
    expect(result.scanResult.bannedWordHits).toContain('暴力');
    expect(result.scanResult.bannedWordHits).not.toContain('正常词');
  });

  it('空内容 + 空规则 → auto_approved', () => {
    const result = computeAutoVerdict({}, [], 0);
    expect(result.autoVerdict).toBe('auto_approved');
  });
});
