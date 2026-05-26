// MonetizationResult.tsx — 右 result card · JSON raw + 反馈 row

import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';

import {
  MONETIZATION_FEEDBACK_PROMPT,
  MONETIZATION_MOCK,
  MONETIZATION_RESULT_TITLE,
} from '@/lib/constants/monetization';

interface MonetizationResultProps {
  mock: typeof MONETIZATION_MOCK;
}

export function MonetizationResult({ mock }: MonetizationResultProps) {
  function handleFeedback() {
    toast.success('感谢反馈');
  }

  return (
    <div className="rounded-2xl border border-primary/20 bg-card p-6">
      <h2 className="font-display text-xl font-bold mb-6 text-on-surface">
        {MONETIZATION_RESULT_TITLE}
      </h2>

      <div className="font-cn text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap break-all">
        {JSON.stringify(mock)}
      </div>

      {/* 反馈 row */}
      <div className="mt-6 flex items-center gap-3">
        <p className="font-cn text-sm text-muted-foreground">
          {MONETIZATION_FEEDBACK_PROMPT}
        </p>
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
    </div>
  );
}
