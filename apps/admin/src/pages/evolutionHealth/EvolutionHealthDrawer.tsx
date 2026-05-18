// PRD-13 US-006 · EvolutionHealthDrawer
// AC-6: account info + L等级 + 评分 + evolution_insight 时间线 + 强制重跑 (super_admin only)
// SHIELD: {role === 'super_admin' && <Button>} + backend adminProcedure.requireSuperAdmin

import { useState } from 'react';
import { adminTrpc } from '../../lib/admin-client';
import { EvolutionTimelineList } from './components/EvolutionTimelineList';
import type { TimelineInsight, TimelineAnomalyFlag } from './components/EvolutionTimelineList';

export interface AnomalyRow {
  id: number;
  accountId: number;
  anomalyType: string;
  severity: string;
  evidence: unknown;
  detectedAt: Date | string;
  resolvedAt: Date | string | null;
  resolution: string | null;
  resolvedByAdminId: number | null;
}

interface Props {
  selectedFlag: AnomalyRow | null;
  role: string | undefined;
  onClose: () => void;
  onFlagResolved: () => void;
}

// ── helpers ─────────────────────────��─────────────────────────��───────────────

function showToast(msg: string, type: 'ok' | 'warn' | 'err') {
  const el = document.createElement('div');
  const color = type === 'ok' ? '#22c55e' : type === 'warn' ? '#f59e0b' : '#ef4444';
  Object.assign(el.style, {
    position: 'fixed', bottom: '24px', right: '24px', zIndex: '9999',
    background: '#111', border: `1px solid ${color}`, color,
    padding: '10px 18px', borderRadius: '6px', fontSize: '13px', fontWeight: '600',
    boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
  });
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div
      style={{
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: 5,
        padding: '10px 12px',
      }}
    >
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: color ?? 'var(--gold)' }}>{value}</div>
    </div>
  );
}

// ── ConfirmRebuildModal ───────────────────────────────────────────────────────

