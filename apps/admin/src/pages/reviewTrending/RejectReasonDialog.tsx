// PRD-12 US-006 · RejectReasonDialog — 单条/批量驳回原因弹窗
// AC-2: min 5 校验 · 提交前 disabled + 红字提示
// AC-5: reason < 5 · 提交前 disabled + 红字提示

import { useEffect, useState } from 'react';

interface Props {
  open: boolean;
  title?: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isPending?: boolean;
}

export function RejectReasonDialog({ open, title, onClose, onConfirm, isPending }: Props) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  if (!open) return null;

  const trimmed = reason.trim();
  const isValid = trimmed.length >= 5;
  const showError = reason.length > 0 && !isValid;

  const handleConfirm = () => {
    if (!isValid || isPending) return;
    onConfirm(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 400,
        }}
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        onKeyDown={handleKeyDown}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 401,
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '20px 24px',
          width: 420,
          maxWidth: 'calc(100vw - 32px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--text)',
            marginBottom: 14,
          }}
        >
          {title ?? '驳回原因'}
        </div>

        <textarea
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="请输入驳回原因（至少 5 个字符）…"
          style={{
            width: '100%',
            background: 'var(--bg)',
            border: `1px solid ${showError ? '#ef4444' : 'var(--border)'}`,
            borderRadius: 4,
            color: 'var(--text)',
            padding: '8px 10px',
            fontSize: 13,
            outline: 'none',
            resize: 'vertical',
            height: 88,
            boxSizing: 'border-box',
            fontFamily: 'inherit',
          }}
        />

        {showError && (
          <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>
            原因至少需要 5 个字符（当前 {reason.length} 个）
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            marginTop: 16,
          }}
        >
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
              fontSize: 12,
            }}
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isValid || isPending}
            style={{
              background: isValid ? 'rgba(239,68,68,0.15)' : 'var(--bg-hover)',
              border: '1px solid rgba(239,68,68,0.4)',
              color: isValid ? '#ef4444' : 'var(--text-dim)',
              padding: '6px 16px',
              borderRadius: 4,
              cursor: !isValid || isPending ? 'not-allowed' : 'pointer',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {isPending ? '处理中…' : '确认驳回'}
          </button>
        </div>
      </div>
    </>
  );
}
