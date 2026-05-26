import { Copy, RotateCcw, Sparkles, ThumbsDown, ThumbsUp } from 'lucide-react';
import {
  GENERATE_RESULT_TITLE,
  GENERATE_BTN_COPY,
  GENERATE_BTN_AI_OPT,
  GENERATE_BTN_RESTART,
  GENERATE_RESULT_PARAGRAPHS,
  GENERATE_FEEDBACK_PROMPT,
} from '@/lib/constants/generatePage';

export function GenerateResult() {
  return (
    <section className="rounded-2xl border border-primary/20 bg-card p-6">
      {/* top row */}
      <div className="flex justify-between items-center">
        <h2 className="text-base font-bold text-on-surface">{GENERATE_RESULT_TITLE}</h2>
        <div className="flex gap-3">
          <button
            type="button"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition"
          >
            <Copy className="w-4 h-4" />
            {GENERATE_BTN_COPY}
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 text-sm border border-primary text-primary rounded-full px-3 py-1 hover:bg-primary/10 transition"
          >
            <Sparkles className="w-4 h-4" />
            {GENERATE_BTN_AI_OPT}
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition"
          >
            <RotateCcw className="w-4 h-4" />
            {GENERATE_BTN_RESTART}
          </button>
        </div>
      </div>

      {/* body · 8 段 mock 文案 */}
      <div className="mt-6 space-y-4 font-cn text-sm text-on-surface leading-relaxed">
        {GENERATE_RESULT_PARAGRAPHS.map((para) => (
          <p key={para.label}>
            <span className="font-bold">{para.label}</span>
            {para.body}
          </p>
        ))}
      </div>

      {/* 底部反馈 row */}
      <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
        <span>{GENERATE_FEEDBACK_PROMPT}</span>
        <button type="button" aria-label="有帮助" className="hover:text-primary transition">
          <ThumbsUp className="w-4 h-4" />
        </button>
        <button type="button" aria-label="无帮助" className="hover:text-primary transition">
          <ThumbsDown className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}
