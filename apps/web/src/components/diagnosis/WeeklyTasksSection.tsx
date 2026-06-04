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
      className="rounded-xl p-6 flex flex-col gap-5 pw-shadow-soft ikb-hovercard"
      style={{
        border: '1px solid rgba(22,32,72,0.13)',
        background: 'linear-gradient(135deg, #F3F5FC, #FFFFFF)',
      }}
    >
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px]" aria-hidden={true} style={{ color: '#2B53E6' }}>event_available</span>
        <h2 className="text-[24px] font-bold" style={{ color: '#161D33' }}>{REPORT_HEADING_WEEKLY}</h2>
      </div>
      <div className="flex flex-col gap-3">
        {tasks.map((task, i) => (
          <div key={i} className="flex items-start gap-3">
            {/* check_circle icon on weekly tasks = "建议/做得好" semantic → deep green preserved */}
            <span className="material-symbols-outlined mt-0.5 text-[18px] shrink-0" aria-hidden={true} style={{ color: '#16a34a' }}>check_circle</span>
            <p className="text-[15px] text-[#444653]">
              <span className="font-bold" style={{ color: '#161D33' }}>{task.heading}</span>
              {task.body}
            </p>
          </div>
        ))}
      </div>
      <p className="text-[15px] text-[#444653] mt-2 pt-4" style={{ borderTop: '1px solid rgba(22,32,72,0.08)' }}>{closing}</p>
    </div>
  );
}
