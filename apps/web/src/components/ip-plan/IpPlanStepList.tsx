import { IpPlanStepCard } from '@/components/ip-plan/IpPlanStepCard';
import type { IpPlanStep } from '@/lib/constants/ipPlan';

interface IpPlanStepListProps {
  steps: ReadonlyArray<IpPlanStep>;
}

export function IpPlanStepList({ steps }: IpPlanStepListProps) {
  return (
    <div className="space-y-4" data-testid="ip-plan-step-list">
      {steps.map((step, index) => (
        <IpPlanStepCard key={step.id} step={step} index={index} />
      ))}
    </div>
  );
}
