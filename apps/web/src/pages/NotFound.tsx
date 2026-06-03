import { Link } from 'react-router-dom';

import { PioneerLayout } from '@/layouts/PioneerLayout';

const NOT_FOUND_CODE = '404' as const;
const NOT_FOUND_TITLE = '页面未找到' as const;
const NOT_FOUND_DESC_1 = '抱歉，您访问的页面不存在。' as const;
const NOT_FOUND_DESC_2 = '该页面可能已被移动或删除。' as const;
const NOT_FOUND_CTA = '返回首页' as const;

export default function NotFound() {
  return (
    <PioneerLayout>
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center text-center">
        <div className="pw-shadow-soft flex w-full flex-col items-center rounded-3xl border border-[#e5e7eb] bg-white px-8 py-20">
          <span className="mb-8 flex h-24 w-24 items-center justify-center rounded-full border-2 border-[#002fa7]/30 bg-[#002fa7]/[0.06]">
            <span className="material-symbols-outlined text-[44px] text-[#002fa7]" aria-hidden="true">
              error_outline
            </span>
          </span>
          <h1 className="mb-3 bg-gradient-to-r from-[#002fa7] to-[#781621] bg-clip-text text-[96px] font-black leading-none tracking-tighter text-transparent">
            {NOT_FOUND_CODE}
          </h1>
          <p className="mb-5 text-[22px] font-bold text-[#111827]">{NOT_FOUND_TITLE}</p>
          <p className="text-[15px] text-[#6b7280]">{NOT_FOUND_DESC_1}</p>
          <p className="mb-10 text-[15px] text-[#6b7280]">{NOT_FOUND_DESC_2}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-[#002fa7] px-8 py-3.5 text-[15px] font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#001e73] hover:shadow-md"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              home
            </span>
            {NOT_FOUND_CTA}
          </Link>
        </div>
      </div>
    </PioneerLayout>
  );
}
