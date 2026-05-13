// PRD-12 US-008 · file-parser worker · 12+ tests
// 覆盖: 5 file type / autoVerdict 4 branch (强 PII/弱 PII/banned/抽样) / size 限制 / mime 白名单

import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockDeepLearnReviewQueueCreate = vi.fn();
const mockAdminAuditLogCreate = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    deepLearnReviewQueue: { create: mockDeepLearnReviewQueueCreate },
    adminAuditLog: { create: mockAdminAuditLogCreate },
  },
}));

vi.mock('@/lib/redis', () => ({
  redis: { status: 'ready' },
}));

vi.mock('bullmq', () => ({
  Worker: vi.fn().mockImplementation(() => ({ on: vi.fn() })),
  Queue: vi.fn().mockImplementation(() => ({ add: vi.fn(), on: vi.fn() })),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const mockComputeVerdict = vi.fn();
vi.mock('@/services/admin/content-review/deep-learn-auto-verdict.service', () => ({
  computeDeepLearnAutoVerdict: mockComputeVerdict,
}));

const { processFileParserJob } = await import('@/workers/file-parser/worker');

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeApprovedVerdict() {
  return {
    autoVerdict: 'auto_approved' as const,
    scanResult: {
      piiTotal: 0,
      piiCriticalHits: 0,
      bannedWordHits: [],
      isSampled: false,
      parseFailed: false,
      checkedAt: new Date().toISOString(),
    },
    redactedText: '正常内容',
  };
}

const BASE = {
  userId: 1,
  accountId: 1,
  fileName: 'test.pdf',
  fileMime: 'application/pdf',
  fileSize: 1024,
  rawText: '正常内容',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('processFileParserJob', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeepLearnReviewQueueCreate.mockResolvedValue({ id: 1 });
    mockAdminAuditLogCreate.mockResolvedValue({ id: BigInt(1) });
    mockComputeVerdict.mockResolvedValue(makeApprovedVerdict());
  });

  // --- 5 file types ---

  it('PDF MIME 通过白名单 · 正常入 queue', async () => {
    await processFileParserJob({ ...BASE, fileMime: 'application/pdf', fileName: 'doc.pdf' });
    expect(mockDeepLearnReviewQueueCreate).toHaveBeenCalledOnce();
  });

  it('Word MIME (docx) 通过白名单 · 正常入 queue', async () => {
    const mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    await processFileParserJob({ ...BASE, fileMime: mime, fileName: 'doc.docx' });
    expect(mockDeepLearnReviewQueueCreate).toHaveBeenCalledOnce();
  });

  it('CSV MIME 通过白名单 · 正常入 queue', async () => {
    await processFileParserJob({ ...BASE, fileMime: 'text/csv', fileName: 'data.csv' });
    expect(mockDeepLearnReviewQueueCreate).toHaveBeenCalledOnce();
  });

  it('Markdown MIME 通过白名单 · 正常入 queue', async () => {
    await processFileParserJob({ ...BASE, fileMime: 'text/markdown', fileName: 'note.md' });
    expect(mockDeepLearnReviewQueueCreate).toHaveBeenCalledOnce();
  });

  it('TXT MIME 通过白名单 · 正常入 queue', async () => {
    await processFileParserJob({ ...BASE, fileMime: 'text/plain', fileName: 'note.txt' });
    expect(mockDeepLearnReviewQueueCreate).toHaveBeenCalledOnce();
  });

  // --- autoVerdict 4 branches ---

  it('autoVerdict=auto_rejected (强 PII) · status=auto_rejected · 写 queue', async () => {
    mockComputeVerdict.mockResolvedValue({
      autoVerdict: 'auto_rejected',
      scanResult: { piiTotal: 1, piiCriticalHits: 1, bannedWordHits: [], isSampled: false, parseFailed: false, checkedAt: 'now' },
      redactedText: '[ID-REDACTED]',
    });

    await processFileParserJob(BASE);
    const call = (mockDeepLearnReviewQueueCreate.mock.calls[0] as [{ data: Record<string, unknown> }])[0];
    expect(call.data.autoVerdict).toBe('auto_rejected');
    expect(call.data.status).toBe('auto_rejected');
  });

  it('autoVerdict=needs_review (弱 PII 抽样) · status=pending', async () => {
    mockComputeVerdict.mockResolvedValue({
      autoVerdict: 'needs_review',
      scanResult: { piiTotal: 1, piiCriticalHits: 0, bannedWordHits: [], isSampled: true, parseFailed: false, checkedAt: 'now' },
      redactedText: '[PHONE-REDACTED]',
    });

    await processFileParserJob(BASE);
    const call = (mockDeepLearnReviewQueueCreate.mock.calls[0] as [{ data: Record<string, unknown> }])[0];
    expect(call.data.autoVerdict).toBe('needs_review');
    expect(call.data.status).toBe('pending');
  });

  it('autoVerdict=auto_rejected (违禁词) · bannedWordHits 非空', async () => {
    mockComputeVerdict.mockResolvedValue({
      autoVerdict: 'auto_rejected',
      scanResult: { piiTotal: 0, piiCriticalHits: 0, bannedWordHits: ['政变'], isSampled: false, parseFailed: false, checkedAt: 'now' },
      redactedText: '内容',
    });

    await processFileParserJob(BASE);
    const call = (mockDeepLearnReviewQueueCreate.mock.calls[0] as [{ data: Record<string, unknown> }])[0];
    expect(call.data.autoVerdict).toBe('auto_rejected');
    const scan = call.data.autoScanResult as Record<string, unknown>;
    expect(scan.bannedWordHits).toEqual(['政变']);
  });

  it('autoVerdict=auto_approved · status=auto_approved · 写审计', async () => {
    await processFileParserJob(BASE);
    const call = (mockDeepLearnReviewQueueCreate.mock.calls[0] as [{ data: Record<string, unknown> }])[0];
    expect(call.data.status).toBe('auto_approved');
    expect(mockAdminAuditLogCreate).toHaveBeenCalledOnce();
    const audit = (mockAdminAuditLogCreate.mock.calls[0] as [{ data: Record<string, unknown> }])[0];
    expect(audit.data.eventCategory).toBe('data_mutation');
    expect(audit.data.eventType).toBe('file_parser_enqueue');
  });

  // --- size limit ---

  it('AC-4: fileSize > 20MB → 不写 queue · log warn · return', async () => {
    const { logger } = await import('@/lib/logger');
    await processFileParserJob({ ...BASE, fileSize: 21 * 1024 * 1024 });
    expect(mockDeepLearnReviewQueueCreate).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 1, fileName: 'test.pdf' }),
      'file_parser_worker.size_exceeded',
    );
  });

  it('fileSize = 20MB (境界值) → 允许通过', async () => {
    await processFileParserJob({ ...BASE, fileSize: 20 * 1024 * 1024 });
    expect(mockDeepLearnReviewQueueCreate).toHaveBeenCalledOnce();
  });

  // --- mime whitelist ---

  it('AC-5: 非法 MIME (image/jpeg) → 不写 queue · log warn', async () => {
    const { logger } = await import('@/lib/logger');
    await processFileParserJob({ ...BASE, fileMime: 'image/jpeg', fileName: 'photo.jpg' });
    expect(mockDeepLearnReviewQueueCreate).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ fileMime: 'image/jpeg' }),
      'file_parser_worker.mime_rejected',
    );
  });

  it('AC-2 grep verify: 写 deepLearnReviewQueue · 字段齐全', async () => {
    await processFileParserJob(BASE);
    const call = (mockDeepLearnReviewQueueCreate.mock.calls[0] as [{ data: Record<string, unknown> }])[0];
    expect(call.data.userId).toBe(1);
    expect(call.data.accountId).toBe(1);
    expect(call.data.fileName).toBe('test.pdf');
    expect(call.data.fileUrl).toMatch(/^mock-s3:\/\//);
    expect(call.data.autoScanResult).toBeDefined();
  });

  it('AC-6: autoScanResult 包含 redactedTextPreview · 不含 rawText', async () => {
    mockComputeVerdict.mockResolvedValue({
      autoVerdict: 'auto_approved',
      scanResult: { piiTotal: 0, piiCriticalHits: 0, bannedWordHits: [], isSampled: false, parseFailed: false, checkedAt: 'now' },
      redactedText: 'some redacted content',
    });

    await processFileParserJob(BASE);
    const call = (mockDeepLearnReviewQueueCreate.mock.calls[0] as [{ data: Record<string, unknown> }])[0];
    const scan = call.data.autoScanResult as Record<string, unknown>;
    expect(scan.redactedTextPreview).toBeDefined();
    // rawText should not appear in stored scan result
    expect(JSON.stringify(scan)).not.toContain('rawText');
  });

  it('AC-8: 成功后 audit actorAdminId=0 · actorRole=system', async () => {
    await processFileParserJob(BASE);
    const audit = (mockAdminAuditLogCreate.mock.calls[0] as [{ data: Record<string, unknown> }])[0];
    expect(audit.data.actorAdminId).toBe(0);
    expect(audit.data.actorRole).toBe('system');
  });

  it('empty rawText → parseFailed=true → computeVerdict 接收 parseFailed=true', async () => {
    await processFileParserJob({ ...BASE, rawText: '' });
    expect(mockComputeVerdict).toHaveBeenCalledWith('', { parseFailed: true });
  });
});
