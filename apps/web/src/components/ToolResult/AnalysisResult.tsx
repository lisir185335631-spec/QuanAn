/**
 * AnalysisResult — /analysis 工具页结果渲染 · PRD-5 US-001
 * Renders analysisStructuralOutput: 6 维评分 + 优化建议 + rewriteSnippet
 */

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

interface AnalysisData {
  scores?: ScoreSet;
  optimizations?: Optimization[];
  rewriteSnippet?: string;
}

interface AnalysisResultProps {
  data: unknown;
}

const SCORE_LABELS: Record<keyof Omit<ScoreSet, 'overall'>, string> = {
  hook: '钩子强度',
  structure: '起承转合',
  emotion: '情绪曲线',
  specificity: '具体性',
  cta: '行动召唤',
};

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const color = pct >= 70 ? 'bg-primary' : pct >= 40 ? 'bg-amber-500' : 'bg-error';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-body-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-on-surface">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-container-high overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function AnalysisResult({ data }: AnalysisResultProps) {
  const d = (data ?? {}) as AnalysisData;
  const scores = d.scores ?? {};
  const optimizations = d.optimizations ?? [];

  return (
    <div className="space-y-6" data-testid="tool-result-analysis">
      {/* 综合评分 */}
      {scores.overall !== undefined && (
        <div className="rounded-lg border border-border bg-surface-container p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-body-md font-semibold text-on-surface">综合评分</h3>
            <span className="text-display-sm font-bold text-primary">{scores.overall}</span>
          </div>
          <div className="space-y-3">
            {(Object.keys(SCORE_LABELS) as Array<keyof typeof SCORE_LABELS>).map((k) => (
              <ScoreBar key={k} label={SCORE_LABELS[k]} value={scores[k] ?? 0} />
            ))}
          </div>
        </div>
      )}

      {/* 优化建议 */}
      {optimizations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-body-md font-semibold text-on-surface">优化建议</h3>
          {optimizations.map((opt, i) => (
            <div key={i} className="rounded-lg border border-border bg-surface-container p-3 space-y-1">
              <div className="flex items-center gap-2">
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-body-xs font-medium text-primary">
                  {opt.dimension ?? ''}
                </span>
              </div>
              {opt.issue && (
                <p className="text-body-xs text-muted-foreground">问题：{opt.issue}</p>
              )}
              {opt.suggestion && (
                <p className="text-body-sm text-on-surface">建议：{opt.suggestion}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 改写片段 */}
      {d.rewriteSnippet && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
          <h3 className="text-body-sm font-semibold text-on-surface mb-2">改写示例</h3>
          <p className="text-body-sm text-on-surface leading-relaxed">{d.rewriteSnippet}</p>
        </div>
      )}
    </div>
  );
}
