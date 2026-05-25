/**
 * EmptyFeedbackCard · 最近反馈 empty card
 * Note: 👍 👎 emoji in desc are sally-original · preserved per SPEC §10
 */
import { MessageSquare } from 'lucide-react';

import {
  EVOLUTION_FEEDBACK_EMPTY_DESC,
  EVOLUTION_FEEDBACK_EMPTY_TITLE,
  EVOLUTION_FEEDBACK_TITLE,
} from '@/lib/constants/evolution';

export function EmptyFeedbackCard() {
  return (
    <div
      data-testid="empty-feedback-card"
      className="bg-card/40 backdrop-blur-md border border-border/40 rounded-lg p-5 space-y-4"
    >
      {/* card header */}
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-on-surface">
          {EVOLUTION_FEEDBACK_TITLE}
        </h3>
      </div>

      {/* empty state center */}
      <div className="flex flex-col items-center justify-center py-6 gap-3 text-center">
        <MessageSquare className="w-12 h-12 text-muted-foreground/40" />
        <p
          data-testid="feedback-empty-title"
          className="text-sm font-medium text-on-surface"
        >
          {EVOLUTION_FEEDBACK_EMPTY_TITLE}
        </p>
        <p className="text-xs text-muted-foreground max-w-[200px]">
          {EVOLUTION_FEEDBACK_EMPTY_DESC}
        </p>
      </div>
    </div>
  );
}
