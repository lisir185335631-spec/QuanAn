import { TRENDING_H1, TRENDING_SUBTITLE } from '@/lib/constants/trending';

export function TrendingHero() {
  return (
    <div>
      <h1 className="font-display text-4xl md:text-5xl font-bold text-on-surface">
        {TRENDING_H1}
      </h1>
      <p className="font-cn text-base text-muted-foreground mt-3">
        {TRENDING_SUBTITLE}
      </p>
    </div>
  );
}
