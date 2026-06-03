import { HOME_STATS } from '@/lib/constants/home';

// 品牌三色轮转 + 迷你环形(纯展示层,不改数据)
const STAT_STYLES = [
  { chip: 'bg-[#002fa7]/10 text-[#002fa7]', accent: '#002fa7', ring: 88 },
  { chip: 'bg-[#781621]/10 text-[#781621]', accent: '#781621', ring: 72 },
  { chip: 'bg-[#F6D300]/20 text-[#8A6A00]', accent: '#F6D300', ring: 64 },
  { chip: 'bg-[#002fa7]/10 text-[#002fa7]', accent: '#002fa7', ring: 80 },
] as const;

export function HomeStatsRow() {
  return (
    <section aria-label="数据概览" className="grid grid-cols-4 gap-6">
      {HOME_STATS.map((stat, i) => {
        const Icon = stat.icon;
        const s = STAT_STYLES[i % STAT_STYLES.length]!;
        return (
          <div
            key={stat.label}
            className="pw-shadow-soft rounded-xl border border-[#e5e7eb] bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.chip}`}>
                <Icon aria-hidden className="h-5 w-5" />
              </span>
              {/* mini ring */}
              <div className="h-10 w-10 shrink-0">
                <svg viewBox="0 0 36 36" className="-rotate-90">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f3f9" strokeWidth="3.5" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke={s.accent}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeDasharray={`${s.ring} 100`}
                  />
                </svg>
              </div>
            </div>
            <p className="mt-4 text-[40px] font-black leading-none tracking-tight text-[#111827]">
              {stat.value}
            </p>
            <p className="mt-1.5 text-[13px] text-[#6b7280]">{stat.label}</p>
          </div>
        );
      })}
    </section>
  );
}
