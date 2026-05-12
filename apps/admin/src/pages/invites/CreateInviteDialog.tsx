// PRD-11 US-021 · CreateInviteDialog · 单条邀请码创建模态
// AC-5: code(可选) / campaign dropdown / expiresAt date picker / quotaLimit

import { useState } from 'react';
import { adminTrpc } from '../../lib/admin-client';

interface Props {
  open: boolean;
  campaigns: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateInviteDialog({ open, campaigns, onClose, onSuccess }: Props) {
  const [code, setCode] = useState('');
  const [campaign, setCampaign] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [quotaLimit, setQuotaLimit] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const create = adminTrpc.inviteCodes.create.useMutation({
    onSuccess: () => {
      setCode('');
      setCampaign('');
      setExpiresAt('');
      setQuotaLimit(1);
      setError(null);
      onSuccess();
      onClose();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    create.mutate({
      code: code.trim() || undefined,
      campaign: campaign.trim() || undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      quotaLimit,
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="创建邀请码"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: 'var(--bg-panel, #111)',
          border: '1px solid var(--border, #2a2a2a)',
          borderRadius: 8,
          padding: '24px',
          minWidth: 380,
          maxWidth: 480,
          width: '100%',
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gold, #d4af37)', marginBottom: 20 }}>
          创建邀请码
        </div>

        <form onSubmit={handleSubmit}>
          <FieldRow label="邀请码（留空自动生成）">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="可选 · 最多32字符"
              maxLength={32}
              style={inputStyle}
            />
          </FieldRow>

          <FieldRow label="Campaign 分组">
            <select
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              style={inputStyle}
            >
              <option value="">不指定</option>
              {campaigns.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value="__custom">自定义...</option>
            </select>
            {campaign === '__custom' && (
              <input
                type="text"
                placeholder="输入 campaign 名称"
                style={{ ...inputStyle, marginTop: 6 }}
                onChange={(e) => setCampaign(e.target.value)}
              />
            )}
          </FieldRow>

          <FieldRow label="过期时间">
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              style={inputStyle}
            />
          </FieldRow>

          <FieldRow label="配额限制">
            <input
              type="number"
              min={1}
              value={quotaLimit}
              onChange={(e) => setQuotaLimit(Math.max(1, parseInt(e.target.value, 10) || 1))}
              style={{ ...inputStyle, width: 80 }}
            />
          </FieldRow>

          {error && (
            <div style={{ color: 'var(--status-err, #ef4444)', fontSize: 12, marginBottom: 12 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>
              取消
            </button>
            <button type="submit" disabled={create.isPending} style={submitBtnStyle}>
              {create.isPending ? '创建中…' : '确认创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted, #888)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg, #0a0a0a)',
  border: '1px solid var(--border, #2a2a2a)',
  color: 'var(--text, #e0e0e0)',
  padding: '6px 10px',
  borderRadius: 4,
  fontSize: 13,
  boxSizing: 'border-box',
};

const cancelBtnStyle: React.CSSProperties = {
  background: 'none',
  border: '1px solid var(--border, #2a2a2a)',
  color: 'var(--text-muted, #888)',
  padding: '7px 16px',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 13,
};

const submitBtnStyle: React.CSSProperties = {
  background: 'var(--gold, #d4af37)',
  border: 'none',
  color: '#000',
  padding: '7px 16px',
  borderRadius: 4,
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: 13,
};
