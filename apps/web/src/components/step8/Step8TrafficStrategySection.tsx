// PRD-29.12 · Step8 引流策略 3 列
import { cn } from '@/lib/utils';

interface TrafficStrategy {
  preLive: string[];
  duringLive: string[];
  postLive: string[];
}

interface Step8TrafficStrategySectionProps {
  strategy?: TrafficStrategy;
  className?: string;
}

function NumberedList({ items }: { items: string[] }) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="grid grid-cols-[24px_1fr] gap-2 items-start">
          <span className="inline-flex items-center justify-center text-xs text-on-surface bg-primary/15 border border-primary/30 rounded-full w-6 h-6 shrink-0">
            {i + 1}
          </span>
          <p className="text-xs text-muted-foreground leading-relaxed">{item}</p>
        </div>
      ))}
    </div>
  );
}

export function Step8TrafficStrategySection({ strategy, className }: Step8TrafficStrategySectionProps) {
  if (!strategy) return null;

  return (
    <div className={cn('space-y-4', className)}>
      {/* H3 row */}
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-base font-semibold text-on-surface flex items-center gap-2">
          📢 引流策略
        </h3>
        <span className="inline-flex items-center rounded border border-primary/25 bg-primary/10 px-2 py-0.5 text-xs text-primary font-semibold">
          三阶段
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 直播前 · 橙边 */}
        <div className="border border-primary/30 bg-primary/5 rounded-lg p-4 space-y-3">
          <p className="text-sm font-semibold text-primary flex items-center gap-1.5">
            📢 直播前
          </p>
          <NumberedList items={strategy.preLive} />
        </div>

        {/* 直播中 · 红边 */}
        <div className="border border-rose-500/30 bg-rose-500/5 rounded-lg p-4 space-y-3">
          <p className="text-sm font-semibold text-rose-400 flex items-center gap-1.5">
            🔴 直播中
          </p>
          <NumberedList items={strategy.duringLive} />
        </div>

        {/* 直播后 · 绿边 */}
        <div className="border border-emerald-500/30 bg-emerald-500/5 rounded-lg p-4 space-y-3">
          <p className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
            📊 直播后
          </p>
          <NumberedList items={strategy.postLive} />
        </div>
      </div>
    </div>
  );
}
