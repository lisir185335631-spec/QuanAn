import { Link } from 'react-router-dom';

import {
  HOME_READY_CTA,
  HOME_READY_CTA_HREF,
  HOME_READY_SUBTITLE,
  HOME_READY_TITLE,
} from '@/lib/constants/home';

export function HomeReadyStart() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#002fa7] to-[#001e73] px-8 py-20 text-center">
      {/* 工业精密网格 */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage: 'radial-gradient(ellipse 60% 80% at 50% 50%, #000 30%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 80% at 50% 50%, #000 30%, transparent 100%)',
        }}
        aria-hidden="true"
      />
      {/* 暖黄光斑 */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#F6D300] opacity-20 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative">
        <h2 className="text-[48px] font-black tracking-tight text-white">{HOME_READY_TITLE}</h2>
        <p className="mt-4 text-[17px] font-medium text-white/75">{HOME_READY_SUBTITLE}</p>
        <div className="mt-9">
          <Link
            to={HOME_READY_CTA_HREF}
            className="inline-flex items-center gap-2 rounded-xl bg-[#F6D300] px-12 py-4 text-[18px] font-extrabold text-[#221b00] shadow-lg transition-all hover:-translate-y-0.5 hover:bg-[#ffe45c]"
          >
            {HOME_READY_CTA} →
          </Link>
        </div>
      </div>
    </section>
  );
}
