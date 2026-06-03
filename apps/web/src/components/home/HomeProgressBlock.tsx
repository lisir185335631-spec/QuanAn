import { CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import {
  HOME_PROGRESS_OVERALL,
  HOME_PROGRESS_PERCENT,
  HOME_PROGRESS_SUBTITLE,
  HOME_PROGRESS_TITLE,
  HOME_PROGRESS_VIEW_PLAN,
  HOME_PROGRESS_VIEW_PLAN_HREF,
  HOME_STEPS,
} from '@/lib/constants/home';

export function HomeProgressBlock() {
  return (
    <section className="pw-shadow-soft rounded-xl border border-[#e5e7eb] bg-white p-8">
      {/* header row */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h2 className="flex items-center gap-2 text-[20px] font-extrabold tracking-tight text-[#111827] before:h-4 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']">
            {HOME_PROGRESS_TITLE}
          </h2>
          <p className="mt-1.5 text-[14px] text-[#6b7280]">{HOME_PROGRESS_SUBTITLE}</p>
        </div>
        <Link
          to={HOME_PROGRESS_VIEW_PLAN_HREF}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#002fa7]/30 bg-white px-4 py-2 text-[13px] font-bold text-[#002fa7] transition-all hover:-translate-y-0.5 hover:bg-[#002fa7]/[0.05]"
        >
          {HOME_PROGRESS_VIEW_PLAN} →
        </Link>
      </div>

      {/* progress row */}
      <div className="mt-6 flex items-center justify-between">
        <span className="text-[13px] font-medium text-[#6b7280]">{HOME_PROGRESS_OVERALL}</span>
        <span className="text-[14px] font-bold text-[#002fa7]">{HOME_PROGRESS_PERCENT}</span>
      </div>
      {/* 品牌渐变进度条 */}
      <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-[#f3f4f6]">
        <div className="h-3 w-full rounded-full bg-gradient-to-r from-[#002fa7] to-[#781621]" />
      </div>

      {/* 9 step grid */}
      <div className="mt-6 grid grid-cols-9 gap-3">
        {HOME_STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.label}
              className="relative flex flex-col items-center gap-2 rounded-lg border border-[#e0e7ff] bg-gradient-to-br from-white to-[#f3f6ff] px-2 py-3.5 transition-all hover:-translate-y-0.5 hover:border-[#002fa7]/40 hover:shadow-sm"
            >
              <CheckCircle2
                aria-hidden
                className="absolute -right-1.5 -top-1.5 h-5 w-5 fill-[#10b981] text-white"
              />
              <Icon aria-hidden className="h-7 w-7 text-[#002fa7]" />
              <span className="text-center text-[12px] font-medium text-[#374151]">{step.label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
