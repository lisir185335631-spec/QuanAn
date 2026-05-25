import { ArrowLeft, FileText, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  IP_PLAN_BACK_HOME,
  IP_PLAN_H1,
  IP_PLAN_REFRESH,
  IP_PLAN_SUBTITLE_TPL,
} from '@/lib/constants/ipPlan';

interface IpPlanHeaderProps {
  completed: number;
  total: number;
}

export function IpPlanHeader({ completed, total }: IpPlanHeaderProps) {
  return (
    <div data-testid="ip-plan-header">
      {/* top nav row */}
      <div className="flex items-center justify-between mb-6">
        <Link to="/" data-testid="ip-plan-back-home-link">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {IP_PLAN_BACK_HOME}
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
          className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
          data-testid="ip-plan-refresh-btn"
        >
          <RefreshCw className="h-4 w-4" />
          {IP_PLAN_REFRESH}
        </Button>
      </div>

      {/* title area */}
      <div className="text-center mb-6" data-testid="ip-plan-title-area">
        <h1
          className="font-display text-3xl font-bold text-foreground mb-2 flex items-center justify-center gap-2"
          data-testid="ip-plan-h1"
        >
          <FileText className="h-7 w-7 text-primary" />
          {IP_PLAN_H1}
        </h1>
        <p className="font-cn text-muted-foreground" data-testid="ip-plan-subtitle">
          {IP_PLAN_SUBTITLE_TPL(completed, total)}
        </p>
      </div>
    </div>
  );
}
