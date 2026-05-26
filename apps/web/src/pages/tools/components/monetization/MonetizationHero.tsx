// MonetizationHero.tsx — h1 + subtitle

import { MONETIZATION_H1, MONETIZATION_SUBTITLE } from '@/lib/constants/monetization';

export function MonetizationHero() {
  return (
    <header className="space-y-3">
      <h1 className="font-display text-4xl md:text-5xl font-bold text-on-surface">
        {MONETIZATION_H1}
      </h1>
      <p className="font-cn text-base text-muted-foreground mt-3">
        {MONETIZATION_SUBTITLE}
      </p>
    </header>
  );
}
