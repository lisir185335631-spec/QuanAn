// PRD-13 US-011 · ApprovalDetailDrawer
// AC-4: 申请概要 + actionPayload JSON + 影响范围预估 (per actionType)
// AC-5: 历史决策参考 + 批准/拒绝 按钮 + 决策理由 input (必填 ≥10字)
// AC-7: dual first_approved 绿条 '第一审批已通过 by ...'
// AC-8: 第一审批人 → <Button> 批准 disabled + tooltip
// SHIELD: 第一审批人不能两次批 (client disabled · server 兜底)

import { useState } from 'react';

import { adminTrpc } from '../../lib/admin-client';
import { EmergencyApproveModal } from './EmergencyApproveModal';

// ── Types (matching enriched backend shape) ────────────────────────────────

export interface ApprovalRow {
  id: number;
  requesterAdminId: number;
  requesterEmail: string | null;
  actionType: string;
  actionPayload: unknown;
  riskLevel: string;
  requireDualApproval: boolean;
  emergencyMode: boolean;
  emergencyIncidentId: string | null;
  postReviewRequired: boolean;
  displayStatus: string;
  approverAdminId: number | null;
  firstApproverEmail: string | null;
  secondApproverEmail: string | null;
  decisionReason: string | null;
  requesterReason: string;
  createdAt: Date | string;
  expiresAt: Date | string;
  decidedAt: Date | string | null;
}

