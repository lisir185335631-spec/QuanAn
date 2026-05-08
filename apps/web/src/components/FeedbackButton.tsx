/**
 * FeedbackButton — placeholder · PRD-3 US-005
 * P0: click → trpc.costLog.logFeedback writes traceId (no evolution trigger)
 * PRD-7: 写入触发 evolution 逻辑
 */

import { ThumbsUp, ThumbsDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';

interface FeedbackButtonProps {
  stepKey: string;
}

export function FeedbackButton({ stepKey }: FeedbackButtonProps) {
  const logFeedback = trpc.costLog.logFeedback.useMutation();

  return (
    <div className="flex items-center gap-2" data-testid="feedback-buttons">
      <span className="text-body-sm text-muted-foreground">内容有帮助吗？</span>
      <Button
        variant="outline"
        size="sm"
        aria-label="有帮助"
        data-testid="feedback-good"
        disabled={logFeedback.isPending}
        onClick={() => logFeedback.mutate({ stepKey, type: 'good' })}
      >
        <ThumbsUp className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        aria-label="没帮助"
        data-testid="feedback-bad"
        disabled={logFeedback.isPending}
        onClick={() => logFeedback.mutate({ stepKey, type: 'bad' })}
      >
        <ThumbsDown className="h-4 w-4" />
      </Button>
    </div>
  );
}
