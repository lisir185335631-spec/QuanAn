import {
  DAILY_TASKS_PROGRESS_COMPLETED,
  DAILY_TASKS_PROGRESS_LABEL,
  DAILY_TASKS_PROGRESS_TOTAL,
} from '@/lib/constants/daily-tasks';

export function TodayProgressCard() {
  return (
    <div
      data-testid="today-progress-card"
      className="rounded-xl border border-border bg-card p-6 space-y-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{DAILY_TASKS_PROGRESS_LABEL}</span>
        <span className="text-sm font-bold text-primary">
          {DAILY_TASKS_PROGRESS_COMPLETED}/{DAILY_TASKS_PROGRESS_TOTAL}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className="h-2 rounded-full bg-primary"
          style={{
            width: `${DAILY_TASKS_PROGRESS_TOTAL > 0 ? (DAILY_TASKS_PROGRESS_COMPLETED / DAILY_TASKS_PROGRESS_TOTAL) * 100 : 0}%`,
          }}
        />
      </div>
    </div>
  );
}
