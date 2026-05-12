// PRD-11 US-021 · CampaignFunnelChart · Recharts FunnelChart · fill per data point
// SHIELD: data points 必含 fill field

import { FunnelChart, Funnel, LabelList, Tooltip, ResponsiveContainer } from 'recharts';
import { adminTrpc } from '../../lib/admin-client';

const STAGE_LABELS: Record<string, string> = {
  registered: '注册',
  activated: '激活',
  step9Completed: '完成9步',
  d30Retained: '30日留存',
};

const FILL_COLORS = [
  'var(--accent-purple, #7c4dff)',
  'var(--accent-teal, #00bcd4)',
  'var(--accent-green, #4caf50)',
  'var(--gold, #d4af37)',
];

export function CampaignFunnelChart({ campaignKey }: { campaignKey: string }) {
  const { data, isLoading, isError, refetch } = adminTrpc.inviteCodes.campaignFunnel.useQuery(
    { campaignKey },
    { staleTime: 60_000 },
  );

  if (isLoading) {
    return <div style={{ height: 160, background: 'var(--bg-hover, #1a1a1a)', borderRadius: 4 }} />;
  }

  if (isError) {
    return (
      <div style={{ color: 'var(--status-err, #ef4444)', fontSize: 12, padding: '12px 0' }}>
        漏斗数据加载失败 ·{' '}
        <button
          type="button"
          onClick={() => void refetch()}
          style={{ background: 'none', border: 'none', color: 'var(--gold, #d4af37)', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: 12 }}
        >
          重试
        </button>
      </div>
    );
  }

  const funnelData = (data ?? []).map((item, i) => ({
    name: STAGE_LABELS[item.stage] ?? item.stage,
    value: item.count,
    fill: FILL_COLORS[i % FILL_COLORS.length],
  }));

  if (funnelData.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted, #888)', fontSize: 12, padding: '12px 0', textAlign: 'center' }}>
        暂无漏斗数据
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <FunnelChart>
        <Tooltip
          contentStyle={{
            background: 'var(--bg-panel, #111)',
            border: '1px solid var(--border, #2a2a2a)',
            color: 'var(--text, #e0e0e0)',
            fontSize: 12,
          }}
        />
        <Funnel dataKey="value" data={funnelData} isAnimationActive={false}>
          <LabelList
            position="right"
            fill="var(--text-muted, #888)"
            stroke="none"
            dataKey="name"
            style={{ fontSize: 11 }}
          />
        </Funnel>
      </FunnelChart>
    </ResponsiveContainer>
  );
}
