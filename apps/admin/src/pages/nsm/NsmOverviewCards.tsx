// PRD-11 US-004 · NSM Overview 4 big-number cards
// AC-3: NSM/完成9步率/反馈率/进化升级率 · delta vs prev day
// AC-11: empty table → skeleton + '等待首次聚合' + [手动触发] for super_admin
// AC-12: readonly_admin → hide [手动触发]

import { adminTrpc } from '../../lib/admin-client';

interface Props {
  role: string | undefined;
}

interface CardDef {
  key: 'activeAccounts7d' | 'step9CompleteRate' | 'feedbackRate' | 'evolutionUpgradeRate';
  label: string;
  unit: string;
  decimals: number;
}

const CARDS: CardDef[] = [
  { key: 'activeAccounts7d', label: 'NSM · 7日活跃IP账号', unit: '个', decimals: 0 },
  { key: 'step9CompleteRate', label: '完成9步率', unit: '%', decimals: 1 },
  { key: 'feedbackRate', label: '反馈率', unit: '%', decimals: 1 },
  { key: 'evolutionUpgradeRate', label: '进化升级率', unit: '%', decimals: 1 },
];

function fmtValue(val: number, card: CardDef): string {
  if (card.unit === '%') return (val * 100).toFixed(card.decimals);
  return val.toFixed(card.decimals);
}

function fmtDelta(delta: number, card: CardDef): string {
  const sign = delta >= 0 ? '+' : '';
  if (card.unit === '%') return `${sign}${(delta * 100).toFixed(card.decimals)}%`;
  return `${sign}${delta.toFixed(card.decimals)}`;
}

export function NsmOverviewCards({ role }: Props) {
  const { data, isLoading, isError, refetch } = adminTrpc.nsm.getOverview.useQuery(undefined, {
    staleTime: 60_000,
  });
  const triggerMutation = adminTrpc.nsm.triggerSnapshot.useMutation({
    onSuccess: () => void refetch(),
  });

  if (isLoading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {CARDS.map((c) => (
          <div key={c.key} style={cardStyle}>
            <div style={{ color: 'var(--text-dim)', fontSize: 12 }}>{c.label}</div>
            <div style={{ color: 'var(--text-dim)', fontSize: 28, marginTop: 8 }}>—</div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ padding: '16px', color: 'var(--status-err)', marginBottom: 20 }}>
        概览数据加载失败 · <button type="button" onClick={() => void refetch()} style={linkBtnStyle}>点击重试</button>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ ...cardStyle, padding: 24, marginBottom: 20, textAlign: 'center' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 12 }}>
          ⏳ 等待首次聚合 · kpi_snapshots 表暂无数据
        </div>
        {role === 'super_admin' && (
          <button
            type="button"
            onClick={() => triggerMutation.mutate()}
            disabled={triggerMutation.isPending}
            style={triggerBtnStyle}
          >
            {triggerMutation.isPending ? '聚合中…' : '手动触发快照'}
          </button>
        )}
        {triggerMutation.isError && (
          <div style={{ color: 'var(--status-err)', fontSize: 12, marginTop: 8 }}>触发失败</div>
        )}
      </div>
    );
  }

  const { latest, deltas } = data;

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {CARDS.map((card) => {
          const val = latest[card.key];
          const delta = deltas?.[card.key] ?? null;
          const deltaPositive = delta !== null && delta >= 0;
          return (
            <div key={card.key} style={cardStyle}>
              <div style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6 }}>
                {card.label}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ color: 'var(--gold)', fontSize: 28, fontWeight: 700, lineHeight: 1 }}>
                  {fmtValue(val, card)}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{card.unit}</span>
              </div>
              {delta !== null && (
                <div style={{ marginTop: 6, fontSize: 11, color: deltaPositive ? 'var(--status-ok)' : 'var(--status-err)' }}>
                  {fmtDelta(delta, card)} vs 上日
                </div>
              )}
            </div>
          );
        })}
      </div>
      {role === 'super_admin' && (
        <div style={{ marginTop: 8, textAlign: 'right' }}>
          <button
            type="button"
            onClick={() => triggerMutation.mutate()}
            disabled={triggerMutation.isPending}
            style={{ ...triggerBtnStyle, fontSize: 11 }}
          >
            {triggerMutation.isPending ? '聚合中…' : '手动触发快照'}
          </button>
          {triggerMutation.isError && (
            <span style={{ color: 'var(--status-err)', fontSize: 11, marginLeft: 8 }}>触发失败</span>
          )}
        </div>
      )}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-panel)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: '14px 16px',
};

const triggerBtnStyle: React.CSSProperties = {
  background: 'var(--gold-dim)',
  border: '1px solid var(--gold)',
  color: 'var(--gold-text)',
  padding: '6px 12px',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 12,
};

const linkBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--gold-text)',
  cursor: 'pointer',
  textDecoration: 'underline',
  padding: 0,
  fontSize: 13,
};
