// PRD-11 US-013 · CostAlertsPanel — 右侧异常告警栏
// 单用户日 > $5 列表 · severity badge (high/medium/low)

import { adminTrpc } from '../../lib/admin-client';

const SEVERITY_COLOR: Record<string, string> = {
  high: 'var(--status-err)',
  medium: 'var(--status-warn)',
  low: '#3b82f6',
};

interface Alert {
  userId: number;
  email: string;
  dailySpent: string;
  threshold: string;
  severity: 'high' | 'medium' | 'low';
}

export function CostAlertsPanel() {
  const { data, isLoading, isError, refetch } = adminTrpc.cost.alerts.useQuery(undefined, {
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  return (
    <div
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: '12px 16px',
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
          💰 成本告警
        </span>
        <button
          type="button"
          onClick={() => void refetch()}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: 11,
            cursor: 'pointer',
            padding: 0,
          }}
        >
          刷新
        </button>
      </div>

      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>
        过去 24h · 单用户 &gt; $5
      </div>

      {isLoading && (
        <div style={{ color: 'var(--text-dim)', fontSize: 12, textAlign: 'center', padding: '16px 0' }}>
          加载中…
        </div>
      )}

      {isError && (
        <div style={{ color: 'var(--status-err)', fontSize: 12 }}>
          加载失败 ·{' '}
          <button type="button" onClick={() => void refetch()} style={{ background: 'none', border: 'none', color: 'var(--status-err)', cursor: 'pointer', padding: 0 }}>
            重试
          </button>
        </div>
      )}

      {!isLoading && !isError && data && data.length === 0 && (
        <div style={{ color: 'var(--text-dim)', fontSize: 12, textAlign: 'center', padding: '16px 0' }}>
          ✅ 暂无异常告警
        </div>
      )}

      {!isLoading && !isError && data && data.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(data as Alert[]).map((alert) => {
            const color = SEVERITY_COLOR[alert.severity] ?? 'var(--text-muted)';
            return (
              <div
                key={alert.userId}
                style={{
                  background: 'var(--bg)',
                  border: `1px solid ${color}44`,
                  borderRadius: 4,
                  padding: '8px 10px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                  }}
                >
                  <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>
                    {alert.email || `U-${alert.userId}`}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {alert.severity}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color }}>
                  $ {parseFloat(alert.dailySpent).toFixed(2)}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>
                  阈值: $ {parseFloat(alert.threshold).toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
