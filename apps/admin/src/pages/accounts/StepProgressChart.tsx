// PRD-11 US-011 · StepProgressChart — 9-step BarChart via Recharts
// AC-16: data [{step:1,progress:0|1,fill:'var(--accent-purple)'}] · 必含 fill

import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface StepProgressChartProps {
  stepData: Array<{ stepKey: string }>;
}

const STEP_COUNT = 9;

export function StepProgressChart({ stepData }: StepProgressChartProps) {
  const completed = new Set(stepData.map((s) => s.stepKey));

  const data = Array.from({ length: STEP_COUNT }, (_, i) => {
    const n = i + 1;
    const done = completed.has(`step${n}`);
    return {
      step: n,
      progress: done ? 1 : 0,
      fill: done ? 'var(--accent-purple)' : 'var(--border)',
    };
  });

  return (
    <ResponsiveContainer width="100%" height={100}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -32 }}>
        <XAxis
          dataKey="step"
          tick={{ fontSize: 10, fill: 'var(--text-dim)' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(value) => [value === 1 ? '已完成' : '未开始', '状态']}
          contentStyle={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            fontSize: 11,
          }}
          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
        />
        <Bar dataKey="progress" maxBarSize={24} radius={2} isAnimationActive={false}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
