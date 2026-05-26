import { GENERATE_H1, GENERATE_SUBTITLE } from '@/lib/constants/generatePage';

export function GenerateHero() {
  return (
    <header className="space-y-2">
      <h1 className="text-2xl font-bold text-on-surface">{GENERATE_H1}</h1>
      <p className="text-sm text-muted-foreground">{GENERATE_SUBTITLE}</p>
    </header>
  );
}
