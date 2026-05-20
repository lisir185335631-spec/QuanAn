/**
 * VideoAnalysis.tsx — /video-analysis · PRD-25 US-005
 * AC-1: useMutation → trpc.videoAnalysis.analyze · loading spinner + 'AI 深度解析中...'
 * AC-2: viral output 5 H3 · analysis.structure / hookType / elements / insights / rewriteVersion
 * AC-3: 一键仿写 → navigate('/generate', {state:{title,copy}})
 * AC-5: isFallback banner + retry button
 * AC-6: onError toast.error + retry button
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { trpc } from '@/lib/trpc';

// ── Inline types (no server import) ──────────────────────────────────────────

interface ViralAnalysis {
  elements?: string[];
  structure?: string;
  hookType?: string;
  viralFormula?: string;
}

interface ViralInsight {
  element?: string;
  explanation?: string;
  impact?: '高' | '中' | '低';
}

interface AnalysisViralOutput {
  analysis?: ViralAnalysis;
  insights?: ViralInsight[];
  rewriteVersion?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SUBTITLE = '粘贴爆款视频的完整文案/口播稿，AI 将深度拆解爆款密码，支持一键仿写';
const INFOBOX_TEXT =
  '打开抖音/小红书/快手等 APP → 找到爆款视频 → 复制视频的完整口播文案/文字内容 → 粘贴到下方输入框 → 点击「开始深度解析」';

const IMPACT_STYLE: Record<string, string> = {
  '高': 'bg-red-500/10 text-red-600',
  '中': 'bg-amber-500/10 text-amber-600',
  '低': 'bg-muted text-muted-foreground',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function VideoAnalysis() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [copy, setCopy] = useState('');
  const [result, setResult] = useState<AnalysisViralOutput | null>(null);
  const [isFallback, setIsFallback] = useState(false);

  const analyzeMutation = trpc.videoAnalysis.analyze.useMutation({
    onSuccess(data) {
      try {
        const parsed = JSON.parse(data.content) as AnalysisViralOutput;
        setResult(parsed);
        setIsFallback(data.isFallback);
      } catch {
        toast.error('解析失败 · 请稍后再试');
      }
    },
    onError() {
      toast.error('解析失败 · 请稍后再试');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (copy.length < 10) return;
    setResult(null);
    setIsFallback(false);
    analyzeMutation.mutate({ lastCopy: copy, lastTitle: title || undefined });
  }

  function handleRetry() {
    if (copy.length < 10) return;
    setResult(null);
    setIsFallback(false);
    analyzeMutation.mutate({ lastCopy: copy, lastTitle: title || undefined });
  }

  return (
    <main className="flex-1 container py-8 space-y-8">
      {/* Header — AC-1 */}
      <div>
        <span className="text-label-sm font-label text-primary uppercase tracking-wide">市场洞察</span>
        <h1 className="mt-1 text-h1 font-display text-on-surface">爆款文案解析</h1>
        <p className="mt-2 text-body-md text-muted-foreground">{SUBTITLE}</p>
      </div>

      {/* Infobox */}
      <div
        className="rounded-lg border border-border bg-muted/30 p-4 text-body-sm text-muted-foreground"
        data-testid="video-analysis-infobox"
      >
        {INFOBOX_TEXT}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="va-title" className="text-label-sm font-label text-on-surface">视频标题</label>
          <input
            id="va-title"
            type="text"
            placeholder="视频标题（选填）"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-body-md placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="va-copy" className="text-label-sm font-label text-on-surface">视频文案</label>
          <textarea
            id="va-copy"
            placeholder="粘贴爆款视频的完整文案/口播稿（至少 10 个字）..."
            value={copy}
            onChange={e => setCopy(e.target.value)}
            rows={8}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-body-md placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          />
        </div>
        <button
          type="submit"
          disabled={copy.length < 10 || analyzeMutation.isPending}
          className="w-full rounded-md bg-primary text-primary-foreground py-2.5 text-label-md font-label disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
        >
          {analyzeMutation.isPending ? 'AI 深度解析中...' : '开始深度解析'}
        </button>
      </form>

      {/* Loading — AC-1 */}
      {analyzeMutation.isPending && (
        <div
          className="flex flex-col items-center gap-3 py-8"
          data-testid="video-analysis-loading"
        >
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-body-md text-muted-foreground">AI 深度解析中...</p>
        </div>
      )}

      {/* isFallback banner — AC-5 */}
      {result && isFallback && (
        <div
          className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3"
          data-testid="video-analysis-fallback-banner"
        >
          <p className="text-body-sm text-muted-foreground">AI 暂未生成深度分析 · 显示规则评分</p>
          <button
            type="button"
            onClick={handleRetry}
            className="rounded-md border border-border px-3 py-1.5 text-label-sm font-label text-muted-foreground hover:bg-muted/50 transition-colors"
            data-testid="video-analysis-retry"
          >
            重试
          </button>
        </div>
      )}

      {/* Results — AC-2 */}
      {result && (
        <div className="space-y-4" data-testid="video-analysis-output">
          {/* H3-1: 结构拆解 */}
          <div className="rounded-lg border border-border p-4 space-y-2">
            <h3 className="text-h3 font-display text-on-surface">结构拆解</h3>
            {result.analysis?.structure ? (
              <p className="text-body-md text-on-surface" data-testid="viral-structure">
                {result.analysis.structure}
              </p>
            ) : (
              <p className="text-body-md text-muted-foreground italic">暂无数据</p>
            )}
          </div>

          {/* H3-2: 节奏分析 */}
          <div className="rounded-lg border border-border p-4 space-y-2">
            <h3 className="text-h3 font-display text-on-surface">节奏分析</h3>
            {result.analysis?.hookType && (
              <p className="text-body-sm text-muted-foreground">
                钩子类型：<span className="text-on-surface font-medium" data-testid="viral-hook-type">{result.analysis.hookType}</span>
              </p>
            )}
            {result.analysis?.viralFormula && (
              <p className="text-body-md text-primary font-medium border-l-2 border-primary pl-3" data-testid="viral-formula">
                {result.analysis.viralFormula}
              </p>
            )}
            {!result.analysis?.hookType && !result.analysis?.viralFormula && (
              <p className="text-body-md text-muted-foreground italic">暂无数据</p>
            )}
          </div>

          {/* H3-3: 爆款元素识别 */}
          <div className="rounded-lg border border-border p-4 space-y-2">
            <h3 className="text-h3 font-display text-on-surface">爆款元素识别</h3>
            {result.analysis?.elements && result.analysis.elements.length > 0 ? (
              <div className="flex flex-wrap gap-2" data-testid="viral-elements">
                {result.analysis.elements.map(el => (
                  <span
                    key={el}
                    className="rounded-md bg-primary/10 px-2.5 py-0.5 text-body-xs font-medium text-primary"
                  >
                    {el}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-body-md text-muted-foreground italic">暂无元素</p>
            )}
          </div>

          {/* H3-4: 多维评分 */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <h3 className="text-h3 font-display text-on-surface">多维评分</h3>
            {result.insights && result.insights.length > 0 ? (
              <div className="space-y-2" data-testid="viral-insights">
                {result.insights.map((ins, i) => (
                  <div key={i} className="flex items-start gap-2 flex-wrap">
                    {ins.impact && (
                      <span
                        className={`rounded px-1.5 py-0.5 text-body-xs font-medium ${IMPACT_STYLE[ins.impact] ?? 'bg-muted text-muted-foreground'}`}
                        data-testid={`viral-impact-${i}`}
                      >
                        {ins.impact}影响
                      </span>
                    )}
                    {ins.element && (
                      <span className="text-body-sm font-medium text-on-surface">{ins.element}</span>
                    )}
                    {ins.explanation && (
                      <span className="text-body-sm text-muted-foreground">{ins.explanation}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-body-md text-muted-foreground italic">暂无评分数据</p>
            )}
          </div>

          {/* H3-5: 优化建议 / 仿写版 + 一键仿写 button */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <h3 className="text-h3 font-display text-on-surface">优化建议</h3>
            {result.rewriteVersion && (
              <p
                className="text-body-md text-on-surface leading-relaxed whitespace-pre-wrap"
                data-testid="viral-rewrite"
              >
                {result.rewriteVersion}
              </p>
            )}
            {/* AC-3: 一键仿写 → navigate with state */}
            <button
              type="button"
              onClick={() =>
                navigate('/generate', { state: { title: title, copy: copy } })
              }
              className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-label-sm font-label hover:bg-primary/90 transition-colors"
              data-testid="video-analysis-imitate"
            >
              一键仿写
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
