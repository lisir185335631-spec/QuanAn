// PRD-11 US-021 · 邀请码管理 UI page
// AC-1: 主页面 · 替换 placeholder
// AC-2: 顶部数字卡片(待激活/转化率/campaign 数)
// AC-3: 操作栏 [创建] + [批量导入 CSV] + [导出]
// AC-4: DenseTable 列表(分页+筛选 status/campaign · 排序)
// AC-5: CreateInviteDialog 单条创建
// AC-6: BatchImportDialog CSV 批量导入
// AC-7: campaign Tab + CampaignFunnelChart
// AC-8: InviteDetailDrawer 点邀请码 → 抽屉
// AC-10: 列表空显示 '暂无邀请码 · 点击创建'

import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DenseTable } from '@quanan/ui/admin';
import type { DenseTableColumn } from '@quanan/ui/admin';

import { adminTrpc } from '../../lib/admin-client';
import { BatchImportDialog } from './BatchImportDialog';
import { CampaignFunnelChart } from './CampaignFunnelChart';
import { CreateInviteDialog } from './CreateInviteDialog';
import { InviteDetailDrawer } from './InviteDetailDrawer';

// ── Types ─────────────────────────────────────────────────────────────────────

type InviteRow = {
  id: number;
  code: string;
  isActive: boolean;
  maxUses: number;
  usedCount: number;
  expiresAt: Date | string | null;
  campaign: string | null;
  notes: string | null;
  createdAt: Date | string;
  usedAt: Date | string | null;
  usedById: number | null;
};

type StatusFilter = 'active' | 'inactive' | 'used' | 'expired' | '';
type ActiveTab = 'list' | 'campaigns';

// ── Overview stat card ─────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  loading,
  color,
}: {
  label: string;
  value: number | string;
  loading: boolean;
  color?: string;
}) {
  return (
    <div
      style={{
        background: 'var(--bg-panel, #111)',
        border: '1px solid var(--border, #2a2a2a)',
        borderRadius: 6,
        padding: '14px 16px',
        minWidth: 120,
      }}
    >
      <div
        style={{
          color: 'var(--text-muted, #888)',
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: color ?? 'var(--gold, #d4af37)',
          lineHeight: 1,
        }}
      >
        {loading ? '—' : value}
      </div>
    </div>
  );
}

// ── Page btn ──────────────────────────────────────────────────────────────────

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
        border: '1px solid var(--border, #2a2a2a)',
        color: disabled ? 'var(--text-dim, #444)' : 'var(--text, #e0e0e0)',
        padding: '3px 10px',
        borderRadius: 3,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 12,
      }}
    >
      {label}
    </button>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ row }: { row: InviteRow }) {
  const now = new Date();
  const expired = row.expiresAt && new Date(row.expiresAt) < now;
  const used = row.usedAt !== null;

  let label = '有效';
  let color = 'var(--status-ok, #4caf50)';

  if (!row.isActive) {
    label = '已失效';
    color = 'var(--status-err, #ef4444)';
  } else if (used) {
    label = '已使用';
    color = 'var(--text-muted, #888)';
  } else if (expired) {
    label = '已过期';
    color = 'var(--status-warn, #ff9800)';
  }

  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        color,
        border: `1px solid ${color}44`,
        padding: '1px 5px',
        borderRadius: 3,
      }}
    >
      {label}
    </span>
  );
}

// ── Campaign Tab content ──────────────────────────────────────────────────────

