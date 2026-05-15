// PRD-14 US-014 · 配置中心 /admin/feature-flags
// AC-1: admin-routes.ts /admin/feature-flags label='配置中心' emoji='⚙️' prd=14 requiredRole='admin'
// AC-2: 顶部 3 Tab + 第 4 Tab '后置复核'(super_admin only) + URL state useSearchParams
// AC-3: 紧急开关 Tab · DenseTable isEmergency=true · 1 click 触发
// AC-4: super_admin 弹 EmergencyTriggerModal · incidentId 必填 · toast
// AC-5: readonly_admin/admin 操作 disabled + tooltip
// AC-10: 顶部 4 KPI 卡片
// SHIELD: super_admin only 双层守护(UI disabled + service guardSuperAdmin)
// SHIELD: incidentId 客户端非空校验 + 服务端双校验

import { lazy, Suspense, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { adminTrpc } from '../../lib/admin-client';
import { DenseTable } from '@quanqn/ui/admin';
import type { DenseTableColumn } from '@quanqn/ui/admin';

// ── Lazy Monaco (复用 PRD-13 US-007 pattern) ─────────────────────────────────
// AC-8: EditConfigModal Monaco JSON editor(lazy import)

const MonacoEditorLazy = lazy(() =>
  import('../prompts/components/MonacoEditor').then((m) => ({ default: m.MonacoEditor })),
);

// ── Types ─────────────────────────────────────────────────────────────────

type TabId = 'emergency' | 'flags' | 'sysconfig' | 'postReview';

type EmergencyConfig = {
  id: number;
  configKey: string;
  configValue?: unknown;
  description: string | null;
  isEmergency: boolean;
  updatedByAdminId: number;
  updatedByEmail: string | null;
  updatedAt: Date | string;
};

type FeatureFlag = {
  id: number;
  flagKey: string;
  description: string | null;
  flagType: string;
  defaultValue?: unknown;
  rolloutConfig?: unknown;
  enabled: boolean;
  updatedByAdminId: number;
  updatedByEmail: string | null;
  updatedAt: Date | string;
};

type SystemConfig = {
  id: number;
  configKey: string;
  configValue?: unknown;
  description: string | null;
  isEmergency: boolean;
  updatedByAdminId: number;
  updatedByEmail: string | null;
  updatedAt: Date | string;
};

type PostReviewRow = {
  id: number;
  actionType: string;
  actionPayload?: unknown;
  decidedAt: Date | string | null;
  postReviewRequired: boolean;
  postReviewedAt: Date | string | null;
  approverAdminId: number | null;
  firstApproverEmail: string | null;
  requesterAdminId: number;
  requesterEmail: string | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  return new Date(String(d)).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function jsonStr(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'string') return v;
  return JSON.stringify(v);
}

// ── KPI Card ──────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
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
        <span
          style={{ color: accent ?? 'var(--gold)', fontSize: 26, fontWeight: 700, lineHeight: 1 }}
        >
          {value}
        </span>
        {sub && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{sub}</span>}
      </div>
    </div>
  );
}

// ── EmergencyTriggerModal ─────────────────────────────────────────────────

