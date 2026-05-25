import type { FlowStep } from '@/lib/constants/guide';

interface FlowCardProps {
  step: FlowStep;
  index: number;
}

export function FlowCard({ step, index }: FlowCardProps) {
  const Icon = step.icon;
  return (
    <div
      data-testid={`flow-card-${index}`}
      className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center"
    >
      <div className="w-12 h-12 rounded-full border border-primary/40 bg-primary/10 flex items-center justify-center">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <span className="font-cn text-sm font-bold text-foreground">{step.name}</span>
      <span className="font-cn text-xs text-muted-foreground">{step.sub}</span>
    </div>
  );
}
