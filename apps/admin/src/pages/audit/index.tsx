// PRD-11 US-017 · 审计日志 UI page
// AC: trace 反查 + 用户/admin Tab + 详情抽屉 + PDF 取证导出
// readonly_admin 法务模式 · 全权

import { useState, useMemo } from 'react';
import { adminTrpc } from '../../lib/admin-client';
import { TraceLookupInput } from './TraceLookupInput';
import { AuditTimeline } from './AuditTimeline';
import { AuditDetailDrawer } from './AuditDetailDrawer';
import type { TimelineItem } from './AuditTimeline';

// ── Types ─────────────────────────────────────────────────────────────────────

type ActiveMode = 'trace' | 'user' | 'admin';

// ── Overview stat card ────────────────────────────────────────────────────────

function StatCard({ label, value, loading, color }: {
  label: string;
  value: number | string;
  loading: boolean;
  color?: string;
}) {
  return (
    <div
      style={{
        background: 'var(--bg-panel, #111)',
        border: '1px solid var(--border, #2a2a2a)',
        borderRadius: 6,
        padding: '14px 16px',
      }}
    >
      <div
        style={{
          color: 'var(--text-muted, #888)',
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: color ?? 'var(--gold, #d4af37)', lineHeight: 1 }}>
        {loading ? '—' : value}
      </div>
    </div>
  );
}

// ── Overview cards (derived from listMine today) ──────────────────────────────

function AuditOverviewCards() {
  const { data, isLoading } = adminTrpc.audit.listMine.useQuery(undefined, {
    staleTime: 60_000,
  });

  const today = new Date().toDateString();

  const stats = useMemo(() => {
    if (!data) return { ops: 0, crossAccount: 0, anomaly: 0 };
    const todayLogs = data.filter(
      (l) => new Date(l.createdAt).toDateString() === today,
    );
    return {
      ops: todayLogs.length,
      crossAccount: todayLogs.filter((l) => l.eventCategory === 'cross_account_query').length,
      anomaly: todayLogs.filter((l) =>
        ['high_risk_action', 'security_alert'].includes(l.eventCategory),
      ).length,
    };
  }, [data, today]);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12,
        marginBottom: 20,
      }}
    >
      <StatCard label="日操作量" value={stats.ops} loading={isLoading} />
      <StatCard
        label="cross_account_query"
        value={stats.crossAccount}
        loading={isLoading}
        color="var(--status-warn, #f59e0b)"
      />
      <StatCard
        label="异常事件"
        value={stats.anomaly}
        loading={isLoading}
        color="var(--status-error, #ef4444)"
      />
    </div>
  );
}

// ── PDF export dialog ─────────────────────────────────────────────────────────

