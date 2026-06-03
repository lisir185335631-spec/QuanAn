// PRD-29 · DiagnosisPage · /admin/diagnosis
// KPI 卡一排 + 报告列表表格 + 行展开看维度分/问题/建议
// 暗金视觉风格 (admin 标准 var(--gold) / var(--bg-panel) / var(--border))
// SHIELD: adminTrpc.diagnosis.list/detail/kpiStats — no mock data

import { useState } from 'react';

import { adminTrpc } from '../../lib/admin-client';

// ── Types ─────────────────────────────────────────────────────────────────────

type ListItem = {
  id: number;
  accountId: number;
  overallScore: number;
  inferredStage: string;
  topPriority: string;
  agentId: string;
  isFallback: boolean;
  modelUsed: string | null;
  tokensUsed: number | null;
  createdAt: string; // tRPC JSON 传输为 ISO string
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 80) return '#86efac'; // green
  if (score >= 60) return '#fcd34d'; // yellow
  return '#fca5a5'; // red
}

function fmtDate(d: Date | string): string {
  return new Date(String(d)).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: '14px 16px',
        flex: 1,
        minWidth: 150,
      }}
    >
      <div
        style={{
          color: 'var(--text-muted)',
          fontSize: 11,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          marginBottom: 6,
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ color: 'var(--gold)', fontSize: 26, fontWeight: 700, lineHeight: 1 }}>
          {value}
        </span>
        {sub && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{sub}</span>}
      </div>
    </div>
  );
}

// ── Detail Drawer ─────────────────────────────────────────────────────────────

function DetailDrawer({
  reportId,
  onClose,
}: {
  reportId: number;
  onClose: () => void;
}) {
  const { data, isLoading, isError } = adminTrpc.diagnosis.detail.useQuery(
    { id: reportId },
    { staleTime: 60_000 },
  );

  const dimensions = data?.dimensions as Record<string, unknown> | null | undefined;
  const answers = data?.answers as unknown[] | null | undefined;
  const steps = data?.recommendedSteps ?? [];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: 480,
        height: '100vh',
        background: 'var(--bg-panel)',
        borderLeft: '1px solid var(--border)',
        zIndex: 1000,
        overflowY: 'auto',
        padding: 24,
        boxShadow: '-4px 0 24px rgba(0,0,0,0.4)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          paddingBottom: 12,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 14 }}>
          🩺 报告详情 #{reportId}
        </span>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            padding: '3px 10px',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          关闭
        </button>
      </div>

      {isLoading && (
        <div style={{ color: 'var(--text-dim)', fontSize: 12, padding: 16 }}>加载中...</div>
      )}
      {isError && (
        <div style={{ color: '#fca5a5', fontSize: 12, padding: 16 }}>加载失败</div>
      )}

      {data && (
        <>
          {/* Meta */}
          <div style={{ marginBottom: 20 }}>
            <MetaRow label="账号 ID" value={String(data.accountId)} />
            <MetaRow label="总分" value={String(data.overallScore)} highlight />
            <MetaRow label="阶段" value={data.inferredStage} />
            <MetaRow label="模型" value={data.modelUsed ?? '—'} />
            <MetaRow label="Tokens" value={data.tokensUsed !== null ? String(data.tokensUsed) : '—'} />
            <MetaRow label="耗时" value={data.durationMs !== null ? `${data.durationMs} ms` : '—'} />
            <MetaRow label="Fallback" value={data.isFallback ? '是' : '否'} />
            {data.traceId && <MetaRow label="Trace ID" value={data.traceId} mono />}
            <MetaRow label="创建时间" value={fmtDate(data.createdAt)} />
          </div>

          {/* Top Priority */}
          <Section title="首要任务">
            <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0, lineHeight: 1.7 }}>
              {data.topPriority}
            </p>
          </Section>

          {/* Dimensions */}
          {dimensions && typeof dimensions === 'object' && (
            <Section title="维度评分">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <tbody>
                  {Object.entries(dimensions).map(([dim, val]) => (
                    <tr key={dim} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '6px 0', color: 'var(--text-muted)' }}>{dim}</td>
                      <td
                        style={{
                          padding: '6px 0',
                          textAlign: 'right',
                          color: typeof val === 'number' ? scoreColor(val) : 'var(--text-dim)',
                          fontWeight: 600,
                        }}
                      >
                        {typeof val === 'object' && val !== null
                          ? JSON.stringify(val)
                          : String(val)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          {/* Recommended Steps */}
          {steps.length > 0 && (
            <Section title="建议步骤">
              <ol style={{ margin: 0, paddingLeft: 18 }}>
                {steps.map((step, i) => (
                  <li
                    key={i}
                    style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 6, lineHeight: 1.6 }}
                  >
                    {step}
                  </li>
                ))}
              </ol>
            </Section>
          )}

          {/* Answers (raw JSON) */}
          {answers !== null && answers !== undefined && (
            <Section title="问卷答案">
              <pre
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  padding: '8px 10px',
                  fontSize: 11,
                  color: 'var(--text-dim)',
                  overflowX: 'auto',
                  margin: 0,
                  maxHeight: 200,
                  overflowY: 'auto',
                }}
              >
                {JSON.stringify(answers, null, 2)}
              </pre>
            </Section>
          )}
        </>
      )}
    </div>
  );
}

