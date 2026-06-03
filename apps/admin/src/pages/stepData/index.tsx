// PRD-29 · StepDataPage · /admin/step-data
// KPI 卡 + 列表表格(账号/stepKey/状态/模型/tokens/fallback/时间) + stepKey 过滤下拉
// 点开 detail 抽屉(看 inputs + result JSON,可折叠/格式化)
// 暗金视觉风格 (admin 标准 var(--gold) / var(--bg-panel) / var(--border))
// SHIELD: adminTrpc.stepData.list/detail/kpiStats — no mock data

import { useState } from 'react';

import { adminTrpc } from '../../lib/admin-client';

// ── Types ─────────────────────────────────────────────────────────────────────

type ListItem = {
  id: number;
  accountId: number;
  stepKey: string;
  status: string;
  agentId: string;
  isFallback: boolean;
  modelUsed: string | null;
  tokensUsed: number | null;
  durationMs: number | null;
  updatedAt: string; // tRPC JSON 传输为 ISO string
};

// ── Constants ─────────────────────────────────────────────────────────────────

const STEP_KEY_OPTIONS = [
  '',
  'step1',
  'step3',
  'step3b',
  'step4',
  'step4b',
  'step5',
  'step6',
  'step7',
  'step8',
  'step9',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: Date | string): string {
  return new Date(String(d)).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusColor(status: string): string {
  if (status === 'completed') return '#86efac';
  if (status === 'failed') return '#fca5a5';
  if (status === 'pending') return '#fcd34d';
  return 'var(--text-dim)';
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

// ── JSON Section (collapsible) ────────────────────────────────────────────────

function JsonSection({ title, data }: { title: string; data: unknown }) {
  const [collapsed, setCollapsed] = useState(false);

  if (data === null || data === undefined) return null;

  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--text-dim)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 6,
          paddingBottom: 4,
          borderBottom: '1px solid var(--border)',
          cursor: 'pointer',
        }}
        onClick={() => setCollapsed((c) => !c)}
      >
        <span>{title}</span>
        <span style={{ fontSize: 10 }}>{collapsed ? '▶ 展开' : '▼ 收起'}</span>
      </div>
      {!collapsed && (
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
            maxHeight: 300,
            overflowY: 'auto',
          }}
        >
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

// ── Detail Drawer ─────────────────────────────────────────────────────────────

