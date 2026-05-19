import { Link } from 'react-router-dom';

import { FadeInWrapper } from '@/components/FadeInWrapper';
import { Button } from '@/components/ui/button';

const IP_PLAN_STEPS = [
  { num: '01', stepKey: 'step1',  href: '/step/1',  emoji: '🏭', title: '行业选择' },
  { num: '02', stepKey: 'step3',  href: '/step/3',  emoji: '📦', title: '账号包装' },
  { num: '03', stepKey: 'step3b', href: '/step/3b', emoji: '🎭', title: '人设定制' },
  { num: '04', stepKey: 'step4',  href: '/step/4',  emoji: '📋', title: '执行计划' },
  { num: '05', stepKey: 'step4b', href: '/step/4b', emoji: '💰', title: '变现路径' },
  { num: '06', stepKey: 'step5',  href: '/step/5',  emoji: '🔥', title: '爆款选题' },
  { num: '07', stepKey: 'step6',  href: '/step/6',  emoji: '🎬', title: '拍摄计划' },
  { num: '08', stepKey: 'step7',  href: '/step/7',  emoji: '✍️', title: '文案生成' },
  { num: '09', stepKey: 'step8',  href: '/step/8',  emoji: '📡', title: '直播策划' },
] as const;

export interface IpPlanStepGridProps {
  completedSteps: string[];
  isLoading: boolean;
}

export function IpPlanStepGrid({ completedSteps, isLoading }: IpPlanStepGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="glass-card rounded-xl p-5 animate-pulse">
            <div className="h-8 w-8 bg-muted/40 rounded mb-2" />
            <div className="h-4 w-16 bg-muted/40 rounded mb-1" />
            <div className="h-3 w-12 bg-muted/30 rounded mb-3" />
            <div className="h-8 w-20 bg-muted/30 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {IP_PLAN_STEPS.map((step, i) => {
        const isDone = completedSteps.includes(step.stepKey);
        return (
          <FadeInWrapper key={step.stepKey} delay={0.05 * i}>
            <div className={`glass-card rounded-xl p-5 border h-full ${isDone ? 'border-primary/40' : 'border-muted/30'}`}>
              <div className="text-3xl mb-2">{step.emoji}</div>
              <div className="font-label text-xs text-muted-foreground mb-1">{step.num}</div>
              <h3 className="font-cn font-semibold text-foreground mb-1">{step.title}</h3>
              <p className={`font-cn text-sm mb-1 ${isDone ? 'text-primary' : 'text-muted-foreground'}`}>
                {isDone ? '✓ 已完成·数据已保存' : '未完成'}
              </p>
              <Link to={step.href}>
                <Button variant="outline" size="sm" className="mt-2">查看详情 →</Button>
              </Link>
            </div>
          </FadeInWrapper>
        );
      })}
    </div>
  );
}
