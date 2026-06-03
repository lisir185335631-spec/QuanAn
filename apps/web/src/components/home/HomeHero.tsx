import { FileText, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

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

  // typewriter 轮播:逐字打字 → 停留 → 逐字删除 → 切下一句(逻辑零改动)
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
    <section className="pw-shadow-soft relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-[#e5e7eb] bg-gradient-to-b from-white to-[#f5f8ff] px-10 py-16 text-center">
      {/* 工业精密网格背景 */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage:
            'linear-gradient(#eef2ff 1px, transparent 1px), linear-gradient(90deg, #eef2ff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, #000 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, #000 40%, transparent 100%)',
        }}
        aria-hidden="true"
      />

      <div className="relative">
        {/* chip · SYSTEM ONLINE */}
        <div className="mb-10 inline-flex items-center gap-2.5 rounded-full border border-[#002fa7]/25 bg-[#002fa7]/[0.06] px-5 py-2">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#10b981]" aria-hidden="true" />
          <span className="text-[15px] font-bold uppercase tracking-widest text-[#002fa7]">
            {HOME_HERO_CHIP}
          </span>
        </div>

        {/* h1 typewriter 轮播 · 品牌蓝→勃艮第红渐变大字 + 打字光标 */}
        <h1 className="mb-8 min-h-[1.15em] bg-gradient-to-r from-[#002fa7] via-[#002fa7] to-[#781621] bg-clip-text text-[128px] font-black leading-none tracking-tighter text-transparent">
          {text}
          <span className="ml-1 animate-pulse font-normal" aria-hidden="true">
            |
          </span>
        </h1>

        {/* subtitle */}
        <p className="mx-auto max-w-[1080px] text-[23px] font-medium text-[#444653]">
          {HOME_HERO_SUBTITLE}
        </p>

        {/* quote · 勃艮第红点缀 */}
        <p className="mt-5 text-[18px] font-medium italic text-[#781621]">{HOME_HERO_QUOTE}</p>

        {/* brand */}
        <p className="mt-4 text-[13px] font-bold uppercase tracking-[0.3em] text-[#9ca3af]">
          {HOME_HERO_BRAND}
        </p>

        {/* 2 CTA */}
        <div className="mt-11 flex justify-center gap-5">
          <Link
            to={HOME_HERO_CTA1_HREF}
            className="inline-flex items-center gap-2.5 rounded-xl bg-[#002fa7] px-9 py-4 text-[17px] font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#001e73] hover:shadow-md"
          >
            <Shield aria-hidden className="h-5 w-5" />
            {HOME_HERO_CTA1}
          </Link>
          <Link
            to={HOME_HERO_CTA2_HREF}
            className="inline-flex items-center gap-2.5 rounded-xl border border-[#002fa7]/30 bg-white px-9 py-4 text-[17px] font-bold text-[#002fa7] transition-all hover:-translate-y-0.5 hover:bg-[#002fa7]/[0.05]"
          >
            <FileText aria-hidden className="h-5 w-5" />
            {HOME_HERO_CTA2}
          </Link>
        </div>
      </div>
    </section>
  );
}
