import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { FileText, Shield } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  HOME_HERO_BRAND,
  HOME_HERO_CHIP,
  HOME_HERO_CTA1,
  HOME_HERO_CTA1_HREF,
  HOME_HERO_CTA2,
  HOME_HERO_CTA2_HREF,
  HOME_HERO_QUOTE,
  HOME_HERO_ROTATION,
  HOME_HERO_ROTATION_MS,
  HOME_HERO_SUBTITLE,
} from '@/lib/constants/home';

export function HomeHero() {
  const [index, setIndex] = useState<number>(0);

  useEffect(() => {
    const id = setInterval(
      () => setIndex((i) => (i + 1) % HOME_HERO_ROTATION.length),
      HOME_HERO_ROTATION_MS,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <section className="flex flex-col items-center justify-center text-center py-20">
      {/* chip */}
      <div className="rounded-full border border-primary/30 px-4 py-1.5 bg-primary/5 mb-8">
        <span className="text-green-500">●</span>
        <span className="font-display text-sm text-primary ml-1">{HOME_HERO_CHIP}</span>
      </div>

      {/* h1 typing rotation */}
      <h1
        className="font-display text-7xl md:text-9xl font-black text-primary tracking-tight mb-6"
        style={{ WebkitTextStroke: '1px var(--primary)' }}
      >
        {HOME_HERO_ROTATION[index]}
      </h1>

      {/* subtitle */}
      <p className="font-cn text-lg text-muted-foreground mb-4">{HOME_HERO_SUBTITLE}</p>

      {/* quote */}
      <p className="font-cn italic text-sm text-muted-foreground/70 mb-4">{HOME_HERO_QUOTE}</p>

      {/* brand */}
      <p className="font-display text-xs text-muted-foreground/50 tracking-widest mb-8">
        {HOME_HERO_BRAND}
      </p>

      {/* 2 CTA */}
      <div className="flex gap-4 flex-wrap justify-center">
        <Link to={HOME_HERO_CTA1_HREF}>
          <Button className="font-cn bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 text-base">
            <Shield className="w-4 h-4 mr-2" />
            {HOME_HERO_CTA1}
          </Button>
        </Link>
        <Link to={HOME_HERO_CTA2_HREF}>
          <Button
            variant="outline"
            className="font-cn border-primary/30 text-primary hover:bg-primary/10 px-6 py-3 text-base"
          >
            <FileText className="w-4 h-4 mr-2" />
            {HOME_HERO_CTA2}
          </Button>
        </Link>
      </div>
    </section>
  );
}
