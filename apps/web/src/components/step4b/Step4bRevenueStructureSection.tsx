// PRD-29.10 · Step4b 收入结构 sub-component
import { cn } from '@/lib/utils';

interface RevenueItem {
  name: string;
  percentage: string;
  desc: string;
  highlight?: boolean;
}

interface Step4bRevenueStructureSectionProps {
  structure?: RevenueItem[];
  className?: string;
}

export function Step4bRevenueStructureSection({ structure, className }: Step4bRevenueStructureSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* H3 row */}
      <h3 className="text-base font-semibold text-on-surface flex items-center gap-2">
        📈 收入结构
      </h3>

      <div className="space-y-3">
        {(structure ?? []).map((item, i) => (
          <div
            key={i}
            className={cn(
              'rounded-lg p-4',
              item.highlight
                ? 'border border-primary/40 bg-primary/8'
                : 'border border-border/40',
            )}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-on-surface">{item.name}</p>
              <span className="text-primary font-bold">{item.percentage}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
