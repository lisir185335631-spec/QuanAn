import { ArrowRight, History } from 'lucide-react';

import { DIAGNOSIS_BUTTONS } from '@/lib/constants/diagnosis';

interface ReportFooterActionsProps {
  onRestart: () => void;
  onHistory: () => void;
  onTodayTasks: () => void;
}

export function ReportFooterActions({ onRestart, onHistory, onTodayTasks }: ReportFooterActionsProps) {
  return (
    <div
      data-testid="report-footer-actions"
      className="flex flex-wrap items-center justify-center gap-4 py-4"
    >
      <button
        type="button"
        onClick={onRestart}
        data-testid="restart-diagnosis-button"
        className="rounded-md border border-border px-5 py-2.5 text-base font-label text-on-surface hover:border-primary/40 transition-colors"
      >
        {DIAGNOSIS_BUTTONS.restart}
      </button>
      <button
        type="button"
        onClick={onHistory}
        data-testid="diagnosis-history-button"
        className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-base font-label text-on-surface hover:border-primary/40 transition-colors"
      >
        <History className="w-4 h-4" />
        {DIAGNOSIS_BUTTONS.history}
      </button>
      <button
        type="button"
        onClick={onTodayTasks}
        data-testid="today-tasks-button"
        className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-base font-label text-on-primary hover:bg-primary/90 transition-colors"
      >
        {DIAGNOSIS_BUTTONS.todayTasks}
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
