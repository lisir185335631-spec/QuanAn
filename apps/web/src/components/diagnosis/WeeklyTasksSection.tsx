import { C, F } from '@/components/home-next/ikb/system';
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
      className="lg-glass lg-spec rounded-xl p-6 flex flex-col gap-5"
    >
      <div className="flex items-center gap-2">
        <span
          className="material-symbols-outlined text-[20px]"
          aria-hidden={true}
          style={{ color: C.ikb, filter: 'drop-shadow(0 1px 4px rgba(5,12,34,.8))' }}
        >
          event_available
        </span>
        <h2
          className="text-[24px] font-bold"
          style={{ color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}
        >
          {REPORT_HEADING_WEEKLY}
        </h2>
      </div>
      <div className="flex flex-col gap-3">
        {tasks.map((task, i) => (
          <div key={i} className="flex items-start gap-3">
            {/* check_circle icon on weekly tasks = "建议/做得好" semantic — preserved as accent color */}
            <span
              className="material-symbols-outlined mt-0.5 text-[18px] shrink-0"
              aria-hidden={true}
              style={{ color: 'rgba(74,222,128,0.85)', filter: 'drop-shadow(0 1px 4px rgba(5,12,34,.8))' }}
            >
              check_circle
            </span>
            <p
              className="text-[15px]"
              style={{ color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}
            >
              <span className="font-bold" style={{ color: C.ink }}>{task.heading}</span>
              {task.body}
            </p>
          </div>
        ))}
      </div>
      <p
        className="text-[15px] mt-2 pt-4"
        style={{
          color: 'rgba(255,255,255,0.60)',
          fontFamily: F.cn,
          textShadow: C.textShadow,
          borderTop: `1px solid ${C.line}`,
        }}
      >
        {closing}
      </p>
    </div>
  );
}
