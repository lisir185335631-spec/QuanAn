// PRD-29 · TopicsPage · /admin/topics
// KPI 卡 + 列表表格(账号/title/sourceType/category/platform/时间) + 过滤区
// 过滤采用 committed 模式：所有项存"草稿 state"，点「筛选」后才同步查询 state + reset page=1
// 点开 detail 抽屉(title/hook/category/platform, <pre> 带 maxHeight+overflow 防大内容卡死)
// 暗金视觉风格 (admin 标准 var(--gold) / var(--bg-panel) / var(--border))
// SHIELD: adminTrpc.topics.list/detail/kpiStats — no mock data
// SHIELD: React 插值天然转义防 XSS

import { useState } from 'react';

import { adminTrpc } from '../../lib/admin-client';

// ── Types ─────────────────────────────────────────────────────────────────────

type ListItem = {
  id: number;
  accountId: number;
  title: string;
  category: string | null;
  platform: string | null;
  sourceType: string;
  createdAt: string; // tRPC JSON 传输为 ISO string
};

// ── Constants ─────────────────────────────────────────────────────────────────

// TODO: 可改为从 kpiStats.sourceTypeDistribution 的 key 动态构建，避免漏新 sourceType；
// 目前硬编码覆盖已知值，若新增 sourceType 需同步更新此列表。
const SOURCE_TYPE_OPTIONS = [
  '',
  'manual',
  'ai_generated',
  'trending',
  'deep_learn',
  'knowledge',
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

function DetailDrawer({ recordId, onClose }: { recordId: number; onClose: () => void }) {
  const { data, isLoading, isError } = adminTrpc.topics.detail.useQuery(
    { id: recordId },
    { staleTime: 60_000 },
  );

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: 560,
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
          💡 选题详情 #{recordId}
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
            <MetaRow label="Title" value={data.title} highlight />
            <MetaRow label="分类 (category)" value={data.category ?? '—'} />
            <MetaRow label="平台 (platform)" value={data.platform ?? '—'} />
            <MetaRow label="来源类型 (sourceType)" value={data.sourceType} />
            <MetaRow label="难度 (difficulty)" value={data.difficulty ?? '—'} />
            <MetaRow label="病毒潜力" value={data.viralPotential ?? '—'} />
            <MetaRow label="逻辑类型" value={data.logicType ?? '—'} />
            <MetaRow label="呈现风格" value={data.presentStyle ?? '—'} />
            <MetaRow label="已使用" value={data.isUsed ? '是' : '否'} />
            {data.traceId && <MetaRow label="Trace ID" value={data.traceId} mono />}
            <MetaRow label="创建时间" value={fmtDate(data.createdAt)} />
          </div>

          {/* Hook — <pre> with maxHeight+overflow to prevent large content freeze */}
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 6,
                paddingBottom: 4,
                borderBottom: '1px solid var(--border)',
              }}
            >
              Hook
            </div>
            {/* React插值天然转义防XSS · maxHeight+overflow防大内容卡死 */}
            <pre
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 4,
                padding: '8px 10px',
                fontSize: 11,
                color: 'var(--text-dim)',
                overflowX: 'auto',
                overflowY: 'auto',
                maxHeight: 300,
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {data.hook}
            </pre>
          </div>

          {/* category display */}
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 6,
                paddingBottom: 4,
                borderBottom: '1px solid var(--border)',
              }}
            >
              Platform / Category
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {data.platform && (
                <span
                  style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 3,
                    padding: '2px 7px',
                    fontSize: 11,
                    color: 'var(--gold)',
                  }}
                >
                  {data.platform}
                </span>
              )}
              {data.category && (
                <span
                  style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 3,
                    padding: '2px 7px',
                    fontSize: 11,
                    color: 'var(--text-muted)',
                  }}
                >
                  {data.category}
                </span>
              )}
            </div>
          </div>

          {/* userTags */}
          {data.userTags.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--text-dim)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 6,
                }}
              >
                用户标签
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {data.userTags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 3,
                      padding: '2px 7px',
                      fontSize: 11,
                      color: 'var(--text-muted)',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
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

// ── TopicsPage ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

// ── Draft (uncommitted) filter state type ─────────────────────────────────────

type FilterDraft = {
  accountId: string;
  sourceType: string;
  category: string;
  platform: string;
  dateFrom: string;
  dateTo: string;
};

type FilterCommitted = {
  accountId: number | undefined;
  sourceType: string | undefined;
  category: string | undefined;
  platform: string | undefined;
  dateFrom: string | undefined;
  dateTo: string | undefined;
};

const EMPTY_DRAFT: FilterDraft = {
  accountId: '',
  sourceType: '',
  category: '',
  platform: '',
  dateFrom: '',
  dateTo: '',
};

function draftToCommitted(d: FilterDraft): FilterCommitted {
  // NaN guard: only pass accountId if it is a valid integer
  const raw = d.accountId ? parseInt(d.accountId, 10) : undefined;
  const accountId = raw !== undefined && Number.isInteger(raw) ? raw : undefined;
  return {
    accountId,
    sourceType: d.sourceType || undefined,
    category: d.category || undefined,
    platform: d.platform || undefined,
    dateFrom: d.dateFrom || undefined,
    dateTo: d.dateTo || undefined,
  };
}

export default function TopicsPage() {
  const [page, setPage] = useState(1);
  // Draft state: what the user is typing/selecting (not yet sent to tRPC)
  const [draft, setDraft] = useState<FilterDraft>(EMPTY_DRAFT);
  // Committed state: what is actually sent to tRPC (only updated on 「筛选」click)
  const [committed, setCommitted] = useState<FilterCommitted>(draftToCommitted(EMPTY_DRAFT));
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: kpi, isLoading: kpiLoading } = adminTrpc.topics.kpiStats.useQuery(undefined, {
    staleTime: 30_000,
  });

  const {
    data: listData,
    isLoading,
    isError,
    refetch,
  } = adminTrpc.topics.list.useQuery(
    {
      page,
      pageSize: PAGE_SIZE,
      accountId: committed.accountId,
      sourceType: committed.sourceType,
      category: committed.category,
      platform: committed.platform,
      dateFrom: committed.dateFrom,
      dateTo: committed.dateTo,
    },
    { staleTime: 30_000 },
  );

  const items = (listData?.items ?? []) as ListItem[];
  const total = listData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function applyFilter() {
    setCommitted(draftToCommitted(draft));
    setPage(1);
  }

  function resetFilter() {
    setDraft(EMPTY_DRAFT);
    setCommitted(draftToCommitted(EMPTY_DRAFT));
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
          💡 选题库 (Topics)
        </h1>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
          全账号 Topic 表(含 manual/ai_generated/trending 等全部来源) · 共 {total.toLocaleString()} 条记录
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

            {/* sourceType distribution */}
            {kpi?.sourceTypeDistribution && Object.keys(kpi.sourceTypeDistribution).length > 0 && (
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
                  来源类型分布
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {Object.entries(kpi.sourceTypeDistribution).map(([key, count]) => (
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

            {/* category distribution */}
            {kpi?.categoryDistribution && Object.keys(kpi.categoryDistribution).length > 0 && (
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
                  分类分布 (Category)
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {Object.entries(kpi.categoryDistribution).map(([key, count]) => (
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

      {/* Filters — committed 模式：所有项存草稿，点「筛选」才提交 */}
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
            value={draft.accountId}
            onChange={(e) => setDraft((d) => ({ ...d, accountId: e.target.value }))}
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
          <label style={{ fontSize: 12, color: 'var(--text-dim)' }}>来源类型</label>
          <select
            value={draft.sourceType}
            onChange={(e) => setDraft((d) => ({ ...d, sourceType: e.target.value }))}
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
            {SOURCE_TYPE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt === '' ? '全部' : opt}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: 12, color: 'var(--text-dim)' }}>Category</label>
          <input
            type="text"
            value={draft.category}
            onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
            placeholder="留空=全部"
            style={{
              width: 110,
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
          <label style={{ fontSize: 12, color: 'var(--text-dim)' }}>平台</label>
          <input
            type="text"
            value={draft.platform}
            onChange={(e) => setDraft((d) => ({ ...d, platform: e.target.value }))}
            placeholder="留空=全部"
            style={{
              width: 110,
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
          <label style={{ fontSize: 12, color: 'var(--text-dim)' }}>开始日期</label>
          <input
            type="date"
            value={draft.dateFrom}
            onChange={(e) => setDraft((d) => ({ ...d, dateFrom: e.target.value }))}
            style={{
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
          <label style={{ fontSize: 12, color: 'var(--text-dim)' }}>结束日期</label>
          <input
            type="date"
            value={draft.dateTo}
            onChange={(e) => setDraft((d) => ({ ...d, dateTo: e.target.value }))}
            style={{
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
          onClick={resetFilter}
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
                {['ID', '账号 ID', 'Title', '来源类型', '分类', '平台', '创建时间'].map(
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
                  <td
                    style={{
                      padding: '8px 10px',
                      color: 'var(--text-muted)',
                      maxWidth: 220,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={row.title}
                  >
                    {row.title}
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
                      {row.sourceType}
                    </span>
                  </td>
                  <td style={{ padding: '8px 10px', color: 'var(--text-dim)' }}>
                    {row.category ?? '—'}
                  </td>
                  <td style={{ padding: '8px 10px', color: 'var(--text-dim)' }}>
                    {row.platform ?? '—'}
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
                    colSpan={7}
                    style={{ padding: 32, textAlign: 'center', color: 'var(--text-dim)' }}
                  >
                    暂无选题记录
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
