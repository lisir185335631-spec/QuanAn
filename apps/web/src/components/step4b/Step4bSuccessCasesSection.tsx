// PRD-29.10 · Step4b 成功案例参考 sub-component
import { SubCard } from '@/components/ui/sub-card';
import { cn } from '@/lib/utils';

interface SuccessCase {
  title: string;
  category: string;
  journey: string;
  outcome: string;
  insight: string;
}

interface Step4bSuccessCasesSectionProps {
  cases?: SuccessCase[];
  className?: string;
}

export function Step4bSuccessCasesSection({ cases, className }: Step4bSuccessCasesSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* H3 row */}
      <h3 className="text-base font-semibold text-on-surface flex items-center gap-2">
        🏆 成功案例参考
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(cases ?? []).map((c, i) => (
          <SubCard key={i}>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-on-surface">{c.title}</p>
              <p className="text-xs text-muted-foreground">{c.category} · {c.journey}</p>
              <p className="text-xs text-emerald-400 font-semibold">{c.outcome}</p>
              <p className="text-xs text-primary">{c.insight}</p>
            </div>
          </SubCard>
        ))}
      </div>
    </div>
  );
}
