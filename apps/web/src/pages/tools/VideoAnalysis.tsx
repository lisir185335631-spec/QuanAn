/**
 * VideoAnalysis.tsx — /video-analysis · PRD-23 US-004
 * Stub: local state form + 5 H3 output sections (no tRPC)
 * AC-1: H1 '爆款文案解析' + subtitle 字面锁
 * AC-2: infobox 使用方法提示
 * AC-3/4: 真表单 (lastTitle optional, lastCopy ≥ 10 字) + CTA disabled
 * AC-5: stub 5 H3 区块 · 一键仿写 → /generate
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SUBTITLE = '粘贴爆款视频的完整文案/口播稿，AI 将深度拆解爆款密码，支持一键仿写';
const INFOBOX_TEXT =
  '打开抖音/小红书/快手等 APP → 找到爆款视频 → 复制视频的完整口播文案/文字内容 → 粘贴到下方输入框 → 点击「开始深度解析」';

export default function VideoAnalysis() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [copy, setCopy] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (copy.length < 10) return;
    setSubmitted(true);
  }

  return (
    <main className="flex-1 container py-8 space-y-8">
      {/* Header — AC-1 */}
      <div>
        <span className="text-label-sm font-label text-primary uppercase tracking-wide">市场洞察</span>
        <h1 className="mt-1 text-h1 font-display text-on-surface">爆款文案解析</h1>
        <p className="mt-2 text-body-md text-muted-foreground">{SUBTITLE}</p>
      </div>

      {/* Infobox — AC-2 */}
      <div
        className="rounded-lg border border-border bg-muted/30 p-4 text-body-sm text-muted-foreground"
        data-testid="video-analysis-infobox"
      >
        {INFOBOX_TEXT}
      </div>

      {/* Form — AC-3/4 */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-label-sm font-label text-on-surface">视频标题</label>
          <input
            type="text"
            placeholder="视频标题（选填）"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-body-md placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-label-sm font-label text-on-surface">视频文案</label>
          <textarea
            placeholder="粘贴爆款视频的完整文案/口播稿（至少 10 个字）..."
            value={copy}
            onChange={e => setCopy(e.target.value)}
            rows={8}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-body-md placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          />
        </div>
        <button
          type="submit"
          disabled={copy.length < 10}
          className="w-full rounded-md bg-primary text-primary-foreground py-2.5 text-label-md font-label disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
        >
          开始深度解析
        </button>
      </form>

      {/* Stub output — AC-5 */}
      {submitted && (
        <div className="space-y-4" data-testid="video-analysis-output">
          <div className="rounded-lg border border-border p-4 space-y-2">
            <h3 className="text-h3 font-display text-on-surface">钩子拆解</h3>
            <p className="text-body-sm text-muted-foreground">开头 3 秒为什么留人</p>
            <p className="text-body-md text-muted-foreground italic">AI 分析中…</p>
          </div>

          <div className="rounded-lg border border-border p-4 space-y-2">
            <h3 className="text-h3 font-display text-on-surface">结构分析</h3>
            <p className="text-body-sm text-muted-foreground">起承转合</p>
            <p className="text-body-md text-muted-foreground italic">AI 分析中…</p>
          </div>

          <div className="rounded-lg border border-border p-4 space-y-2">
            <h3 className="text-h3 font-display text-on-surface">爆款元素识别</h3>
            <p className="text-body-sm text-muted-foreground">用了贪念/恐惧/反差等中的哪几个</p>
            <p className="text-body-md text-muted-foreground italic">AI 分析中…</p>
          </div>

          <div className="rounded-lg border border-border p-4 space-y-2">
            <h3 className="text-h3 font-display text-on-surface">多维评分</h3>
            <p className="text-body-sm text-muted-foreground">10 维度综合评分</p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {['情感共鸣', '钩子强度', '结构清晰', '行动召唤', '独特性', '节奏感', '真实感', '传播性', '价值密度', '完播率'].map(dim => (
                <div key={dim} className="flex items-center justify-between rounded border border-border px-2 py-1 text-body-sm text-muted-foreground">
                  <span>{dim}</span>
                  <span className="text-muted-foreground">— 分</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border p-4 space-y-2">
            <h3 className="text-h3 font-display text-on-surface">一键仿写</h3>
            <p className="text-body-sm text-muted-foreground">基于爆款结构，一键生成仿写文案</p>
            <button
              type="button"
              onClick={() => navigate('/generate')}
              className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-label-sm font-label hover:bg-primary/90 transition-colors"
            >
              一键仿写
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
