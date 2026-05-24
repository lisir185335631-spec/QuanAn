// PRD-29.9 · Step4 每日作息 sub-component
import { FlameIcon } from '@/components/icons/aiipznt-icons';
import { SubCard } from '@/components/ui/sub-card';
import { cn } from '@/lib/utils';

export interface Step4ScheduleItem {
  time: string;
  title: string;
  desc: string;
}

interface Step4DailyScheduleSectionProps {
  schedule?: {
    morning: Step4ScheduleItem[];
    afternoon: Step4ScheduleItem[];
    evening: Step4ScheduleItem[];
  };
  className?: string;
}

function ScheduleColumn({
  label,
  items,
}: {
  label: string;
  items: Step4ScheduleItem[];
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-primary">{label}</p>
      {items.map((item, i) => (
        <div key={i} className="space-y-1">
          <p className="text-xs text-primary font-mono">{item.time}</p>
          <p className="text-sm font-semibold text-on-surface">{item.title}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
        </div>
      ))}
    </div>
  );
}

export function Step4DailyScheduleSection({ schedule, className }: Step4DailyScheduleSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* H3 row */}
      <h3 className="flex items-center gap-2 text-base font-semibold text-on-surface">
        <FlameIcon className="h-4 w-4 shrink-0" size={4} />
        🕐 每日作息安排
      </h3>

      <SubCard>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ScheduleColumn label="☀️ 上午" items={schedule?.morning ?? []} />
          <ScheduleColumn label="☁️ 下午" items={schedule?.afternoon ?? []} />
          <ScheduleColumn label="🌙 晚上" items={schedule?.evening ?? []} />
        </div>
      </SubCard>
    </div>
  );
}
