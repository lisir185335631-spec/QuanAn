// PRD-14 US-004 · MultiMetricChart
// AC-10: Recharts BarChart · 3 metric × 3 variant 矩阵 · 显著性 badge
// SHIELD: 使用已安装的 recharts ^3.8.1

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export interface MetricResult {
  metric: string;
  testType: 'chi_square' | 'welch_t';
  pValue: number | null;
  isSignificant: boolean;
  effect: number | null;
  sampleSize: number;
  confidence: number;
  recommendation: 'continue' | 'stop_winner' | 'stop_loser' | 'inconclusive';
}

interface Props {
  results: MetricResult[];
}

const METRIC_LABELS: Record<string, string> = {
  conversion: '转化率',
  retention: '留存率',
  cost: '成本',
};

const RECOMMENDATION_COLOR: Record<string, string> = {
  stop_winner: '#22c55e',
  stop_loser: '#ef4444',
  continue: '#f59e0b',
  inconclusive: '#6b7280',
};

const RECOMMENDATION_LABEL: Record<string, string> = {
  stop_winner: '显著优胜',
  stop_loser: '显著劣于',
  continue: '继续观察',
  inconclusive: '样本不足',
};

function SignificanceBadge({ result }: { result: MetricResult }) {
  const color = RECOMMENDATION_COLOR[result.recommendation] ?? '#6b7280';
  const label = RECOMMENDATION_LABEL[result.recommendation] ?? result.recommendation;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '1px 6px',
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 700,
        background: `${color}22`,
        color,
        border: `1px solid ${color}55`,
        marginLeft: 4,
      }}
    >
      {label}
      {result.pValue !== null && (
        <span style={{ marginLeft: 4, fontWeight: 400 }}>
          p={result.pValue.toFixed(3)}
        </span>
      )}
    </span>
  );
}

export function MultiMetricChart({ results }: Props) {
  if (!results || results.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: '12px 0' }}>
        暂无显著性数据
      </div>
    );
  }

  // Build bar chart data: one bar per metric showing effect size
  const chartData = results.map((r) => ({
    metric: METRIC_LABELS[r.metric] ?? r.metric,
    effect: r.effect !== null ? Math.round(r.effect * 100) : 0,
    pValue: r.pValue,
    recommendation: r.recommendation,
    sampleSize: r.sampleSize,
    isSignificant: r.isSignificant,
  }));

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {results.map((r) => (
          <div
            key={r.metric}
            style={{
              background: 'var(--bg-panel)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '8px 12px',
              flex: 1,
              minWidth: 120,
            }}
          >
            <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {METRIC_LABELS[r.metric] ?? r.metric}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: 'var(--gold)', fontSize: 18, fontWeight: 700 }}>
                {r.effect !== null ? `${(r.effect * 100).toFixed(1)}%` : '—'}
              </span>
              <SignificanceBadge result={r} />
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 4 }}>
              n={r.sampleSize} · {r.testType === 'chi_square' ? 'χ²' : 'Welch t'}
            </div>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="metric"
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--border)' }}
          />
          <YAxis
            tickFormatter={(v: number) => `${v}%`}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--border)' }}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-panel)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              color: 'var(--text-primary)',
              fontSize: 12,
            }}
            formatter={(value) => [`${String(value)}%`, '效果']}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }}
          />
          <Bar dataKey="effect" name="效果(variant_a vs control)" radius={[3, 3, 0, 0]}>
            {chartData.map((entry, idx) => (
              <Cell
                key={idx}
                fill={
                  entry.isSignificant
                    ? (entry.effect >= 0 ? '#22c55e' : '#ef4444')
                    : '#6b7280'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
