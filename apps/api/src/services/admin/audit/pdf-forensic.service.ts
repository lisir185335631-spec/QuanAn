// PRD-11 US-018 · Forensic PDF Service — generateForensicPdf
// SHIELD: payloadHash must redact sensitive fields before hashing (anti_patterns: PRD-9+LD-A-3)
// SHIELD: signer info from requesterEmail, never hardcoded (anti_patterns: PRD-7)
// SHIELD: PDF footer must contain SHA-256 hash on every page (anti_patterns: LD-A-3)

import { createHash } from 'node:crypto';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';

import { PdfForensicTemplate } from '@quanan/ui/admin/forensic-pdf';
import type { ForensicPdfData, ForensicTimelineEntry } from '@quanan/ui/admin/forensic-pdf';

// ── Constants ──────────────────────────────────────────────────────────────

const MAX_PDF_BYTES = 50 * 1024 * 1024; // 50 MB guard (AC-12)
const PAYLOAD_SUMMARY_LEN = 200;

// ── Sensitive field redaction (SHIELD: AC-14 + LD-A-3 + GDPR) ─────────────

const SENSITIVE_SUBSTRINGS = ['password', 'token', 'apikey', 'secret', 'credential', 'authorization', 'cookie'];

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  return SENSITIVE_SUBSTRINGS.some((s) => lower.includes(s));
}

function redactObject(payload: unknown): unknown {
  if (payload === null || payload === undefined) return payload;
  if (typeof payload !== 'object') return payload;
  if (Array.isArray(payload)) return payload.map(redactObject);

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload as Record<string, unknown>)) {
    if (isSensitiveKey(k)) {
      out[k] = '[REDACTED]';
    } else if (v !== null && typeof v === 'object') {
      out[k] = redactObject(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

// ── Timeline normalization ─────────────────────────────────────────────────

function inferSource(r: Record<string, unknown>): string {
  if ('_source' in r) return String(r['_source']);
  if ('actorAdminId' in r) return 'admin_audit_log';
  if ('costUsd' in r || 'modelUsed' in r) return 'cost_log';
  if ('rating' in r) return 'feedback_log';
  return 'audit_log';
}

function inferEventType(r: Record<string, unknown>): string {
  if (r['eventType'] != null) return String(r['eventType']);
  if ('rating' in r) return 'user_feedback';
  return 'unknown';
}

function inferEventCategory(r: Record<string, unknown>): string {
  if (r['eventCategory'] != null) return String(r['eventCategory']);
  if ('costUsd' in r) return 'cost';
  if ('rating' in r) return 'feedback';
  return 'unknown';
}

function extractPayload(r: Record<string, unknown>): unknown {
  if (r['payload'] != null) return r['payload'];
  const out: Record<string, unknown> = {};
  for (const k of ['costUsd', 'modelUsed', 'rating', 'agentId', 'userId', 'success']) {
    if (k in r) out[k] = String(r[k]);
  }
  return Object.keys(out).length ? out : null;
}

function normalizeEntry(raw: unknown): ForensicTimelineEntry {
  const r = (raw as Record<string, unknown>) ?? {};
  const payload = extractPayload(r);
  const redacted = redactObject(payload);
  const payloadHash = sha256(JSON.stringify(redacted ?? null));
  const summary = JSON.stringify(redacted ?? {});

  const createdAt: Date =
    r['createdAt'] instanceof Date ? r['createdAt'] : new Date(String(r['createdAt'] ?? 0));

  return {
    source: inferSource(r),
    eventType: inferEventType(r),
    eventCategory: inferEventCategory(r),
    createdAt: createdAt.toISOString(),
    payloadSummary: summary.length > PAYLOAD_SUMMARY_LEN
      ? summary.slice(0, PAYLOAD_SUMMARY_LEN) + '…'
      : summary,
    payloadHash,
  };
}

// ── Public interface ───────────────────────────────────────────────────────

export interface ForensicPdfInput {
  traceId: string;
  caseNumber?: string;
  reason: string;
  timeline: unknown[];
  requesterAdminId: number;
  requesterEmail: string;
  requesterRole: string;
}

export async function generateForensicPdf(input: ForensicPdfInput): Promise<Buffer> {
  const {
    traceId,
    caseNumber,
    reason,
    timeline,
    requesterAdminId,
    requesterEmail,
    requesterRole,
  } = input;

  const generatedAt = new Date().toISOString();

  // 1. Normalize + redact all timeline entries
  const entries: ForensicTimelineEntry[] = timeline.map(normalizeEntry);

  // 2. Compute contentHash from all redacted payloads (AC-6: use redact後 data)
  const hashInput = entries.map((e) => `${e.createdAt}|${e.source}|${e.payloadHash}`).join('\n');
  const contentHash = sha256(hashInput || 'empty');

  // 3. Build template data
  const pdfData: ForensicPdfData = {
    traceId,
    caseNumber,
    reason,
    generatedAt,
    requesterEmail,
    requesterRole,
    requesterAdminId,
    contentHash,
    entries,
    isEmpty: entries.length === 0,
  };

  // 4. Render PDF via React PDF
  const buffer = await renderToBuffer(
    React.createElement(PdfForensicTemplate, { data: pdfData }) as never,
  );

  // 5. Guard: > 50 MB → reject (AC-12)
  if (buffer.byteLength > MAX_PDF_BYTES) {
    throw new Error(
      `数据量过大 · 缩小时间范围或分批导出 (PDF size: ${(buffer.byteLength / 1024 / 1024).toFixed(1)} MB > 50 MB)`,
    );
  }

  return buffer;
}