function PdfExportDialog({
  traceId,
  onClose,
}: {
  traceId: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const exportPdf = adminTrpc.audit.exportPdf.useMutation();

  async function handleExport() {
    if (reason.length < 10 || !caseNumber) return;
    try {
      const result = await exportPdf.mutateAsync({ traceId, reason, caseNumber });
      if (result.base64) {
        const bytes = atob(result.base64);
        const arr = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
        const blob = new Blob([arr], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `forensic-${result.caseNumber}-${result.traceId.slice(0, 8)}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
      onClose();
    } catch {
      // error shown below
    }
  }

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300,
  };
  const box: React.CSSProperties = {
    background: 'var(--bg-panel, #111)',
    border: '1px solid var(--border, #2a2a2a)',
    borderRadius: 8, padding: '24px 28px', width: 420, maxWidth: '90vw',
  };
  const label: React.CSSProperties = {
    color: 'var(--text-muted, #888)', fontSize: 11, fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4, display: 'block',
  };
  const input: React.CSSProperties = {
    width: '100%', background: 'var(--bg-input, #1a1a1a)',
    border: '1px solid var(--border, #2a2a2a)', borderRadius: 4,
    color: 'var(--text-primary, #e0e0e0)', fontSize: 13, padding: '6px 10px',
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={box} onClick={(e) => e.stopPropagation()}>
        <div style={{ color: 'var(--text-primary, #e0e0e0)', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>
          PDF 取证导出
        </div>
        <div style={{ color: 'var(--text-muted, #888)', fontSize: 12, marginBottom: 16, fontFamily: 'monospace' }}>
          traceId: {traceId}
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={label}>案件编号 (Case Number)</label>
          <input
            style={input}
            value={caseNumber}
            onChange={(e) => setCaseNumber(e.target.value)}
            placeholder="CASE-2026-001"
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={label}>导出原因（最少 10 字）</label>
          <textarea
            style={{ ...input, minHeight: 80, resize: 'vertical', fontFamily: 'inherit' }}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="请说明取证目的，例如：配合公安机关调查用户 XXX 违规行为…"
          />
          <div style={{ fontSize: 11, color: reason.length < 10 ? 'var(--status-error, #ef4444)' : 'var(--text-muted, #888)', marginTop: 4 }}>
            {reason.length}/10+
          </div>
        </div>

        {exportPdf.isError && (
          <div style={{ color: 'var(--status-error, #ef4444)', fontSize: 12, marginBottom: 12 }}>
            导出失败，请重试
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none', border: '1px solid var(--border, #2a2a2a)',
              color: 'var(--text-muted, #888)', borderRadius: 4, padding: '6px 14px',
              fontSize: 13, cursor: 'pointer',
            }}
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={reason.length < 10 || !caseNumber || exportPdf.isPending}
            style={{
              background: reason.length >= 10 && caseNumber && !exportPdf.isPending
                ? 'var(--gold, #d4af37)' : '#2a2a2a',
              color: reason.length >= 10 && caseNumber && !exportPdf.isPending ? '#000' : '#888',
              border: 'none', borderRadius: 4, padding: '6px 18px',
              fontSize: 13, fontWeight: 600, cursor: exportPdf.isPending ? 'not-allowed' : 'pointer',
            }}
          >
            {exportPdf.isPending ? '生成中…' : '导出 PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tab button ────────────────────────────────────────────────────────────────

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: active ? 'var(--gold, #d4af37)' : 'none',
        color: active ? '#000' : 'var(--text-muted, #888)',
        border: `1px solid ${active ? 'var(--gold, #d4af37)' : 'var(--border, #2a2a2a)'}`,
        borderRadius: 4,
        padding: '5px 16px',
        fontSize: 13,
        fontWeight: active ? 700 : 400,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AuditPage() {
  const [activeMode, setActiveMode] = useState<ActiveMode>('user');
  const [activeTraceId, setActiveTraceId] = useState('');  // submitted trace_id
  const [userIdInput, setUserIdInput] = useState('');
  const [adminIdInput, setAdminIdInput] = useState('');
  const [submittedUserId, setSubmittedUserId] = useState<number | null>(null);
  const [submittedAdminId, setSubmittedAdminId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);
  const [showPdfDialog, setShowPdfDialog] = useState(false);

  // ── Queries ───────────────────────────────────────────────────────────────

  const traceQuery = adminTrpc.audit.byTraceId.useQuery(
    { traceId: activeTraceId },
    { enabled: activeTraceId.length >= 8, staleTime: 30_000 },
  );

  const userQuery = adminTrpc.audit.byUserId.useQuery(
    { userId: submittedUserId ?? 0, page: 1, pageSize: 50 },
    { enabled: activeMode === 'user' && submittedUserId !== null && !activeTraceId, staleTime: 30_000 },
  );

  const adminQuery = adminTrpc.audit.byAdminId.useQuery(
    { adminUserId: submittedAdminId ?? 0 },
    { enabled: activeMode === 'admin' && submittedAdminId !== null && !activeTraceId, staleTime: 30_000 },
  );

  // ── Derived timeline items ────────────────────────────────────────────────

  const { items, isLoading, notFound } = useMemo<{
    items: TimelineItem[];
    isLoading: boolean;
    notFound: boolean;
  }>(() => {
    if (activeTraceId) {
      const data = traceQuery.data;
      const loading = traceQuery.isLoading;
      if (!data) return { items: [], isLoading: loading, notFound: false };
      if (data.timeline.length === 0 && !loading)
        return { items: [], isLoading: false, notFound: true };
      return {
        items: data.timeline as TimelineItem[],
        isLoading: loading,
        notFound: false,
      };
    }
    if (activeMode === 'user') {
      const data = userQuery.data;
      const loading = userQuery.isLoading;
      if (!submittedUserId) return { items: [], isLoading: false, notFound: false };
      return {
        items: (data?.timeline ?? []) as TimelineItem[],
        isLoading: loading,
        notFound: false,
      };
    }
    if (activeMode === 'admin') {
      const data = adminQuery.data;
      const loading = adminQuery.isLoading;
      if (!submittedAdminId) return { items: [], isLoading: false, notFound: false };
      return {
        items: (data ?? []) as TimelineItem[],
        isLoading: loading,
        notFound: false,
      };
    }
    return { items: [], isLoading: false, notFound: false };
  }, [activeTraceId, activeMode, traceQuery, userQuery, adminQuery, submittedUserId, submittedAdminId]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleTraceSubmit(traceId: string) {
    setActiveTraceId(traceId);
    setSelectedItem(null);
  }

  function handleTabSwitch(tab: 'user' | 'admin') {
    setActiveMode(tab);
    setActiveTraceId('');  // clear trace mode
    setSelectedItem(null);
  }

  function handleUserSubmit(e: React.FormEvent) {
    e.preventDefault();
    const id = parseInt(userIdInput, 10);
    if (!isNaN(id)) {
      setSubmittedUserId(id);
      setSelectedItem(null);
    }
  }

  function handleAdminSubmit(e: React.FormEvent) {
    e.preventDefault();
    const id = parseInt(adminIdInput, 10);
    if (!isNaN(id)) {
      setSubmittedAdminId(id);
      setSelectedItem(null);
    }
  }

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-input, #1a1a1a)',
    border: '1px solid var(--border, #2a2a2a)',
    borderRadius: 4,
    color: 'var(--text-primary, #e0e0e0)',
    fontSize: 13,
    padding: '5px 10px',
    outline: 'none',
    width: 160,
  };

  const pdfTraceId = activeTraceId || selectedItem?.traceId || '';

  return (
    <div style={{ padding: 24, position: 'relative', minHeight: '100%' }}>
      <h2
        style={{
          color: 'var(--gold, #d4af37)',
          fontSize: 18,
          fontWeight: 700,
          marginBottom: 20,
        }}
      >
        审计日志
      </h2>

      {/* 3 stat cards */}
      <AuditOverviewCards />

      {/* Trace lookup */}
      <div
        style={{
          background: 'var(--bg-panel, #111)',
          border: '1px solid var(--border, #2a2a2a)',
          borderRadius: 6,
          padding: '14px 16px',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            color: 'var(--text-muted, #888)',
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: 10,
          }}
        >
          Trace 反查
        </div>
        <TraceLookupInput
          onSubmit={handleTraceSubmit}
          loading={traceQuery.isLoading}
        />
        {activeTraceId && (
          <div style={{ fontSize: 11, color: 'var(--text-muted, #888)' }}>
            正在查询:{' '}
            <span style={{ fontFamily: 'monospace', color: 'var(--gold, #d4af37)' }}>
              {activeTraceId}
            </span>
            <button
              type="button"
              onClick={() => { setActiveTraceId(''); setSelectedItem(null); }}
              style={{
                background: 'none', border: 'none', color: 'var(--text-muted, #888)',
                cursor: 'pointer', marginLeft: 8, fontSize: 11,
              }}
            >
              清除
            </button>
          </div>
        )}
      </div>

      {/* User / Admin tabs + sub-input */}
      <div
        style={{
          background: 'var(--bg-panel, #111)',
          border: '1px solid var(--border, #2a2a2a)',
          borderRadius: 6,
          padding: '14px 16px',
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <TabBtn active={activeMode === 'user'} onClick={() => handleTabSwitch('user')}>
            用户
          </TabBtn>
          <TabBtn active={activeMode === 'admin'} onClick={() => handleTabSwitch('admin')}>
            admin
          </TabBtn>
        </div>

        {activeMode === 'user' && !activeTraceId && (
          <form onSubmit={handleUserSubmit} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              style={inputStyle}
              type="number"
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value)}
              placeholder="用户 ID"
            />
            <button
              type="submit"
              disabled={!userIdInput}
              style={{
                background: userIdInput ? 'var(--gold, #d4af37)' : '#2a2a2a',
                color: userIdInput ? '#000' : '#888',
                border: 'none', borderRadius: 4, padding: '5px 14px', fontSize: 13,
                fontWeight: 600, cursor: userIdInput ? 'pointer' : 'not-allowed',
              }}
            >
              查询
            </button>
          </form>
        )}

        {activeMode === 'admin' && !activeTraceId && (
          <form onSubmit={handleAdminSubmit} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              style={inputStyle}
              type="number"
              value={adminIdInput}
              onChange={(e) => setAdminIdInput(e.target.value)}
              placeholder="Admin 用户 ID"
            />
            <button
              type="submit"
              disabled={!adminIdInput}
              style={{
                background: adminIdInput ? 'var(--gold, #d4af37)' : '#2a2a2a',
                color: adminIdInput ? '#000' : '#888',
                border: 'none', borderRadius: 4, padding: '5px 14px', fontSize: 13,
                fontWeight: 600, cursor: adminIdInput ? 'pointer' : 'not-allowed',
              }}
            >
              查询
            </button>
          </form>
        )}
      </div>

      {/* Timeline */}
      {isLoading && (
        <div style={{ color: 'var(--text-muted, #888)', fontSize: 13, padding: '20px 0' }}>
          加载中…
        </div>
      )}

      {notFound && (
        <div
          style={{
            color: 'var(--status-warn, #f59e0b)',
            fontSize: 13,
            padding: '16px',
            background: 'var(--bg-panel, #111)',
            border: '1px solid var(--border, #2a2a2a)',
            borderRadius: 6,
            marginBottom: 12,
          }}
        >
          未找到匹配 · 检查 trace_id 是否完整
        </div>
      )}

      {!isLoading && !notFound && (
        <AuditTimeline
          items={items}
          emptyText="暂无数据"
          onSelect={(item) => setSelectedItem(item)}
          selectedId={selectedItem?.id}
        />
      )}

      {/* PDF export button */}
      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={() => setShowPdfDialog(true)}
          disabled={!pdfTraceId}
          style={{
            background: pdfTraceId ? 'var(--gold, #d4af37)' : '#2a2a2a',
            color: pdfTraceId ? '#000' : '#888',
            border: 'none', borderRadius: 4, padding: '7px 20px',
            fontSize: 13, fontWeight: 700, cursor: pdfTraceId ? 'pointer' : 'not-allowed',
          }}
        >
          PDF 取证导出
        </button>
      </div>

      {/* Detail drawer */}
      <AuditDetailDrawer
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />

      {/* PDF dialog */}
      {showPdfDialog && pdfTraceId && (
        <PdfExportDialog
          traceId={pdfTraceId}
          onClose={() => setShowPdfDialog(false)}
        />
      )}
    </div>
  );
}
