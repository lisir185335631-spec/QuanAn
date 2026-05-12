// PRD-11 US-011 · ForceFreezeDialog — reason textarea + forceFreeze mutation
// AC-8: same Dialog pattern as ChangePlanDialog
// AC-14: super_admin → toast('冻结成功') · admin → '已提交等审批'

import { useState } from 'react';
import { adminTrpc } from '../../lib/admin-client';

interface ForceFreezeDialogProps {
  accountId: number | null;
  accountName?: string;
  role: string | undefined;
  onClose: () => void;
  onSuccess: () => void;
}

export function ForceFreezeDialog({
  accountId,
  accountName,
  role,
  onClose,
  onSuccess,
}: ForceFreezeDialogProps) {
  const [reason, setReason] = useState('');

  const mutation = adminTrpc.ipAccounts.forceFreeze.useMutation({
    onSuccess: (data) => {
      if (data.status === 'auto_executed') {
        showToast('账号已冻结', 'ok');
      } else {
        showToast('已提交审批 · 等待 super_admin 审批', 'warn');
      }
      onSuccess();
      onClose();
    },
    onError: (err) => {
      showToast(`失败: ${err.message}`, 'err');
    },
  });

  if (!accountId) return null;

  return (
    <Dialog title="强制冻结账号" onClose={onClose}>
      <div style={{ marginBottom: 14 }}>
        <Label>账号</Label>
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{accountName ?? `#${accountId}`}</div>
      </div>
      <div
        style={{
          marginBottom: 16,
          padding: '8px 12px',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 4,
          fontSize: 12,
          color: '#ef4444',
        }}
      >
        ⚠️ 强制冻结将立即停止该账号的所有 Specialist 调用。此操作需要审批（super_admin 直接执行）。
      </div>
      <div style={{ marginBottom: 20 }}>
        <Label>冻结原因 * (≥10字)</Label>
        <textarea
          style={textareaStyle}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="请填写冻结原因（至少10字）…"
        />
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <GhostButton onClick={onClose}>取消</GhostButton>
        <PrimaryButton
          onClick={() => mutation.mutate({ accountId, freezeReason: reason })}
          disabled={reason.length < 10 || mutation.isPending}
          loading={mutation.isPending}
          danger
        >
          {role === 'super_admin' ? '确认冻结' : '提交审批'}
        </PrimaryButton>
      </div>
    </Dialog>
  );
}

// ── Shared dialog primitives (duplicated from ChangePlanDialog to keep module standalone) ──

function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300 }}
      />
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: 24,
          width: 440,
          zIndex: 301,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#ef4444', flex: 1 }}>{title}</h3>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        color: 'var(--text-muted)',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}
    >
      {children}
    </div>
  );
}

function GhostButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'none',
        border: '1px solid var(--border)',
        color: 'var(--text-muted)',
        padding: '6px 16px',
        borderRadius: 4,
        cursor: 'pointer',
        fontSize: 12,
      }}
    >
      {children}
    </button>
  );
}

function PrimaryButton({
  onClick,
  disabled,
  loading,
  danger,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  const bg = disabled ? 'var(--bg-hover)' : danger ? 'rgba(239,68,68,0.15)' : 'var(--gold-dim)';
  const borderColor = disabled ? 'var(--border)' : danger ? '#ef4444' : 'var(--gold)';
  const color = disabled ? 'var(--text-dim)' : danger ? '#ef4444' : 'var(--gold-text)';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        background: bg,
        border: `1px solid ${borderColor}`,
        color,
        padding: '6px 16px',
        borderRadius: 4,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {loading ? '提交中…' : children}
    </button>
  );
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 4,
  color: 'var(--text)',
  padding: '6px 8px',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
  height: 80,
  resize: 'vertical',
};

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
