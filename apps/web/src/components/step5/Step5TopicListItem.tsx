// PRD-29.14 · Step5 单个 topic list item
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface Step5TopicItem {
  index: number;
  title: string;
  platform: string;
  difficulty: 'simple' | 'medium' | 'hard';
  difficultyLabel: '简单' | '中等' | '困难';
  rating: 4 | 5;
}

interface Step5TopicListItemProps {
  topic: Step5TopicItem;
  onLike?: () => void;
  onOptimize?: () => void;
  onCopy?: () => void;
  className?: string;
}

export function Step5TopicListItem({
  topic,
  onLike,
  onOptimize,
  onCopy,
  className,
}: Step5TopicListItemProps) {
  const difficultyColors: Record<Step5TopicItem['difficulty'], string> = {
    simple: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    medium: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
    hard:   'bg-rose-500/15 border-rose-500/30 text-rose-400',
  };

  return (
    <div
      className={cn(
        'grid grid-cols-[48px_1fr_auto] gap-3 items-center border border-border/40 rounded-lg p-3',
        className,
      )}
    >
      {/* 左 · 序号 chip */}
      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/8 text-sm font-semibold text-on-surface/70">
        {topic.index}
      </span>

      {/* 中 · title + tags */}
      <div className="space-y-1.5 min-w-0">
        <p className="text-sm font-semibold text-on-surface leading-snug">{topic.title}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center rounded border border-primary/30 bg-primary/15 text-primary px-2 py-0.5 text-[11px]">
            {topic.platform}
          </span>
          <span
            className={cn(
              'inline-flex items-center rounded border px-2 py-0.5 text-[11px]',
              difficultyColors[topic.difficulty],
            )}
          >
            {topic.difficultyLabel}
          </span>
          <span className="text-primary text-[11px]">{'★'.repeat(topic.rating)}</span>
        </div>
      </div>

      {/* 右 · 3 action buttons */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onLike}
          aria-label="收藏"
        >
          ♡
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onOptimize}
          aria-label="优化"
        >
          ✨
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onCopy}
          aria-label="复制"
        >
          📋
        </Button>
      </div>
    </div>
  );
}
