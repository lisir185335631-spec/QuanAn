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
      className="rounded-xl border border-[#e5e7eb] bg-white p-6 flex flex-col gap-5 pw-shadow-soft"
    >
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px] text-[#002fa7]" aria-hidden="true">event_available</span>
        <h2 className="text-[24px] font-bold text-[#111827]">{REPORT_HEADING_WEEKLY}</h2>
      </div>
      <div className="flex flex-col gap-3">
        {tasks.map((task, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="material-symbols-outlined mt-0.5 text-[18px] text-[#10b981] shrink-0" aria-hidden="true">check_circle</span>
            <p className="text-[15px] text-[#444653]">
              <span className="font-bold text-[#111827]">{task.heading}</span>
              {task.body}
            </p>
          </div>
        ))}
      </div>
      <p className="text-[15px] text-[#444653] mt-2 border-t border-[#f1f3f9] pt-4">{closing}</p>
    </div>
  );
}
