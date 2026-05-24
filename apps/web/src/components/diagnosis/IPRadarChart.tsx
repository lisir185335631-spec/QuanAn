interface DimensionScore {
  id: string;
  shortLabel: string;
  radarLabel: string;
  score: number;
}

interface IPRadarChartProps {
  scores: ReadonlyArray<DimensionScore>;
}

// 7-pointed radar chart: top = index 6 (authentic/状态), going clockwise
// Order per SPEC §4.1: 顶=状态, 右上=包装, 右下=流, 底右=价值, 底左=案例, 左下=设, 左上=定位
const RADAR_ORDER = ['authentic', 'branding', 'traffic', 'value', 'case', 'persona', 'positioning'];

function polarToCartesian(cx: number, cy: number, r: number, angleRad: number) {
  return {
    x: cx + r * Math.sin(angleRad),
    y: cy - r * Math.cos(angleRad),
  };
}

export function IPRadarChart({ scores: rawScores }: IPRadarChartProps) {
  const cx = 150;
  const cy = 150;
  const maxR = 100;
  const rings = 7;
  const n = 7;
  const maxScore = 10;

  // Re-order scores per RADAR_ORDER
  const scores = RADAR_ORDER.map(
    (id) => rawScores.find((s) => s.id === id) ?? { id, shortLabel: id, radarLabel: id, score: 0 },
  );

  const angles = Array.from({ length: n }, (_, i) => (2 * Math.PI * i) / n);

  // Grid ring polygons
  const gridRings = Array.from({ length: rings }, (_, ri) => {
    const r = (maxR / rings) * (ri + 1);
    const pts = angles.map((a) => polarToCartesian(cx, cy, r, a));
    return pts.map((p) => `${p.x},${p.y}`).join(' ');
  });

  // Data polygon
  const dataPoints = scores.map((s, i) => {
    const r = maxScore > 0 ? (s.score / maxScore) * maxR : 0;
    return polarToCartesian(cx, cy, r, angles[i]!);
  });
  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  // Label positions (slightly outside maxR)
  const labelR = maxR + 22;
  const labelPositions = angles.map((a) => polarToCartesian(cx, cy, labelR, a));

  return (
    <div
      data-testid="ip-radar-chart"
      className="rounded-xl border border-border bg-card p-6 flex flex-col items-center justify-center"
    >
      <svg width="300" height="300" viewBox="0 0 300 300">
        {/* Grid rings */}
        {gridRings.map((pts, ri) => (
          <polygon
            key={ri}
            points={pts}
            fill="none"
            stroke="rgb(100,100,120)"
            strokeWidth="0.5"
          />
        ))}
        {/* Axis lines */}
        {angles.map((a, i) => {
          const outer = polarToCartesian(cx, cy, maxR, a);
          return (
            <line
              key={i}
              x1={cx} y1={cy}
              x2={outer.x} y2={outer.y}
              stroke="rgb(100,100,120)"
              strokeWidth="0.5"
            />
          );
        })}
        {/* Data polygon */}
        <polygon
          points={dataPolygon}
          fill="rgba(59,130,246,0.15)"
          stroke="rgb(59,130,246)"
          strokeWidth="1.5"
        />
        {/* Center dot */}
        <circle cx={cx} cy={cy} r={5} fill="rgb(34,211,238)" />
        {/* Labels */}
        {scores.map((s, i) => {
          const pos = labelPositions[i]!;
          return (
            <text
              key={s.id}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="11"
              fill="rgb(160,160,180)"
            >
              {s.radarLabel}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
