// PRD-13 US-011 · Approval Gates · /admin/approvals
// AC-1: admin-routes.ts /approvals · sidebar='Approval Gates' · requiredRole='admin'
// AC-2: 4 KPI 卡片 · 待审批数 / 平均审批时长 / 拒绝率 / 紧急 SLA 达成率
// AC-3: DenseTable 待审批列表 · riskLevel 排序 · displayStatus
// AC-9: Tab 切换 · 待审批 / 历史决策 / 后置复核 (super_admin only)
// AC-12: agent-browser 验证 (运行时)
// SHIELD: 30s polling via setInterval (anti-pattern: not WebSocket)

import { useCallback, useEffect, useState } from 'react';

import { adminTrpc } from '../../lib/admin-client';
import { DenseTable } from '@quanan/ui/admin';
import type { DenseTableColumn } from '@quanan/ui/admin';
import type { ApprovalRow } from './ApprovalDetailDrawer';
import { ApprovalDetailDrawer } from './ApprovalDetailDrawer';

// ── Types ─────────────────────────────────────────────────────────────────

type Tab = 'pending' | 'decided' | 'postReview';

// ── Helpers ───────────────────────────────────────────────────────────────

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  return new Date(String(d)).toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

function riskColor(r: string): string {
  if (r === 'high' || r === 'critical') return '#ef4444';
  if (r === 'medium') return '#f59e0b';
  return '#6b7280';
}

function statusLabel(s: string): { text: string; color: string } {
  switch (s) {
    case 'pending': return { text: '待审批', color: '#f59e0b' };
    case 'first_approved': return { text: '第一审批通过', color: '#22c55e' };
    case 'approved': return { text: '已批准', color: '#22c55e' };
    case 'rejected': return { text: '已拒绝', color: '#ef4444' };
    case 'expired': return { text: '已过期', color: '#6b7280' };
    default: return { text: s, color: 'var(--text-muted)' };
  }
}

function actionTypeLabel(t: string): string {
  const m: Record<string, string> = {
    force_rebuild_evolution: '强制重建进化档案',
    publish_prompt: '发布 Prompt',
    rollback_prompt: '回滚 Prompt',
    adjust_quota: '配额调整',
    whitelist_user: '用户白名单',
    ban_uploader: '封禁上传者',
    template_modify: '模板变更',
    cross_account_batch: '跨账号批量',
    evolution_anomaly_resolve: '异常解决',
    quota_adjust_small: '小额配额调整',
    prompt_canary_adjust: 'Canary 调整',
  };
  return m[t] ?? t;
}

// ── KPI Card ──────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
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
      <div style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6, fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ color: accent ?? 'var(--gold)', fontSize: 26, fontWeight: 700, lineHeight: 1 }}>{value}</span>
        {sub && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{sub}</span>}
      </div>
    </div>
  );
}

// ── ExpiryProgress ────────────────────────────────────────────────────────

function ExpiryProgress({ createdAt, expiresAt }: { createdAt: Date | string; expiresAt: Date | string }) {
  const created = new Date(String(createdAt)).getTime();
  const expires = new Date(String(expiresAt)).getTime();
  const now = Date.now();
  const total = expires - created;
  const elapsed = now - created;
  const pct = Math.min(100, Math.max(0, (elapsed / total) * 100));
  const remaining = Math.max(0, expires - now);
  const remainingHours = (remaining / 3_600_000).toFixed(1);

  return (
    <div style={{ width: 80 }}>
      <div style={{ height: 4, background: 'var(--bg-hover)', borderRadius: 2, overflow: 'hidden' }}>
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: pct > 75 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#22c55e',
            borderRadius: 2,
            transition: 'width 0.3s',
          }}
        />
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, textAlign: 'center' }}>
        {remainingHours}h 剩
      </div>
    </div>
  );
}

// ── ApprovalGatesPage ─────────────────────────────────────────────────────

