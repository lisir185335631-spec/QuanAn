// PRD-11 US-007 · ResetPasswordDialog — confirm + submit → show temp password

import { useState } from 'react';
import { adminTrpc } from '../../lib/admin-client';

interface ResetPasswordDialogProps {
  userId: number | null;
  userEmail?: string;
  onClose: () => void;
}

export function ResetPasswordDialog({ userId, userEmail, onClose }: ResetPasswordDialogProps) {
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const mutation = adminTrpc.users.resetPassword.useMutation({
    onSuccess: (data) => {
      setTempPassword(data.tempPassword);
    },
    onError: (err) => showToast(`失败: ${err.message}`, 'err'),
  });

  if (!userId) return null;

  return (
    <Dialog title="重置密码" onClose={onClose}>
      {tempPassword ? (
        <>
          <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--text-muted)' }}>
            密码已重置 · 请将临时密码发给用户
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '12px 14px',
              marginBottom: 20,
            }}
          >
            <code style={{ flex: 1, fontSize: 15, fontFamily: 'monospace', color: 'var(--gold)', letterSpacing: '0.1em' }}>
              {tempPassword}
            </code>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(tempPassword);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              style={{
                background: copied ? 'rgba(34,197,94,0.1)' : 'var(--bg-hover)',
                border: '1px solid var(--border)',
                color: copied ? 'var(--status-ok)' : 'var(--text-muted)',
                padding: '4px 10px',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 11,
                flexShrink: 0,
              }}
            >
              {copied ? '已复制' : '复制'}
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <PrimaryButton onClick={onClose}>关闭</PrimaryButton>
          </div>
        </>
      ) : (
        <>
          <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--text-muted)' }}>
            将为用户 <span style={{ color: 'var(--text)' }}>{userEmail ?? `#${userId}`}</span> 生成临时密码
          </div>
          <div style={{ marginBottom: 20, padding: '10px 12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 4, fontSize: 12, color: 'var(--status-warn)' }}>
            ⚠️ 原密码将立即失效，此操作不可逆
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <GhostButton onClick={onClose}>取消</GhostButton>
            <PrimaryButton
              onClick={() => mutation.mutate({ userId })}
              disabled={mutation.isPending}
              loading={mutation.isPending}
            >
              确认重置
            </PrimaryButton>
          </div>
        </>
      )}
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
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text)', flex: 1 }}>{title}</h3>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>
        {children}
      </div>
    </>
  );
}

function GhostButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '6px 16px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>{children}</button>;
}

function PrimaryButton({ onClick, disabled, loading, children }: { onClick: () => void; disabled?: boolean; loading?: boolean; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} disabled={disabled} style={{ background: disabled ? 'var(--bg-hover)' : 'var(--gold-dim)', border: '1px solid var(--gold)', color: disabled ? 'var(--text-dim)' : 'var(--gold-text)', padding: '6px 16px', borderRadius: 4, cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600 }}>{loading ? '处理中…' : children}</button>;
}

function showToast(msg: string, type: 'ok' | 'warn' | 'err') {
  const el = document.createElement('div');
  const color = type === 'ok' ? '#22c55e' : type === 'warn' ? '#f59e0b' : '#ef4444';
  Object.assign(el.style, { position: 'fixed', bottom: '24px', right: '24px', zIndex: '9999', background: '#111', border: `1px solid ${color}`, color, padding: '10px 18px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', boxShadow: '0 4px 16px rgba(0,0,0,0.5)' });
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}
