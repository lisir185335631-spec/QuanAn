// PRD-11 US-018 · pdf-forensic.service unit tests (AC-16: ≥ 7 tests)
// Tests: buffer output / empty timeline / 1000 items / footer hash / admin info / redact / 50MB reject

import { createHash } from 'node:crypto';

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ──────────────────────────────────────────────────────────

const mockRenderToBuffer = vi.hoisted(() => vi.fn());

vi.mock('@react-pdf/renderer', () => ({
  renderToBuffer: mockRenderToBuffer,
  Document: 'Document',
  Page: 'Page',
  Text: 'Text',
  View: 'View',
  StyleSheet: { create: (s: unknown) => s },
}));

vi.mock('@quanan/ui/admin/forensic-pdf', () => ({
  PdfForensicTemplate: (_props: unknown) => null,
}));

// ── Import after mocks ─────────────────────────────────────────────────────

import { generateForensicPdf } from '@/services/admin/audit/pdf-forensic.service';

// ── Helpers ────────────────────────────────────────────────────────────────

function makePdfBuffer(sizeBytes = 1024): Buffer {
  return Buffer.alloc(sizeBytes, 'x');
}

function makeRawEntry(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 1,
    eventType: 'api_call',
    eventCategory: 'data_query',
    createdAt: new Date('2026-01-01T10:00:00Z'),
    payload: { action: 'view', userId: 42 },
    userId: 42,
    success: true,
    ...overrides,
  };
}

const BASE_INPUT = {
  traceId: 'trace-test-0001',
  caseNumber: 'CASE-2026-001',
  reason: 'Legal forensic investigation',
  requesterAdminId: 1,
  requesterEmail: 'super@quanan.com',
  requesterRole: 'super_admin',
};

beforeEach(() => {
  vi.resetAllMocks();
  mockRenderToBuffer.mockResolvedValue(makePdfBuffer(2048));
});

// ── Test 1: returns Buffer for normal timeline ─────────────────────────────

