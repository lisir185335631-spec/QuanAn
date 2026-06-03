// PRD-29.13 · 私域成交流程 · SOP 执行流程 5 step
import { ChevronRight } from 'lucide-react';

import { SubCard } from '@/components/ui/sub-card';
import { cn } from '@/lib/utils';

interface SopStep {
  day: string;
  title: string;
  goal: string;
  desc: string;
}

interface PrivateDomainSopSectionProps {
  sop: SopStep[];
  className?: string;
}

export function PrivateDomainSopSection({ sop, className }: PrivateDomainSopSectionProps) {
  return (
    <SubCard className={cn('space-y-4', className)}>
      <h3 className="text-base font-semibold text-on-surface flex items-center gap-2">
        📅 SOP执行流程
      </h3>
      <div className="space-y-4">
        {sop.map((step, i) => (
          <div key={i} className="grid grid-cols-[80px_1fr_24px] gap-4 items-start">
            {/* 左 · Day chip */}
            <div className="flex items-start pt-0.5">
              <span className="bg-primary/15 border border-primary/30 text-primary rounded-full px-3 py-1 text-xs font-mono whitespace-nowrap">
                {step.day}
              </span>
            </div>

            {/* 中 · title + goal + desc */}
            <div className="space-y-1">
              <p className="text-sm font-semibold text-on-surface">{step.title}</p>
              <span className="inline-block text-xs text-muted-foreground bg-border/20 rounded px-2 py-0.5">
                目标：{step.goal}
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
            </div>

            {/* 右 · chevron */}
            <div className="flex items-start pt-1">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        ))}
      </div>
    </SubCard>
  );
}
