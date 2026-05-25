/**
 * StatCard · single stat card · icon + value large + label gray
 * variant: good | needsImprove | learning | satisfaction
 * satisfaction variant adds "-0%" chip top-right
 */
import { Brain, ThumbsDown, ThumbsUp, TrendingUp } from 'lucide-react';

type StatVariant = 'good' | 'needsImprove' | 'learning' | 'satisfaction';

interface StatCardProps {
  variant: StatVariant;
  label: string;
  value: number;
  unit?: string;
  showDelta?: boolean;
}

const ICON_MAP: Record<StatVariant, React.ReactNode> = {
  good: <ThumbsUp className="w-5 h-5 text-emerald-400" />,
  needsImprove: <ThumbsDown className="w-5 h-5 text-red-400" />,
  learning: <Brain className="w-5 h-5 text-primary" />,
  satisfaction: <TrendingUp className="w-5 h-5 text-primary" />,
};

export function StatCard({ variant, label, value, unit = '', showDelta = false }: StatCardProps) {
  return (
    <div
      data-testid={`stat-card-${variant}`}
      className="bg-card/40 backdrop-blur-md border border-border/40 rounded-lg p-4 relative"
    >
      {/* top-right chip for satisfaction */}
      {showDelta && (
        <span
          data-testid="stat-delta-chip"
          className="absolute top-3 right-3 text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full"
        >
          - 0%
        </span>
      )}

      <div className="flex flex-col gap-2">
        <div>{ICON_MAP[variant]}</div>
        <p className="text-3xl font-bold text-on-surface">
          {value}
          {unit}
        </p>
        <p
          data-testid={`stat-label-${variant}`}
          className="text-xs text-muted-foreground"
        >
          {label}
        </p>
      </div>
    </div>
  );
}
