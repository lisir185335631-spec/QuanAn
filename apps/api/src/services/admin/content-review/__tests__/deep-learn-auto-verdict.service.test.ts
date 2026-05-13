// PRD-12 US-008 · deep-learn-auto-verdict.service · 8+ tests
// 覆盖: 强 PII(身份证/银行卡) / 违禁词 / 解析失败 / 抽样 / auto_approved / redact

import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockBannedWordScan = vi.fn();
const mockPIIDetect = vi.fn();
const mockPIIRedact = vi.fn();

vi.mock('@/services/admin/content-review/banned-word.service', () => ({
  bannedWordService: { scan: mockBannedWordScan },
}));

vi.mock('@/services/admin/content-review/pii-detection.service', () => ({
  piiDetectionService: {
    detect: mockPIIDetect,
    redact: mockPIIRedact,
  },
}));

const { computeDeepLearnAutoVerdict } = await import(
  '@/services/admin/content-review/deep-learn-auto-verdict.service'
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cleanPII() {
  mockPIIDetect.mockReturnValue({ idCards: [], phones: [], emails: [], bankCards: [], total: 0 });
  mockPIIRedact.mockImplementation((t: string) => t);
}

function noBanned() {
  mockBannedWordScan.mockResolvedValue({ verdict: 'auto_approved', hits: [], checkedAt: 'now' });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('computeDeepLearnAutoVerdict', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('强 PII: 身份证 >= 1 → auto_rejected', async () => {
    mockPIIDetect.mockReturnValue({ idCards: ['110101199001011234'], phones: [], emails: [], bankCards: [], total: 1 });
    mockPIIRedact.mockReturnValue('[ID-REDACTED]');
    noBanned();

    const result = await computeDeepLearnAutoVerdict('身份证 110101199001011234');
    expect(result.autoVerdict).toBe('auto_rejected');
    expect(result.scanResult.piiCriticalHits).toBe(1);
  });

  it('强 PII: 银行卡 >= 1 → auto_rejected', async () => {
    mockPIIDetect.mockReturnValue({ idCards: [], phones: [], emails: [], bankCards: ['6222021234567890'], total: 1 });
    mockPIIRedact.mockReturnValue('[CARD-REDACTED]');
    noBanned();

    const result = await computeDeepLearnAutoVerdict('银行卡 6222021234567890');
    expect(result.autoVerdict).toBe('auto_rejected');
    expect(result.scanResult.piiCriticalHits).toBe(1);
  });

  it('强 PII: 身份证 + 银行卡同时命中 → auto_rejected · piiCriticalHits=2', async () => {
    mockPIIDetect.mockReturnValue({
      idCards: ['110101199001011234'],
      phones: [],
      emails: [],
      bankCards: ['6222021234567890'],
      total: 2,
    });
    mockPIIRedact.mockReturnValue('[REDACTED]');
    noBanned();

    const result = await computeDeepLearnAutoVerdict('both');
    expect(result.autoVerdict).toBe('auto_rejected');
    expect(result.scanResult.piiCriticalHits).toBe(2);
  });

  it('违禁词命中 → auto_rejected', async () => {
    cleanPII();
    mockBannedWordScan.mockResolvedValue({
      verdict: 'auto_rejected',
      hits: ['政变'],
      checkedAt: 'now',
    });

    const result = await computeDeepLearnAutoVerdict('内容包含政变字样');
    expect(result.autoVerdict).toBe('auto_rejected');
    expect(result.scanResult.bannedWordHits).toEqual(['政变']);
  });

  it('parseFailed=true → needs_review (conservative)', async () => {
    cleanPII();
    noBanned();

    const result = await computeDeepLearnAutoVerdict('', { parseFailed: true });
    expect(result.autoVerdict).toBe('needs_review');
    expect(result.scanResult.parseFailed).toBe(true);
    expect(result.scanResult.isSampled).toBe(false);
  });

  it('抽样命中 (samplingRate=1) → needs_review · isSampled=true', async () => {
    cleanPII();
    noBanned();

    const result = await computeDeepLearnAutoVerdict('正常内容', { samplingRate: 1 });
    expect(result.autoVerdict).toBe('needs_review');
    expect(result.scanResult.isSampled).toBe(true);
  });

  it('无 PII + 无违禁词 + 无抽样 (samplingRate=0) → auto_approved', async () => {
    cleanPII();
    noBanned();

    const result = await computeDeepLearnAutoVerdict('完全正常的内容', { samplingRate: 0 });
    expect(result.autoVerdict).toBe('auto_approved');
    expect(result.scanResult.isSampled).toBe(false);
    expect(result.scanResult.piiCriticalHits).toBe(0);
    expect(result.scanResult.bannedWordHits).toHaveLength(0);
  });

  it('AC-6: redactedText 由 piiDetectionService.redact 返回 · 存入结果', async () => {
    mockPIIDetect.mockReturnValue({ idCards: [], phones: ['13800138000'], emails: [], bankCards: [], total: 1 });
    mockPIIRedact.mockReturnValue('联系方式 [PHONE-REDACTED]');
    noBanned();

    const result = await computeDeepLearnAutoVerdict('联系方式 13800138000', { samplingRate: 0 });
    expect(result.redactedText).toBe('联系方式 [PHONE-REDACTED]');
  });

  it('弱 PII(手机)不触发 auto_rejected · samplingRate=0 → auto_approved', async () => {
    mockPIIDetect.mockReturnValue({ idCards: [], phones: ['13800138000'], emails: [], bankCards: [], total: 1 });
    mockPIIRedact.mockReturnValue('[PHONE-REDACTED]');
    noBanned();

    // weak PII alone does not force rejection
    const result = await computeDeepLearnAutoVerdict('phone text', { samplingRate: 0 });
    expect(result.autoVerdict).toBe('auto_approved');
    expect(result.scanResult.piiCriticalHits).toBe(0); // only idCards + bankCards count
  });

  it('banned-word scan 在 redactedText 上执行 (防 PII 泄漏)', async () => {
    mockPIIDetect.mockReturnValue({ idCards: [], phones: [], emails: [], bankCards: [], total: 0 });
    mockPIIRedact.mockReturnValue('REDACTED_OUTPUT');
    noBanned();

    await computeDeepLearnAutoVerdict('原始内容', { samplingRate: 0 });
    // bannedWordService.scan must receive the redacted text, not the original
    expect(mockBannedWordScan).toHaveBeenCalledWith('REDACTED_OUTPUT');
  });
});
