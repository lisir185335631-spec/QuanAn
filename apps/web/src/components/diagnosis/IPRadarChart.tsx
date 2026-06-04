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

// Colors for each vertex dot — rotate through IKB brand palette
const DOT_COLORS = ['#2B53E6', '#EF3E6B', '#7A3BE0', '#2B53E6', '#EF3E6B', '#2B53E6', '#7A3BE0'];

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
  const dataPolygon = dataPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // Label positions (slightly outside maxR)
  const labelR = maxR + 22;
  const labelPositions = angles.map((a) => polarToCartesian(cx, cy, labelR, a));

  return (
    <div
      data-testid="ip-radar-chart"
      className="rounded-xl p-6 flex flex-col items-center justify-center pw-shadow-soft ikb-hovercard"
      style={{
        border: '1px solid rgba(22,32,72,0.13)',
        background: 'linear-gradient(135deg, #F3F5FC, #FFFFFF)',
      }}
    >
      <svg width="300" height="300" viewBox="0 0 300 300">
        <defs>
          <linearGradient id="dg-radar-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2B53E6" stopOpacity="0.35" />
            <stop offset="52%" stopColor="#7A3BE0" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#EF3E6B" stopOpacity="0.10" />
          </linearGradient>
        </defs>
        {/* Grid rings */}
        {gridRings.map((pts, ri) => (
          <polygon
            key={ri}
            points={pts}
            fill="none"
            stroke="#eef1f6"
            strokeWidth="1"
          />
        ))}
        {/* Axis lines */}
        {angles.map((a, i) => {
          const outer = polarToCartesian(cx, cy, maxR, a);
          return (
            <line
              key={i}
              x1={cx} y1={cy}
              x2={outer.x.toFixed(1)} y2={outer.y.toFixed(1)}
              stroke="#e8ebf2"
              strokeWidth="1"
            />
          );
        })}
        {/* Data polygon — brand gradient fill */}
        <polygon
          points={dataPolygon}
          fill="url(#dg-radar-fill)"
          stroke="#2B53E6"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Vertex dots — three brand colors */}
        {dataPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x.toFixed(1)}
            cy={p.y.toFixed(1)}
            r="3.2"
            fill="#fff"
            stroke={DOT_COLORS[i % DOT_COLORS.length]}
            strokeWidth="2"
          />
        ))}
        {/* Labels */}
        {scores.map((s, i) => {
          const pos = labelPositions[i]!;
          return (
            <text
              key={s.id}
              x={pos.x.toFixed(1)}
              y={pos.y.toFixed(1)}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="11"
              fill="#6b7280"
              fontWeight="600"
            >
              {s.radarLabel}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