function MetaRow({
  label,
  value,
  highlight,
  mono,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  mono?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '5px 0',
        borderBottom: '1px solid var(--border)',
        fontSize: 12,
      }}
    >
      <span style={{ color: 'var(--text-dim)' }}>{label}</span>
      <span
        style={{
          color: highlight ? 'var(--gold)' : 'var(--text-muted)',
          fontWeight: highlight ? 700 : 400,
          fontFamily: mono ? 'monospace' : undefined,
          fontSize: mono ? 11 : undefined,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--text-dim)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 8,
          paddingBottom: 4,
          borderBottom: '1px solid var(--border)',
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

// ── Page Btn ──────────────────────────────────────────────────────────────────

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

// ── DiagnosisPage ─────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

export default function DiagnosisPage() {
  const [page, setPage] = useState(1);
  const [accountIdFilter, setAccountIdFilter] = useState('');
  const [minScore, setMinScore] = useState('');
  const [maxScore, setMaxScore] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const accountIdParsed = accountIdFilter ? parseInt(accountIdFilter, 10) : undefined;
  const minScoreParsed = minScore ? parseInt(minScore, 10) : undefined;
  const maxScoreParsed = maxScore ? parseInt(maxScore, 10) : undefined;

  const { data: kpi, isLoading: kpiLoading } = adminTrpc.diagnosis.kpiStats.useQuery(undefined, {
    staleTime: 30_000,
  });

  const {
    data: listData,
    isLoading,
    isError,
    refetch,
  } = adminTrpc.diagnosis.list.useQuery(
    {
      page,
      pageSize: PAGE_SIZE,
      accountId: accountIdParsed,
      minScore: minScoreParsed,
      maxScore: maxScoreParsed,
    },
    { staleTime: 30_000 },
  );

  const items = (listData?.items ?? []) as ListItem[];
  const total = listData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function applyFilter() {
    // 只重置 page; query key 随 state 变化自动重 fetch
    setPage(1);
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Overlay backdrop when drawer is open */}
      {selectedId !== null && (
        <div
          onClick={() => setSelectedId(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 999,
          }}
        />
      )}

      {/* Detail Drawer */}
      {selectedId !== null && (
        <DetailDrawer reportId={selectedId} onClose={() => setSelectedId(null)} />
      )}

      {/* Page Header */}
      <div
        style={{
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--gold)' }}>
          🩺 诊断报告
        </h1>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
          DiagnosisAgent 全账号报告 · 共 {total.toLocaleString()} 份
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

      {/* KPI Cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {kpiLoading ? (
          <div style={{ color: 'var(--text-dim)', fontSize: 12 }}>KPI 加载中...</div>
        ) : (
          <>
            <KpiCard label="总报告数" value={(kpi?.total ?? 0).toLocaleString()} />
            <KpiCard
              label="7 天新增"
              value={(kpi?.recentCount ?? 0).toLocaleString()}
              sub="份"
            />
            <KpiCard
              label="平均总分"
              value={kpi?.avgScore !== undefined ? String(kpi.avgScore) : '—'}
              sub="/ 100"
            />
            <KpiCard
              label="Fallback 占比"
              value={kpi?.fallbackRate !== undefined ? `${kpi.fallbackRate}%` : '—'}
            />
          </>
        )}
      </div>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          marginBottom: 14,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: 12, color: 'var(--text-dim)' }}>账号 ID</label>
          <input
            type="number"
            value={accountIdFilter}
            onChange={(e) => setAccountIdFilter(e.target.value)}
            placeholder="留空=全部"
            style={{
              width: 100,
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              borderRadius: 4,
              padding: '4px 8px',
              fontSize: 12,
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: 12, color: 'var(--text-dim)' }}>最低分</label>
          <input
            type="number"
            value={minScore}
            onChange={(e) => setMinScore(e.target.value)}
            placeholder="0–100"
            min={0}
            max={100}
            style={{
              width: 80,
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              borderRadius: 4,
              padding: '4px 8px',
              fontSize: 12,
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: 12, color: 'var(--text-dim)' }}>最高分</label>
          <input
            type="number"
            value={maxScore}
            onChange={(e) => setMaxScore(e.target.value)}
            placeholder="0–100"
            min={0}
            max={100}
            style={{
              width: 80,
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              borderRadius: 4,
              padding: '4px 8px',
              fontSize: 12,
            }}
          />
        </div>
        <button
          type="button"
          onClick={applyFilter}
          style={{
            background: 'var(--gold)',
            border: 'none',
            color: '#000',
            padding: '5px 14px',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          筛选
        </button>
        <button
          type="button"
          onClick={() => {
            setAccountIdFilter('');
            setMinScore('');
            setMaxScore('');
            setPage(1);
          }}
          style={{
            background: 'none',
            border: '1px solid var(--border)',
            color: 'var(--text-dim)',
            padding: '5px 10px',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          重置
        </button>
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
                {['ID', '账号 ID', '总分', '阶段', '首要任务', '模型', 'Tokens', 'Fallback', '时间'].map(
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
              {items.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => setSelectedId(row.id)}
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
                    {row.id}
                  </td>
                  <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>
                    {row.accountId}
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{ color: scoreColor(row.overallScore), fontWeight: 700 }}>
                      {row.overallScore}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: '8px 10px',
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {row.inferredStage}
                  </td>
                  <td
                    style={{
                      padding: '8px 10px',
                      color: 'var(--text-dim)',
                      maxWidth: 200,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={row.topPriority}
                  >
                    {row.topPriority}
                  </td>
                  <td
                    style={{
                      padding: '8px 10px',
                      color: 'var(--text-dim)',
                      fontFamily: 'monospace',
                      fontSize: 11,
                    }}
                  >
                    {row.modelUsed ?? '—'}
                  </td>
                  <td style={{ padding: '8px 10px', color: 'var(--text-dim)' }}>
                    {row.tokensUsed !== null ? row.tokensUsed.toLocaleString() : '—'}
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    {row.isFallback ? (
                      <span style={{ color: '#fca5a5', fontWeight: 600 }}>是</span>
                    ) : (
                      <span style={{ color: 'var(--text-dim)' }}>否</span>
                    )}
                  </td>
                  <td
                    style={{
                      padding: '8px 10px',
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {fmtDate(row.createdAt)}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    style={{ padding: 32, textAlign: 'center', color: 'var(--text-dim)' }}
                  >
                    暂无诊断报告
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
          <PageBtn
            label="← 上页"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          />
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
