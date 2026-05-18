// PRD-12 US-006 · BatchActionBar — 多选批量操作栏
// AC-1: max 100 前端 disabled · AC-5: 0 条 disabled

interface Props {
  selectedCount: number;
  onSelectAll: () => void;
  onClearAll: () => void;
  totalOnPage: number;
  onBatchApprove: () => void;
  onBatchReject: () => void;
  isPending: boolean;
}

export function BatchActionBar({
  selectedCount,
  onSelectAll,
  onClearAll,
  totalOnPage,
  onBatchApprove,
  onBatchReject,
  isPending,
}: Props) {
  const overLimit = selectedCount > 100;
  const actionDisabled = isPending || selectedCount === 0 || overLimit;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 12px',
        background: selectedCount > 0 ? 'rgba(200,168,75,0.08)' : 'var(--bg-panel)',
        border: `1px solid ${selectedCount > 0 ? 'rgba(200,168,75,0.3)' : 'var(--border)'}`,
        borderRadius: 6,
        marginBottom: 8,
        flexWrap: 'wrap',
        transition: 'background 0.2s, border-color 0.2s',
      }}
    >
      {/* Select-all / clear */}
      <button
        type="button"
        onClick={selectedCount === totalOnPage && totalOnPage > 0 ? onClearAll : onSelectAll}
        disabled={totalOnPage === 0}
        style={{
          background: 'none',
          border: '1px solid var(--border)',
          color: 'var(--text-muted)',
          padding: '4px 10px',
          borderRadius: 4,
          cursor: totalOnPage === 0 ? 'not-allowed' : 'pointer',
          fontSize: 11,
        }}
      >
        {selectedCount === totalOnPage && totalOnPage > 0 ? '取消全选' : '全选本页'}
      </button>

      {/* Count indicator */}
      <span
        style={{
          fontSize: 12,
          color: selectedCount > 0 ? 'var(--gold)' : 'var(--text-muted)',
          fontWeight: selectedCount > 0 ? 600 : 400,
          minWidth: 60,
        }}
      >
        {selectedCount > 0 ? `已选 ${selectedCount}` : '未选择'}
      </span>

      {/* Over-limit warning */}
      {overLimit && (
        <span style={{ fontSize: 11, color: 'var(--status-err)' }}>
          ⚠ 最多批量操作 100 条
        </span>
      )}

      <div style={{ flex: 1 }} />

      {/* Batch approve */}
      <button
        type="button"
        onClick={onBatchApprove}
        disabled={actionDisabled}
        style={{
          background: actionDisabled ? 'var(--bg-hover)' : 'rgba(34,197,94,0.15)',
          border: '1px solid rgba(34,197,94,0.4)',
          color: actionDisabled ? 'var(--text-dim)' : '#22c55e',
          padding: '5px 14px',
          borderRadius: 4,
          cursor: actionDisabled ? 'not-allowed' : 'pointer',
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        {isPending ? '处理中…' : '✓ 批量批准'}
      </button>

      {/* Batch reject */}
      <button
        type="button"
        onClick={onBatchReject}
        disabled={actionDisabled}
        style={{
          background: actionDisabled ? 'var(--bg-hover)' : 'rgba(239,68,68,0.15)',
          border: '1px solid rgba(239,68,68,0.4)',
          color: actionDisabled ? 'var(--text-dim)' : '#ef4444',
          padding: '5px 14px',
          borderRadius: 4,
          cursor: actionDisabled ? 'not-allowed' : 'pointer',
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        ✗ 批量驳回
      </button>
    </div>
  );
}
