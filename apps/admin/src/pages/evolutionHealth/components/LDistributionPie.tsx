// PRD-13 US-006 · L1-L5 distribution pie chart
// AC-3: L1 灰 / L2 浅蓝 / L3 蓝 / L4 紫 / L5 金

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  data: { L1: number; L2: number; L3: number; L4: number; L5: number };
}

const L_COLORS: Record<string, string> = {
  L1: '#666',
  L2: '#7dd3fc',
  L3: '#3b82f6',
  L4: '#a855f7',
  L5: '#d4af37',
};

export function LDistributionPie({ data }: Props) {
  const pieData = (['L1', 'L2', 'L3', 'L4', 'L5'] as const).map((level) => ({
    name: level,
    value: data[level],
    level,
  }));
  const total = pieData.reduce((s, d) => s + d.value, 0);

  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-muted)',
          marginBottom: 6,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        L 等级分布
      </div>
      {total === 0 ? (
        <div
          style={{
            height: 160,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-dim)',
            fontSize: 12,
          }}
        >
          暂无数据
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              cx="50%"
              cy="50%"
              outerRadius={65}
              isAnimationActive={false}
            >
              {pieData.map((entry) => (
                <Cell key={entry.level} fill={L_COLORS[entry.level]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'var(--bg-panel)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                fontSize: 11,
              }}
              formatter={(value, name) => {
                const num = typeof value === 'number' ? value : 0;
                const pct = total > 0 ? ((num / total) * 100).toFixed(1) : '0.0';
                return [`${num} (${pct}%)`, name];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 10px', marginTop: 4 }}>
        {(['L1', 'L2', 'L3', 'L4', 'L5'] as const).map((level) => (
          <span
            key={level}
            style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: L_COLORS[level],
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            {level}: {data[level]}
          </span>
        ))}
      </div>
    </div>
  );
}
