// PRD-14 US-005 · ExperimentTimeline
// AC-7: Recharts AreaChart · 横轴日期 / 纵轴累积 sample size / 3 variant 颜色 · 悬停 tooltip

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export interface TimelinePoint {
  day: string;
  control: number;
  variant_a: number;
  variant_b: number;
}

interface Props {
  timeline: TimelinePoint[];
}

const VARIANT_COLORS = {
  control: '#d4af37',
  variant_a: '#22c55e',
  variant_b: '#3b82f6',
};

const VARIANT_LABELS: Record<string, string> = {
  control: 'Control',
  variant_a: 'Variant A',
  variant_b: 'Variant B',
};

export function ExperimentTimeline({ timeline }: Props) {
  if (!timeline || timeline.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: '12px 0', textAlign: 'center' }}>
        暂无时间线数据
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={timeline} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
        <defs>
          {(['control', 'variant_a', 'variant_b'] as const).map((v) => (
            <linearGradient key={v} id={`grad-${v}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={VARIANT_COLORS[v]} stopOpacity={0.35} />
              <stop offset="95%" stopColor={VARIANT_COLORS[v]} stopOpacity={0.05} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="day"
          tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
          axisLine={{ stroke: 'var(--border)' }}
          tickFormatter={(v: string) => v.slice(5)} // MM-DD
        />
        <YAxis
          tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
          axisLine={{ stroke: 'var(--border)' }}
          tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            fontSize: 12,
            color: 'var(--text-primary)',
          }}
          formatter={(value, name) => [
            typeof value === 'number' ? value.toLocaleString() : String(value),
            VARIANT_LABELS[String(name)] ?? String(name),
          ]}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }}
          formatter={(value) => VARIANT_LABELS[value as keyof typeof VARIANT_LABELS] ?? value}
        />
        {(['control', 'variant_a', 'variant_b'] as const).map((v) => (
          <Area
            key={v}
            type="monotone"
            dataKey={v}
            stroke={VARIANT_COLORS[v]}
            fill={`url(#grad-${v})`}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3 }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
