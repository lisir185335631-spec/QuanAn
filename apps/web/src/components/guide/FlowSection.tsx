import { ChevronRight, Rocket } from 'lucide-react';

import { GUIDE_FLOW, GUIDE_FLOW_TITLE } from '@/lib/constants/guide';

import { FlowCard } from './FlowCard';

export function FlowSection() {
  return (
    <section data-testid="flow-section" className="rounded-xl border bg-card p-6">
      <h2 className="font-cn text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <Rocket className="w-5 h-5 text-primary flex-shrink-0" />
        {GUIDE_FLOW_TITLE}
      </h2>
      <div className="flex flex-col md:flex-row items-stretch gap-2">
        {GUIDE_FLOW.map((step, i) => (
          <div key={step.name} className="flex items-center gap-2 flex-1">
            <div className="flex-1">
              <FlowCard step={step} index={i} />
            </div>
            {i < GUIDE_FLOW.length - 1 && (
              <ChevronRight
                data-testid={`flow-arrow-${i}`}
                className="hidden md:block w-5 h-5 text-primary flex-shrink-0"
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
