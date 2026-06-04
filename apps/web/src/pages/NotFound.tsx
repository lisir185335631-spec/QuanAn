import { Link } from 'react-router-dom';

import { C, F } from '@/components/home/ikb/system';
import { IKBLayout } from '@/layouts/IKBLayout';
import '@/styles/ikb-hero.css';

const NOT_FOUND_CODE = '404' as const;
const NOT_FOUND_TITLE = '页面未找到' as const;
const NOT_FOUND_DESC_1 = '抱歉，您访问的页面不存在。' as const;
const NOT_FOUND_DESC_2 = '该页面可能已被移动或删除。' as const;
const NOT_FOUND_CTA = '返回首页' as const;

export default function NotFound() {
  return (
    <IKBLayout>
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center text-center">
        <div
          className="flex w-full flex-col items-center px-8 py-20"
          style={{ background: `linear-gradient(135deg, ${C.paper}, ${C.base})`, border: `1px solid ${C.line}` }}
        >
          <span
            className="mb-8 flex h-24 w-24 items-center justify-center rounded-full"
            style={{ border: `2px solid ${C.ikb}33`, background: `${C.ikb}0f` }}
          >
            <span className="material-symbols-outlined text-[44px]" style={{ color: C.ikb }} aria-hidden={true}>
              error_outline
            </span>
          </span>
          <h1
            className="ikb-gradtext mb-3 text-[96px] font-black leading-none tracking-tighter"
            style={{ fontFamily: F.display }}
          >
            {NOT_FOUND_CODE}
          </h1>
          <p className="mb-5 text-[22px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>
            {NOT_FOUND_TITLE}
          </p>
          <p className="text-[15px]" style={{ color: '#6b7280', fontFamily: F.cn }}>
            {NOT_FOUND_DESC_1}
          </p>
          <p className="mb-10 text-[15px]" style={{ color: '#6b7280', fontFamily: F.cn }}>
            {NOT_FOUND_DESC_2}
          </p>
          <Link
            to="/"
            className="ikb-gradbtn ikb-focusring inline-flex items-center gap-2 px-8 py-3.5 text-[15px] font-bold text-white transition-transform hover:-translate-y-0.5"
            style={{ fontFamily: F.cn }}
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>
              home
            </span>
            {NOT_FOUND_CTA}
          </Link>
        </div>
      </div>
    </IKBLayout>
  );
}
