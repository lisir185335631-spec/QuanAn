import { HOME_STATS } from '@/lib/constants/home';

export function HomeStatsRow() {
  return (
    <section className="grid grid-cols-4 gap-4">
      {HOME_STATS.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="flex items-center gap-3">
            <Icon className="w-8 h-8 text-primary shrink-0" />
            <div className="flex flex-col">
              <span className="font-display text-5xl font-black text-foreground leading-none">
                {stat.value}
              </span>
              <span className="font-cn text-xs text-muted-foreground mt-1">{stat.label}</span>
            </div>
          </div>
        );
      })}
    </section>
  );
}
