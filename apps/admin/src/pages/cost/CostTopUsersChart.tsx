// PRD-11 US-013 · CostTopUsersChart — Top 10 横向 bar
// SHIELD: 数字格式 `$ ${cost.toFixed(2)}` · 不 raw float

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface TopUser {
  userId: number;
  totalCost: string;
  callCount: number;
}

interface Props {
  data: TopUser[];
  isLoading?: boolean;
}

const BAR_COLORS = [
  'var(--accent-purple)',
  'var(--accent-blue)',
  'var(--accent-green)',
  'var(--accent-amber)',
];

export function CostTopUsersChart({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div
        style={{
          height: 240,
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-dim)',
          fontSize: 13,
        }}
      >
        加载中…
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div
        style={{
          height: 120,
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-dim)',
          fontSize: 13,
        }}
      >
        暂无数据
      </div>
    );
  }

  const chartData = data.slice(0, 10).map((u) => ({
    label: `U-${u.userId}`,
    cost: parseFloat(u.totalCost),
    userId: u.userId,
  }));

  return (
    <div
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: '12px 16px',
      }}
    >
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
        Top 10 用户 · 成本排行
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 60, left: 8, bottom: 0 }}
        >
          <XAxis
            type="number"
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `$${v.toFixed(2)}`}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={50}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            contentStyle={{
              background: 'var(--bg-panel)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              fontSize: 12,
            }}
            formatter={(value) => [`$ ${Number(value ?? 0).toFixed(2)}`, '成本']}
          />
          <Bar dataKey="cost" radius={[0, 3, 3, 0]} label={{
            position: 'right',
            fill: 'var(--text-muted)',
            fontSize: 11,
            formatter: (v: unknown) => `$ ${Number(v ?? 0).toFixed(2)}`,
          }}>
            {chartData.map((_, index) => (
              <Cell
                key={index}
                fill={BAR_COLORS[index % BAR_COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
