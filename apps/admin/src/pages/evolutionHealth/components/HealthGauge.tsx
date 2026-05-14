// PRD-13 US-006 · HealthGauge — flywheel health semicircle gauge
// AC-3: 绿/黄/红 · 内圈进度 + 中心状态文案

interface Props {
  status: 'green' | 'yellow' | 'red';
  stalledCount: number;
  conflictCount: number;
  healthyCount: number;
}

const STATUS_COLOR: Record<string, string> = {
  green: '#22c55e',
  yellow: '#f59e0b',
  red: '#ef4444',
};

const STATUS_LABEL: Record<string, string> = {
  green: '健康',
  yellow: '预警',
  red: '异常',
};

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export function HealthGauge({ status, stalledCount, conflictCount, healthyCount }: Props) {
  const total = stalledCount + conflictCount + healthyCount;
  const healthyPct = total > 0 ? healthyCount / total : 1;
  const color = STATUS_COLOR[status] ?? '#22c55e';
  const label = STATUS_LABEL[status] ?? '—';

  const CX = 50;
  const CY = 52;
  const R = 38;

  const trackStart = polarToXY(CX, CY, R, -180);
  const trackEnd = polarToXY(CX, CY, R, 0);

  const fillAngleDeg = -180 + healthyPct * 180;
  const fillEnd = polarToXY(CX, CY, R, fillAngleDeg);
  const largeArc = healthyPct > 0.5 ? 1 : 0;

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
        飞轮健康度
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <svg viewBox="0 0 100 58" style={{ width: 140, height: 81 }} aria-label={`健康度: ${label}`}>
          <path
            d={`M ${trackStart.x} ${trackStart.y} A ${R} ${R} 0 0 1 ${trackEnd.x} ${trackEnd.y}`}
            fill="none"
            stroke="var(--border)"
            strokeWidth="9"
            strokeLinecap="round"
          />
          {healthyPct > 0 && (
            <path
              d={`M ${trackStart.x} ${trackStart.y} A ${R} ${R} 0 ${largeArc} 1 ${fillEnd.x} ${fillEnd.y}`}
              fill="none"
              stroke={color}
              strokeWidth="9"
              strokeLinecap="round"
            />
          )}
          <text x={CX} y={CY - 6} textAnchor="middle" fill={color} fontSize="13" fontWeight="700">
            {label}
          </text>
          <text x={CX} y={CY + 7} textAnchor="middle" fill="var(--text-muted)" fontSize="9">
            {total > 0 ? `${(healthyPct * 100).toFixed(0)}%` : '—'}
          </text>
        </svg>
        <div style={{ display: 'flex', gap: 10, fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
          <span style={{ color: '#22c55e' }}>健康 {healthyCount}</span>
          <span style={{ color: '#f59e0b' }}>停滞 {stalledCount}</span>
          <span style={{ color: '#ef4444' }}>冲突 {conflictCount}</span>
        </div>
      </div>
    </div>
  );
}