function CampaignTabContent({ campaigns }: { campaigns: string[] }) {
  const [selected, setSelected] = useState<string>(campaigns[0] ?? '');

  if (campaigns.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted, #888)', fontSize: 13, padding: '24px 0', textAlign: 'center' }}>
        暂无 Campaign 数据
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 16 }}>
      {/* Campaign list */}
      <div
        style={{
          width: 200,
          flexShrink: 0,
          borderRight: '1px solid var(--border, #2a2a2a)',
          paddingRight: 16,
        }}
      >
        {campaigns.map((c) => (
          <div
            key={c}
            onClick={() => setSelected(c)}
            style={{
              padding: '8px 10px',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 13,
              marginBottom: 2,
              background: selected === c ? 'var(--bg-hover, #1a1a1a)' : 'none',
              color: selected === c ? 'var(--gold, #d4af37)' : 'var(--text, #e0e0e0)',
              borderLeft: selected === c ? '2px solid var(--gold, #d4af37)' : '2px solid transparent',
            }}
          >
            {c}
          </div>
        ))}
      </div>

      {/* Funnel chart */}
      <div style={{ flex: 1 }}>
        {selected ? (
          <>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-muted, #888)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: 12,
              }}
            >
              {selected} · 转化漏斗
            </div>
            <CampaignFunnelChart campaignKey={selected} />
          </>
        ) : (
          <div style={{ color: 'var(--text-muted, #888)', fontSize: 13 }}>选择左侧 campaign 查看漏斗</div>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function InvitesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const search = searchParams.get('search') ?? '';
  const statusFilter = (searchParams.get('status') ?? '') as StatusFilter;
  const campaignFilter = searchParams.get('campaign') ?? '';

  const [activeTab, setActiveTab] = useState<ActiveTab>('list');
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showBatchDialog, setShowBatchDialog] = useState(false);

  const listQuery = adminTrpc.inviteCodes.list.useQuery(
    {
      page,
      pageSize: 20,
      search: search || undefined,
      statusFilter: statusFilter || undefined,
      campaignFilter: campaignFilter || undefined,
    },
    { staleTime: 30_000 },
  );

  const utils = adminTrpc.useUtils();

  const rows: InviteRow[] = useMemo(
    () => (listQuery.data?.codes ?? []) as InviteRow[],
    [listQuery.data],
  );

  const totalCount = listQuery.data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / 20));

  // Derive campaigns list from rows
  const campaigns = useMemo(() => {
    const seen = new Set<string>();
    rows.forEach((r) => { if (r.campaign) seen.add(r.campaign); });
    return Array.from(seen).sort();
  }, [rows]);

  // Overview stats derived from list data
  const pendingCount = rows.filter((r) => r.isActive && !r.usedAt).length;
  const usedCount = rows.filter((r) => r.usedAt !== null).length;
  const conversionRate = rows.length > 0 ? Math.round((usedCount / rows.length) * 100) : 0;

  const handleRefresh = useCallback(() => {
    void utils.inviteCodes.list.invalidate();
  }, [utils]);

  function setParam(updates: Record<string, string | undefined>) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === undefined || v === '') next.delete(k);
        else next.set(k, v);
      }
      return next;
    });
  }

  function handleExport() {
    const codes = rows.map((r) => [
      r.code,
      r.campaign ?? '',
      r.isActive ? '有效' : '失效',
      String(r.usedCount),
      String(r.maxUses),
      r.expiresAt ? new Date(r.expiresAt).toISOString() : '',
    ]);
    const header = ['code', 'campaign', 'status', 'usedCount', 'maxUses', 'expiresAt'];
    const csv = [header, ...codes].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invites-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // DenseTable columns
  const columns: DenseTableColumn<InviteRow>[] = [
    {
      key: 'code',
      label: '邀请码',
      width: '180px',
      render: (row) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--gold, #d4af37)' }}>
          {row.code}
        </span>
      ),
    },
    {
      key: 'status',
      label: '状态',
      width: '80px',
      render: (row) => <StatusBadge row={row} />,
    },
    {
      key: 'campaign',
      label: 'Campaign',
      width: '120px',
      render: (row) => (
        <span style={{ color: row.campaign ? 'var(--text, #e0e0e0)' : 'var(--text-muted, #888)', fontSize: 12 }}>
          {row.campaign ?? '—'}
        </span>
      ),
    },
    {
      key: 'quota',
      label: '配额',
      width: '80px',
      render: (row) => (
        <span style={{ fontSize: 12, color: 'var(--text-muted, #888)' }}>
          {row.usedCount}/{row.maxUses}
        </span>
      ),
    },
    {
      key: 'expiresAt',
      label: '过期时间',
      width: '140px',
      render: (row) => (
        <span style={{ fontSize: 11, color: 'var(--text-muted, #888)' }}>
          {row.expiresAt ? new Date(row.expiresAt).toLocaleDateString('zh-CN') : '永久'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: '创建时间',
      width: '140px',
      render: (row) => (
        <span style={{ fontSize: 11, color: 'var(--text-muted, #888)' }}>
          {new Date(row.createdAt).toLocaleDateString('zh-CN')}
        </span>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px 24px', color: 'var(--text, #e0e0e0)' }}>
      {/* Page title */}
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold, #d4af37)', marginBottom: 20 }}>
        🎫 邀请码管理
      </div>

      {/* Overview stat cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <StatCard label="待激活" value={pendingCount} loading={listQuery.isLoading} color="var(--gold, #d4af37)" />
        <StatCard label="转化率" value={`${conversionRate}%`} loading={listQuery.isLoading} color="var(--status-ok, #4caf50)" />
        <StatCard label="Campaign 数" value={campaigns.length} loading={listQuery.isLoading} color="var(--accent-purple, #7c4dff)" />
        <StatCard label="总计" value={totalCount} loading={listQuery.isLoading} color="var(--text-muted, #888)" />
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border, #2a2a2a)', marginBottom: 16 }}>
        {(['list', 'campaigns'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--gold, #d4af37)' : '2px solid transparent',
              color: activeTab === tab ? 'var(--gold, #d4af37)' : 'var(--text-muted, #888)',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: activeTab === tab ? 600 : 400,
            }}
          >
            {tab === 'list' ? '邀请码列表' : 'Campaign 分析'}
          </button>
        ))}
      </div>

      {activeTab === 'list' && (
        <>
          {/* Filter + action bar */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 12,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              placeholder="搜索邀请码 / campaign"
              value={search}
              onChange={(e) => setParam({ search: e.target.value, page: '1' })}
              style={{
                background: 'var(--bg, #0a0a0a)',
                border: '1px solid var(--border, #2a2a2a)',
                color: 'var(--text, #e0e0e0)',
                padding: '5px 10px',
                borderRadius: 4,
                fontSize: 13,
                width: 220,
              }}
            />

            <select
              value={statusFilter}
              onChange={(e) => setParam({ status: e.target.value, page: '1' })}
              style={{
                background: 'var(--bg, #0a0a0a)',
                border: '1px solid var(--border, #2a2a2a)',
                color: 'var(--text, #e0e0e0)',
                padding: '5px 8px',
                borderRadius: 4,
                fontSize: 13,
              }}
            >
              <option value="">全部状态</option>
              <option value="active">有效</option>
              <option value="used">已使用</option>
              <option value="inactive">已失效</option>
              <option value="expired">已过期</option>
            </select>

            <select
              value={campaignFilter}
              onChange={(e) => setParam({ campaign: e.target.value, page: '1' })}
              style={{
                background: 'var(--bg, #0a0a0a)',
                border: '1px solid var(--border, #2a2a2a)',
                color: 'var(--text, #e0e0e0)',
                padding: '5px 8px',
                borderRadius: 4,
                fontSize: 13,
              }}
            >
              <option value="">全部 Campaign</option>
              {campaigns.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <div style={{ flex: 1 }} />

            <button
              type="button"
              onClick={() => setShowCreateDialog(true)}
              style={{
                background: 'var(--gold, #d4af37)',
                border: 'none',
                color: '#000',
                padding: '6px 14px',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              + 创建
            </button>

            <button
              type="button"
              onClick={() => setShowBatchDialog(true)}
              style={{
                background: 'none',
                border: '1px solid var(--border, #2a2a2a)',
                color: 'var(--text, #e0e0e0)',
                padding: '6px 14px',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              批量导入 CSV
            </button>

            <button
              type="button"
              onClick={handleExport}
              style={{
                background: 'none',
                border: '1px solid var(--border, #2a2a2a)',
                color: 'var(--text, #e0e0e0)',
                padding: '6px 14px',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              导出
            </button>
          </div>

          {/* DenseTable */}
          <div
            style={{
              background: 'var(--bg-panel, #111)',
              border: '1px solid var(--border, #2a2a2a)',
              borderRadius: 6,
              overflow: 'hidden',
            }}
          >
            {listQuery.isError ? (
              <div style={{ padding: '24px', color: 'var(--status-err, #ef4444)', fontSize: 13, textAlign: 'center' }}>
                数据加载失败 · <button type="button" onClick={() => void listQuery.refetch()} style={{ background: 'none', border: 'none', color: 'var(--gold, #d4af37)', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: 13 }}>重试</button>
              </div>
            ) : (
              <DenseTable
                columns={columns}
                data={rows}
                loading={listQuery.isLoading}
                onRowClick={(row) => setSelectedCode(row.code)}
                selectedKey={selectedCode ?? undefined}
              />
            )}
          </div>

          {/* Pagination */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 12,
              justifyContent: 'flex-end',
              fontSize: 12,
              color: 'var(--text-muted, #888)',
            }}
          >
            <PageBtn label="‹" disabled={page <= 1} onClick={() => setParam({ page: String(page - 1) })} />
            <span>第 {page} / {totalPages} 页 · 共 {totalCount} 条</span>
            <PageBtn label="›" disabled={page >= totalPages} onClick={() => setParam({ page: String(page + 1) })} />
          </div>
        </>
      )}

      {activeTab === 'campaigns' && (
        <div
          style={{
            background: 'var(--bg-panel, #111)',
            border: '1px solid var(--border, #2a2a2a)',
            borderRadius: 6,
            padding: '16px',
          }}
        >
          <CampaignTabContent campaigns={campaigns} />
        </div>
      )}

      {/* Dialogs */}
      <CreateInviteDialog
        open={showCreateDialog}
        campaigns={campaigns}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={handleRefresh}
      />

      <BatchImportDialog
        open={showBatchDialog}
        onClose={() => setShowBatchDialog(false)}
        onSuccess={handleRefresh}
      />

      {/* Detail Drawer */}
      <InviteDetailDrawer
        code={selectedCode}
        onClose={() => setSelectedCode(null)}
      />
    </div>
  );
}