function EmergencyTriggerModal({
  configKey,
  onClose,
  onSuccess,
}: {
  configKey: string;
  onClose: () => void;
  onSuccess: (approvalRequestId: number) => void;
}) {
  const [incidentId, setIncidentId] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const emergencyToggle = adminTrpc.featureFlags.emergencyToggleSystemConfig.useMutation({
    onSuccess: (data) => {
      onSuccess(data.approvalRequestId);
    },
  });

  function handleSubmit() {
    if (!incidentId.trim()) {
      setError('incidentId 不能为空');
      return;
    }
    setError('');
    emergencyToggle.mutate({
      configKey: configKey as 'stop_trending_scraper' | 'stop_evolution_agent' | 'enable_fallback_prompt',
      incidentId: incidentId.trim(),
    });
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid #ef4444',
          borderRadius: 8,
          padding: 24,
          width: 440,
          maxWidth: '90vw',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{ color: '#ef4444', fontSize: 16, fontWeight: 700, marginBottom: 4 }}
        >
          ⚠️ 紧急触发 · {configKey}
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 16 }}>
          此操作会立即执行并激活 24h 后置复核。请填写事件编号和决策理由。
        </p>

        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 12, display: 'block', marginBottom: 4 }}>
            事件编号 (incidentId) <span style={{ color: '#ef4444' }}>*</span>
          </span>
          <input
            type="text"
            value={incidentId}
            onChange={(e) => setIncidentId(e.target.value)}
            placeholder="INCIDENT-2026-05-15-001"
            style={{
              width: '100%',
              background: 'var(--bg-input)',
              border: `1px solid ${error ? '#ef4444' : 'var(--border)'}`,
              borderRadius: 4,
              color: 'var(--text)',
              padding: '7px 10px',
              fontSize: 13,
              boxSizing: 'border-box',
            }}
          />
          {error && <span style={{ color: '#ef4444', fontSize: 11, marginTop: 3, display: 'block' }}>{error}</span>}
        </label>

        <label style={{ display: 'block', marginBottom: 16 }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 12, display: 'block', marginBottom: 4 }}>
            决策理由
          </span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              color: 'var(--text)',
              padding: '7px 10px',
              fontSize: 13,
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        </label>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'var(--bg-hover)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              padding: '7px 16px',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={emergencyToggle.isPending}
            style={{
              background: '#ef4444',
              border: 'none',
              color: '#fff',
              padding: '7px 16px',
              borderRadius: 4,
              cursor: emergencyToggle.isPending ? 'not-allowed' : 'pointer',
              fontSize: 13,
              fontWeight: 700,
              opacity: emergencyToggle.isPending ? 0.7 : 1,
            }}
          >
            {emergencyToggle.isPending ? '提交中…' : '确认紧急触发'}
          </button>
        </div>

        {emergencyToggle.isError && (
          <p style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>
            {emergencyToggle.error?.message ?? '操作失败，请重试'}
          </p>
        )}
      </div>
    </div>
  );
}

// ── EditFlagModal ─────────────────────────────────────────────────────────

