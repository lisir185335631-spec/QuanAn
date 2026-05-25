import { Calendar } from 'lucide-react';

import { DAILY_TASKS_CHIP } from '@/lib/constants/daily-tasks';

export function DailyTasksChip() {
  return (
    <div
      data-testid="daily-tasks-chip"
      className="inline-flex items-center gap-2 rounded-full border border-primary/60 bg-card px-4 py-2"
    >
      <Calendar className="w-4 h-4 text-primary" />
      <span className="text-sm text-primary">{DAILY_TASKS_CHIP}</span>
    </div>
  );
}
