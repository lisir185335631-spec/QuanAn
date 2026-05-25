import { ArrowRight } from 'lucide-react';

import {
  HOME_WORKFLOW_STEPS,
  HOME_WORKFLOW_SUBTITLE,
  HOME_WORKFLOW_TITLE,
} from '@/lib/constants/home';

export function HomeWorkflow() {
  return (
    <section className="mt-16">
      {/* title */}
      <h2 className="font-display text-5xl md:text-6xl font-black text-primary text-center tracking-widest">
        {HOME_WORKFLOW_TITLE}
      </h2>
      {/* subtitle */}
      <p className="font-cn text-sm text-muted-foreground text-center mt-3">
        {HOME_WORKFLOW_SUBTITLE}
      </p>

      {/* 6 steps + arrows */}
      <div className="mt-10 flex items-center justify-between">
        {HOME_WORKFLOW_STEPS.map((step, i) => (
          <div key={step.num} className="flex items-center">
            {/* step */}
            <div className="flex flex-col items-center text-center">
              <div className="rounded-lg border border-primary/40 px-4 py-2">
                <span className="font-display text-2xl font-black text-primary">{step.num}</span>
              </div>
              <span className="font-cn text-base font-bold text-foreground mt-3">{step.title}</span>
              <span className="font-cn text-xs text-muted-foreground mt-1">{step.desc}</span>
            </div>
            {/* arrow after every step (including last, per SPEC: 第 6 step 之后也有箭头) */}
            {i < HOME_WORKFLOW_STEPS.length - 1 && (
              <ArrowRight className="w-5 h-5 text-muted-foreground/30 mx-3 shrink-0" />
            )}
          </div>
        ))}
        {/* trailing arrow after last step — implies continuation */}
        <ArrowRight className="w-5 h-5 text-muted-foreground/30 ml-3 shrink-0" />
      </div>
    </section>
  );
}
