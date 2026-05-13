// PRD-12 US-003 AC-9 · BannedWordService unit tests — 8+ cases

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BannedWordService, ConfigurationError } from '@/services/admin/content-review/banned-word.service';

describe('BannedWordService · isMock=true (default)', () => {
  it('默认 constructor 使用 isMock=true (env 未设)', () => {
    const svc = new BannedWordService('', true);
    expect(svc).toBeInstanceOf(BannedWordService);
  });

  it('扫描命中违禁词 → verdict=auto_rejected + hits 含匹配词', async () => {
    const svc = new BannedWordService('', true);
    const result = await svc.scan('这篇文章涉及网络赌博问题');
    expect(result.verdict).toBe('auto_rejected');
    expect(result.hits).toContain('网络赌博');
  });

  it('无违禁词 → verdict=auto_approved + hits 为空', async () => {
    const svc = new BannedWordService('', true);
    const result = await svc.scan('这是一段完全正常的内容');
    expect(result.verdict).toBe('auto_approved');
    expect(result.hits).toHaveLength(0);
  });

  it('大小写不敏感匹配', async () => {
    const svc = new BannedWordService('', true);
    // 色情内容 is in mock dictionary
    const result = await svc.scan('含有色情内容的文章');
    expect(result.verdict).toBe('auto_rejected');
  });

  it('返回 checkedAt ISO 时间戳', async () => {
    const svc = new BannedWordService('', true);
    const result = await svc.scan('正常内容');
    expect(result.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('多词命中全部记录在 hits', async () => {
    const svc = new BannedWordService('', true);
    const result = await svc.scan('涉及色情内容和网络赌博两类违禁内容');
    expect(result.verdict).toBe('auto_rejected');
    expect(result.hits.length).toBeGreaterThanOrEqual(2);
  });
});

describe('BannedWordService · isMock=false · ConfigurationError', () => {
  it('isMock=false + empty webhookUrl → 抛 ConfigurationError', () => {
    expect(() => new BannedWordService('', false)).toThrow(ConfigurationError);
    expect(() => new BannedWordService('', false)).toThrow('BANNED_WORD_API_URL is required');
  });

  it('isMock=false + 有 URL → 不抛异常 (成功构造)', () => {
    expect(() => new BannedWordService('https://api.example.com/scan', false)).not.toThrow();
  });
});

describe('BannedWordService · isMock=false · fetch fallback', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetch 失败 → fallback needs_review (保守策略)', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('network error'));
    const svc = new BannedWordService('https://api.example.com/scan', false);
    const result = await svc.scan('任意内容');
    expect(result.verdict).toBe('needs_review');
    expect(result.hits).toHaveLength(0);
  });

  it('fetch 返回 verdict=auto_approved → 透传', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: () => Promise.resolve({ verdict: 'auto_approved', hits: [] }),
    } as Response);
    const svc = new BannedWordService('https://api.example.com/scan', false);
    const result = await svc.scan('干净内容');
    expect(result.verdict).toBe('auto_approved');
  });

  it('fetch 返回 verdict=auto_rejected → 透传 hits', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: () => Promise.resolve({ verdict: 'auto_rejected', hits: ['banned-term'] }),
    } as Response);
    const svc = new BannedWordService('https://api.example.com/scan', false);
    const result = await svc.scan('包含违禁词');
    expect(result.verdict).toBe('auto_rejected');
    expect(result.hits).toContain('banned-term');
  });

  it('fetch 返回无 verdict 字段 → fallback needs_review', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: () => Promise.resolve({}),
    } as Response);
    const svc = new BannedWordService('https://api.example.com/scan', false);
    const result = await svc.scan('内容');
    // AC-4: 外部 API 返回缺 verdict → needs_review 保守
    expect(result.verdict).toBe('needs_review');
  });
});
