import { Link } from 'react-router-dom';

import { CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  HOME_PROGRESS_OVERALL,
  HOME_PROGRESS_PERCENT,
  HOME_PROGRESS_SUBTITLE,
  HOME_PROGRESS_TITLE,
  HOME_PROGRESS_VIEW_PLAN,
  HOME_PROGRESS_VIEW_PLAN_HREF,
  HOME_STEPS,
} from '@/lib/constants/home';

export function HomeProgressBlock() {
  return (
    <section>
      <div className="rounded-xl border border-primary/20 bg-card p-6">
        {/* header row */}
        <div className="flex items-start justify-between">
          <div>
            <p className="font-display text-xl font-bold text-foreground">{HOME_PROGRESS_TITLE}</p>
            <p className="font-cn text-sm text-muted-foreground mt-1">{HOME_PROGRESS_SUBTITLE}</p>
          </div>
          <Link to={HOME_PROGRESS_VIEW_PLAN_HREF}>
            <Button
              variant="outline"
              size="sm"
              className="font-cn border-primary/30 text-primary hover:bg-primary/10 shrink-0"
            >
              {HOME_PROGRESS_VIEW_PLAN} →
            </Button>
          </Link>
        </div>

        {/* progress row */}
        <div className="flex justify-between items-center mt-4">
          <span className="font-cn text-sm text-muted-foreground">{HOME_PROGRESS_OVERALL}</span>
          <span className="font-display text-sm font-bold text-primary">{HOME_PROGRESS_PERCENT}</span>
        </div>

        {/* progress bar */}
        <div className="h-2 bg-muted/20 rounded-full overflow-hidden mt-2">
          <div className="h-full bg-primary rounded-full w-full" />
        </div>

        {/* 9 step grid */}
        <div className="grid grid-cols-9 gap-2 mt-4">
          {HOME_STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.label}
                className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-3 flex flex-col items-center gap-2 relative"
              >
                <CheckCircle2 className="absolute -top-1.5 -right-1.5 w-5 h-5 text-primary fill-primary" />
                <Icon className="w-8 h-8 text-primary" />
                <span className="font-cn text-xs text-foreground text-center">{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
