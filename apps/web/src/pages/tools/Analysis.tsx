/**
 * Analysis.tsx — /analysis · PRD-23 US-005
 * Stub: local state form + 5 H3 output sections (no tRPC)
 * AC-1: H1 '文案结构分析' + subtitle 字面锁
 * AC-2: textarea '文案' placeholder + 字符计数 right-aligned
 * AC-3: CTA '开始分析' disabled if text.length < 10
 * AC-4: stub 5 H3: 结构拆解/节奏分析/爆款元素识别/多维评分/优化建议
 */
import { useState } from 'react';

const SUBTITLE = '粘贴任意短视频文案，AI 将从结构、节奏、爆款元素等多维度深度分析';

const OUTPUT_SECTIONS = [
  { h3: '结构拆解', desc: '起承转合 / 起转合 / hook-body-cta 等' },
  { h3: '节奏分析', desc: '每段时长 / 留人率预测' },
  { h3: '爆款元素识别', desc: null },
  { h3: '多维评分', desc: null },
  { h3: '优化建议', desc: null },
] as const;

export default function Analysis() {
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (text.length < 10) return;
    setSubmitted(true);
  }

  return (
    <main className="flex-1 container py-8 space-y-8">
      {/* Header — AC-1 */}
      <div>
        <span className="text-label-sm font-label text-primary uppercase tracking-wide">内容创作</span>
        <h1 className="mt-1 text-h1 font-display text-on-surface">文案结构分析</h1>
        <p className="mt-2 text-body-md text-muted-foreground">{SUBTITLE}</p>
      </div>

      {/* Form — AC-2/3 */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-label-sm font-label text-on-surface">文案</label>
          <textarea
            placeholder="粘贴需要分析的短视频文案（至少 10 个字）..."
            value={text}
            onChange={e => setText(e.target.value)}
            rows={8}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-body-md placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          />
          {/* AC-2 字符计数 right-aligned */}
          <div className="flex justify-end">
            <span className="text-body-sm text-muted-foreground" data-testid="char-count">
              {text.length} 字
            </span>
          </div>
        </div>
        <button
          type="submit"
          disabled={text.length < 10}
          className="w-full rounded-md bg-primary text-primary-foreground py-2.5 text-label-md font-label disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
        >
          开始分析
        </button>
      </form>

      {/* Stub output — AC-4 */}
      {submitted && (
        <div className="space-y-4" data-testid="analysis-output">
          {OUTPUT_SECTIONS.map(({ h3, desc }) => (
            <div key={h3} className="rounded-lg border border-border p-4 space-y-2">
              <h3 className="text-h3 font-display text-on-surface">{h3}</h3>
              {desc && <p className="text-body-sm text-muted-foreground">{desc}</p>}
              <p className="text-body-md text-muted-foreground italic">AI 分析中…</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
