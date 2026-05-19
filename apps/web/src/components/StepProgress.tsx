/**
 * StepProgress — 9 step IP 起号进度条 · PRD-3 US-005
 * 完成 高亮金 / 当前 高亮蓝 / 待办 灰
 */

import { cn } from '@/lib/utils';

// Mirrors apps/api/src/lib/constants/steps.ts — P1 move to @quanan/schemas
const STEP_ORDER = [
  { key: 'step1',  label: '行业选择', emoji: '🎯' },
  { key: 'step3',  label: '账号包装', emoji: '📝' },
  { key: 'step3b', label: '人设定制', emoji: '🎭' },
  { key: 'step4',  label: '执行计划', emoji: '📅' },
  { key: 'step4b', label: '变现路径', emoji: '💰' },
  { key: 'step5',  label: '爆款选题', emoji: '🔥' },
  { key: 'step6',  label: '拍摄计划', emoji: '🎬' },
  { key: 'step7',  label: '文案生成', emoji: '✍️' },
  { key: 'step8',  label: '直播策划', emoji: '📡' },
] as const;

export const STEP_ORDER_KEYS = STEP_ORDER.map((s) => s.key) as readonly string[];

interface StepProgressProps {
  completedSteps: string[];
  isLoading?: boolean;
  className?: string;
}

function StepSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="加载中">
      <div className="h-4 w-20 rounded bg-surface-container animate-pulse" />
      <div className="grid grid-cols-9 gap-2">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-surface-container animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export function StepProgress({ completedSteps, isLoading, className }: StepProgressProps) {
  if (isLoading) return <StepSkeleton />;

  const completedSet = new Set(completedSteps);
  const completedCount = STEP_ORDER.filter((s) => completedSet.has(s.key)).length;
  const currentIndex = STEP_ORDER.findIndex((s) => !completedSet.has(s.key));

  return (
    <div className={cn('space-y-3', className)}>
      <p className="text-body-sm text-muted-foreground">
        进度 <span className="font-semibold text-on-surface">{completedCount}/9</span>
      </p>

      <div className="grid grid-cols-9 gap-2">
        {STEP_ORDER.map((step, idx) => {
          const isCompleted = completedSet.has(step.key);
          const isCurrent = idx === currentIndex;

          return (
            <div
              key={step.key}
              data-testid={`step-${step.key}`}
              data-status={isCompleted ? 'completed' : isCurrent ? 'current' : 'pending'}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-center transition-colors',
                isCompleted && 'border-yellow-500/60 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
                isCurrent && 'border-blue-500/60 bg-blue-500/10 text-blue-700 dark:text-blue-400',
                !isCompleted && !isCurrent && 'border-border bg-surface-container text-muted-foreground',
              )}
            >
              <span className="text-base leading-none">{step.emoji}</span>
              <span className="text-[10px] leading-tight font-medium line-clamp-2">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
