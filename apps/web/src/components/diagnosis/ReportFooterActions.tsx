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
      className="flex flex-wrap items-center justify-center gap-4 py-6"
    >
      <button
        type="button"
        onClick={onRestart}
        data-testid="restart-diagnosis-button"
        aria-label={DIAGNOSIS_BUTTONS.restart}
        className="ikb-focusring flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-5 py-2.5 text-[14px] font-semibold text-[#444653] transition-colors hover:bg-[#F3F5FC]"
        style={{ ['--ikb-hover-border' as string]: 'rgba(43,83,230,0.30)' }}
      >
        <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>refresh</span>
        {DIAGNOSIS_BUTTONS.restart}
      </button>
      <button
        type="button"
        onClick={onHistory}
        data-testid="diagnosis-history-button"
        aria-label={DIAGNOSIS_BUTTONS.history}
        className="ikb-focusring flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-5 py-2.5 text-[14px] font-semibold text-[#444653] transition-colors hover:bg-[#F3F5FC]"
      >
        <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>history</span>
        {DIAGNOSIS_BUTTONS.history}
      </button>
      <button
        type="button"
        onClick={onTodayTasks}
        data-testid="today-tasks-button"
        aria-label={DIAGNOSIS_BUTTONS.todayTasks}
        className="ikb-gradbtn flex items-center gap-2 rounded-xl px-6 py-2.5 text-[14px] font-bold text-white shadow-sm transition-all"
      >
        {DIAGNOSIS_BUTTONS.todayTasks}
        <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>arrow_forward</span>
      </button>
    </div>
  );
}