describe('generateForensicPdf', () => {
  it('returns Buffer for a regular timeline (AC-1)', async () => {
    const timeline = Array.from({ length: 10 }, (_, i) =>
      makeRawEntry({ id: i + 1, createdAt: new Date(Date.UTC(2026, 0, 1, 10, i, 0)) }),
    );

    const result = await generateForensicPdf({ ...BASE_INPUT, timeline });

    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result.byteLength).toBeGreaterThan(0);
    expect(mockRenderToBuffer).toHaveBeenCalledOnce();
  });

  // ── Test 2: empty timeline still generates PDF (AC-10) ──────────────────

  it('generates PDF for empty timeline — isEmpty=true cover page (AC-10)', async () => {
    const result = await generateForensicPdf({ ...BASE_INPUT, timeline: [] });

    expect(Buffer.isBuffer(result)).toBe(true);
    expect(mockRenderToBuffer).toHaveBeenCalledOnce();

    // The template data passed to renderToBuffer should have isEmpty=true
    const templateProps = (mockRenderToBuffer.mock.calls[0]![0] as { props: { data: { isEmpty: boolean } } }).props;
    expect(templateProps?.data?.isEmpty).toBe(true);
  });

  // ── Test 3: 1000 items — generates without OOM (AC-9) ───────────────────

  it('handles 1000 timeline entries without OOM (AC-9 pagination)', async () => {
    const largeTimeline = Array.from({ length: 1000 }, (_, i) =>
      makeRawEntry({ id: i + 1, createdAt: new Date(Date.UTC(2026, 0, 1, 0, i % 60, i % 60)) }),
    );

    mockRenderToBuffer.mockResolvedValueOnce(makePdfBuffer(4 * 1024 * 1024)); // 4 MB

    const result = await generateForensicPdf({ ...BASE_INPUT, timeline: largeTimeline });

    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result.byteLength).toBeLessThan(50 * 1024 * 1024);

    // Template receives all 1000 entries (service slices happen in template layer)
    const data = (mockRenderToBuffer.mock.calls[0]![0] as { props: { data: { entries: unknown[] } } }).props?.data;
    expect(data?.entries).toHaveLength(1000);
  });

  // ── Test 4: contentHash deterministic from redacted payloads (AC-6) ──────

  it('contentHash is SHA-256 of redacted timeline entries — deterministic (AC-6)', async () => {
    const timeline = [
      makeRawEntry({ id: 1, createdAt: new Date('2026-01-01T10:00:00Z'), payload: { action: 'view' } }),
      makeRawEntry({ id: 2, createdAt: new Date('2026-01-01T10:01:00Z'), payload: { action: 'edit' } }),
    ];

    await generateForensicPdf({ ...BASE_INPUT, timeline });
    await generateForensicPdf({ ...BASE_INPUT, timeline });

    const data1 = (mockRenderToBuffer.mock.calls[0]![0] as { props: { data: { contentHash: string } } }).props?.data;
    const data2 = (mockRenderToBuffer.mock.calls[1]![0] as { props: { data: { contentHash: string } } }).props?.data;

    // Same input → same hash (deterministic)
    expect(data1?.contentHash).toBe(data2?.contentHash);
    // Hash should be valid SHA-256 hex (64 chars)
    expect(data1?.contentHash).toMatch(/^[0-9a-f]{64}$/);
  });

  // ── Test 5: admin info (requesterEmail/role) filled in template (AC-2) ───

  it('requesterEmail and requesterRole appear in template data (AC-2/SHIELD)', async () => {
    await generateForensicPdf({
      ...BASE_INPUT,
      requesterEmail: 'legal@quanan.com',
      requesterRole: 'readonly_admin',
      timeline: [],
    });

    const data = (mockRenderToBuffer.mock.calls[0]![0] as { props: { data: { requesterEmail: string; requesterRole: string } } }).props?.data;
    expect(data?.requesterEmail).toBe('legal@quanan.com');
    expect(data?.requesterRole).toBe('readonly_admin');
  });

  // ── Test 6: sensitive fields are redacted before payloadHash (AC-14/SHIELD) ─

  it('redacts sensitive fields in payload before computing payloadHash (AC-14)', async () => {
    const sensitiveTimeline = [
      makeRawEntry({
        payload: { action: 'login', password: 'secret123', token: 'bearer-xyz', userId: 42 },
      }),
    ];

    await generateForensicPdf({ ...BASE_INPUT, timeline: sensitiveTimeline });

    const data = (mockRenderToBuffer.mock.calls[0]![0] as { props: { data: { entries: Array<{ payloadSummary: string; payloadHash: string }> } } }).props?.data;
    const entry = data?.entries?.[0];

    // Sensitive values should NOT appear in payload summary
    expect(entry?.payloadSummary).not.toContain('secret123');
    expect(entry?.payloadSummary).not.toContain('bearer-xyz');
    expect(entry?.payloadSummary).toContain('[REDACTED]');

    // payloadHash should differ from hash of non-redacted payload
    const rawHash = createHash('sha256')
      .update(JSON.stringify({ action: 'login', password: 'secret123', token: 'bearer-xyz', userId: 42 }))
      .digest('hex');
    expect(entry?.payloadHash).not.toBe(rawHash);
  });

  // ── Test 7: > 50 MB buffer throws (AC-12) ─────────────────────────────────

  it('rejects PDF > 50 MB with descriptive error (AC-12)', async () => {
    mockRenderToBuffer.mockResolvedValueOnce(makePdfBuffer(51 * 1024 * 1024));

    await expect(
      generateForensicPdf({ ...BASE_INPUT, timeline: [] }),
    ).rejects.toThrow('数据量过大');
  });

  // ── Test 8: payloadHash per entry is stable ────────────────────────────────

  it('payloadHash for each entry is stable SHA-256 of redacted payload', async () => {
    const payload = { action: 'view', userId: 99 };
    const timeline = [makeRawEntry({ payload })];

    await generateForensicPdf({ ...BASE_INPUT, timeline });

    const data = (mockRenderToBuffer.mock.calls[0]![0] as { props: { data: { entries: Array<{ payloadHash: string }> } } }).props?.data;
    const entry = data?.entries?.[0];

    // Expected: SHA-256 of JSON.stringify(payload) (no sensitive keys here)
    const expectedHash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
    expect(entry?.payloadHash).toBe(expectedHash);
  });

  // ── Test 9: source inference from raw record shape ─────────────────────────

  it('infers source correctly from record shape', async () => {
    const mixedTimeline = [
      // audit_log: has eventType but no actorAdminId, no costUsd
      { id: 1, eventType: 'api_call', eventCategory: 'data_query', createdAt: new Date(), payload: null, userId: 1 },
      // admin_audit_log: has actorAdminId
      { id: 2, eventType: 'view_user', eventCategory: 'admin_op', createdAt: new Date(), payload: null, actorAdminId: 5 },
      // cost_log: has costUsd
      { id: 3, eventType: 'call', createdAt: new Date(), costUsd: '0.05', modelUsed: 'claude', userId: 1 },
      // feedback_log: has rating
      { id: 4, createdAt: new Date(), rating: 'up', agentId: 'agent-1', userId: 1 },
    ];

    await generateForensicPdf({ ...BASE_INPUT, timeline: mixedTimeline });

    const data = (mockRenderToBuffer.mock.calls[0]![0] as { props: { data: { entries: Array<{ source: string }> } } }).props?.data;
    expect(data?.entries?.[0]?.source).toBe('audit_log');
    expect(data?.entries?.[1]?.source).toBe('admin_audit_log');
    expect(data?.entries?.[2]?.source).toBe('cost_log');
    expect(data?.entries?.[3]?.source).toBe('feedback_log');
  });
});
