// PRD-11 US-004 · NSM 3 pie charts
// AC-5: 3 pie charts side by side (行业/平台/用户画像) · hover shows value + %
// AC-12: readonly_admin 可见 distributions

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

import { adminTrpc } from '../../lib/admin-client';

const PIE_COLORS = [
  'var(--accent-purple)',
  'var(--accent-blue)',
  'var(--accent-green)',
  'var(--accent-amber)',
  '#ec4899',
  '#06b6d4',
  '#f97316',
  '#84cc16',
  '#a78bfa',
  '#fb923c',
  'var(--text-dim)',
];

interface PieEntry {
  name: string;
  value: number;
}

function buildPieData(dist: Record<string, number>): PieEntry[] {
  return Object.entries(dist)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));
}

interface SinglePieProps {
  title: string;
  data: PieEntry[];
}

function SinglePie({ title, data }: SinglePieProps) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {title}
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            cx="50%"
            cy="50%"
            outerRadius={75}
            isAnimationActive={false}
          >
            {data.map((_entry, index) => (
              <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 12 }}
            formatter={(value, name) => {
              const num = typeof value === 'number' ? value : 0;
              const nameStr = typeof name === 'string' ? name : String(name ?? '');
              const pct = total > 0 ? ((num / total) * 100).toFixed(1) : '0.0';
              return [`${num} (${pct}%)`, nameStr];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 10, color: 'var(--text-muted)' }}
            iconSize={8}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function NsmDistributions() {
  const { data, isLoading, isError, refetch } = adminTrpc.nsm.getDistributions.useQuery(undefined, {
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <SectionShell title="用户分布">
        <div style={{ display: 'flex', gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ flex: 1, height: 220, background: 'var(--bg-hover)', borderRadius: 4 }} />
          ))}
        </div>
      </SectionShell>
    );
  }

  if (isError) {
    return (
      <SectionShell title="用户分布">
        <div style={{ color: 'var(--status-err)', fontSize: 13, padding: '16px 0' }}>
          数据加载失败 · <button type="button" onClick={() => void refetch()} style={{ background: 'none', border: 'none', color: 'var(--gold-text)', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: 13 }}>点击重试</button>
        </div>
      </SectionShell>
    );
  }

  if (!data) {
    return (
      <SectionShell title="用户分布">
        <div style={{ color: 'var(--text-dim)', fontSize: 13, padding: '16px 0' }}>等待数据聚合</div>
      </SectionShell>
    );
  }

  const industryData = buildPieData(data.industryDistribution);
  const platformData = buildPieData(data.platformDistribution);
  const personaData = buildPieData(data.userPersonaDistribution);

  return (
    <SectionShell title="用户分布">
      <div style={{ display: 'flex', gap: 16 }}>
        <SinglePie title="行业分布" data={industryData} />
        <SinglePie title="平台分布" data={platformData} />
        <SinglePie title="用户画像" data={personaData} />
      </div>
    </SectionShell>
  );
}

function SectionShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 6, padding: '14px 16px', marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {title}
      </div>
      {children}
    </div>
  );
}
