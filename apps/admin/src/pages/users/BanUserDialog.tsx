// PRD-11 US-007 · BanUserDialog — reason + durationDays(optional) + submit

import { useState } from 'react';
import { adminTrpc } from '../../lib/admin-client';

interface BanUserDialogProps {
  userId: number | null;
  userEmail?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function BanUserDialog({ userId, userEmail, onClose, onSuccess }: BanUserDialogProps) {
  const [reason, setReason] = useState('');

  const mutation = adminTrpc.users.banUser.useMutation({
    onSuccess: (data) => {
      showToast(
        data.status === 'auto_executed' ? '封禁成功' : '已提交 · 等审批',
        data.status === 'auto_executed' ? 'ok' : 'warn',
      );
      onSuccess();
      onClose();
    },
    onError: (err) => showToast(`失败: ${err.message}`, 'err'),
  });

  if (!userId) return null;

  return (
    <Dialog title="封禁用户" onClose={onClose}>
      <div style={{ marginBottom: 14 }}>
        <Label>用户</Label>
        <div style={{ color: 'var(--text)', fontSize: 13 }}>{userEmail ?? `#${userId}`}</div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <Label>封禁原因 * (≥10字)</Label>
        <textarea
          style={{ ...inputStyle, height: 80, resize: 'vertical' }}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="请填写封禁原因（至少10字）…"
        />
      </div>
      <div
        style={{
          padding: '10px 12px',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 4,
          marginBottom: 20,
          fontSize: 12,
          color: 'var(--status-err)',
        }}
      >
        ⚠️ 此操作将封禁用户账户，该用户将无法登录
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <GhostButton onClick={onClose}>取消</GhostButton>
        <DangerButton
          onClick={() => mutation.mutate({ userId, reason })}
          disabled={reason.length < 10 || mutation.isPending}
          loading={mutation.isPending}
        >
          确认封禁
        </DangerButton>
      </div>
    </Dialog>
  );
}

// ── Primitives ────────────────────────────────────────────────────────────────

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 8, padding: 24, width: 420, zIndex: 301, boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--status-err)', flex: 1 }}>{title}</h3>
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
  return <button type="button" onClick={onClick} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '6px 16px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>{children}</button>;
}

function DangerButton({ onClick, disabled, loading, children }: { onClick: () => void; disabled?: boolean; loading?: boolean; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} disabled={disabled} style={{ background: disabled ? 'var(--bg-hover)' : 'rgba(239,68,68,0.1)', border: '1px solid var(--status-err)', color: disabled ? 'var(--text-dim)' : 'var(--status-err)', padding: '6px 16px', borderRadius: 4, cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600 }}>{loading ? '提交中…' : children}</button>;
}

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

function showToast(msg: string, type: 'ok' | 'warn' | 'err') {
  const el = document.createElement('div');
  const color = type === 'ok' ? '#22c55e' : type === 'warn' ? '#f59e0b' : '#ef4444';
  Object.assign(el.style, { position: 'fixed', bottom: '24px', right: '24px', zIndex: '9999', background: '#111', border: `1px solid ${color}`, color, padding: '10px 18px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', boxShadow: '0 4px 16px rgba(0,0,0,0.5)' });
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}
