import { Loader2 } from 'lucide-react';

import { SubCard } from '@/components/ui/sub-card';

export function Step3LoadingState() {
  return (
    <SubCard className="my-6 border-primary/30">
      <div className="flex items-center gap-4">
        {/* animate-ping-primary yellow dot (AC-2) */}
        <span className="relative flex h-3 w-3 shrink-0">
          <span className="animate-ping-primary absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
        </span>

        <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />

        <div>
          <p className="text-body-sm font-label text-on-surface">AI 正在深度分析中...</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            正在生成专业分析报告，请稍候片刻
          </p>
        </div>
      </div>
    </SubCard>
  );
}
