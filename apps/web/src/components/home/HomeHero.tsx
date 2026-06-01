import { FileText, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';


import { Button } from '@/components/ui/button';
import {
  HOME_HERO_BRAND,
  HOME_HERO_CHIP,
  HOME_HERO_CTA1,
  HOME_HERO_CTA1_HREF,
  HOME_HERO_CTA2,
  HOME_HERO_CTA2_HREF,
  HOME_HERO_DELETE_MS,
  HOME_HERO_HOLD_MS,
  HOME_HERO_QUOTE,
  HOME_HERO_ROTATION,
  HOME_HERO_SUBTITLE,
  HOME_HERO_TYPE_MS,
} from '@/lib/constants/home';

export function HomeHero() {
  const [phraseIndex, setPhraseIndex] = useState<number>(0);
  const [text, setText] = useState<string>('');
  const [deleting, setDeleting] = useState<boolean>(false);

  // typewriter 轮播:逐字打字 → 停留 → 逐字删除 → 切下一句
  useEffect(() => {
    const full = HOME_HERO_ROTATION[phraseIndex] ?? '';

    // 打满 → 停留后开始删除
    if (!deleting && text === full) {
      const hold = setTimeout(() => setDeleting(true), HOME_HERO_HOLD_MS);
      return () => clearTimeout(hold);
    }
    // 删空 → 切下一句重新打字
    if (deleting && text === '') {
      setDeleting(false);
      setPhraseIndex((i) => (i + 1) % HOME_HERO_ROTATION.length);
      return;
    }
    // 单步:打 or 删
    const tick = setTimeout(
      () =>
        setText((cur) =>
          deleting ? full.slice(0, cur.length - 1) : full.slice(0, cur.length + 1),
        ),
      deleting ? HOME_HERO_DELETE_MS : HOME_HERO_TYPE_MS,
    );
    return () => clearTimeout(tick);
  }, [text, deleting, phraseIndex]);

  return (
    <section className="flex flex-col items-center justify-center text-center py-20">
      {/* chip */}
      <div className="rounded-full border border-primary/30 px-4 py-1.5 bg-primary/5 mb-8">
        <span className="text-green-500">●</span>
        <span className="font-display text-sm text-primary ml-1">{HOME_HERO_CHIP}</span>
      </div>

      {/* h1 typewriter rotation */}
      <h1
        className="font-display text-7xl md:text-9xl font-black text-primary tracking-tight mb-6 min-h-[1.2em]"
        style={{ WebkitTextStroke: '1px var(--primary)' }}
      >
        {text}
        <span className="ml-1 font-normal animate-pulse" aria-hidden="true">
          |
        </span>
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
