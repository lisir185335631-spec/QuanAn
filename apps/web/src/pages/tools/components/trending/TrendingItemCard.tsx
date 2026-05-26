import type { TrendingCard } from '@/lib/constants/trending';

interface Props {
  card: TrendingCard;
}

export function TrendingItemCard({ card }: Props) {
  return (
    <div className="rounded-xl border border-primary/20 bg-card p-5 hover:border-primary/40 transition-all cursor-pointer flex flex-col">
      {/* top row: platform chip + type chip */}
      <div className="flex items-center justify-between mb-4">
        <span className="flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-2 py-1 font-cn text-xs text-muted-foreground">
          {card.platformEmoji} {card.platformLabel}
        </span>
        <span className="rounded-md bg-muted/30 px-2 py-1 font-cn text-xs text-muted-foreground">
          {card.type}
        </span>
      </div>

      {/* title */}
      <h3 className="font-cn text-base font-bold text-on-surface mb-3 leading-snug">
        {card.title}
      </h3>

      {/* body */}
      <p className="font-cn text-sm text-muted-foreground/85 leading-relaxed mb-4 flex-1">
        {card.body}
      </p>

      {/* tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {card.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-md border border-primary/40 px-2.5 py-1 font-cn text-xs text-primary bg-primary/5"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* metrics */}
      <div className="flex items-center gap-4 pt-3 border-t border-border/40">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-cn">
          {'👍'} {card.likes}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-cn">
          {'💬'} {card.comments}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-cn">
          {'🔄'} {card.shares}
        </span>
      </div>
    </div>
  );
}
