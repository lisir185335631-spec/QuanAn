import { Circle } from 'lucide-react';

import type { TaskMockItem } from '@/lib/constants/daily-tasks';

import { TaskCategoryTag } from './TaskCategoryTag';
import { TaskPriorityTag } from './TaskPriorityTag';

interface TaskCardProps {
  task: TaskMockItem;
}

export function TaskCard({ task }: TaskCardProps) {
  return (
    <div
      data-testid={`task-card-${task.id}`}
      className="rounded-xl border border-border bg-card p-6 space-y-3"
    >
      <div className="flex items-start gap-3">
        <Circle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-on-surface leading-snug">{task.title}</h3>
            <TaskPriorityTag priority={task.priority} />
            <TaskCategoryTag category={task.category} />
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{task.desc}</p>
        </div>
      </div>
    </div>
  );
}
