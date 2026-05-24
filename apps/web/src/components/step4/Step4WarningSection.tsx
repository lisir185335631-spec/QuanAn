// PRD-29.9 · Step4 危险信号预警 sub-component
import { cn } from '@/lib/utils';

interface Step4WarningSectionProps {
  warnings?: Array<{
    signal: string;
    meaning: string;
    solution: string;
  }>;
  className?: string;
}

export function Step4WarningSection({ warnings, className }: Step4WarningSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* H3 row */}
      <h3 className="flex items-center gap-2 text-base font-semibold">
        <span className="text-rose-400">⚠️</span>
        <span className="text-rose-400 font-semibold">危险信号预警</span>
      </h3>

      {/* 红色边框大卡 */}
      <div className="border border-rose-500/30 bg-rose-500/5 rounded-lg p-5">
        <div className="space-y-4">
          {(warnings ?? []).map((warning, i) => (
            <div key={i} className="space-y-1">
              <p className="text-sm font-semibold text-rose-400">{warning.signal}</p>
              <p className="text-xs text-muted-foreground">含义：{warning.meaning}</p>
              <p className="text-xs text-emerald-400">解决方案：{warning.solution}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
