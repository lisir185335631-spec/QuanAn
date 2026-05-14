// PRD-13 US-011 · EmergencyApproveModal — super_admin only
// AC-6: 紧急通道 super_admin only · 弹 incidentId input · 必填
// SHIELD: incidentId 必填 · 客户端 + 服务端双校验

import { useState } from 'react';

import { adminTrpc } from '../../lib/admin-client';

interface Props {
  requestId: number;
  onClose: () => void;
  onApproved: () => void;
}

export function EmergencyApproveModal({ requestId, onClose, onApproved }: Props) {
  const [incidentId, setIncidentId] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const utils = adminTrpc.useUtils();
  const emergencyMutation = adminTrpc.approvals.emergencyApprove.useMutation({
    onSuccess: () => {
      void utils.approvals.listPending.invalidate();
      void utils.approvals.getKpiStats.invalidate();
      onApproved();
    },
    onError: (err) => setError(err.message),
  });

  function handleSubmit() {
    setError('');
    // SHIELD: client-side incidentId 必填
    if (!incidentId.trim()) {
      setError('incidentId 必填');
      return;
    }
    if (reason.trim().length < 10) {
      setError('决策理由至少 10 个字');
      return;
    }
    emergencyMutation.mutate({ requestId, incidentId: incidentId.trim(), decisionReason: reason });
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: 'var(--bg-panel)',
          border: '2px solid #ef4444',
          borderRadius: 8,
          padding: 24,
          width: 440,
          maxWidth: '90vw',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 20 }}>🚨</span>
          <h3 style={{ color: '#ef4444', fontSize: 16, fontWeight: 700, margin: 0 }}>
            紧急通道 · 后置复核
          </h3>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 16 }}>
          此操作绕过正常审批流程，将在 24 小时内触发后置复核。请确保已记录事故编号。
        </p>

        {/* incidentId input */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
            事故编号 (Incident ID) <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="text"
            value={incidentId}
            onChange={(e) => setIncidentId(e.target.value)}
            placeholder="例: INC-2026-0512"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: 'var(--bg)',
              border: `1px solid ${incidentId.trim() ? 'var(--border)' : '#ef4444'}`,
              color: 'var(--text)',
              borderRadius: 4,
              padding: '8px 10px',
              fontSize: 13,
            }}
          />
        </div>

        {/* Reason textarea */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
            决策理由 (≥ 10 字) <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="请说明为什么需要使用紧急通道..."
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              borderRadius: 4,
              padding: '8px 10px',
              fontSize: 13,
              resize: 'vertical',
            }}
          />
          <div style={{ fontSize: 11, color: reason.length < 10 ? '#ef4444' : 'var(--text-muted)', textAlign: 'right', marginTop: 2 }}>
            {reason.length} / 10
          </div>
        </div>

        {error && (
          <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 12, background: 'rgba(239,68,68,0.1)', padding: '6px 10px', borderRadius: 4 }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'var(--bg-hover)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              padding: '7px 16px',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={emergencyMutation.isPending}
            style={{
              background: '#ef4444',
              border: 'none',
              color: '#fff',
              padding: '7px 20px',
              borderRadius: 4,
              cursor: emergencyMutation.isPending ? 'not-allowed' : 'pointer',
              fontSize: 13,
              fontWeight: 600,
              opacity: emergencyMutation.isPending ? 0.7 : 1,
            }}
          >
            {emergencyMutation.isPending ? '提交中…' : '确认紧急批准'}
          </button>
        </div>
      </div>
    </div>
  );
}
