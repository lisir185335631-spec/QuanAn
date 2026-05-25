import { IP_PLAN_PROGRESS_LABEL } from '@/lib/constants/ipPlan';

interface IpPlanProgressCardProps {
  percent: number;
}

export function IpPlanProgressCard({ percent }: IpPlanProgressCardProps) {
  return (
    <div
      className="rounded-xl border bg-card p-6"
      data-testid="ip-plan-progress-card"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-cn text-sm text-muted-foreground" data-testid="ip-plan-progress-label">
          {IP_PLAN_PROGRESS_LABEL}
        </span>
        <span
          className="text-primary font-bold text-lg"
          data-testid="ip-plan-progress-percent"
        >
          {percent}%
        </span>
      </div>
      <div className="w-full h-4 bg-muted/20 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
          data-testid="ip-plan-progress-bar-fill"
        />
      </div>
    </div>
  );
}
