/**
 * /daily-tasks · 今日行动清单 (sally 真实页 1:1 复刻)
 * mock-first · 默认 render DAILY_TASKS_MOCK 4 task
 */
import { CheckCircle2, Flame, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { DailyTasksChip } from '@/components/daily-tasks/DailyTasksChip';
import { DailyTasksFooter } from '@/components/daily-tasks/DailyTasksFooter';
import { StatCard } from '@/components/daily-tasks/StatCard';
import { TaskCard } from '@/components/daily-tasks/TaskCard';
import { TodayProgressCard } from '@/components/daily-tasks/TodayProgressCard';
import {
  DAILY_TASKS_FOOTER_BTN_1_HREF,
  DAILY_TASKS_FOOTER_BTN_2_HREF,
  DAILY_TASKS_H1,
  DAILY_TASKS_MOCK,
  DAILY_TASKS_STATS,
  DAILY_TASKS_SUBTITLE,
} from '@/lib/constants/daily-tasks';

type LucideComponent = typeof Flame | typeof Trophy | typeof CheckCircle2;

// Icon + color metadata aligned to DAILY_TASKS_STATS order (streak / total-days / total-tasks)
const STAT_ICON_META: Array<{ Icon: LucideComponent; iconColor: string; valueColor: string }> = [
  { Icon: Flame, iconColor: 'text-orange-500', valueColor: 'text-orange-500' },
  { Icon: Trophy, iconColor: 'text-primary', valueColor: 'text-primary' },
  { Icon: CheckCircle2, iconColor: 'text-green-500', valueColor: 'text-green-500' },
];

export default function DailyTasks() {
  const navigate = useNavigate();

  return (
    <main className="flex-1 container py-8 max-w-4xl space-y-8">
      <div className="flex flex-col items-center gap-3">
        <DailyTasksChip />
        <h1 className="text-4xl md:text-5xl font-bold text-on-surface font-display text-center">
          {DAILY_TASKS_H1}
        </h1>
        <p className="text-base text-muted-foreground text-center">{DAILY_TASKS_SUBTITLE}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {DAILY_TASKS_STATS.map((stat, i) => {
          const meta = STAT_ICON_META[i] ?? STAT_ICON_META[0]!;
          return (
            <StatCard
              key={stat.id}
              value={stat.value}
              label={stat.label}
              Icon={meta.Icon}
              iconColor={meta.iconColor}
              valueColor={meta.valueColor}
            />
          );
        })}
      </div>

      <TodayProgressCard />

      <div className="space-y-4">
        {DAILY_TASKS_MOCK.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>

      <DailyTasksFooter
        onIPDiagnosis={() => navigate(DAILY_TASKS_FOOTER_BTN_1_HREF)}
        onContinue={() => navigate(DAILY_TASKS_FOOTER_BTN_2_HREF)}
      />
    </main>
  );
}
