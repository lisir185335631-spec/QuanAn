// PRD-11 US-013 · CostBreakdownChart — 多线折线(模型/Specialist) + 饼图(provider)
// SHIELD: Recharts data 必含 fill var(--accent-X)
// AC-11: X 轴时间格式 'MM-dd' 不 raw timestamp

import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { adminTrpc } from '../../lib/admin-client';

interface Props {
  startDate: Date;
  endDate: Date;
  groupBy: 'day' | 'week' | 'month';
}

type LineMode = 'model' | 'specialist';

const LINE_COLORS = [
  'var(--accent-purple)',
  'var(--accent-blue)',
  'var(--accent-green)',
  'var(--accent-amber)',
  '#e11d48',
  '#0891b2',
];

const PIE_ACCENT = [
  'var(--accent-purple)',
  'var(--accent-blue)',
  'var(--accent-green)',
  'var(--accent-amber)',
  '#e11d48',
];

function formatDate(d: Date | string): string {
  const dt = typeof d === 'string' ? new Date(d) : d;
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${mm}-${dd}`;
}

function pivotAggregations(rows: { timeBucket: Date | string; dimensionValue: string | null; totalCost: string }[]) {
  const dateMap = new Map<string, Record<string, number>>();
  const keys = new Set<string>();

  for (const row of rows) {
    const dateKey = formatDate(row.timeBucket);
    const dim = row.dimensionValue ?? 'unknown';
    keys.add(dim);
    if (!dateMap.has(dateKey)) dateMap.set(dateKey, {});
    dateMap.get(dateKey)![dim] = (dateMap.get(dateKey)![dim] ?? 0) + parseFloat(row.totalCost);
  }

  const sorted = Array.from(dateMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, vals]) => ({ date, ...vals }));

  return { data: sorted, keys: Array.from(keys) };
}

const dropdownStyle: React.CSSProperties = {
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  padding: '4px 10px',
  borderRadius: 4,
  fontSize: 12,
  cursor: 'pointer',
};

export function CostBreakdownChart({ startDate, endDate, groupBy }: Props) {
  const [lineMode, setLineMode] = useState<LineMode>('model');

  const dimension = lineMode === 'model' ? 'model' : 'specialist';

  const { data: lineData, isLoading: lineLoading } = adminTrpc.cost.aggregate.useQuery(
    { startDate, endDate, dimension, groupBy },
    { staleTime: 60_000 },
  );

  const { data: providerData, isLoading: pieLoading } = adminTrpc.cost.aggregate.useQuery(
    { startDate, endDate, dimension: 'provider', groupBy: 'month' },
    { staleTime: 60_000 },
  );

  const { data: chartData, keys } = useMemo(() => {
    if (!lineData?.aggregations) return { data: [], keys: [] };
    return pivotAggregations(lineData.aggregations);
  }, [lineData]);

  const pieData = useMemo(() => {
    if (!providerData?.aggregations) return [];
    const agg = new Map<string, number>();
    for (const r of providerData.aggregations) {
      const key = r.dimensionValue ?? 'unknown';
      agg.set(key, (agg.get(key) ?? 0) + parseFloat(r.totalCost));
    }
    return Array.from(agg.entries()).map(([name, value], i) => ({
      name,
      value: parseFloat(value.toFixed(4)),
      fill: PIE_ACCENT[i % PIE_ACCENT.length],
    }));
  }, [providerData]);

  return (
    <div
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: '12px 16px',
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>成本趋势</span>
        <select value={lineMode} onChange={(e) => setLineMode(e.target.value as LineMode)} style={dropdownStyle}>
          <option value="model">按模型</option>
          <option value="specialist">按 Specialist</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
        {/* Line chart */}
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
            {lineMode === 'model' ? '按模型' : '按 Specialist'} 成本折线
          </div>
          {lineLoading ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: 12 }}>
              加载中…
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `$${v.toFixed(2)}`}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-panel)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    fontSize: 11,
                  }}
                  formatter={(value, name) => [`$ ${Number(value ?? 0).toFixed(4)}`, String(name ?? '')]}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }}
                />
                {keys.slice(0, 6).map((key, i) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={LINE_COLORS[i % LINE_COLORS.length]}
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart — provider breakdown */}
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Provider 分项</div>
          {pieLoading ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: 12 }}>
              加载中…
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  isAnimationActive={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-panel)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    fontSize: 11,
                  }}
                  formatter={(value, name) => [`$ ${Number(value ?? 0).toFixed(4)}`, String(name ?? '')]}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
