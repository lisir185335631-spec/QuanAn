/**
 * MyTopicsEmpty — empty state · 心 icon + 文字 + 去生成选题 btn
 * sally 1:1 复刻 · 字面全走 constants
 */
import { Flame, Heart } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  MY_TOPICS_EMPTY_CTA,
  MY_TOPICS_EMPTY_DESC,
  MY_TOPICS_EMPTY_TITLE,
} from '@/lib/constants/myTopics';

interface MyTopicsEmptyProps {
  onCta: () => void;
}

export function MyTopicsEmpty({ onCta }: MyTopicsEmptyProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 space-y-4"
      data-testid="empty-state"
    >
      <Heart
        className="w-20 h-20 text-muted-foreground/40"
        data-testid="empty-heart-icon"
      />
      <p className="text-base text-muted-foreground" data-testid="empty-title">
        {MY_TOPICS_EMPTY_TITLE}
      </p>
      <p className="text-sm text-muted-foreground" data-testid="empty-desc">
        {MY_TOPICS_EMPTY_DESC}
      </p>
      <Button
        onClick={onCta}
        className="bg-primary text-black hover:bg-primary/90"
        data-testid="empty-cta-btn"
      >
        <Flame className="h-4 w-4 mr-1.5" />
        {MY_TOPICS_EMPTY_CTA}
      </Button>
    </div>
  );
}
