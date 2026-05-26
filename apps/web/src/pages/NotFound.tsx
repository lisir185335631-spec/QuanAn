import { AlertCircle, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

const NOT_FOUND_CODE = '404' as const;
const NOT_FOUND_TITLE = '页面未找到' as const;
const NOT_FOUND_DESC_1 = '抱歉，您访问的页面不存在。' as const;
const NOT_FOUND_DESC_2 = '该页面可能已被移动或删除。' as const;
const NOT_FOUND_CTA = '返回首页' as const;

export default function NotFound() {
  return (
    <main className="flex-1 container mx-auto px-4 py-20 flex items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-2xl rounded-2xl border border-primary/20 bg-card/50 p-16 flex flex-col items-center text-center">
        <div className="w-24 h-24 rounded-full border-2 border-primary bg-background flex items-center justify-center mb-8">
          <AlertCircle className="w-12 h-12 text-primary" strokeWidth={2.5} />
        </div>

        <h1 className="font-display text-7xl font-black text-on-surface mb-4 tracking-tight">
          {NOT_FOUND_CODE}
        </h1>

        <p className="font-display text-2xl font-bold text-primary mb-6">
          {NOT_FOUND_TITLE}
        </p>

        <p className="font-cn text-base text-muted-foreground">{NOT_FOUND_DESC_1}</p>
        <p className="font-cn text-base text-muted-foreground mb-10">{NOT_FOUND_DESC_2}</p>

        <Link to="/">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 font-cn font-bold text-on-primary hover:bg-primary/90 transition-colors"
          >
            <Home className="w-5 h-5" />
            {NOT_FOUND_CTA}
          </button>
        </Link>
      </div>
    </main>
  );
}
