import { ArrowRight } from 'lucide-react';

import {
  HOME_WORKFLOW_STEPS,
  HOME_WORKFLOW_SUBTITLE,
  HOME_WORKFLOW_TITLE,
} from '@/lib/constants/home';

// 步骤序号品牌三色轮转
const NUM_ACCENT = [
  'border-[#002fa7]/40 text-[#002fa7]',
  'border-[#781621]/40 text-[#781621]',
  'border-[#F3E08A] text-[#8A6A00]',
] as const;

export function HomeWorkflow() {
  return (
    <section>
      {/* title · 品牌渐变大字 */}
      <h2 className="bg-gradient-to-r from-[#002fa7] to-[#781621] bg-clip-text text-center text-[44px] font-black tracking-tight text-transparent">
        {HOME_WORKFLOW_TITLE}
      </h2>
      <p className="mt-3 text-center text-[14px] text-[#6b7280]">{HOME_WORKFLOW_SUBTITLE}</p>

      {/* 6 steps + arrows */}
      <div className="pw-shadow-soft mt-10 flex items-center justify-between rounded-xl border border-[#e5e7eb] bg-white px-6 py-8">
        {HOME_WORKFLOW_STEPS.map((step, i) => (
          <div key={step.num} className="flex items-center">
            {/* step */}
            <div className="flex flex-col items-center text-center">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 bg-white text-[20px] font-black ${NUM_ACCENT[i % NUM_ACCENT.length]!}`}
              >
                {step.num}
              </div>
              <span className="mt-3 text-[15px] font-bold text-[#111827]">{step.title}</span>
              <span className="mt-1 text-[12px] text-[#9ca3af]">{step.desc}</span>
            </div>
            {/* arrow between steps */}
            {i < HOME_WORKFLOW_STEPS.length - 1 && (
              <ArrowRight aria-hidden className="mx-3 h-5 w-5 shrink-0 text-[#c4c5d6]" />
            )}
          </div>
        ))}
        {/* 末步后箭头 · 暗示延续 */}
        <ArrowRight aria-hidden className="ml-3 h-5 w-5 shrink-0 text-[#c4c5d6]" />
      </div>
    </section>
  );
}