interface Props {
  selected: ApprovalRow | null;
  currentAdminId: number;
  currentRole: string | undefined;
  onClose: () => void;
  onRefresh: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  return new Date(String(d)).toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

function riskColor(r: string): string {
  if (r === 'high' || r === 'critical') return '#ef4444';
  if (r === 'medium') return '#f59e0b';
  return '#6b7280';
}

/** Per-actionType impact description (stub per AC-4) */
function ImpactEstimator({ actionType, payload }: { actionType: string; payload: unknown }) {
  const p = typeof payload === 'object' && payload !== null ? (payload as Record<string, unknown>) : {};

  const texts: Record<string, string> = {
    force_rebuild_evolution: `将清空 accountId=${String(p['accountId'] ?? '?')} 的 evolution_profile + insights · 重新跑 EvolutionAgent · 预计耗时 30-60s · ⚠️ 不可恢复`,
    publish_prompt: `将切换 specialistId=${String(p['specialistId'] ?? '?')} mode=${String(p['mode'] ?? 'default')} 当前 active 版本 from v${String(p['fromVersion'] ?? '?')} to v${String(p['toVersion'] ?? '?')} · 灰度比例 ${String(p['canaryPct'] ?? '?')}% · 影响约 ${String(p['estimatedUsers'] ?? '—')} 用户`,
    adjust_quota: `将变更 userId=${String(p['userId'] ?? '?')} dailyQuota 从 ${String(p['oldQuota'] ?? '?')} 到 ${String(p['newQuota'] ?? '?')} · 24h 后自动失效`,
    ban_uploader: `将暂停 userId=${String(p['userId'] ?? '?')} 的内容上传权限 · 持续 7 天 · 失败 7 天后自动恢复`,
    rollback_prompt: `将回滚 specialistId=${String(p['specialistId'] ?? '?')} 到版本 v${String(p['targetVersion'] ?? '?')}`,
    whitelist_user: `将 userId=${String(p['userId'] ?? '?')} 加入白名单 · TTL=${String(p['ttlHours'] ?? '?')}h`,
    template_modify: `将更新模板 ${String(p['templateId'] ?? '?')} · 影响范围: ${String(p['affectedSpecialists'] ?? '—')}`,
    cross_account_batch: `批量操作 ${String(p['batchCount'] ?? '?')} 个账号`,
  };

  const text = texts[actionType] ?? `将执行操作 ${actionType}`;

  return (
    <div
      style={{
        background: 'rgba(239,68,68,0.07)',
        border: '1px solid rgba(239,68,68,0.3)',
        borderRadius: 4,
        padding: '8px 10px',
        fontSize: 12,
        color: 'var(--text)',
        lineHeight: 1.6,
      }}
    >
      <span style={{ color: '#ef4444', fontWeight: 600 }}>影响范围预估：</span> {text}
    </div>
  );
}

// ── Main Drawer ────────────────────────────────────────────────────────────

export function ApprovalDetailDrawer({ selected, currentAdminId, currentRole, onClose, onRefresh }: Props) {
  const [decisionReason, setDecisionReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [toast, setToast] = useState('');
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  const utils = adminTrpc.useUtils();

  const { data: historicalDecisions } = adminTrpc.approvals.getHistoricalDecisions.useQuery(
    { actionType: selected?.actionType ?? '', excludeId: selected?.id },
    { enabled: !!selected },
  );

  const approveMutation = adminTrpc.approvals.approveRequest.useMutation({
    onSuccess: (data) => {
      showToast(data.displayStatus === 'first_approved' ? '第一审批已通过，等待第二审批' : '已批准');
      setDecisionReason('');
      void utils.approvals.listPending.invalidate();
      void utils.approvals.listDecided.invalidate();
      void utils.approvals.getKpiStats.invalidate();
      onRefresh();
    },
    onError: (err) => setReasonError(err.message),
  });

  const rejectMutation = adminTrpc.approvals.rejectRequest.useMutation({
    onSuccess: () => {
      showToast('已拒绝');
      setDecisionReason('');
      void utils.approvals.listPending.invalidate();
      void utils.approvals.listDecided.invalidate();
      void utils.approvals.getKpiStats.invalidate();
      onRefresh();
    },
    onError: (err) => setReasonError(err.message),
  });

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function handleApprove() {
    setReasonError('');
    if (decisionReason.trim().length < 10) {
      setReasonError('决策理由至少 10 个字');
      return;
    }
    if (!selected) return;
    approveMutation.mutate({ requestId: selected.id, decisionReason });
  }

  function handleReject() {
    setReasonError('');
    if (decisionReason.trim().length < 10) {
      setReasonError('拒绝理由至少 10 个字');
      return;
    }
    if (!selected) return;
    rejectMutation.mutate({ requestId: selected.id, decisionReason });
  }

  if (!selected) return null;

  // AC-8: 当前用户是第一审批人?
  const isFirstApprover =
    selected.requireDualApproval &&
    selected.approverAdminId === currentAdminId &&
    selected.displayStatus === 'first_approved';

  const isSuperAdmin = currentRole === 'super_admin';
  const isPending = selected.displayStatus === 'pending' || selected.displayStatus === 'first_approved';

  // Redact PII from payload for display
  const payloadForDisplay = JSON.stringify(selected.actionPayload, null, 2)
    .replace(/"email":\s*"[^"]*"/g, '"email": "[REDACTED]"')
    .replace(/"phone":\s*"[^"]*"/g, '"phone": "[REDACTED]"');

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 1000,
        }}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 520,
          maxWidth: '90vw',
          background: 'var(--bg-panel)',
          borderLeft: '1px solid var(--border)',
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Toast */}
        {toast && (
          <div
            style={{
              position: 'absolute',
              top: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#22c55e',
              color: '#fff',
              padding: '6px 18px',
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 600,
              zIndex: 10,
            }}
          >
            {toast}
          </div>
        )}

        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div>
            <h3 style={{ color: 'var(--gold)', fontSize: 15, fontWeight: 700, margin: 0 }}>
              申请 #{selected.id} · {selected.actionType}
            </h3>
            <span
              style={{
                fontSize: 11,
                padding: '2px 6px',
                borderRadius: 3,
                background: `${riskColor(selected.riskLevel)}22`,
                color: riskColor(selected.riskLevel),
                marginTop: 4,
                display: 'inline-block',
              }}
            >
              {selected.riskLevel.toUpperCase()}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}
          >
            ✕
          </button>
        </div>

        {/* AC-10: Emergency banner */}
        {selected.emergencyMode && isSuperAdmin && (
          <div
            style={{
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid #ef4444',
              padding: '8px 16px',
              color: '#ef4444',
              fontSize: 12,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            🚨 紧急通道 - 后置复核 · 批准后 24h 内须完成复核
            {selected.emergencyIncidentId && (
              <span style={{ marginLeft: 8, opacity: 0.8 }}>INC: {selected.emergencyIncidentId}</span>
            )}
          </div>
        )}

        {/* AC-7: first_approved 绿条 */}
        {selected.displayStatus === 'first_approved' && (
          <div
            style={{
              background: 'rgba(34,197,94,0.12)',
              border: '1px solid #22c55e',
              padding: '8px 16px',
              color: '#22c55e',
              fontSize: 12,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            ✅ 第一审批已通过 by {selected.firstApproverEmail ?? `Admin#${selected.approverAdminId}`} at {fmtDate(selected.decidedAt)}
            {' · '}
            <span style={{ opacity: 0.8 }}>等待第二审批人</span>
          </div>
        )}

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {/* Summary */}
          <section style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
              申请概要
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', fontSize: 12 }}>
              <Row label="申请人" value={selected.requesterEmail ?? `Admin#${selected.requesterAdminId}`} />
              <Row label="角色" value={selected.requesterEmail ? '管理员' : '—'} />
              <Row label="Dual审批" value={selected.requireDualApproval ? 'Y' : 'N'} />
              <Row label="紧急" value={selected.emergencyMode ? '是' : '否'} />
              <Row label="创建时间" value={fmtDate(selected.createdAt)} />
              <Row label="到期时间" value={fmtDate(selected.expiresAt)} />
            </div>
            {selected.requesterReason && (
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                <span style={{ fontWeight: 600 }}>申请理由：</span>{selected.requesterReason}
              </div>
            )}
          </section>

          {/* ActionPayload JSON */}
          <section style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
              操作载荷 (PII 已脱敏)
            </div>
            <pre
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 4,
                padding: '8px 10px',
                fontSize: 11,
                color: 'var(--text)',
                overflowX: 'auto',
                margin: 0,
                maxHeight: 160,
                overflowY: 'auto',
              }}
            >
              {payloadForDisplay}
            </pre>
          </section>

          {/* Impact estimate */}
          <section style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
              影响范围预估
            </div>
            <ImpactEstimator actionType={selected.actionType} payload={selected.actionPayload} />
          </section>

          {/* Historical decisions */}
          <section style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
              同类历史决策参考 (近 10 条)
            </div>
            {!historicalDecisions || historicalDecisions.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 0' }}>暂无同类历史决策</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {historicalDecisions.map((d) => (
                  <div
                    key={d.id}
                    style={{
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 4,
                      padding: '6px 10px',
                      fontSize: 12,
                    }}
                  >
                    <span
                      style={{
                        color: d.status === 'approved' ? '#22c55e' : '#ef4444',
                        fontWeight: 600,
                        marginRight: 8,
                      }}
                    >
                      {d.status === 'approved' ? '✅ 批准' : '❌ 拒绝'}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {d.approverEmail ?? '—'} · {fmtDate(d.decidedAt)}
                    </span>
                    {d.decisionReason && (
                      <div style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 11 }}>
                        {d.decisionReason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Approve / Reject — only for pending requests */}
          {isPending && (
            <section>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                决策操作
              </div>

              <textarea
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
                placeholder="决策理由 (必填，至少 10 个字)"
                rows={3}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  borderRadius: 4,
                  padding: '8px 10px',
                  fontSize: 12,
                  resize: 'vertical',
                  marginBottom: 8,
                }}
              />
              {decisionReason.length > 0 && decisionReason.length < 10 && (
                <div style={{ color: '#f59e0b', fontSize: 11, marginBottom: 6 }}>
                  还需要 {10 - decisionReason.length} 个字
                </div>
              )}
              {reasonError && (
                <div style={{ color: '#ef4444', fontSize: 11, marginBottom: 8, background: 'rgba(239,68,68,0.1)', padding: '4px 8px', borderRadius: 4 }}>
                  {reasonError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {/* AC-8: 第一审批人 → disabled + tooltip */}
                <div
                  title={isFirstApprover ? '您已是第一审批人 · 不能两次批' : ''}
                  style={{ flex: 1 }}
                >
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={isFirstApprover || approveMutation.isPending}
                    style={{
                      width: '100%',
                      background: isFirstApprover ? 'var(--bg-hover)' : '#22c55e',
                      border: 'none',
                      color: isFirstApprover ? 'var(--text-muted)' : '#fff',
                      padding: '8px 16px',
                      borderRadius: 4,
                      cursor: isFirstApprover ? 'not-allowed' : 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                      opacity: approveMutation.isPending ? 0.7 : 1,
                    }}
                  >
                    {approveMutation.isPending ? '处理中…' : isFirstApprover ? '批准 (已参与第一审批)' : '✅ 批准'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleReject}
                  disabled={rejectMutation.isPending}
                  style={{
                    flex: 1,
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid #ef4444',
                    color: '#ef4444',
                    padding: '8px 16px',
                    borderRadius: 4,
                    cursor: rejectMutation.isPending ? 'not-allowed' : 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                    opacity: rejectMutation.isPending ? 0.7 : 1,
                  }}
                >
                  {rejectMutation.isPending ? '处理中…' : '❌ 拒绝'}
                </button>

                {/* AC-6: 紧急通道 super_admin + emergencyMode */}
                {isSuperAdmin && selected.emergencyMode && (
                  <button
                    type="button"
                    onClick={() => setShowEmergencyModal(true)}
                    style={{
                      background: '#ef4444',
                      border: 'none',
                      color: '#fff',
                      padding: '8px 16px',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    🚨 紧急批准
                  </button>
                )}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Emergency modal */}
      {showEmergencyModal && selected && (
        <EmergencyApproveModal
          requestId={selected.id}
          onClose={() => setShowEmergencyModal(false)}
          onApproved={() => {
            setShowEmergencyModal(false);
            onRefresh();
          }}
        />
      )}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{label}: </span>
      <span style={{ color: 'var(--text)', fontSize: 12 }}>{value}</span>
    </div>
  );
}
