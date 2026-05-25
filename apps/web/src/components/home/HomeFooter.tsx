import { HOME_FOOTER } from '@/lib/constants/home';

export function HomeFooter() {
  return (
    <footer className="py-8">
      <p className="font-display text-xs text-muted-foreground/40 text-center tracking-widest">
        {HOME_FOOTER}
      </p>
    </footer>
  );
}
