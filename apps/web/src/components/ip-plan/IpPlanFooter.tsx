import { ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { IP_PLAN_FOOTER_TPL, IP_PLAN_NEXT_BTN } from '@/lib/constants/ipPlan';

interface IpPlanFooterProps {
  remaining: number;
  onNext: () => void;
}

export function IpPlanFooter({ remaining, onNext }: IpPlanFooterProps) {
  return (
    <div className="text-center space-y-4 py-4" data-testid="ip-plan-footer">
      <p className="text-sm text-muted-foreground" data-testid="ip-plan-footer-text">
        {IP_PLAN_FOOTER_TPL(remaining)}
      </p>
      <Button
        onClick={onNext}
        className="gap-2"
        data-testid="ip-plan-next-btn"
      >
        {IP_PLAN_NEXT_BTN}
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
