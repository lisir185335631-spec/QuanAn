import { useState } from 'react';
import { adminTrpc } from '../../lib/admin-client';

function showToast(msg: string, type: 'ok' | 'err') {
  const el = document.createElement('div');
  const color = type === 'ok' ? '#22c55e' : '#ef4444';
  Object.assign(el.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: '9999',
    background: '#111',
    border: `1px solid ${color}`,
    color,
    padding: '10px 18px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
  });
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

interface BanUploaderDialogProps {
  userId: number;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  role: string | undefined;
  isSuspended: boolean;
}

export function BanUploaderDialog({
  userId,
  open,
  onClose,
  onSuccess,
  role,
  isSuspended,
}: BanUploaderDialogProps) {
  const [reason, setReason] = useState('');

  const banMut = adminTrpc.reviewDeepLearn.banUploader.useMutation({
    onSuccess: (result) => {
      if (result.status === 'auto_executed') {
        showToast('冻结成功', 'ok');
      } else {
        showToast('已提交等审批', 'ok');
      }
      setReason('');
      onSuccess();
      onClose();
    },
    onError: (err) => showToast(`操作失败: ${err.message}`, 'err'),
  });

  if (!open) return null;

  const reasonTrimmed = reason.trim();
  const reasonValid = reasonTrimmed.length >= 10;
  const canSubmit = reasonValid && !isSuspended && !banMut.isPending;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 400,
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 440,
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          zIndex: 401,
          padding: 24,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
          封禁上传 · 用户 #{userId}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
          {role === 'super_admin'
            ? '操作将立即生效（super_admin 直批）'
            : '操作将提交审批（admin 待审）'}
        </div>

        {isSuspended && (
          <div
            style={{
              padding: '8px 12px',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 4,
              fontSize: 12,
              color: '#ef4444',
              marginBottom: 12,
            }}
          >
            ⚠️ 该用户已被封禁，无需重复操作
          </div>
        )}

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="封禁原因（至少 10 个字符）…"
          disabled={isSuspended}
          style={{
            width: '100%',
            background: 'var(--bg)',
            border: `1px solid ${reason.length > 0 && !reasonValid ? '#ef4444' : 'var(--border)'}`,
            borderRadius: 4,
            color: isSuspended ? 'var(--text-dim)' : 'var(--text)',
            padding: '8px 10px',
            fontSize: 13,
            outline: 'none',
            resize: 'vertical',
            height: 80,
            boxSizing: 'border-box',
            cursor: isSuspended ? 'not-allowed' : 'text',
          }}
        />
        {reason.length > 0 && !reasonValid && (
          <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>
            原因至少需要 10 个字符（当前 {reasonTrimmed.length} 字符）
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              padding: '6px 16px',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => banMut.mutate({ userId, reason })}
            disabled={!canSubmit}
            style={{
              background: canSubmit ? 'rgba(239,68,68,0.15)' : 'var(--bg-hover)',
              border: '1px solid rgba(239,68,68,0.4)',
              color: canSubmit ? '#ef4444' : 'var(--text-dim)',
              padding: '6px 16px',
              borderRadius: 4,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {banMut.isPending ? '处理中…' : '封禁上传'}
          </button>
        </div>
      </div>
    </>
  );
}
