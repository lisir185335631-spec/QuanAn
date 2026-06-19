// PRD-28 US-006 AC-3 · EvaluationMatrixChart · 跨 specialist × mode 热力图
// Tailwind grid 实现 · 不引 chart 库
// cell color: red<4 / yellow 4-6 / green 6-8 / blue>8

const SPECIALIST_IDS = [
  'CopywritingAgent',
  'BrandingAgent',
  'VideoAgent',
  'TopicAgent',
  'PositioningAgent',
  'MonetizationAgent',
  'AnalysisAgent',
  'PresentationAgent',
  'DailyTaskAgent',
  'EvolutionAgent',
  'InsightInjectionAgent',
  'RagInjectionAgent',
  'LivestreamAgent',
] as const;

interface SampleRow {
  specialistId: string;
  mode: string | null;
  judgeScore: number;
}

interface Props {
  samples: SampleRow[];
}

function scoreColor(avg: number | null): string {
  if (avg === null) return '#1a1a2e';
  if (avg < 4) return '#7f1d1d';
  if (avg < 6) return '#713f12';
  if (avg < 8) return '#14532d';
  return '#1e3a5f';
}

function scoreTextColor(avg: number | null): string {
  if (avg === null) return '#6b7280';
  if (avg < 4) return '#fca5a5';
  if (avg < 6) return '#fcd34d';
  if (avg < 8) return '#86efac';
  return '#93c5fd';
}

function buildMatrix(samples: SampleRow[]) {
  const modes = Array.from(new Set(samples.map((s) => s.mode ?? 'default'))).sort();
  const matrix: Record<string, Record<string, { sum: number; count: number }>> = {};

  for (const s of samples) {
    const mode = s.mode ?? 'default';
    if (!matrix[s.specialistId]) matrix[s.specialistId] = {};
    const specMap = matrix[s.specialistId];
    if (!specMap) continue;
    if (!specMap[mode]) specMap[mode] = { sum: 0, count: 0 };
    const cell = specMap[mode];
    if (!cell) continue;
    cell.sum += s.judgeScore;
    cell.count += 1;
  }

  return { modes, matrix };
}

export function EvaluationMatrixChart({ samples }: Props) {
  const { modes, matrix } = buildMatrix(samples);

  if (samples.length === 0) {
    return (
      <div style={{ color: 'var(--text-dim)', fontSize: 13, textAlign: 'center', padding: 32 }}>
        暂无样本数据
      </div>
    );
  }

  const specialists = SPECIALIST_IDS.filter((s) => matrix[s]);

  return (
    <div style={{ overflowX: 'auto' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `160px repeat(${modes.length}, minmax(60px, 1fr))`,
          gap: 2,
          minWidth: specialists.length > 0 ? 400 : 300,
        }}
      >
        {/* Header row */}
        <div style={{ padding: '6px 8px', fontSize: 11, color: 'var(--text-dim)' }}>Specialist</div>
        {modes.map((mode) => (
          <div
            key={mode}
            style={{
              padding: '6px 4px',
              fontSize: 11,
              color: 'var(--gold)',
              textAlign: 'center',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={mode}
          >
            {mode}
          </div>
        ))}

        {/* Data rows */}
        {specialists.map((specialist) => (
          <>
            <div
              key={`label-${specialist}`}
              style={{
                padding: '6px 8px',
                fontSize: 11,
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={specialist}
            >
              {specialist.replace('Agent', '')}
            </div>
            {modes.map((mode) => {
              const cell = matrix[specialist]?.[mode] ?? null;
              const avg = cell ? cell.sum / cell.count : null;
              const display = avg !== null ? avg.toFixed(1) : '—';
              return (
                <div
                  key={`${specialist}-${mode}`}
                  style={{
                    background: scoreColor(avg),
                    color: scoreTextColor(avg),
                    textAlign: 'center',
                    padding: '6px 4px',
                    fontSize: 12,
                    fontWeight: avg !== null ? 600 : 400,
                    borderRadius: 3,
                    cursor: 'default',
                  }}
                  title={
                    cell ? `${specialist} × ${mode}: avg=${avg?.toFixed(2)} n=${cell.count}` : '无数据'
                  }
                >
                  {display}
                </div>
              );
            })}
          </>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
        {[
          { color: '#7f1d1d', text: '#fca5a5', label: '< 4 (红)' },
          { color: '#713f12', text: '#fcd34d', label: '4–6 (黄)' },
          { color: '#14532d', text: '#86efac', label: '6–8 (绿)' },
          { color: '#1e3a5f', text: '#93c5fd', label: '> 8 (蓝)' },
        ].map((item) => (
          <span
            key={item.label}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}
          >
            <span
              style={{
                display: 'inline-block',
                width: 14,
                height: 14,
                background: item.color,
                borderRadius: 2,
              }}
            />
            <span style={{ color: item.text }}>{item.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
