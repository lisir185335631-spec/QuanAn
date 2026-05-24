// PRD-29.9 · Step4 成功标准 sub-component
import { cn } from '@/lib/utils';

interface Step4SuccessCriteriaSectionProps {
  criteria?: Array<{
    period: string;
    desc: string;
  }>;
  className?: string;
}

export function Step4SuccessCriteriaSection({ criteria, className }: Step4SuccessCriteriaSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* H3 row */}
      <h3 className="flex items-center gap-2 text-base font-semibold">
        <span className="text-emerald-400">📊</span>
        <span className="text-emerald-400 font-semibold">成功标准</span>
      </h3>

      {/* 绿色边框大卡 */}
      <div className="border border-emerald-500/30 bg-emerald-500/5 rounded-lg p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(criteria ?? []).map((criterion, i) => (
            <div key={i} className="space-y-1">
              <p className="text-xs text-emerald-400 font-semibold">{criterion.period}</p>
              <p className="text-sm text-on-surface leading-relaxed">{criterion.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
