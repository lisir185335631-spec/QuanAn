// PRD-14 US-004 · AbExperimentDrawer
// AC-5: 实验基本信息 + variant 配置 JSON readonly + trafficAllocation pie chart Recharts
//       + 实验时间线 + 多维结果 chart + 操作(详细分析/一键停损)
// AC-8: 一键停损 super_admin only · ConfirmModal · reason ≥ 20字 · stop.mutate
// SHIELD: super_admin only stop — {role === 'super_admin' && <Button>}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { PieLabelRenderProps } from 'recharts';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

import { adminTrpc } from '../../lib/admin-client';
import { MultiMetricChart } from './components/MultiMetricChart';

// ── Types ─────────────────────────────────────────────────────────────────

export interface ExperimentRow {
  id: number;
  experimentKey: string;
  name: string;
  status: string;
  variantCount: number;
  sampleSize: number;
  startedAt: Date | string | null;
  stoppedAt: Date | string | null;
  createdAt: Date | string;
  trafficAllocation: Record<string, number> | null;
  currentPValue?: number | null;
}

interface Props {
  selected: ExperimentRow | null;
  currentRole: string | undefined;
  onClose: () => void;
  onRefresh: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  return new Date(String(d)).toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

function statusLabel(s: string): { text: string; color: string } {
  switch (s) {
    case 'running': return { text: '运行中', color: '#22c55e' };
    case 'draft': return { text: '草稿', color: '#6b7280' };
    case 'stopped': return { text: '已停损', color: '#ef4444' };
    case 'completed': return { text: '已完成', color: '#3b82f6' };
    default: return { text: s, color: 'var(--text-muted)' };
  }
}

const PIE_COLORS = ['#d4af37', '#22c55e', '#3b82f6', '#a855f7'];

// ── Helpers ───────────────────────────────────────────────────────────────

const sectionTitleStyle: React.CSSProperties = {
  color: 'var(--text-muted)', fontSize: 10, textTransform: 'uppercase',
  letterSpacing: '0.06em', fontWeight: 700, marginBottom: 8,
};

function SectionTitle({ label }: { label: string }): JSX.Element {
  return <div style={sectionTitleStyle}>{label}</div>;
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }): JSX.Element {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 5, alignItems: 'baseline' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: 12, minWidth: 80 }}>{label}</span>
      <span style={{ color: 'var(--text-primary)', fontSize: 12, fontFamily: mono ? 'monospace' : undefined }}>
        {value}
      </span>
    </div>
  );
}

// ── StopConfirmModal ──────────────────────────────────────────────────────

