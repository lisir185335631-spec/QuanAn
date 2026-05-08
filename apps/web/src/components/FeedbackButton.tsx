/**
 * FeedbackButton — PRD-4 US-014
 * Click → trpc.costLog.logFeedback writes to cost_log(event_type='good'/'bad')
 * AC-12: mutation failure → toast.error, does not block UX
 * AC-13: repeated clicks allowed (multi-record for PRD-8 density)
 * AC-17: single render point is StepLayout (AGENTS.md §11.3)
 */

import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';

interface FeedbackButtonProps {
  stepKey: string;
  agentId: string;
}

export function FeedbackButton({ stepKey, agentId }: FeedbackButtonProps) {
  const logFeedback = trpc.costLog.logFeedback.useMutation({
    onError: () => {
      toast.error('反馈失败 · 请稍后');
    },
  });

  return (
    <div className="flex items-center gap-2" data-testid="feedback-buttons">
      <span className="text-body-sm text-muted-foreground">内容有帮助吗？</span>
      <Button
        variant="outline"
        size="sm"
        aria-label="有帮助"
        data-testid="feedback-good"
        disabled={logFeedback.isPending}
        onClick={() => logFeedback.mutate({ stepKey, agentId, type: 'good' })}
      >
        <ThumbsUp className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        aria-label="没帮助"
        data-testid="feedback-bad"
        disabled={logFeedback.isPending}
        onClick={() => logFeedback.mutate({ stepKey, agentId, type: 'bad' })}
      >
        <ThumbsDown className="h-4 w-4" />
      </Button>
    </div>
  );
}
