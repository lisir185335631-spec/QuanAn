import type { WeeklyTaskItem } from '@/lib/constants/diagnosis';
import { REPORT_HEADING_WEEKLY } from '@/lib/constants/diagnosis';

interface WeeklyTasksSectionProps {
  tasks: ReadonlyArray<WeeklyTaskItem>;
  closing: string;
}

export function WeeklyTasksSection({ tasks, closing }: WeeklyTasksSectionProps) {
  return (
    <div
      data-testid="weekly-tasks-section"
      className="rounded-xl border border-border bg-card p-6 flex flex-col gap-5"
    >
      <h2 className="text-2xl font-bold text-on-surface">{REPORT_HEADING_WEEKLY}</h2>
      <div className="flex flex-col gap-3">
        {tasks.map((task, i) => (
          <p key={i} className="text-base text-muted-foreground">
            <span className="font-bold text-on-surface">{task.heading}</span>
            {task.body}
          </p>
        ))}
      </div>
      <p className="text-base text-muted-foreground mt-2">{closing}</p>
    </div>
  );
}
