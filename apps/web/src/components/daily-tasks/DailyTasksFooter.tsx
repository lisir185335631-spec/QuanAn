import { ArrowRight, Stethoscope } from 'lucide-react';

import {
  DAILY_TASKS_FOOTER_BTN_1,
  DAILY_TASKS_FOOTER_BTN_2,
} from '@/lib/constants/daily-tasks';

interface DailyTasksFooterProps {
  onIPDiagnosis: () => void;
  onContinue: () => void;
}

export function DailyTasksFooter({ onIPDiagnosis, onContinue }: DailyTasksFooterProps) {
  return (
    <div
      data-testid="daily-tasks-footer"
      className="flex flex-wrap items-center justify-center gap-4 py-4"
    >
      <button
        type="button"
        onClick={onIPDiagnosis}
        data-testid="footer-btn-diagnosis"
        className="inline-flex items-center gap-2 rounded-md border border-border bg-transparent px-5 py-2.5 text-base font-label text-on-surface hover:border-primary/40 transition-colors"
      >
        <Stethoscope className="w-4 h-4" />
        {DAILY_TASKS_FOOTER_BTN_1}
      </button>
      <button
        type="button"
        onClick={onContinue}
        data-testid="footer-btn-continue"
        className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-base font-label font-bold text-on-primary hover:bg-primary/90 transition-colors"
      >
        {DAILY_TASKS_FOOTER_BTN_2}
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
