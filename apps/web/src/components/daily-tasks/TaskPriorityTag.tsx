import type { TaskPriority } from '@/lib/constants/daily-tasks';
import { PRIORITY_LABELS } from '@/lib/constants/daily-tasks';

interface TaskPriorityTagProps {
  priority: TaskPriority;
}

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  high: 'bg-red-500/20 text-red-400',
  medium: 'bg-primary/10 text-primary',
  low: 'bg-muted text-muted-foreground',
};

export function TaskPriorityTag({ priority }: TaskPriorityTagProps) {
  return (
    <span
      data-testid="task-priority-tag"
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[priority]}`}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
