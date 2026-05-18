// PRD-11 US-017 · AuditDetailDrawer — 右侧抽屉(prompt + response + context 可折叠 + payloadHash)

import { useState } from 'react';
import type { TimelineItem } from './AuditTimeline';

interface Props {
  item: TimelineItem | null;
  onClose: () => void;
}

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 12 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted, #888)',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          padding: '4px 0',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          width: '100%',
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 9 }}>{open ? '▼' : '▶'}</span>
        {title}
      </button>
      {open && (
        <div
          style={{
            background: '#0d0d0d',
            border: '1px solid var(--border, #2a2a2a)',
            borderRadius: 4,
            padding: '8px 10px',
            marginTop: 4,
            fontSize: 12,
            fontFamily: 'monospace',
            color: '#ccc',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            maxHeight: 180,
            overflowY: 'auto',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function extractField(
  payload: Record<string, unknown> | null,
  keys: string[],
): string {
  if (!payload) return '—';
  for (const k of keys) {
    const v = payload[k];
    if (v !== undefined && v !== null) {
      return typeof v === 'string' ? v : JSON.stringify(v, null, 2);
    }
  }
  return '—';
}

export function AuditDetailDrawer({ item, onClose }: Props) {
  if (!item) return null;

  const payload = item.payload;
  const prompt = extractField(payload, ['prompt', 'message', 'input', 'query']);
  const response = extractField(payload, ['response', 'output', 'result', 'reply']);
  const context = extractField(payload, ['context', 'metadata', 'extra']);
  const payloadHash =
    extractField(payload, ['payloadHash', 'payload_hash', 'hash']) || '—';

  const dt = typeof item.createdAt === 'string' ? new Date(item.createdAt) : item.createdAt;
  const timeStr = dt.toISOString().replace('T', ' ').slice(0, 19);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 480,
        background: 'var(--bg-panel, #111)',
        borderLeft: '1px solid var(--border, #2a2a2a)',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--border, #2a2a2a)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ color: 'var(--text-primary, #e0e0e0)', fontWeight: 600, fontSize: 13 }}>
            {item.eventType}
          </div>
          <div style={{ color: 'var(--text-muted, #888)', fontSize: 11, marginTop: 2 }}>
            {timeStr} · {item.eventCategory}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted, #888)',
            fontSize: 18,
            cursor: 'pointer',
            padding: '0 4px',
          }}
          aria-label="关闭"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
        {/* payloadHash — always visible, non-collapsible */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              color: 'var(--text-muted, #888)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            payloadHash
          </div>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: 12,
              color: 'var(--gold, #d4af37)',
              background: '#0d0d0d',
              border: '1px solid var(--border, #2a2a2a)',
              borderRadius: 4,
              padding: '6px 10px',
              wordBreak: 'break-all',
            }}
          >
            {payloadHash}
          </div>
        </div>

        <Section title="Prompt / Input">{prompt}</Section>
        <Section title="Response / Output">{response}</Section>
        <Section title="Context / Metadata" defaultOpen={false}>
          {context}
        </Section>

        {/* Full payload (collapsed by default) */}
        <Section title="Full Payload (raw)" defaultOpen={false}>
          {payload ? JSON.stringify(payload, null, 2) : '—'}
        </Section>

        {/* Meta info */}
        <div
          style={{
            marginTop: 16,
            paddingTop: 12,
            borderTop: '1px solid var(--border, #2a2a2a)',
            fontSize: 11,
            color: 'var(--text-muted, #888)',
          }}
        >
          <div>ID: {item.id}</div>
          {item.traceId && <div>traceId: {item.traceId}</div>}
          {item.source && <div>source: {item.source}</div>}
          {item.success !== undefined && <div>success: {String(item.success)}</div>}
          {item.isHighRisk && (
            <div style={{ color: 'var(--status-error, #ef4444)', fontWeight: 600, marginTop: 4 }}>
              ⚠ HIGH RISK
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
