// PRD-29.9 · Step4 footer action sub-component
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SubCard } from '@/components/ui/sub-card';
import { cn } from '@/lib/utils';

interface Step4FooterActionProps {
  onNextStep?: () => void;
  onViewIpPlan?: () => void;
  onFeedbackUp?: () => void;
  onFeedbackDown?: () => void;
  className?: string;
}

export function Step4FooterAction({
  onNextStep,
  onViewIpPlan,
  onFeedbackUp,
  onFeedbackDown,
  className,
}: Step4FooterActionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* feedback row */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">这个结果对你有帮助吗？</span>
        <Button variant="ghost" size="icon" onClick={onFeedbackUp} aria-label="有帮助">
          👍
        </Button>
        <Button variant="ghost" size="icon" onClick={onFeedbackDown} aria-label="没帮助">
          👎
        </Button>
      </div>

      {/* completion SubCard */}
      <SubCard className="bg-primary/8 border-primary/25">
        <div className="space-y-3">
          {/* title row */}
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-primary shrink-0" />
            <p className="text-sm font-semibold text-on-surface">执行计划 已完成 🎉</p>
          </div>
          {/* desc */}
          <p className="text-xs text-muted-foreground leading-relaxed">
            分析结果已保存。建议继续下一步「变现路径」，让AI为你生成更精准的方案。
          </p>
          {/* 2 buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={onNextStep}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              继续下一步：变现路径 &gt;
            </Button>
            <Button variant="outline" onClick={onViewIpPlan}>
              查看我的IP方案
            </Button>
          </div>
        </div>
      </SubCard>
    </div>
  );
}
