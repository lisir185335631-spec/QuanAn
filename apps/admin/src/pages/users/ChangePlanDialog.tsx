// PRD-11 US-007 · ChangePlanDialog — plan dropdown + reason + submit

import { useState } from 'react';
import { adminTrpc } from '../../lib/admin-client';

const PLANS = ['free', 'pro', 'enterprise'];

interface ChangePlanDialogProps {
  userId: number | null;
  currentPlan?: string;
  role: string | undefined;
  onClose: () => void;
  onSuccess: () => void;
}

export function ChangePlanDialog({ userId, currentPlan, role, onClose, onSuccess }: ChangePlanDialogProps) {
  const [newPlan, setNewPlan] = useState('');
  const [reason, setReason] = useState('');

  const mutation = adminTrpc.users.changePlan.useMutation({
    onSuccess: (data) => {
      if (data.status === 'auto_executed') {
        showToast('改套餐成功', 'ok');
      } else {
        showToast('已提交 · 等审批', 'warn');
      }
      onSuccess();
      onClose();
    },
    onError: (err) => {
      showToast(`失败: ${err.message}`, 'err');
    },
  });

  if (!userId) return null;

  return (
    <Dialog title="改套餐" onClose={onClose}>
      <div style={{ marginBottom: 14 }}>
        <Label>当前套餐</Label>
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{currentPlan ?? '—'}</div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <Label>新套餐 *</Label>
        <select
          style={selectStyle}
          value={newPlan}
          onChange={(e) => setNewPlan(e.target.value)}
        >
          <option value="">选择套餐…</option>
          {PLANS.filter((p) => p !== currentPlan).map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
      <div style={{ marginBottom: 20 }}>
        <Label>原因 * (≥10字)</Label>
        <textarea
          style={{ ...inputStyle, height: 72, resize: 'vertical' }}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="请填写变更原因（至少10字）…"
        />
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <GhostButton onClick={onClose}>取消</GhostButton>
        <PrimaryButton
          onClick={() => mutation.mutate({ userId, newPlan, reason })}
          disabled={!newPlan || reason.length < 10 || mutation.isPending}
          loading={mutation.isPending}
        >
          {role === 'super_admin' ? '确认改套餐' : '提交审批'}
        </PrimaryButton>
      </div>
    </Dialog>
  );
}

// ── Shared dialog primitives ──────────────────────────────────────────────────

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
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
          width: 420,
          zIndex: 301,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--gold)', flex: 1 }}>{title}</h3>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>
        {children}
      </div>
    </>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{children}</div>;
}

function GhostButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '6px 16px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
      {children}
    </button>
  );
}

function PrimaryButton({ onClick, disabled, loading, children }: { onClick: () => void; disabled?: boolean; loading?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{ background: disabled ? 'var(--bg-hover)' : 'var(--gold-dim)', border: '1px solid var(--gold)', color: disabled ? 'var(--text-dim)' : 'var(--gold-text)', padding: '6px 16px', borderRadius: 4, cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600 }}
    >
      {loading ? '提交中…' : children}
    </button>
  );
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 4,
  color: 'var(--text)',
  padding: '6px 8px',
  fontSize: 13,
  outline: 'none',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 4,
  color: 'var(--text)',
  padding: '6px 8px',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
};

// Simple toast (DOM-based, no portal needed)
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
