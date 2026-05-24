// PRD-29.12 · Step8 3套方案 tabs
import { cn } from '@/lib/utils';

export interface Step8Plan {
  index: 1 | 2 | 3;
  title: string;
  hookLine: string;
  kpis: {
    targetAudience: string;
    duration: string;
    targetOnline: string;
    targetRevenue: string;
  };
  flowStages: Array<{
    index: number;
    name: string;
  }>;
  stageDetails: Step8StageDetail[];
}

export interface Step8StageDetail {
  index: number;
  name: string;
  duration: string;
  accent: 'normal' | 'green' | 'red' | 'orange';
  scriptLabel: string;
  script: string;
  actions?: string[];
  hooks?: string[];
  interaction?: string;
  conversion?: string;
  urgencyTags?: string[];
  closeTechniques?: string[];
  nextPreview?: string;
}

interface Step8PlanTabsProps {
  plans: Step8Plan[];
  activeIndex: number;
  onChange: (i: number) => void;
}

export function Step8PlanTabs({ plans, activeIndex, onChange }: Step8PlanTabsProps) {
  return (
    <div className="flex gap-3">
      {plans.map((plan) => (
        <button
          key={plan.index}
          type="button"
          onClick={() => onChange(plan.index)}
          className={cn(
            'px-5 py-2 rounded border text-sm transition-colors',
            activeIndex === plan.index
              ? 'bg-primary/15 border-primary/40 text-primary font-semibold'
              : 'border-border/40 text-muted-foreground hover:text-on-surface',
          )}
        >
          方案 {plan.index}
        </button>
      ))}
    </div>
  );
}
