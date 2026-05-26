import { TrendingItemCard } from './TrendingItemCard';
import type { TrendingCard } from '@/lib/constants/trending';

interface Props {
  items: ReadonlyArray<TrendingCard>;
}

export function TrendingGrid({ items }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
      {items.map((card) => (
        <TrendingItemCard key={card.id} card={card} />
      ))}
    </div>
  );
}
