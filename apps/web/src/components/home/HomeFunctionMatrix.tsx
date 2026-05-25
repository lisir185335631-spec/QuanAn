import { Link } from 'react-router-dom';

import { ChevronRight } from 'lucide-react';

import {
  HOME_MATRIX,
  HOME_MATRIX_SUBTITLE,
  HOME_MATRIX_TITLE,
} from '@/lib/constants/home';

const colsMap: Record<2 | 3 | 5, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  5: 'grid-cols-5',
};

export function HomeFunctionMatrix() {
  return (
    <section className="mt-16">
      {/* title */}
      <h2 className="font-display text-5xl md:text-6xl font-black text-primary text-center tracking-widest">
        {HOME_MATRIX_TITLE}
      </h2>
      {/* subtitle */}
      <p className="font-cn text-sm text-muted-foreground text-center mt-3">
        {HOME_MATRIX_SUBTITLE}
      </p>

      {/* 4 groups */}
      {HOME_MATRIX.map((group) => {
        const GroupIcon = group.groupIcon;
        const colsCls = colsMap[group.cols];
        return (
          <div key={group.groupTitle} className="mt-12">
            {/* group header */}
            <div className="flex items-center gap-3 rounded-lg bg-primary/10 p-2.5 w-fit mb-4">
              <GroupIcon className="w-5 h-5 text-primary" />
              <span className="font-display text-xl font-bold text-foreground">
                {group.groupTitle}
              </span>
            </div>

            {/* card grid */}
            <div className={`grid ${colsCls} gap-4 auto-rows-fr`}>
              {group.cards.map((card) => {
                const CardIcon = card.icon;
                return (
                  <Link to={card.href} key={card.title}>
                    <div className="rounded-xl border border-primary/20 bg-card p-5 hover:border-primary/40 transition-all cursor-pointer h-full relative">
                      {/* icon chip */}
                      <div className="rounded-lg bg-primary/10 p-2.5 w-fit">
                        <CardIcon className="w-5 h-5 text-primary" />
                      </div>
                      {/* title */}
                      <p className="font-display text-base font-bold mt-4">{card.title}</p>
                      {/* desc */}
                      <p className="font-cn text-xs text-muted-foreground/80 mt-2">{card.desc}</p>
                      {/* optional chevron */}
                      {card.arrow && (
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}