function EditFlagModal({
  flag,
  onClose,
  onSuccess,
}: {
  flag: FeatureFlag;
  onClose: () => void;
  onSuccess: (approvalRequestId: number) => void;
}) {
  const [enabled, setEnabled] = useState(flag.enabled);
  const [rolloutConfigStr, setRolloutConfigStr] = useState(
    flag.rolloutConfig ? JSON.stringify(flag.rolloutConfig, null, 2) : '',
  );
  const [parseError, setParseError] = useState('');

  const toggleMutation = adminTrpc.featureFlags.toggle.useMutation({
    onSuccess: (data) => onSuccess(data.approvalRequestId),
  });

  function handleSubmit() {
    let rolloutConfig: unknown = undefined;
    if (rolloutConfigStr.trim()) {
      try {
        rolloutConfig = JSON.parse(rolloutConfigStr);
        setParseError('');
      } catch {
        setParseError('rolloutConfig JSON 格式错误');
        return;
      }
    }

    toggleMutation.mutate({
      flagKey: flag.flagKey,
      enabled,
      rolloutConfig: rolloutConfig as never,
    });
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: 24,
          width: 520,
          maxWidth: '90vw',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ color: 'var(--gold)', fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
          编辑 Feature Flag · {flag.flagKey}
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <span style={{ color: 'var(--text)', fontSize: 13 }}>
            {enabled ? '启用' : '禁用'}
          </span>
        </label>

        <div style={{ marginBottom: 16 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 6 }}>
            rolloutConfig (JSON · 可选)
          </div>
          <div style={{ height: 160, border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>
            <Suspense
              fallback={
                <div style={{ padding: 12, color: 'var(--text-muted)', fontSize: 13 }}>
                  加载编辑器…
                </div>
              }
            >
              <MonacoEditorLazy
                value={rolloutConfigStr}
                onChange={setRolloutConfigStr}
                language="json"
                height="160px"
              />
            </Suspense>
          </div>
          {parseError && (
            <p style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{parseError}</p>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'var(--bg-hover)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              padding: '7px 16px',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={toggleMutation.isPending}
            style={{
              background: 'var(--gold)',
              border: 'none',
              color: '#000',
              padding: '7px 16px',
              borderRadius: 4,
              cursor: toggleMutation.isPending ? 'not-allowed' : 'pointer',
              fontSize: 13,
              fontWeight: 700,
              opacity: toggleMutation.isPending ? 0.7 : 1,
            }}
          >
            {toggleMutation.isPending ? '提交中…' : '提交审批'}
          </button>
        </div>

        {toggleMutation.isError && (
          <p style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>
            {toggleMutation.error?.message ?? '操作失败'}
          </p>
        )}
      </div>
    </div>
  );
}

// ── EditConfigModal ───────────────────────────────────────────────────────

function EditConfigModal({
  config,
  onClose,
  onSuccess,
}: {
  config: SystemConfig;
  onClose: () => void;
  onSuccess: (approvalRequestId: number) => void;
}) {
  const [configValueStr, setConfigValueStr] = useState(
    JSON.stringify(config.configValue, null, 2),
  );
  const [parseError, setParseError] = useState('');

  const updateMutation = adminTrpc.featureFlags.updateSystemConfig.useMutation({
    onSuccess: (data) => onSuccess(data.approvalRequestId),
  });

  function handleSubmit() {
    let configValue: unknown;
    try {
      configValue = JSON.parse(configValueStr);
      setParseError('');
    } catch {
      setParseError('configValue JSON 格式错误');
      return;
    }

    updateMutation.mutate({ configKey: config.configKey, configValue });
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: 24,
          width: 560,
          maxWidth: '90vw',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ color: 'var(--gold)', fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
          编辑系统配置 · {config.configKey}
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 6 }}>
            configValue (JSON)
          </div>
          <div style={{ height: 200, border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>
            <Suspense
              fallback={
                <div style={{ padding: 12, color: 'var(--text-muted)', fontSize: 13 }}>
                  加载编辑器…
                </div>
              }
            >
              <MonacoEditorLazy
                value={configValueStr}
                onChange={setConfigValueStr}
                language="json"
                height="200px"
              />
            </Suspense>
          </div>
          {parseError && (
            <p style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{parseError}</p>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'var(--bg-hover)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              padding: '7px 16px',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
            style={{
              background: 'var(--gold)',
              border: 'none',
              color: '#000',
              padding: '7px 16px',
              borderRadius: 4,
              cursor: updateMutation.isPending ? 'not-allowed' : 'pointer',
              fontSize: 13,
              fontWeight: 700,
              opacity: updateMutation.isPending ? 0.7 : 1,
            }}
          >
            {updateMutation.isPending ? '提交中…' : '提交审批'}
          </button>
        </div>

        {updateMutation.isError && (
          <p style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>
            {updateMutation.error?.message ?? '操作失败'}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Toast helper ──────────────────────────────────────────────────────────

function useToast() {
  const [toast, setToast] = useState<{ msg: string; key: number } | null>(null);

  function show(msg: string) {
    setToast({ msg, key: Date.now() });
    setTimeout(() => setToast(null), 4000);
  }

  const node = toast ? (
    <div
      key={toast.key}
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        background: '#22c55e',
        color: '#fff',
        padding: '10px 18px',
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 600,
        zIndex: 9999,
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }}
    >
      {toast.msg}
    </div>
  ) : null;

  return { show, node };
}

// ── Tab button ────────────────────────────────────────────────────────────

function TabBtn({
  id,
  label,
  count,
  active,
  onClick,
}: {
  id: string;
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      key={id}
      type="button"
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        borderBottom: active ? '2px solid var(--gold)' : '2px solid transparent',
        color: active ? 'var(--gold)' : 'var(--text-muted)',
        padding: '8px 16px',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: active ? 700 : 400,
        marginBottom: -1,
      }}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span
          style={{
            marginLeft: 6,
            background: 'var(--bg-hover)',
            color: 'var(--text-muted)',
            borderRadius: 10,
            fontSize: 10,
            padding: '1px 6px',
            fontWeight: 700,
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ── FeatureFlagsPage ──────────────────────────────────────────────────────

export default function FeatureFlagsPage() {
  const { data: me } = adminTrpc.auth.me.useQuery();
  const role = me?.role;
  const isSuperAdmin = role === 'super_admin';

  // AC-2: URL state
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as TabId) ?? 'emergency';

  function setTab(t: TabId) {
    setSearchParams({ tab: t });
  }

  // Modal states
  const [emergencyModal, setEmergencyModal] = useState<string | null>(null); // configKey
  const [editFlagModal, setEditFlagModal] = useState<FeatureFlag | null>(null);
  const [editConfigModal, setEditConfigModal] = useState<SystemConfig | null>(null);

  const toast = useToast();

  // KPI data
  const { data: kpi, refetch: refetchKpi } = adminTrpc.featureFlags.getKpiStats.useQuery(undefined, {
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  // Tab data
  const { data: emergencySwitches = [], refetch: refetchEmergency } =
    adminTrpc.featureFlags.listEmergencySwitches.useQuery(undefined, { staleTime: 30_000 });

  const { data: featureFlags = [], refetch: refetchFlags } =
    adminTrpc.featureFlags.listFeatureFlags.useQuery(undefined, { staleTime: 30_000 });

  const { data: sysConfigs = [], refetch: refetchSysConfig } =
    adminTrpc.featureFlags.listSystemConfig.useQuery(undefined, { staleTime: 30_000 });

  const { data: postReviewItems = [] } = adminTrpc.featureFlags.listPostReview.useQuery(undefined, {
    enabled: isSuperAdmin,
    staleTime: 30_000,
  });

  function handleRefreshAll() {
    void refetchKpi();
    void refetchEmergency();
    void refetchFlags();
    void refetchSysConfig();
  }

  // ── Emergency switches tab columns ─────────────────────────────────────

  const emergencyColumns: DenseTableColumn<EmergencyConfig>[] = [
    {
      key: 'configKey',
      label: '配置键',
      render: (r) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#ef4444', fontWeight: 600 }}>
          {r.configKey}
        </span>
      ),
    },
    {
      key: 'configValue',
      label: '当前值',
      width: '120px',
      render: (r) => (
        <span
          style={{
            fontSize: 12,
            color: r.configValue ? '#22c55e' : 'var(--text-muted)',
            fontWeight: 600,
          }}
        >
          {String(r.configValue)}
        </span>
      ),
    },
    {
      key: 'updatedBy',
      label: '上次变更人',
      render: (r) => (
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {r.updatedByEmail ?? `Admin#${r.updatedByAdminId}`}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      label: '变更时间',
      width: '110px',
      render: (r) => (
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtDate(r.updatedAt)}</span>
      ),
    },
    {
      key: 'action',
      label: '操作',
      width: '100px',
      render: (r) => {
        const canAct = isSuperAdmin;
        return (
          <div title={canAct ? undefined : '需 super_admin 权限'}>
            <button
              type="button"
              disabled={!canAct}
              onClick={() => canAct && setEmergencyModal(r.configKey)}
              style={{
                background: canAct ? '#ef4444' : 'var(--bg-hover)',
                border: 'none',
                color: canAct ? '#fff' : 'var(--text-muted)',
                padding: '4px 10px',
                borderRadius: 3,
                cursor: canAct ? 'pointer' : 'not-allowed',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              触发
            </button>
          </div>
        );
      },
    },
  ];

  // ── Feature flags tab columns ──────────────────────────────────────────

  const flagColumns: DenseTableColumn<FeatureFlag>[] = [
    {
      key: 'flagKey',
      label: 'Flag Key',
      render: (r) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--gold)' }}>
          {r.flagKey}
        </span>
      ),
    },
    {
      key: 'flagType',
      label: '类型',
      width: '90px',
      render: (r) => (
        <span
          style={{
            fontSize: 11,
            padding: '2px 6px',
            borderRadius: 3,
            background: 'var(--bg-hover)',
            color: 'var(--text-muted)',
            fontWeight: 600,
          }}
        >
          {r.flagType}
        </span>
      ),
    },
    {
      key: 'enabled',
      label: '状态',
      width: '70px',
      render: (r) => (
        <span style={{ fontSize: 12, color: r.enabled ? '#22c55e' : '#6b7280', fontWeight: 600 }}>
          {r.enabled ? '启用' : '禁用'}
        </span>
      ),
    },
    {
      key: 'rolloutConfig',
      label: 'Rollout',
      render: (r) => (
        <span
          style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            fontFamily: 'monospace',
            maxWidth: 200,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'block',
          }}
        >
          {r.rolloutConfig ? jsonStr(r.rolloutConfig) : '—'}
        </span>
      ),
    },
    {
      key: 'updatedBy',
      label: '上次变更',
      render: (r) => (
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {r.updatedByEmail ?? `Admin#${r.updatedByAdminId}`} · {fmtDate(r.updatedAt)}
        </span>
      ),
    },
    {
      key: 'action',
      label: '操作',
      width: '80px',
      render: (r) => {
        const canAct = role !== 'readonly_admin';
        return (
          <div title={canAct ? undefined : '需 super_admin 权限'}>
            <button
              type="button"
              disabled={!canAct}
              onClick={() => canAct && setEditFlagModal(r)}
              style={{
                background: canAct ? 'var(--gold)' : 'var(--bg-hover)',
                border: 'none',
                color: canAct ? '#000' : 'var(--text-muted)',
                padding: '4px 10px',
                borderRadius: 3,
                cursor: canAct ? 'pointer' : 'not-allowed',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              编辑
            </button>
          </div>
        );
      },
    },
  ];

  // ── System config tab columns ──────────────────────────────────────────

  const sysConfigColumns: DenseTableColumn<SystemConfig>[] = [
    {
      key: 'configKey',
      label: '配置键',
      render: (r) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--gold)' }}>
          {r.configKey}
        </span>
      ),
    },
    {
      key: 'configValue',
      label: '当前值 (JSON)',
      render: (r) => (
        <span
          style={{
            fontSize: 11,
            color: 'var(--text)',
            fontFamily: 'monospace',
            maxWidth: 240,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'block',
          }}
        >
          {jsonStr(r.configValue)}
        </span>
      ),
    },
    {
      key: 'action',
      label: '操作',
      width: '80px',
      render: (r) => {
        const canAct = role !== 'readonly_admin';
        return (
          <div title={canAct ? undefined : '需 super_admin 权限'}>
            <button
              type="button"
              disabled={!canAct}
              onClick={() => canAct && setEditConfigModal(r)}
              style={{
                background: canAct ? 'var(--gold)' : 'var(--bg-hover)',
                border: 'none',
                color: canAct ? '#000' : 'var(--text-muted)',
                padding: '4px 10px',
                borderRadius: 3,
                cursor: canAct ? 'pointer' : 'not-allowed',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              编辑
            </button>
          </div>
        );
      },
    },
  ];

  // ── Post review tab columns ────────────────────────────────────────────

  const postReviewColumns: DenseTableColumn<PostReviewRow>[] = [
    {
      key: 'id',
      label: '申请 ID',
      width: '70px',
      render: (r) => <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>#{r.id}</span>,
    },
    {
      key: 'actionType',
      label: '操作类型',
      render: (r) => <span style={{ fontSize: 12 }}>{r.actionType}</span>,
    },
    {
      key: 'decidedAt',
      label: '批准时间',
      width: '100px',
      render: (r) => (
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtDate(r.decidedAt)}</span>
      ),
    },
    {
      key: 'approver',
      label: '批准人',
      render: (r) => (
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {r.firstApproverEmail ??
            (r.approverAdminId != null ? `Admin#${r.approverAdminId}` : '—')}
        </span>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────

  const tabs: Array<{ id: TabId; label: string; count?: number }> = [
    { id: 'emergency', label: '⚡ 紧急开关', count: emergencySwitches.length },
    { id: 'flags', label: '🚩 通用 Flags', count: featureFlags.length },
    { id: 'sysconfig', label: '🔧 系统配置', count: sysConfigs.length },
    ...(isSuperAdmin
      ? [{ id: 'postReview' as TabId, label: '🔍 后置复核', count: postReviewItems.length }]
      : []),
  ];

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1200 }}>
      {/* Page title */}
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ color: 'var(--gold)', fontSize: 18, fontWeight: 700, margin: 0 }}>
            ⚙️ 配置中心
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '4px 0 0' }}>
            紧急开关 · Feature Flags · 系统配置 · 后置复核
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefreshAll}
          style={{
            background: 'var(--bg-hover)',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            padding: '6px 14px',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          刷新
        </button>
      </div>

      {/* AC-10: 4 KPI Cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <KpiCard label="总 Flag 数" value={String(kpi?.totalFlags ?? 0)} />
        <KpiCard
          label="启用 Flag 数"
          value={String(kpi?.enabledFlags ?? 0)}
          accent="#22c55e"
        />
        <KpiCard
          label="7 天变更次数"
          value={String(kpi?.recentChanges ?? 0)}
          sub="flag + config"
          accent={kpi && kpi.recentChanges > 10 ? '#f59e0b' : undefined}
        />
        <KpiCard
          label="紧急开关激活"
          value={String(kpi?.emergencyActivations ?? 0)}
          sub="全量历史"
          accent={kpi && kpi.emergencyActivations > 0 ? '#ef4444' : undefined}
        />
      </div>

      {/* AC-2: Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 0,
          marginBottom: 16,
          borderBottom: '1px solid var(--border)',
        }}
      >
        {tabs.map((t) => (
          <TabBtn
            key={t.id}
            id={t.id}
            label={t.label}
            count={t.count}
            active={activeTab === t.id}
            onClick={() => setTab(t.id)}
          />
        ))}
      </div>

      {/* AC-3: 紧急开关 Tab */}
      {activeTab === 'emergency' && (
        <div
          style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            borderRadius: 6,
          }}
        >
          {emergencySwitches.length === 0 ? (
            <div
              style={{
                padding: '32px 0',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: 14,
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>⚡</div>
              暂无紧急开关配置
            </div>
          ) : (
            <DenseTable
              columns={emergencyColumns}
              data={emergencySwitches}
              maxHeight="calc(100vh - 400px)"
              getRowKey={(r) => r.id}
            />
          )}
        </div>
      )}

      {/* AC-6: 通用 Flags Tab */}
      {activeTab === 'flags' && (
        <div
          style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            borderRadius: 6,
          }}
        >
          {featureFlags.length === 0 ? (
            <div
              style={{
                padding: '32px 0',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: 14,
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>🚩</div>
              暂无 Feature Flags
            </div>
          ) : (
            <DenseTable
              columns={flagColumns}
              data={featureFlags}
              maxHeight="calc(100vh - 400px)"
              getRowKey={(r) => r.id}
            />
          )}
        </div>
      )}

      {/* AC-8: 系统配置 Tab */}
      {activeTab === 'sysconfig' && (
        <div
          style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            borderRadius: 6,
          }}
        >
          {sysConfigs.length === 0 ? (
            <div
              style={{
                padding: '32px 0',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: 14,
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>🔧</div>
              暂无系统配置
            </div>
          ) : (
            <DenseTable
              columns={sysConfigColumns}
              data={sysConfigs}
              maxHeight="calc(100vh - 400px)"
              getRowKey={(r) => r.id}
            />
          )}
        </div>
      )}

      {/* AC-9: 后置复核 Tab (super_admin only) */}
      {activeTab === 'postReview' && isSuperAdmin && (
        <div
          style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            borderRadius: 6,
          }}
        >
          {postReviewItems.length === 0 ? (
            <div
              style={{
                padding: '32px 0',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: 14,
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>✅</div>
              无待复核的紧急配置变更
            </div>
          ) : (
            <DenseTable
              columns={postReviewColumns}
              data={postReviewItems}
              maxHeight="calc(100vh - 400px)"
              getRowKey={(r) => r.id}
            />
          )}
        </div>
      )}

      {/* AC-4: EmergencyTriggerModal */}
      {emergencyModal && (
        <EmergencyTriggerModal
          configKey={emergencyModal}
          onClose={() => setEmergencyModal(null)}
          onSuccess={(approvalRequestId) => {
            setEmergencyModal(null);
            toast.show(`已紧急触发 · 审批 #${approvalRequestId} · 24h 后置复核已激活`);
            handleRefreshAll();
          }}
        />
      )}

      {/* AC-7: EditFlagModal */}
      {editFlagModal && (
        <EditFlagModal
          flag={editFlagModal}
          onClose={() => setEditFlagModal(null)}
          onSuccess={(approvalRequestId) => {
            setEditFlagModal(null);
            toast.show(`已发起 Approval #${approvalRequestId}`);
            void refetchFlags();
          }}
        />
      )}

      {/* AC-8: EditConfigModal */}
      {editConfigModal && (
        <EditConfigModal
          config={editConfigModal}
          onClose={() => setEditConfigModal(null)}
          onSuccess={(approvalRequestId) => {
            setEditConfigModal(null);
            toast.show(`已发起 Approval #${approvalRequestId}`);
            void refetchSysConfig();
          }}
        />
      )}

      {toast.node}
    </div>
  );
}
