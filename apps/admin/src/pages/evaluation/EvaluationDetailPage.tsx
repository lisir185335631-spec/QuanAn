// PRD-28 US-006 AC-2 · EvaluationDetailPage · 单 run 详情 + 矩阵热力图
// PRD-28 US-007 AC-6 · +Inter-rater agreement 子区域
import { useState } from 'react';

import { useNavigate, useParams } from 'react-router-dom';

import { adminTrpc } from '../../lib/admin-client';
import { EvaluationMatrixChart } from './EvaluationMatrixChart';
import { SampleDetailDrawer } from './SampleDetailDrawer';

const PAGE_SIZE = 50;

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

type SampleRow = {
  id: number;
  goldenId: string;
  specialistId: string;
  mode: string | null;
  structurePass: boolean;
  judgeScore: number;
  judgePass: boolean;
  judgeReason: string;
  costUsd: string | number;
  durationMs: number;
};

export default function EvaluationDetailPage() {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [selectedSample, setSelectedSample] = useState<SampleRow | null>(null);
  const [showMatrix, setShowMatrix] = useState(true);

  const { data: run, isLoading: runLoading } = adminTrpc.evaluation.getRun.useQuery(
    { runId: runId ?? '' },
    { enabled: !!runId },
  );

  const { data: samplesData, isLoading: samplesLoading } =
    adminTrpc.evaluation.listSamples.useQuery(
      { runId: runId ?? '', page, pageSize: PAGE_SIZE },
      { enabled: !!runId },
    );

  // Fetch all samples for matrix (page 1, large limit)
  const { data: allSamplesData } = adminTrpc.evaluation.listSamples.useQuery(
    { runId: runId ?? '', page: 1, pageSize: 100 },
    { enabled: !!runId },
  );

  const samples = samplesData?.items ?? [];
  const totalCount = samplesData?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const matrixSamples = (allSamplesData?.items ?? []) as SampleRow[];

  if (!runId) return <div style={{ color: 'var(--text-dim)', padding: 24 }}>runId 缺失</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={() => navigate('/admin/evaluation')}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              padding: '4px 10px',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            ← 返回列表
          </button>
          <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--gold)' }}>
            📊 Evaluation Run 详情
          </h1>
        </div>
        {runLoading && (
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>加载中...</div>
        )}
        {run && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            {run.runId} · {run.status} · 共 {run.totalSamples} 条 · 通过{' '}
            {run.passedSamples} · avgScore{' '}
            {run.avgScore !== null ? Number(run.avgScore).toFixed(2) : '—'}
          </div>
        )}
      </div>

      {/* Matrix section */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          padding: 16,
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>
            Specialist × Mode 评分矩阵
          </span>
          <button
            type="button"
            onClick={() => setShowMatrix((v) => !v)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-dim)',
              fontSize: 12,
            }}
          >
            {showMatrix ? '收起' : '展开'}
          </button>
        </div>
        {showMatrix && <EvaluationMatrixChart samples={matrixSamples} />}
      </div>

      {/* Sample list */}
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10 }}>
        样本列表 ({totalCount})
      </div>

      {samplesLoading && (
        <div style={{ color: 'var(--text-dim)', fontSize: 12, padding: 16 }}>加载中...</div>
      )}

      {!samplesLoading && (
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 12,
            }}
          >
            <thead>
              <tr>
                {['Golden ID', 'Specialist', 'Mode', 'Structure', 'Judge Score', 'Pass'].map(
                  (col) => (
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
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {samples.map((s: unknown) => {
                const row = s as SampleRow;
                return (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedSample(row)}
                    style={{
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border)',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.background =
                        'var(--bg-card)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.background = 'transparent';
                    }}
                  >
                    <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>
                      {row.goldenId}
                    </td>
                    <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>
                      {row.specialistId.replace('Agent', '')}
                    </td>
                    <td style={{ padding: '8px 10px', color: 'var(--text-dim)' }}>
                      {row.mode ?? 'default'}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      {row.structurePass ? (
                        <span style={{ color: '#86efac' }}>✅</span>
                      ) : (
                        <span style={{ color: '#fca5a5' }}>❌</span>
                      )}
                    </td>
                    <td style={{ padding: '8px 10px', color: 'var(--gold)', fontWeight: 600 }}>
                      {row.judgeScore}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      {row.judgePass ? (
                        <span style={{ color: '#86efac' }}>Pass</span>
                      ) : (
                        <span style={{ color: '#fca5a5' }}>Fail</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {samples.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    style={{ padding: 24, textAlign: 'center', color: 'var(--text-dim)' }}
                  >
                    暂无样本
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

      {/* Inter-rater agreement subregion (AC-6) */}
      <InterRaterSection runId={runId} />

      {/* Sample detail drawer */}
      <SampleDetailDrawer sample={selectedSample} onClose={() => setSelectedSample(null)} />
    </div>
  );
}

// ── Inter-rater Agreement section ────────────────────────────────────────────
function InterRaterSection({ runId }: { runId: string }) {
  const navigate = useNavigate();

  const { data: subsetData } = adminTrpc.evaluation.listInterRaterSubset.useQuery(
    { runId },
    { retry: false },
  );

  const totalRated = subsetData
    ? (subsetData.samples as Array<{ humanScore: number | null }>).filter(
        (s) => s.humanScore !== null,
      ).length
    : null;
  const totalSubset = subsetData?.totalSubset ?? 30;
  const allDone = totalRated !== null && totalRated >= totalSubset && totalSubset > 0;

  const { data: agreement } = adminTrpc.evaluation.computeAgreement.useQuery(
    { runId },
    { enabled: allDone, retry: false },
  );

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: 16,
        marginBottom: 20,
        marginTop: 4,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>
          Inter-rater agreement
        </span>
        <button
          type="button"
          onClick={() => navigate(`/admin/evaluation/inter-rater/${runId}`)}
          style={{
            background: 'none',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            padding: '3px 10px',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 11,
          }}
        >
          手工评分 →
        </button>
      </div>

      {totalRated === null ? (
        <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>加载中...</div>
      ) : allDone && agreement ? (
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 12 }}>
          <div>
            <span style={{ color: 'var(--text-dim)' }}>κ: </span>
            <span
              style={{
                color: agreement.kappa >= 0.4 ? '#86efac' : '#fca5a5',
                fontWeight: 700,
              }}
            >
              {agreement.kappa.toFixed(3)}
            </span>
          </div>
          <div>
            <span style={{ color: 'var(--text-dim)' }}>Pearson r: </span>
            <span style={{ color: 'var(--gold)', fontWeight: 700 }}>
              {agreement.pearson.toFixed(3)}
            </span>
          </div>
          <div>
            <span style={{ color: 'var(--text-dim)' }}>interpretation: </span>
            <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              {agreement.interpretation}
            </span>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
          {totalRated}/{totalSubset} 评完
        </div>
      )}
    </div>
  );
}
