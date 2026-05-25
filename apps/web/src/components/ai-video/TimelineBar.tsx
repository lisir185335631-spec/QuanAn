/**
 * TimelineBar.tsx — 10 段 timeline bar
 * 每段标 Ns 文字 · 金调 opacity 不同
 */
interface TimelineBarProps {
  segments: ReadonlyArray<string>;
}

// opacity 按时长简化: 3s→0.5 5s→0.6 10s→0.75 12s→0.8 15s→1.0
const OPACITY_MAP: Record<string, number> = {
  '3s': 0.5,
  '5s': 0.6,
  '10s': 0.75,
  '12s': 0.8,
  '15s': 1.0,
};

export function TimelineBar({ segments }: TimelineBarProps) {
  return (
    <div className="flex gap-1" data-testid="ai-video-timeline">
      {segments.map((seg, idx) => {
        const opacity = OPACITY_MAP[seg] ?? 0.7;
        return (
          <div
            key={idx}
            className="flex-1 h-12 rounded flex items-center justify-center bg-primary text-xs font-medium text-on-primary"
            style={{ opacity }}
            data-testid={`timeline-seg-${idx + 1}`}
          >
            {seg}
          </div>
        );
      })}
    </div>
  );
}
