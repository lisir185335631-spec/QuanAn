/**
 * Analysis.tsx — /analysis · PRD-25 US-005
 * AC-4: useMutation → trpc.analysis.analyze · structural output 5 H3
 * AC-5: isFallback banner + retry button
 * AC-6: onError toast.error + retry button
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { trpc } from '@/lib/trpc';

// ── Inline types (no server import) ──────────────────────────────────────────

interface ScoreSet {
  hook?: number;
  structure?: number;
  emotion?: number;
  specificity?: number;
  cta?: number;
  overall?: number;
}

interface Optimization {
  dimension?: string;
  issue?: string;
  suggestion?: string;
}

interface AnalysisStructuralOutput {
  scores?: ScoreSet;
  optimizations?: Optimization[];
  rewriteSnippet?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SUBTITLE = '粘贴任意短视频文案，AI 将从结构、节奏、爆款元素等多维度深度分析';

const SCORE_LABELS: Record<keyof Omit<ScoreSet, 'overall'>, string> = {
  hook: '钩子强度',
  structure: '结构清晰',
  emotion: '情绪曲线',
  specificity: '具体性',
  cta: '行动召唤',
};

const SCORE_KEYS = Object.keys(SCORE_LABELS) as Array<keyof typeof SCORE_LABELS>;

// ── ScoreBar sub-component ────────────────────────────────────────────────────

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const colorClass = pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="space-y-1" data-testid={`structural-score-${label}`}>
      <div className="flex justify-between text-body-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-on-surface">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted">
        <div
          className={`h-1.5 rounded-full transition-all ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Analysis() {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [result, setResult] = useState<AnalysisStructuralOutput | null>(null);
  const [isFallback, setIsFallback] = useState(false);

  const analyzeMutation = trpc.analysis.analyze.useMutation({
    onSuccess(data) {
      try {
        const parsed = JSON.parse(data.content) as AnalysisStructuralOutput;
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
    if (text.length < 10) return;
    setResult(null);
    setIsFallback(false);
    analyzeMutation.mutate({ copy: text });
  }

  function handleRetry() {
    if (text.length < 10) return;
    setResult(null);
    setIsFallback(false);
    analyzeMutation.mutate({ copy: text });
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
          <label htmlFor="analysis-copy" className="text-label-sm font-label text-on-surface">文案</label>
          <textarea
            id="analysis-copy"
            placeholder="粘贴需要分析的短视频文案（至少 10 个字）..."
            value={text}
            onChange={e => setText(e.target.value)}
            rows={8}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-body-md placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          />
          <div className="flex justify-end">
            <span className="text-body-sm text-muted-foreground" data-testid="char-count">
              {text.length} 字
            </span>
          </div>
        </div>
        <button
          type="submit"
          disabled={text.length < 10 || analyzeMutation.isPending}
          className="w-full rounded-md bg-primary text-primary-foreground py-2.5 text-label-md font-label disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
        >
          {analyzeMutation.isPending ? 'AI 分析中...' : '开始分析'}
        </button>
      </form>

      {/* Loading */}
      {analyzeMutation.isPending && (
        <div
          className="flex flex-col items-center gap-3 py-8"
          data-testid="analysis-loading"
        >
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-body-md text-muted-foreground">AI 深度解析中...</p>
        </div>
      )}

      {/* isFallback banner — AC-5 */}
      {result && isFallback && (
        <div
          className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3"
          data-testid="analysis-fallback-banner"
        >
          <p className="text-body-sm text-muted-foreground">AI 暂未生成深度分析 · 显示规则评分</p>
          <button
            type="button"
            onClick={handleRetry}
            className="rounded-md border border-border px-3 py-1.5 text-label-sm font-label text-muted-foreground hover:bg-muted/50 transition-colors"
            data-testid="analysis-retry"
          >
            重试
          </button>
        </div>
      )}

      {/* Results — AC-4 */}
      {result && (
        <div className="space-y-4" data-testid="analysis-output">
          {/* H3-1: 结构拆解 */}
          <div className="rounded-lg border border-border p-4 space-y-2">
            <h3 className="text-h3 font-display text-on-surface">结构拆解</h3>
            {result.scores?.structure !== undefined ? (
              <ScoreBar label="结构清晰" value={result.scores.structure} />
            ) : (
              <p className="text-body-md text-muted-foreground italic">暂无数据</p>
            )}
            {result.rewriteSnippet && (
              <p
                className="text-body-sm text-on-surface mt-2 leading-relaxed"
                data-testid="structural-rewrite-snippet"
              >
                {result.rewriteSnippet}
              </p>
            )}
          </div>

          {/* H3-2: 节奏分析 */}
          <div className="rounded-lg border border-border p-4 space-y-2">
            <h3 className="text-h3 font-display text-on-surface">节奏分析</h3>
            <div className="space-y-2" data-testid="structural-pacing">
              {result.scores?.hook !== undefined && (
                <ScoreBar label="钩子强度" value={result.scores.hook} />
              )}
              {result.scores?.emotion !== undefined && (
                <ScoreBar label="情绪曲线" value={result.scores.emotion} />
              )}
              {result.scores?.hook === undefined && result.scores?.emotion === undefined && (
                <p className="text-body-md text-muted-foreground italic">暂无数据</p>
              )}
            </div>
          </div>

          {/* H3-3: 爆款元素识别 */}
          <div className="rounded-lg border border-border p-4 space-y-2">
            <h3 className="text-h3 font-display text-on-surface">爆款元素识别</h3>
            <div className="space-y-2" data-testid="structural-elements">
              {result.scores?.specificity !== undefined && (
                <ScoreBar label="具体性" value={result.scores.specificity} />
              )}
              {result.scores?.cta !== undefined && (
                <ScoreBar label="行动召唤" value={result.scores.cta} />
              )}
              {result.scores?.specificity === undefined && result.scores?.cta === undefined && (
                <p className="text-body-md text-muted-foreground italic">暂无数据</p>
              )}
            </div>
          </div>

          {/* H3-4: 多维评分 */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <h3 className="text-h3 font-display text-on-surface">多维评分</h3>
            {result.scores ? (
              <div className="space-y-2" data-testid="structural-scores">
                {SCORE_KEYS.map(key => {
                  const s = result.scores;
                  const val = s?.[key];
                  if (val === undefined) return null;
                  return (
                    <ScoreBar
                      key={key}
                      label={SCORE_LABELS[key]}
                      value={val}
                    />
                  );
                })}
                {result.scores.overall !== undefined && (
                  <div className="pt-2 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-body-sm font-medium text-on-surface">综合评分</span>
                      <span
                        className="text-display-sm font-bold text-on-surface"
                        data-testid="structural-overall"
                      >
                        {result.scores.overall}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-body-md text-muted-foreground italic">暂无评分</p>
            )}
          </div>

          {/* H3-5: 优化建议 + 一键仿写 */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <h3 className="text-h3 font-display text-on-surface">优化建议</h3>
            {result.optimizations && result.optimizations.length > 0 ? (
              <div className="space-y-3" data-testid="structural-optimizations">
                {result.optimizations.map((opt, i) => (
                  <div key={i} className="space-y-1">
                    {opt.dimension && (
                      <span className="inline-block rounded bg-primary/10 px-1.5 py-0.5 text-body-xs font-medium text-primary">
                        {opt.dimension}
                      </span>
                    )}
                    {opt.issue && (
                      <p className="text-body-xs text-muted-foreground">问题：{opt.issue}</p>
                    )}
                    {opt.suggestion && (
                      <p className="text-body-sm text-on-surface">建议：{opt.suggestion}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-body-md text-muted-foreground italic">暂无建议</p>
            )}
            {/* 一键仿写 */}
            <button
              type="button"
              onClick={() =>
                navigate('/generate', { state: { title: '', copy: text } })
              }
              className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-label-sm font-label hover:bg-primary/90 transition-colors"
              data-testid="analysis-imitate"
            >
              一键仿写
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