export default function ApprovalGatesPage() {
  const { data: me } = adminTrpc.auth.me.useQuery();
  const currentAdminId = me?.id ?? 0;
  const role = me?.role;

  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [selected, setSelected] = useState<ApprovalRow | null>(null);

  // KPI — 30s polling
  const { data: kpi, refetch: refetchKpi } = adminTrpc.approvals.getKpiStats.useQuery(undefined, {
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const utils = adminTrpc.useUtils();

  // ── Pending list ──────────────────────────────────────────────────────

  const [pendingItems, setPendingItems] = useState<ApprovalRow[]>([]);
  const [pendingCursor, setPendingCursor] = useState<number | undefined>(undefined);
  const [pendingHasMore, setPendingHasMore] = useState(false);
  const [pendingLoading, setPendingLoading] = useState(false);

  const fetchPending = useCallback(async (cursor?: number) => {
    setPendingLoading(true);
    try {
      const result = await utils.approvals.listPending.fetch({ limit: 20, cursor });
      const rows = result.items as ApprovalRow[];
      if (cursor) {
        setPendingItems((prev) => [...prev, ...rows]);
      } else {
        setPendingItems(rows);
      }
      setPendingCursor(result.nextCursor);
      setPendingHasMore(result.nextCursor !== undefined);
    } finally {
      setPendingLoading(false);
    }
  }, [utils]);

  // ── Decided list ──────────────────────────────────────────────────────

  const [decidedItems, setDecidedItems] = useState<ApprovalRow[]>([]);
  const [decidedCursor, setDecidedCursor] = useState<number | undefined>(undefined);
  const [decidedHasMore, setDecidedHasMore] = useState(false);
  const [decidedLoading, setDecidedLoading] = useState(false);

  const fetchDecided = useCallback(async (cursor?: number) => {
    setDecidedLoading(true);
    try {
      const result = await utils.approvals.listDecided.fetch({ limit: 20, cursor });
      const rows = result.items as ApprovalRow[];
      if (cursor) {
        setDecidedItems((prev) => [...prev, ...rows]);
      } else {
        setDecidedItems(rows);
      }
      setDecidedCursor(result.nextCursor);
      setDecidedHasMore(result.nextCursor !== undefined);
    } finally {
      setDecidedLoading(false);
    }
  }, [utils]);

  // ── Post review list (super_admin only) ───────────────────────────────

  const { data: postReviewItems, refetch: refetchPostReview } =
    adminTrpc.approvals.listPostReview.useQuery(undefined, {
      enabled: role === 'super_admin',
      staleTime: 30_000,
    });

  // ── Initial load + polling ─────────────────────────────────────────────

  useEffect(() => {
    void fetchPending(undefined);
    void fetchDecided(undefined);
  }, [fetchPending, fetchDecided]);

  useEffect(() => {
    const interval = setInterval(() => {
      void fetchPending(undefined);
      void refetchKpi();
    }, 30_000);
    return () => clearInterval(interval);
  }, [fetchPending, refetchKpi]);

  function handleRefresh() {
    void fetchPending(undefined);
    void fetchDecided(undefined);
    void refetchKpi();
    if (role === 'super_admin') void refetchPostReview();
    setSelected(null);
  }

  // ── Pending table columns ─────────────────────────────────────────────

  const pendingColumns: DenseTableColumn<ApprovalRow>[] = [
    {
      key: 'id',
      label: '申请 ID',
      width: '70px',
      render: (r) => (
        <span style={{ color: 'var(--gold)', fontWeight: 600, fontSize: 12 }}>#{r.id}</span>
      ),
    },
    {
      key: 'actionType',
      label: '操作类型',
      render: (r) => (
        <span style={{ fontSize: 12 }}>{actionTypeLabel(r.actionType)}</span>
      ),
    },
    {
      key: 'requester',
      label: '申请人',
      render: (r) => (
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {r.requesterEmail ?? `Admin#${r.requesterAdminId}`}
        </span>
      ),
    },
    {
      key: 'riskLevel',
      label: '风险',
      width: '70px',
      render: (r) => (
        <span
          style={{
            fontSize: 11,
            padding: '2px 5px',
            borderRadius: 3,
            background: `${riskColor(r.riskLevel)}22`,
            color: riskColor(r.riskLevel),
            fontWeight: 600,
          }}
        >
          {r.riskLevel.toUpperCase()}
        </span>
      ),
    },
    {
      key: 'dual',
      label: 'Dual',
      width: '50px',
      render: (r) => (
        <span style={{ fontSize: 11, color: r.requireDualApproval ? '#22c55e' : 'var(--text-muted)' }}>
          {r.requireDualApproval ? 'Y' : 'N'}
        </span>
      ),
    },
    {
      key: 'emergency',
      label: '紧急',
      width: '70px',
      render: (r) =>
        r.emergencyMode ? (
          <span
            style={{
              fontSize: 10,
              padding: '2px 5px',
              borderRadius: 3,
              background: 'rgba(239,68,68,0.15)',
              color: '#ef4444',
              fontWeight: 700,
            }}
          >
            EMERGENCY
          </span>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>
        ),
    },
    {
      key: 'status',
      label: '状态',
      width: '100px',
      render: (r) => {
        const s = statusLabel(r.displayStatus);
        return (
          <span style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.text}</span>
        );
      },
    },
    {
      key: 'expiry',
      label: '到期',
      width: '90px',
      render: (r) => <ExpiryProgress createdAt={r.createdAt} expiresAt={r.expiresAt} />,
    },
  ];

  // ── Decided table columns ─────────────────────────────────────────────

  const decidedColumns: DenseTableColumn<ApprovalRow>[] = [
    {
      key: 'id',
      label: '申请 ID',
      width: '70px',
      render: (r) => <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>#{r.id}</span>,
    },
    {
      key: 'actionType',
      label: '操作类型',
      render: (r) => <span style={{ fontSize: 12 }}>{actionTypeLabel(r.actionType)}</span>,
    },
    {
      key: 'riskLevel',
      label: '风险',
      width: '70px',
      render: (r) => (
        <span style={{ fontSize: 11, color: riskColor(r.riskLevel) }}>
          {r.riskLevel.toUpperCase()}
        </span>
      ),
    },
    {
      key: 'status',
      label: '状态',
      width: '80px',
      render: (r) => {
        const s = statusLabel(r.displayStatus);
        return <span style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.text}</span>;
      },
    },
    {
      key: 'approver',
      label: '审批人',
      render: (r) => (
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {r.firstApproverEmail ?? (r.approverAdminId ? `Admin#${r.approverAdminId}` : '—')}
        </span>
      ),
    },
    {
      key: 'decidedAt',
      label: '决策时间',
      width: '100px',
      render: (r) => (
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtDate(r.decidedAt)}</span>
      ),
    },
    {
      key: 'emergency',
      label: '紧急',
      width: '60px',
      render: (r) =>
        r.emergencyMode ? (
          <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 700 }}>EMRG</span>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>
        ),
    },
  ];

  // ── Post review table columns ─────────────────────────────────────────

  type PostReviewRow = NonNullable<typeof postReviewItems>[number];

  const postReviewColumns: DenseTableColumn<PostReviewRow>[] = [
    { key: 'id', label: '申请 ID', width: '70px', render: (r) => <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>#{r.id}</span> },
    { key: 'actionType', label: '操作类型', render: (r) => <span style={{ fontSize: 12 }}>{actionTypeLabel(r.actionType)}</span> },
    { key: 'decidedAt', label: '批准时间', width: '100px', render: (r) => <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtDate(r.decidedAt)}</span> },
    {
      key: 'approver',
      label: '批准人',
      render: (r) => <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.firstApproverEmail ?? (r.approverAdminId != null ? `Admin#${r.approverAdminId}` : '—')}</span>,
    },
  ];

  // ── Tabs ──────────────────────────────────────────────────────────────

  const tabs: Array<{ id: Tab; label: string; count?: number }> = [
    { id: 'pending', label: '待审批', count: kpi?.pendingCount },
    { id: 'decided', label: '历史决策', count: decidedItems.length },
    ...(role === 'super_admin'
      ? [{ id: 'postReview' as Tab, label: '后置复核', count: postReviewItems?.length ?? 0 }]
      : []),
  ];

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1200 }}>
      {/* Page title */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ color: 'var(--gold)', fontSize: 18, fontWeight: 700, margin: 0 }}>
          🛡️ Approval Gates
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '4px 0 0' }}>
          待审批列表 · 历史决策 · 紧急通道 · 后置复核
        </p>
      </div>

      {/* AC-2: 4 KPI Cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <KpiCard
          label="待审批"
          value={String(kpi?.pendingCount ?? 0)}
          sub="我可审批的"
          accent={kpi?.pendingCount ? '#f59e0b' : undefined}
        />
        <KpiCard
          label="平均审批时长"
          value={kpi?.avgDecisionTimeHours != null ? `${kpi.avgDecisionTimeHours}h` : '—'}
          sub="近 30 天"
        />
        <KpiCard
          label="拒绝率"
          value={`${kpi?.rejectionRate ?? 0}%`}
          sub="近 30 天"
          accent={kpi && kpi.rejectionRate > 30 ? '#ef4444' : undefined}
        />
        <KpiCard
          label="紧急 SLA 达成率"
          value={`${kpi?.emergencySlaRate ?? 100}%`}
          sub="< 1h 决策"
          accent={kpi && kpi.emergencySlaRate < 80 ? '#ef4444' : '#22c55e'}
        />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '1px solid var(--border)' }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === t.id ? '2px solid var(--gold)' : '2px solid transparent',
              color: activeTab === t.id ? 'var(--gold)' : 'var(--text-muted)',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: activeTab === t.id ? 700 : 400,
              marginBottom: -1,
            }}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span
                style={{
                  marginLeft: 6,
                  background: t.id === 'pending' ? '#f59e0b' : 'var(--bg-hover)',
                  color: t.id === 'pending' ? '#fff' : 'var(--text-muted)',
                  borderRadius: 10,
                  fontSize: 10,
                  padding: '1px 6px',
                  fontWeight: 700,
                }}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* AC-3: Pending tab */}
      {activeTab === 'pending' && (
        <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 6 }}>
          {pendingItems.length === 0 && !pendingLoading ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>✅</div>
              暂无待审批申请
            </div>
          ) : (
            <>
              <DenseTable
                columns={pendingColumns}
                data={pendingItems}
                loading={pendingLoading && pendingItems.length === 0}
                maxHeight="calc(100vh - 420px)"
                onRowClick={(row) => setSelected(row as ApprovalRow)}
                selectedKey={selected?.id ?? undefined}
                getRowKey={(row) => row.id}
              />
              {pendingHasMore && (
                <div style={{ padding: 10, textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => void fetchPending(pendingCursor)}
                    disabled={pendingLoading}
                    style={{
                      background: 'var(--bg-hover)', border: '1px solid var(--border)',
                      color: 'var(--text-muted)', padding: '6px 20px', borderRadius: 4,
                      cursor: pendingLoading ? 'not-allowed' : 'pointer', fontSize: 12,
                    }}
                  >
                    {pendingLoading ? '加载中…' : '加载更多'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* AC-9: Decided tab */}
      {activeTab === 'decided' && (
        <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 6 }}>
          {decidedItems.length === 0 && !decidedLoading ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>📋</div>
              暂无历史决策
            </div>
          ) : (
            <>
              <DenseTable
                columns={decidedColumns}
                data={decidedItems}
                loading={decidedLoading && decidedItems.length === 0}
                maxHeight="calc(100vh - 420px)"
                onRowClick={(row) => setSelected(row as ApprovalRow)}
                selectedKey={selected?.id ?? undefined}
                getRowKey={(row) => row.id}
              />
              {decidedHasMore && (
                <div style={{ padding: 10, textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => void fetchDecided(decidedCursor)}
                    disabled={decidedLoading}
                    style={{
                      background: 'var(--bg-hover)', border: '1px solid var(--border)',
                      color: 'var(--text-muted)', padding: '6px 20px', borderRadius: 4,
                      cursor: decidedLoading ? 'not-allowed' : 'pointer', fontSize: 12,
                    }}
                  >
                    {decidedLoading ? '加载中…' : '加载更多'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* AC-10: Post review tab (super_admin only) */}
      {activeTab === 'postReview' && role === 'super_admin' && (
        <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 6 }}>
          {!postReviewItems || postReviewItems.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>✅</div>
              无待复核的紧急审批
            </div>
          ) : (
            <DenseTable
              columns={postReviewColumns}
              data={postReviewItems as PostReviewRow[]}
              maxHeight="calc(100vh - 420px)"
              onRowClick={(row) => setSelected(row as unknown as ApprovalRow)}
              selectedKey={selected?.id ?? undefined}
              getRowKey={(row) => row.id}
            />
          )}
        </div>
      )}

      {/* Detail Drawer */}
      <ApprovalDetailDrawer
        selected={selected}
        currentAdminId={currentAdminId}
        currentRole={role}
        onClose={() => setSelected(null)}
        onRefresh={handleRefresh}
      />
    </div>
  );
}
