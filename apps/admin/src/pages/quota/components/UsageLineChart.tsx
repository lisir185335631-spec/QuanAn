// PRD-13 US-009 · UsageLineChart · 24h × 3 plans call count trend
// AC-3: Recharts LineChart · 3 plan lines (free/pro/enterprise) · 24h x-axis
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface HourlyTrendRow {
  hour: string;
  plan: string;
  callCount: number;
}

interface ChartDataPoint {
  hour: string;
  free: number;
  pro: number;
  enterprise: number;
}

interface Props {
  data: HourlyTrendRow[];
  loading?: boolean;
}

const PLAN_COLORS = {
  free: '#6b7280',
  pro: '#d4af37',
  enterprise: '#22c55e',
};

function buildChartData(rows: HourlyTrendRow[]): ChartDataPoint[] {
  const map = new Map<string, ChartDataPoint>();

  for (const row of rows) {
    const existing = map.get(row.hour) ?? { hour: row.hour, free: 0, pro: 0, enterprise: 0 };
    if (row.plan === 'free') existing.free = row.callCount;
    else if (row.plan === 'pro') existing.pro = row.callCount;
    else if (row.plan === 'enterprise') existing.enterprise = row.callCount;
    map.set(row.hour, existing);
  }

  return Array.from(map.values()).sort((a, b) => a.hour.localeCompare(b.hour));
}

export function UsageLineChart({ data, loading }: Props) {
  const chartData = buildChartData(data);

  if (loading) {
    return (
      <div
        style={{
          height: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontSize: 13,
        }}
      >
        加载中…
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div
        style={{
          height: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontSize: 13,
        }}
      >
        24h 内暂无调用数据
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="hour"
          tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
          tickLine={false}
          axisLine={{ stroke: 'var(--border)' }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
          tickLine={false}
          axisLine={false}
          width={36}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            fontSize: 12,
          }}
          labelStyle={{ color: 'var(--text-muted)', marginBottom: 4 }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)', paddingTop: 8 }}
          formatter={(val) => (val === 'free' ? 'Free' : val === 'pro' ? 'Pro' : 'Enterprise')}
        />
        <Line
          type="monotone"
          dataKey="free"
          stroke={PLAN_COLORS.free}
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 3 }}
        />
        <Line
          type="monotone"
          dataKey="pro"
          stroke={PLAN_COLORS.pro}
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 3 }}
        />
        <Line
          type="monotone"
          dataKey="enterprise"
          stroke={PLAN_COLORS.enterprise}
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
