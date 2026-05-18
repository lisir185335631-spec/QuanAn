// PRD-11 US-021 · BatchImportDialog · CSV 批量导入 + 进度条 + 错误列表
// AC-6: 文件选 + 进度条 + 第N行错跳过显示

import { useRef, useState } from 'react';
import { adminTrpc } from '../../lib/admin-client';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ImportResult = {
  imported: number;
  errors: Array<{ row: number; code: string; reason: string }>;
};

export function BatchImportDialog({ open, onClose, onSuccess }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [csvData, setCsvData] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const batchImport = adminTrpc.inviteCodes.batchImport.useMutation({
    onSuccess: (data) => {
      setResult(data);
      if (data.errors.length === 0) {
        onSuccess();
      }
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  if (!open) return null;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    setError(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === 'string') setCsvData(text);
    };
    reader.readAsText(file, 'utf-8');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!csvData) {
      setError('请先选择 CSV 文件');
      return;
    }
    setError(null);
    setResult(null);
    batchImport.mutate({ csvData });
  }

  function handleDone() {
    setCsvData('');
    setFileName('');
    setResult(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = '';
    onSuccess();
    onClose();
  }

  const isImporting = batchImport.isPending;
  const progress = isImporting ? undefined : result ? 100 : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="批量导入邀请码"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => { if (e.target === e.currentTarget && !isImporting) onClose(); }}
    >
      <div
        style={{
          background: 'var(--bg-panel, #111)',
          border: '1px solid var(--border, #2a2a2a)',
          borderRadius: 8,
          padding: '24px',
          minWidth: 420,
          maxWidth: 560,
          width: '100%',
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gold, #d4af37)', marginBottom: 16 }}>
          批量导入邀请码 CSV
        </div>

        <div style={{ fontSize: 11, color: 'var(--text-muted, #888)', marginBottom: 14, lineHeight: 1.7 }}>
          CSV 必须包含列头: <code style={{ color: 'var(--text, #e0e0e0)', background: 'var(--bg, #0a0a0a)', padding: '0 4px', borderRadius: 2 }}>code</code>
          (必填) · <code style={{ color: 'var(--text, #e0e0e0)', background: 'var(--bg, #0a0a0a)', padding: '0 4px', borderRadius: 2 }}>campaign</code>
          · <code style={{ color: 'var(--text, #e0e0e0)', background: 'var(--bg, #0a0a0a)', padding: '0 4px', borderRadius: 2 }}>expiresAt</code>
          · <code style={{ color: 'var(--text, #e0e0e0)', background: 'var(--bg, #0a0a0a)', padding: '0 4px', borderRadius: 2 }}>quotaLimit</code>
          · 最多 10,000 行
        </div>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              border: '1px dashed var(--border, #2a2a2a)',
              borderRadius: 6,
              padding: '16px',
              marginBottom: 14,
              textAlign: 'center',
              cursor: 'pointer',
            }}
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            {fileName ? (
              <div style={{ color: 'var(--text, #e0e0e0)', fontSize: 13 }}>
                📄 {fileName}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted, #888)', fontSize: 13 }}>
                点击选择 CSV 文件 · 或拖放至此
              </div>
            )}
          </div>

          {/* Progress bar */}
          {(isImporting || result) && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ height: 4, background: 'var(--bg, #0a0a0a)', borderRadius: 2, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: isImporting ? '60%' : `${progress ?? 0}%`,
                    background: 'var(--gold, #d4af37)',
                    transition: 'width 0.3s ease',
                    ...(isImporting ? { animation: 'pulse 1s infinite' } : {}),
                  }}
                />
              </div>
              {isImporting && (
                <div style={{ fontSize: 11, color: 'var(--text-muted, #888)', marginTop: 6 }}>
                  正在导入中…
                </div>
              )}
            </div>
          )}

          {/* Result summary */}
          {result && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: 'var(--status-ok, #4caf50)', marginBottom: 6 }}>
                ✓ 成功导入 {result.imported} 条
                {result.errors.length > 0 && (
                  <span style={{ color: 'var(--status-warn, #ff9800)', marginLeft: 8 }}>
                    · {result.errors.length} 行跳过
                  </span>
                )}
              </div>

              {result.errors.length > 0 && (
                <div
                  style={{
                    background: 'var(--bg, #0a0a0a)',
                    border: '1px solid var(--border, #2a2a2a)',
                    borderRadius: 4,
                    padding: '8px 10px',
                    maxHeight: 160,
                    overflowY: 'auto',
                  }}
                >
                  <div style={{ fontSize: 11, color: 'var(--text-muted, #888)', marginBottom: 6 }}>跳过明细:</div>
                  {result.errors.map((err) => (
                    <div key={`${err.row}-${err.code}`} style={{ fontSize: 11, color: 'var(--status-err, #ef4444)', marginBottom: 2 }}>
                      第 {err.row} 行 {err.code ? `[${err.code}]` : ''} · {err.reason}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <div style={{ color: 'var(--status-err, #ef4444)', fontSize: 12, marginBottom: 12 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            {result ? (
              <button type="button" onClick={handleDone} style={submitBtnStyle}>
                完成
              </button>
            ) : (
              <>
                <button type="button" onClick={onClose} disabled={isImporting} style={cancelBtnStyle}>
                  取消
                </button>
                <button type="submit" disabled={!csvData || isImporting} style={submitBtnStyle}>
                  {isImporting ? '导入中…' : '开始导入'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

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
