/**
 * IpPlan — IP 起号进度总览 · PRD-3 US-005
 * AC-1/2: 9 step 进度条 · stepData.progress · 切账号后自动 refetch
 * AC-4/5: FeedbackButton placeholder + 加载失败 skeleton
 */

import { FeedbackButton } from '@/components/FeedbackButton';
import { StepProgress } from '@/components/StepProgress';
import { trpc } from '@/lib/trpc';

export default function IpPlan() {
  const { data: progress, isLoading, isError } = trpc.stepData.progress.useQuery(undefined, {
    retry: 1,
  });

  return (
    <main className="flex-1 container py-8 space-y-6" data-testid="ip-plan-page">
      <div>
        <h1 className="text-h1 font-display text-on-surface">IP 起号进度</h1>
        <p className="mt-1 text-body-md text-muted-foreground">
          完成 9 个关键步骤，打造优质 IP 账号
        </p>
      </div>

      {isError ? (
        <StepProgress completedSteps={[]} isLoading={false} />
      ) : (
        <StepProgress
          completedSteps={progress?.completedSteps ?? []}
          isLoading={isLoading}
        />
      )}

      <FeedbackButton stepKey="ip-plan" />
    </main>
  );
}