function StopConfirmModal({
  experimentId,
  experimentKey,
  onClose,
  onStopped,
}: {
  experimentId: number;
  experimentKey: string;
  onClose: () => void;
  onStopped: () => void;
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const stopMutation = adminTrpc.abExperiments.stop.useMutation();

  async function handleStop() {
    if (reason.length < 20) {
      setError('停损理由至少 20 个字');
      return;
    }
    try {
      await stopMutation.mutateAsync({ experimentId, stopReason: reason });
      onStopped();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '停损失败');
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid #ef444455',
          borderRadius: 8,
          padding: '24px 28px',
          width: 440,
        }}
      >
        <h4 style={{ color: '#ef4444', fontSize: 15, marginBottom: 8 }}>
          ⚠ 一键停损确认
        </h4>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 16 }}>
          实验 <strong>{experimentKey}</strong> 将立即停损，不可逆。请填写停损理由（≥ 20 字）：
        </p>
        <textarea
          value={reason}
          onChange={(e) => { setReason(e.target.value); setError(null); }}
          rows={4}
          placeholder="停损原因，例如：指标恶化超过阈值，variant_a 转化率下降 35%，需要立即回滚..."
          style={{
            width: '100%',
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            borderRadius: 5,
            padding: '8px 10px',
            color: 'var(--text-primary)',
            fontSize: 13,
            boxSizing: 'border-box',
            resize: 'vertical',
          }}
        />
        <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4 }}>
          {reason.length} / 20 最低
        </div>
        {error && (
          <div style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>{error}</div>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-panel)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
              borderRadius: 5,
              padding: '7px 14px',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            取消
          </button>
          <button
            onClick={() => { void handleStop(); }}
            disabled={stopMutation.isPending}
            style={{
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: 5,
              padding: '7px 16px',
              fontWeight: 700,
              fontSize: 13,
              cursor: stopMutation.isPending ? 'not-allowed' : 'pointer',
              opacity: stopMutation.isPending ? 0.6 : 1,
            }}
          >
            {stopMutation.isPending ? '停损中…' : '确认停损'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── AbExperimentDrawer ────────────────────────────────────────────────────

export function AbExperimentDrawer({ selected, currentRole, onClose, onRefresh }: Props) {
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const navigate = useNavigate();

  const { data: detail } = adminTrpc.abExperiments.getDetail.useQuery(
    { experimentId: selected?.id ?? 0 },
    { enabled: selected !== null },
  );

  const { data: multiMetric } = adminTrpc.abExperiments.getMultiMetric.useQuery(
    { experimentId: selected?.id ?? 0 },
    { enabled: selected !== null && selected.status === 'running' },
  );

  if (!selected) return null;

  const badge = statusLabel(selected.status);
  const pieData = selected.trafficAllocation
    ? Object.entries(selected.trafficAllocation).map(([k, v]) => ({ name: k, value: v }))
    : [];
  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 100,
        }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          bottom: 0,
          width: 560,
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border)',
          zIndex: 101,
          overflowY: 'auto',
          padding: '24px 28px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ color: 'var(--gold)', fontSize: 16, fontWeight: 700 }}>
                {selected.name}
              </span>
              <span style={{ background: `${badge.color}22`, color: badge.color, border: `1px solid ${badge.color}55`, borderRadius: 4, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>
                {badge.text}
              </span>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12, fontFamily: 'monospace' }}>
              {selected.experimentKey}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20 }}>
            ×
          </button>
        </div>

        {/* Basic info */}
        <div style={{ marginBottom: 20 }}>
          <SectionTitle label="基本信息" />
          <InfoRow label="实验 Key" value={selected.experimentKey} mono />
          <InfoRow label="状态" value={badge.text} />
          <InfoRow label="sample 数" value={String(selected.sampleSize)} />
          <InfoRow label="启动时间" value={fmtDate(selected.startedAt)} />
          <InfoRow label="停损时间" value={fmtDate(selected.stoppedAt)} />
          <InfoRow label="创建时间" value={fmtDate(selected.createdAt)} />
          {detail?.description ? <InfoRow label="描述" value={detail.description} /> : null}
        </div>

        {/* Traffic allocation pie chart */}
        {pieData.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <SectionTitle label="流量分配" />
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  dataKey="value"
                  label={({ name, value }: PieLabelRenderProps) =>
                    name !== undefined && value !== undefined ? `${String(name)}: ${String(value)}%` : ''
                  }
                  labelLine={false}
                >
                  {pieData.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length] ?? '#6b7280'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${String(value)}%`]}
                  contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Variant config JSON readonly */}
        {detail?.variantConfig != null && (
          <div style={{ marginBottom: 20 }}>
            <SectionTitle label="Variant Config (只读)" />
            <pre
              style={{
                background: 'var(--bg-panel)',
                border: '1px solid var(--border)',
                borderRadius: 5,
                padding: '10px 12px',
                color: 'var(--text-muted)',
                fontSize: 11,
                fontFamily: 'monospace',
                overflowX: 'auto',
                margin: 0,
                maxHeight: 160,
                overflowY: 'auto',
              }}
            >
              {JSON.stringify(detail.variantConfig, null, 2)}
            </pre>
          </div>
        )}

        {/* Timeline */}
        {detail?.timeline && detail.timeline.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <SectionTitle label="分配时间线 (近30天)" />
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 60 }}>
              {detail.timeline.map((t, idx) => {
                const maxCount = Math.max(...detail.timeline.map((x) => x.count), 1);
                const heightPct = (t.count / maxCount) * 100;
                return (
                  <div
                    key={idx}
                    title={`${fmtDate(t.day)}: ${t.count} assignments`}
                    style={{
                      flex: 1,
                      height: `${heightPct}%`,
                      minHeight: 2,
                      background: 'var(--gold)',
                      borderRadius: '1px 1px 0 0',
                      cursor: 'default',
                    }}
                  />
                );
              })}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 4 }}>
              {detail.timeline[0] ? fmtDate(detail.timeline[0].day) : ''}
              {' — '}
              {detail.timeline[detail.timeline.length - 1] ? fmtDate(detail.timeline[detail.timeline.length - 1]?.day) : ''}
            </div>
          </div>
        )}

        {/* Multi-metric significance chart */}
        {multiMetric?.results && (
          <div style={{ marginBottom: 20 }}>
            <SectionTitle label="多维显著性结果" />
            <MultiMetricChart results={multiMetric.results} />
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
          <button
            onClick={() => void navigator.clipboard?.writeText(selected.experimentKey).catch(() => null)}
            style={{
              background: 'var(--bg-panel)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
              borderRadius: 5,
              padding: '7px 14px',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            📋 复制 Key
          </button>

          <button
            onClick={() => navigate(`/admin/ab-experiments/${selected.experimentKey}`)}
            style={{
              background: 'var(--bg-panel)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
              borderRadius: 5,
              padding: '7px 14px',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            📊 详细分析
          </button>

          {/* SHIELD: super_admin only stop button (client-side hide + server-side guard) */}
          {currentRole === 'super_admin' && selected.status === 'running' && (
            <button
              onClick={() => setShowStopConfirm(true)}
              style={{
                background: '#ef444422',
                color: '#ef4444',
                border: '1px solid #ef444455',
                borderRadius: 5,
                padding: '7px 14px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ⚡ 一键停损
            </button>
          )}
        </div>
      </div>

      {/* Stop confirm modal */}
      {showStopConfirm && (
        <StopConfirmModal
          experimentId={selected.id}
          experimentKey={selected.experimentKey}
          onClose={() => setShowStopConfirm(false)}
          onStopped={() => { onRefresh(); onClose(); }}
        />
      )}
    </>
  );
}

