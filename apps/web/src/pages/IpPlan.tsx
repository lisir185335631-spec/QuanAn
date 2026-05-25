import { useNavigate } from 'react-router-dom';

import { IpPlanFooter } from '@/components/ip-plan/IpPlanFooter';
import { IpPlanHeader } from '@/components/ip-plan/IpPlanHeader';
import { IpPlanProgressCard } from '@/components/ip-plan/IpPlanProgressCard';
import { IpPlanStepList } from '@/components/ip-plan/IpPlanStepList';
import { IP_PLAN_STEPS } from '@/lib/constants/ipPlan';

export default function IpPlan() {
  const navigate = useNavigate();
  const completed = IP_PLAN_STEPS.filter((s) => s.done).length;
  const total = IP_PLAN_STEPS.length;
  const remaining = total - completed;
  const firstUncompleted = IP_PLAN_STEPS.find((s) => !s.done);

  return (
    <main
      className="flex-1 container mx-auto max-w-4xl py-8 space-y-6"
      data-testid="ip-plan-page"
    >
      <IpPlanHeader completed={completed} total={total} />
      <IpPlanProgressCard percent={Math.round((completed / total) * 100)} />
      <IpPlanStepList steps={IP_PLAN_STEPS} />
      {remaining > 0 && firstUncompleted && (
        <IpPlanFooter
          remaining={remaining}
          onNext={() => { void navigate(firstUncompleted.href); }}
        />
      )}
    </main>
  );
}
