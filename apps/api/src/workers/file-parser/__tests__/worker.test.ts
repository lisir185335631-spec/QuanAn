// PRD-12 US-008 · PRD-37 US-P07 · file-parser worker · tests
// 覆盖: 5 file type / autoVerdict 4 branch / size 限制 / mime 白名单 / Excel MIME / Asset 解析流

import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockDeepLearnReviewQueueCreate = vi.fn();
const mockAdminAuditLogCreate = vi.fn();
const mockAssetUpdate = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    deepLearnReviewQueue: { create: mockDeepLearnReviewQueueCreate },
    adminAuditLog: { create: mockAdminAuditLogCreate },
    asset: { update: mockAssetUpdate },
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

// PRD-37 US-P07: mock parse engine — avoid requiring actual pdf/docx/xlsx binaries in unit tests
const mockParseFileBuffer = vi.fn();
vi.mock('@/workers/file-parser/parse-engine', () => ({
  parseFileBuffer: mockParseFileBuffer,
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
    mockAssetUpdate.mockResolvedValue({ id: 1 });
    mockComputeVerdict.mockResolvedValue(makeApprovedVerdict());
    mockParseFileBuffer.mockResolvedValue('parsed text from engine');
  });

  // --- 5 file types (legacy rawText path) ---

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

  // --- PRD-37 US-P07: Excel MIME whitelist ---

  it('Excel MIME (.xlsx) 通过白名单 · 正常入 queue', async () => {
    const mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    await processFileParserJob({ ...BASE, fileMime: mime, fileName: 'data.xlsx' });
    expect(mockDeepLearnReviewQueueCreate).toHaveBeenCalledOnce();
  });

  it('Excel MIME (.xls legacy) 通过白名单 · 正常入 queue', async () => {
    await processFileParserJob({ ...BASE, fileMime: 'application/vnd.ms-excel', fileName: 'data.xls' });
    expect(mockDeepLearnReviewQueueCreate).toHaveBeenCalledOnce();
  });

  // --- PRD-37 US-P07: parse engine routing via fileBuffer ---

  it('fileBuffer 存在 · 调用 parseFileBuffer · 用 engine 结果入 queue', async () => {
    const fileBuffer = Buffer.from('fake pdf bytes').toString('base64');
    await processFileParserJob({
      ...BASE,
      fileBuffer,
      assetId: 42,
    });
    expect(mockParseFileBuffer).toHaveBeenCalledOnce();
    // engine result should feed into computeDeepLearnAutoVerdict
    expect(mockComputeVerdict).toHaveBeenCalledWith('parsed text from engine', expect.any(Object));
    expect(mockDeepLearnReviewQueueCreate).toHaveBeenCalledOnce();
  });

  it('fileBuffer 为空 · 走 rawText 路径 · parseFileBuffer 不调用', async () => {
    await processFileParserJob({ ...BASE, fileBuffer: '' });
    expect(mockParseFileBuffer).not.toHaveBeenCalled();
    expect(mockComputeVerdict).toHaveBeenCalledWith('正常内容', expect.any(Object));
  });

  it('无 fileBuffer · 走 rawText 路径 · parseFileBuffer 不调用', async () => {
    await processFileParserJob(BASE);
    expect(mockParseFileBuffer).not.toHaveBeenCalled();
  });

  // --- PRD-37 US-P07: Asset 解析流 ---

  it('assetId 存在 + engine 成功 · 写 Asset.parsedText + parsingStatus=completed', async () => {
    const fileBuffer = Buffer.from('bytes').toString('base64');
    mockParseFileBuffer.mockResolvedValue('sheet data row1,row2');

    await processFileParserJob({
      ...BASE,
      assetId: 99,
      fileBuffer,
    });

    expect(mockAssetUpdate).toHaveBeenCalledOnce();
    const call = (mockAssetUpdate.mock.calls[0] as [{ where: unknown; data: Record<string, unknown> }])[0];
    expect(call.where).toEqual({ id: 99, accountId: 1 });
    expect(call.data.parsedText).toBe('sheet data row1,row2');
    expect(call.data.parsingStatus).toBe('completed');
    expect(call.data.parsingError).toBeNull();
  });

  it('assetId 存在 + engine 抛出错误 · 写 parsingStatus=failed', async () => {
    const fileBuffer = Buffer.from('corrupt').toString('base64');
    mockParseFileBuffer.mockRejectedValue(new Error('parse failed'));

    await processFileParserJob({
      ...BASE,
      assetId: 77,
      fileBuffer,
    });

    expect(mockAssetUpdate).toHaveBeenCalledOnce();
    const call = (mockAssetUpdate.mock.calls[0] as [{ where: unknown; data: Record<string, unknown> }])[0];
    expect(call.where).toEqual({ id: 77, accountId: 1 });
    expect(call.data.parsingStatus).toBe('failed');
    expect(call.data.parsedText).toBeNull();
    // deepLearnReviewQueue 仍写入（失败也走扫描）
    expect(mockDeepLearnReviewQueueCreate).toHaveBeenCalledOnce();
  });

  it('assetId 存在 + engine 返回空字符串 · parsingStatus=failed', async () => {
    const fileBuffer = Buffer.from('empty').toString('base64');
    mockParseFileBuffer.mockResolvedValue('');

    await processFileParserJob({
      ...BASE,
      assetId: 55,
      fileBuffer,
    });

    const call = (mockAssetUpdate.mock.calls[0] as [{ where: unknown; data: Record<string, unknown> }])[0];
    expect(call.data.parsingStatus).toBe('failed');
  });

  it('无 assetId · 不调用 Asset.update', async () => {
    await processFileParserJob(BASE);
    expect(mockAssetUpdate).not.toHaveBeenCalled();
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