function DetailDrawer({ recordId, onClose }: { recordId: number; onClose: () => void }) {
  const { data, isLoading, isError } = adminTrpc.stepData.detail.useQuery(
    { id: recordId },
    { staleTime: 60_000 },
  );

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: 520,
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
          📝 StepData #{recordId}
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
            <MetaRow label="StepKey" value={data.stepKey} highlight />
            <MetaRow label="状态" value={data.status} />
            <MetaRow label="Agent ID" value={data.agentId} mono />
            <MetaRow label="模型" value={data.modelUsed ?? '—'} />
            <MetaRow label="Tokens" value={data.tokensUsed !== null ? String(data.tokensUsed) : '—'} />
            <MetaRow label="耗时" value={data.durationMs !== null ? `${data.durationMs} ms` : '—'} />
            <MetaRow label="Fallback" value={data.isFallback ? '是' : '否'} />
            {data.traceId && <MetaRow label="Trace ID" value={data.traceId} mono />}
            <MetaRow label="更新时间" value={fmtDate(data.updatedAt)} />
            <MetaRow label="创建时间" value={fmtDate(data.createdAt)} />
          </div>

          {/* inputs JSON (collapsible) */}
          <JsonSection title="Inputs" data={data.inputs} />

          {/* result JSON (collapsible) */}
          <JsonSection title="Result" data={data.result} />
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

// ── StepDataPage ──────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

export default function StepDataPage() {
  const [page, setPage] = useState(1);
  const [accountIdFilter, setAccountIdFilter] = useState('');
  const [stepKeyFilter, setStepKeyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const accountIdParsed = accountIdFilter ? parseInt(accountIdFilter, 10) : undefined;

  const { data: kpi, isLoading: kpiLoading } = adminTrpc.stepData.kpiStats.useQuery(undefined, {
    staleTime: 30_000,
  });

  const {
    data: listData,
    isLoading,
    isError,
    refetch,
  } = adminTrpc.stepData.list.useQuery(
    {
      page,
      pageSize: PAGE_SIZE,
      accountId: accountIdParsed,
      stepKey: stepKeyFilter || undefined,
      status: statusFilter || undefined,
    },
    { staleTime: 30_000 },
  );

  const items = (listData?.items ?? []) as ListItem[];
  const total = listData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function applyFilter() {
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
        <DetailDrawer recordId={selectedId} onClose={() => setSelectedId(null)} />
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
          📝 用户内容 (StepData)
        </h1>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
          用户生成内容管理 · step 类页面共用 · 共 {total.toLocaleString()} 条记录
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
            <KpiCard label="总条数" value={(kpi?.total ?? 0).toLocaleString()} />
            <KpiCard
              label="7 天新增"
              value={(kpi?.recentCount ?? 0).toLocaleString()}
              sub="条"
            />
            <KpiCard
              label="Fallback 占比"
              value={kpi?.fallbackRate !== undefined ? `${kpi.fallbackRate}%` : '—'}
            />
            <KpiCard
              label="平均 Tokens"
              value={kpi?.avgTokens !== undefined ? kpi.avgTokens.toLocaleString() : '—'}
            />
            {kpi?.stepKeyDistribution && (
              <div
                style={{
                  background: 'var(--bg-panel)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '14px 16px',
                  flex: 2,
                  minWidth: 200,
                }}
              >
                <div
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: 11,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    marginBottom: 8,
                    fontWeight: 600,
                  }}
                >
                  StepKey 分布
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {Object.entries(kpi.stepKeyDistribution).map(([key, count]) => (
                    <span
                      key={key}
                      style={{
                        background: 'var(--bg)',
                        border: '1px solid var(--border)',
                        borderRadius: 4,
                        padding: '2px 8px',
                        fontSize: 11,
                        color: 'var(--text-muted)',
                      }}
                    >
                      {key}: <strong style={{ color: 'var(--gold)' }}>{count}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}
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
          <label style={{ fontSize: 12, color: 'var(--text-dim)' }}>StepKey</label>
          <select
            value={stepKeyFilter}
            onChange={(e) => setStepKeyFilter(e.target.value)}
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              borderRadius: 4,
              padding: '4px 8px',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            {STEP_KEY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt === '' ? '全部' : opt}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: 12, color: 'var(--text-dim)' }}>状态</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              borderRadius: 4,
              padding: '4px 8px',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            <option value="">全部</option>
            <option value="completed">completed</option>
            <option value="pending">pending</option>
            <option value="failed">failed</option>
          </select>
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
            setStepKeyFilter('');
            setStatusFilter('');
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
                {['ID', '账号 ID', 'StepKey', '状态', '模型', 'Tokens', '耗时', 'Fallback', '更新时间'].map(
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
                    <span
                      style={{
                        background: 'var(--bg)',
                        border: '1px solid var(--border)',
                        borderRadius: 3,
                        padding: '1px 6px',
                        color: 'var(--gold)',
                        fontFamily: 'monospace',
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {row.stepKey}
                    </span>
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{ color: statusColor(row.status), fontWeight: 600 }}>
                      {row.status}
                    </span>
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
                  <td style={{ padding: '8px 10px', color: 'var(--text-dim)' }}>
                    {row.durationMs !== null ? `${row.durationMs} ms` : '—'}
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
                    {fmtDate(row.updatedAt)}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    style={{ padding: 32, textAlign: 'center', color: 'var(--text-dim)' }}
                  >
                    暂无用户内容记录
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
