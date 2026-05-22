// PRD-28 US-006 AC-1 · EvaluationPage · evaluation_runs 历史列表
// 分页 20 · 列 runId/startedAt/status/totalSamples/passedSamples/avgScore/totalCostUsd
// 点 row 跳 /admin/evaluation/:runId
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { adminTrpc } from '../../lib/admin-client';

const PAGE_SIZE = 20;

function statusColor(status: string): string {
  if (status === 'completed') return '#86efac';
  if (status === 'running') return '#fcd34d';
  return '#fca5a5';
}

function PageBtn({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        background: 'none',
        border: '1px solid var(--border)',
        color: disabled ? 'var(--text-dim)' : 'var(--text-muted)',
        padding: '5px 12px',
        borderRadius: 4,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 12,
      }}
    >
      {label}
    </button>
  );
}

type RunRow = {
  runId: string;
  startedAt: Date | string;
  finishedAt?: Date | string | null;
  status: string;
  totalSamples: number;
  passedSamples: number;
  avgScore: string | number | null;
  totalCostUsd: string | number;
};

export default function EvaluationPage() {
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = adminTrpc.evaluation.listRuns.useQuery(
    { page, pageSize: PAGE_SIZE },
    { staleTime: 30_000 },
  );

  const items = (data?.items ?? []) as RunRow[];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
        <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--gold)' }}>
          📊 Evaluation Runs
        </h1>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
          LLM Judge 评分历史 · 共 {totalCount.toLocaleString()} 次批跑
          <button
            type="button"
            onClick={() => void refetch()}
            style={{
              marginLeft: 12,
              background: 'none',
              border: '1px solid var(--border)',
              color: 'var(--text-dim)',
              padding: '2px 8px',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 11,
            }}
          >
            刷新
          </button>
        </div>
      </div>

      {/* Loading / Error */}
      {isLoading && (
        <div style={{ color: 'var(--text-dim)', fontSize: 12, padding: 16 }}>加载中...</div>
      )}
      {isError && (
        <div style={{ color: '#fca5a5', fontSize: 12, padding: 16 }}>
          加载失败 ·{' '}
          <button
            type="button"
            onClick={() => void refetch()}
            style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}
          >
            重试
          </button>
        </div>
      )}

      {/* Table */}
      {!isLoading && !isError && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {[
                  'Run ID',
                  '开始时间',
                  '状态',
                  '总样本',
                  '通过',
                  'Avg Score',
                  '费用 (USD)',
                ].map((col) => (
                  <th
                    key={col}
                    style={{
                      textAlign: 'left',
                      padding: '8px 10px',
                      color: 'var(--text-dim)',
                      fontWeight: 600,
                      borderBottom: '1px solid var(--border)',
                      whiteSpace: 'nowrap',
                      background: 'var(--bg)',
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((run) => (
                <tr
                  key={run.runId}
                  onClick={() => navigate(`/admin/evaluation/${run.runId}`)}
                  style={{ cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = 'var(--bg-card)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = 'transparent';
                  }}
                >
                  <td
                    style={{
                      padding: '8px 10px',
                      color: 'var(--gold)',
                      fontFamily: 'monospace',
                      fontSize: 11,
                    }}
                  >
                    {run.runId}
                  </td>
                  <td style={{ padding: '8px 10px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(run.startedAt).toLocaleString('zh-CN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{ color: statusColor(run.status), fontWeight: 600 }}>
                      {run.status}
                    </span>
                  </td>
                  <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>
                    {run.totalSamples}
                  </td>
                  <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>
                    {run.passedSamples}
                    {run.totalSamples > 0 && (
                      <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>
                        {' '}
                        ({Math.round((run.passedSamples / run.totalSamples) * 100)}%)
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '8px 10px', color: 'var(--gold)', fontWeight: 600 }}>
                    {run.avgScore !== null ? Number(run.avgScore).toFixed(2) : '—'}
                  </td>
                  <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>
                    ${Number(run.totalCostUsd).toFixed(4)}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    style={{ padding: 32, textAlign: 'center', color: 'var(--text-dim)' }}
                  >
                    暂无 evaluation run 记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            gap: 6,
            alignItems: 'center',
            justifyContent: 'flex-end',
            marginTop: 12,
          }}
        >
          <PageBtn label="← 上页" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)', padding: '0 8px' }}>
            {page} / {totalPages}
          </span>
          <PageBtn
            label="下页 →"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          />
        </div>
      )}
    </div>
  );
}