function ConfirmRebuildModal({
  accountId,
  isPending,
  onConfirm,
  onCancel,
}: {
  accountId: number;
  isPending: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');
  const trimmed = reason.trim();
  const canSubmit = trimmed.length >= 10 && !isPending;

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.7)',
        zIndex: 400,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderRadius: 8, padding: 24,
          width: 360, maxWidth: '90vw',
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
          强制重跑进化档案
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
          账号 #{accountId} · 此操作将创建 dual-approval 申请，第二审批人确认后执行。
        </div>
        <div style={{ marginBottom: 16 }}>
          <label
            style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}
          >
            审批原因（≥ 10 字）
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="请说明强制重跑的原因..."
            rows={4}
            style={{
              width: '100%',
              background: 'var(--bg)',
              border: `1px solid ${trimmed.length > 0 && trimmed.length < 10 ? '#ef4444' : 'var(--border)'}`,
              borderRadius: 4,
              color: 'var(--text)',
              padding: '6px 8px',
              fontSize: 12,
              outline: 'none',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
          {trimmed.length > 0 && trimmed.length < 10 && (
            <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>
              原因需至少 10 字（当前 {trimmed.length} 字）
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            style={{
              background: 'none', border: '1px solid var(--border)',
              color: 'var(--text-muted)', padding: '6px 16px',
              borderRadius: 4, cursor: 'pointer', fontSize: 12,
            }}
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => canSubmit && onConfirm(trimmed)}
            disabled={!canSubmit}
            style={{
              background: canSubmit ? 'rgba(239,68,68,0.15)' : 'var(--bg-hover)',
              border: `1px solid ${canSubmit ? 'rgba(239,68,68,0.6)' : 'var(--border)'}`,
              color: canSubmit ? '#ef4444' : 'var(--text-dim)',
              padding: '6px 16px', borderRadius: 4,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              fontSize: 12, fontWeight: 600,
            }}
          >
            {isPending ? '提交中…' : '提交申请'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── EvolutionHealthDrawer ─────────────────────────────────────────────────────

export function EvolutionHealthDrawer({
  selectedFlag,
  role,
  onClose,
  onFlagResolved,
}: Props) {
  const isOpen = selectedFlag !== null;
  const accountId = selectedFlag?.accountId ?? null;
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: timeline, isLoading: timelineLoading } =
    adminTrpc.evolution.getAccountTimeline.useQuery(
      { accountId: accountId! },
      { enabled: accountId !== null, staleTime: 30_000 },
    );

  const forceRebuildMut = adminTrpc.evolution.forceRebuildEvolution.useMutation({
    onSuccess: (data) => {
      setShowConfirm(false);
      showToast(`已发起 Approval 申请 #${data.approvalRequestId}`, 'ok');
    },
    onError: (err) => showToast(`申请失败: ${err.message}`, 'err'),
  });

  const markResolvedMut = adminTrpc.evolution.markAnomalyResolved.useMutation({
    onSuccess: () => {
      showToast('已标记为 false positive', 'ok');
      onFlagResolved();
      onClose();
    },
    onError: (err) => showToast(`操作失败: ${err.message}`, 'err'),
  });

  const profile = timeline?.profile;

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200 }}
        />
      )}
      {showConfirm && accountId !== null && (
        <ConfirmRebuildModal
          accountId={accountId}
          isPending={forceRebuildMut.isPending}
          onConfirm={(reason) =>
            forceRebuildMut.mutate({ accountId, reason })
          }
          onCancel={() => setShowConfirm(false)}
        />
      )}

      <div
        style={{
          position: 'fixed',
          top: 0, right: 0, bottom: 0,
          width: 'min(520px, 90vw)',
          background: 'var(--bg-panel)',
          borderLeft: '1px solid var(--border)',
          zIndex: 201,
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.2s ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'flex-start', gap: 10,
            flexShrink: 0,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
              账号进化详情
            </div>
            {selectedFlag && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                Account #{selectedFlag.accountId}
                {profile?.level ? ` · L 等级: ${profile.level}` : ''}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭详情"
            style={{
              background: 'none', border: 'none',
              color: 'var(--text-muted)', cursor: 'pointer',
              fontSize: 18, padding: '0 4px', lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {selectedFlag && (
            <>
              {/* KPI cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                <StatCard label="L 等级" value={profile?.level ?? '—'} />
                <StatCard
                  label="满意度"
                  value={
                    profile?.satisfactionRate != null
                      ? `${(profile.satisfactionRate * 100).toFixed(1)}%`
                      : '—'
                  }
                  color="var(--accent-blue)"
                />
                <StatCard
                  label="总反馈数"
                  value={profile?.feedbackCountTotal != null ? String(profile.feedbackCountTotal) : '—'}
                />
                <StatCard
                  label="自动进化"
                  value={profile?.autoEvolutionEnabled === false ? '已关闭' : '开启'}
                  color={profile?.autoEvolutionEnabled === false ? '#ef4444' : '#22c55e'}
                />
              </div>

              {/* Timeline */}
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    marginBottom: 10,
                  }}
                >
                  进化时间线（最近 50 条）
                </div>
                <EvolutionTimelineList
                  insights={(timeline?.insights ?? []) as TimelineInsight[]}
                  anomalyFlags={(timeline?.anomalyFlags ?? []) as TimelineAnomalyFlag[]}
                  isLoading={timelineLoading}
                />
              </div>

              {/* Actions */}
              <div
                style={{
                  display: 'flex', flexDirection: 'column', gap: 8,
                  paddingTop: 16, borderTop: '1px solid var(--border)',
                }}
              >
                {!selectedFlag.resolvedAt && (
                  <button
                    type="button"
                    onClick={() =>
                      markResolvedMut.mutate({
                        flagId: selectedFlag.id,
                        resolution: 'false_positive',
                      })
                    }
                    disabled={markResolvedMut.isPending}
                    style={{
                      background: 'none',
                      border: '1px solid var(--border)',
                      color: 'var(--text-muted)',
                      padding: '6px 14px', borderRadius: 4,
                      cursor: 'pointer', fontSize: 12,
                      alignSelf: 'flex-start',
                    }}
                  >
                    {markResolvedMut.isPending ? '处理中…' : '标记 false positive'}
                  </button>
                )}
                {/* SHIELD: super_admin only — hidden for admin/readonly_admin */}
                {role === 'super_admin' && (
                  <button
                    type="button"
                    onClick={() => setShowConfirm(true)}
                    style={{
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.4)',
                      color: '#ef4444',
                      padding: '8px 16px', borderRadius: 4,
                      cursor: 'pointer', fontSize: 12, fontWeight: 600,
                      alignSelf: 'flex-start',
                    }}
                  >
                    强制重跑批
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
