// PRD-11 US-004 · NSM Alerts sidebar
// AC-6: 右侧告警栏 · 连续3天恶化 · metric/severity/deltaPct + 钉钉推送状态

import { adminTrpc } from '../../lib/admin-client';

const METRIC_LABELS: Record<string, string> = {
  activeAccounts7d: 'NSM 7日活跃',
  step9CompleteRate: '完成9步率',
  feedbackRate: '反馈率',
  evolutionUpgradeRate: '进化升级率',
  d30Retention: 'D30 留存',
};

const SEVERITY_STYLE: Record<string, { color: string; label: string }> = {
  high: { color: 'var(--status-err)', label: '🔴 高危' },
  medium: { color: 'var(--status-warn)', label: '🟡 中危' },
  low: { color: 'var(--text-muted)', label: '🟢 低危' },
};

export function NsmAlerts() {
  const { data, isLoading, isError, refetch } = adminTrpc.nsm.getAlerts.useQuery(undefined, {
    staleTime: 60_000,
    refetchInterval: 300_000,
  });

  return (
    <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 6, padding: '14px 16px', height: 'fit-content' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        告警栏 · 连续恶化指标
      </div>

      {isLoading && (
        <div style={{ color: 'var(--text-dim)', fontSize: 12, padding: '8px 0' }}>加载中…</div>
      )}

      {isError && (
        <div style={{ color: 'var(--status-err)', fontSize: 12, padding: '8px 0' }}>
          加载失败 · <button type="button" onClick={() => void refetch()} style={{ background: 'none', border: 'none', color: 'var(--gold-text)', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: 12 }}>重试</button>
        </div>
      )}

      {!isLoading && !isError && data && data.length === 0 && (
        <div style={{ color: 'var(--status-ok)', fontSize: 12, padding: '8px 0' }}>✓ 无告警 · 所有指标正常</div>
      )}

      {data &&
        data.map((alert, idx) => {
          const sevStyle = SEVERITY_STYLE[alert.severity] ?? SEVERITY_STYLE['low']!;
          const metricLabel = METRIC_LABELS[alert.metric] ?? alert.metric;
          return (
            <div
              key={idx}
              style={{
                borderLeft: `3px solid ${sevStyle.color}`,
                paddingLeft: 10,
                marginBottom: 12,
                paddingBottom: 12,
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{metricLabel}</span>
                <span style={{ fontSize: 10, color: sevStyle.color }}>{sevStyle.label}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--status-err)' }}>
                {alert.deltaPct > 0 ? '+' : ''}{alert.deltaPct.toFixed(1)}%
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>
                钉钉推送 · <span style={{ color: 'var(--text-muted)' }}>mock</span>
              </div>
            </div>
          );
        })}
    </div>
  );
}
