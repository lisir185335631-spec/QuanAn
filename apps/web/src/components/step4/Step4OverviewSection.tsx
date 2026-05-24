// PRD-29.9 · Step4 总览 sub-component
import { SparkleIcon } from '@/components/icons/aiipznt-icons';
import { SubCard } from '@/components/ui/sub-card';
import { cn } from '@/lib/utils';

export interface Step4OverviewSectionProps {
  overview?: {
    currentStage: string;
    coreGoal: string;
    timeline: string;
    mainPlatform: string;
    coreAdvantages: string;
  };
  className?: string;
}

export function Step4OverviewSection({ overview, className }: Step4OverviewSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* H3 row */}
      <h3 className="flex items-center gap-2 text-base font-semibold text-on-surface">
        <SparkleIcon className="h-4 w-4 shrink-0" size={4} />
        📌 总览
      </h3>

      <SubCard>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 左列 */}
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-primary/85">当前阶段</p>
              <p className="text-sm text-on-surface/90 leading-relaxed">{overview?.currentStage ?? ''}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-primary/85">总体时间线</p>
              <p className="text-sm text-on-surface/90 leading-relaxed">{overview?.timeline ?? ''}</p>
            </div>
          </div>

          {/* 右列 */}
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-primary/85">核心目标</p>
              <p className="text-sm text-on-surface/90 leading-relaxed">{overview?.coreGoal ?? ''}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-primary/85">主攻平台</p>
              <p className="text-sm text-on-surface/90 leading-relaxed">{overview?.mainPlatform ?? ''}</p>
            </div>
          </div>

          {/* 核心优势 · 跨整行 */}
          <div className="md:col-span-2 space-y-1">
            <p className="text-xs font-semibold text-primary/85">核心优势</p>
            <p className="text-sm text-on-surface/90 leading-relaxed">{overview?.coreAdvantages ?? ''}</p>
          </div>
        </div>
      </SubCard>
    </div>
  );
}
