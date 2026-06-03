import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { HOME_MATRIX, HOME_MATRIX_SUBTITLE, HOME_MATRIX_TITLE } from '@/lib/constants/home';

const colsMap: Record<2 | 3 | 5, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  5: 'grid-cols-5',
};

// 每组品牌色:市场洞察=克莱因蓝 / 变现设计=勃艮第红 / 内容创作=暖黄 / 智能工具=克莱因蓝
const GROUP_ACCENT = [
  'bg-[#002fa7]/10 text-[#002fa7]',
  'bg-[#781621]/10 text-[#781621]',
  'bg-[#F6D300]/20 text-[#8A6A00]',
  'bg-[#002fa7]/10 text-[#002fa7]',
] as const;

export function HomeFunctionMatrix() {
  return (
    <section>
      {/* title · 品牌渐变大字 */}
      <h2 className="bg-gradient-to-r from-[#002fa7] to-[#781621] bg-clip-text text-center text-[44px] font-black tracking-tight text-transparent">
        {HOME_MATRIX_TITLE}
      </h2>
      <p className="mt-3 text-center text-[14px] text-[#6b7280]">{HOME_MATRIX_SUBTITLE}</p>

      {/* 4 groups */}
      {HOME_MATRIX.map((group, gi) => {
        const GroupIcon = group.groupIcon;
        const colsCls = colsMap[group.cols];
        const accent = GROUP_ACCENT[gi % GROUP_ACCENT.length]!;
        return (
          <div key={group.groupTitle} className="mt-12">
            {/* group header */}
            <div className="pw-shadow-soft mb-5 flex w-fit items-center gap-2.5 rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5">
              <span className={`flex h-8 w-8 items-center justify-center rounded-md ${accent}`}>
                <GroupIcon aria-hidden className="h-[18px] w-[18px]" />
              </span>
              <span className="text-[17px] font-extrabold tracking-tight text-[#111827]">
                {group.groupTitle}
              </span>
            </div>

            {/* card grid */}
            <div className={`grid ${colsCls} auto-rows-fr gap-5`}>
              {group.cards.map((card) => {
                const CardIcon = card.icon;
                return (
                  <Link to={card.href} key={card.title} className="group block h-full">
                    <div className="pw-shadow-soft relative h-full rounded-xl border border-[#e5e7eb] bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#002fa7]/40 hover:shadow-md">
                      <span className={`flex h-11 w-11 items-center justify-center rounded-lg ${accent}`}>
                        <CardIcon aria-hidden className="h-5 w-5" />
                      </span>
                      <p className="mt-4 text-[15px] font-bold text-[#111827]">{card.title}</p>
                      <p className="mt-1.5 text-[12px] leading-relaxed text-[#6b7280]">{card.desc}</p>
                      {card.arrow && (
                        <ChevronRight
                          aria-hidden
                          className="absolute right-4 top-5 h-4 w-4 text-[#c4c5d6] transition-colors group-hover:text-[#002fa7]"
                        />
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
