// VideoProductionFeedback.tsx — 反馈 row · 有帮助 / 无帮助

import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';

import { VIDEO_PRODUCTION_FEEDBACK_PROMPT } from '@/lib/constants/video-production';

export function VideoProductionFeedback() {
  function handleFeedback() {
    toast.success('感谢反馈');
  }

  return (
    <div className="flex items-center gap-3">
      <p className="font-cn text-sm text-muted-foreground">{VIDEO_PRODUCTION_FEEDBACK_PROMPT}</p>
      <button
        type="button"
        onClick={handleFeedback}
        aria-label="有帮助"
        className="text-muted-foreground hover:text-primary transition-colors"
      >
        <ThumbsUp className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={handleFeedback}
        aria-label="无帮助"
        className="text-muted-foreground hover:text-primary transition-colors"
      >
        <ThumbsDown className="h-4 w-4" />
      </button>
    </div>
  );
}
