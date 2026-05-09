/**
 * AnalysisResult — /analysis 工具页结果渲染 · PRD-5 US-008
 * Accepts raw AnalysisHistoryRow (content: string JSON) from trpc.analysis.analyze
 * JSON.parse(data.content) → 5 维度 Progress bar (shadcn Progress)
 * Color: overall>=80 green · >=60 yellow · <60 red
 * Graceful: JSON.parse fail → "解析失败 · 请重试" · scores.overall missing → N/A
 * LD-015: 0 hardcode color — Tailwind semantic classes only
 */

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

// ── Types ─────────────────────────────────────────────────────────────────────

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

interface AnalysisHistoryRowLike {
  content?: string;
}

interface AnalysisResultProps {
  data: unknown;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DIMENSION_LABELS: Record<keyof Omit<ScoreSet, 'overall'>, string> = {
  hook: '钩子强度',
  structure: '起承转合',
  emotion: '情绪曲线',
  specificity: '具体性',
  cta: '行动召唤',
};

const DIMENSIONS = Object.keys(DIMENSION_LABELS) as Array<keyof typeof DIMENSION_LABELS>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function overallColorClass(overall: number): string {
  if (overall >= 80) return 'bg-green-500';
  if (overall >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
}

// ── Sub-components ────────────────────────────────────────────────────────────

function DimensionBar({
  label,
  value,
  indicatorClass,
}: {
  label: string;
  value: number;
  indicatorClass: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="space-y-1" data-testid={`analysis-dim-bar-${label}`}>
      <div className="flex justify-between text-body-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-on-surface">{value}</span>
      </div>
      <Progress value={pct} indicatorClassName={indicatorClass} aria-label={label} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AnalysisResult({ data }: AnalysisResultProps) {
  const row = (data ?? {}) as AnalysisHistoryRowLike;

  // AC-8: JSON.parse fail → graceful error
  let parsed: AnalysisData | null = null;
  try {
    if (row.content) {
      parsed = JSON.parse(row.content) as AnalysisData;
    }
  } catch {
    return (
      <div
        className="rounded-lg border border-error bg-error/5 p-4"
        role="alert"
        data-testid="analysis-parse-error"
      >
        <p className="text-body-sm text-error">解析失败 · 请重试</p>
      </div>
    );
  }

  if (!parsed) {
    return (
      <div className="rounded-lg border border-border bg-surface-container p-4" data-testid="tool-result-analysis">
        <p className="text-body-sm text-muted-foreground text-center py-4">暂无结果</p>
      </div>
    );
  }

  const scores = parsed.scores ?? {};
  const optimizations = parsed.optimizations ?? [];
  const overall = scores.overall;

  // AC-10: color class for overall score bar
  const overallClass = overall !== undefined ? overallColorClass(overall) : 'bg-primary';
  // Each dimension inherits the overall color for visual consistency
  const dimClass = overallClass;

  return (
    <div className="space-y-6" data-testid="tool-result-analysis">
      {/* 综合评分 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-body-md font-semibold text-on-surface">综合评分</h3>
            {/* AC-9: overall missing → N/A */}
            <span
              className="text-display-sm font-bold text-on-surface"
              data-testid="analysis-overall-score"
            >
              {overall !== undefined ? overall : 'N/A'}
            </span>
          </div>

          {/* AC-3: 5 维度 Progress bar */}
          <div className="space-y-3">
            {DIMENSIONS.map((key) => (
              <DimensionBar
                key={key}
                label={DIMENSION_LABELS[key]}
                value={scores[key] ?? 0}
                indicatorClass={dimClass}
              />
            ))}
          </div>

          {/* Overall progress bar */}
          {overall !== undefined && (
            <div className="mt-4 space-y-1">
              <div className="flex justify-between text-body-xs">
                <span className="text-muted-foreground font-medium">综合</span>
                <span className="font-semibold text-on-surface">{overall}</span>
              </div>
              <Progress
                value={overall}
                indicatorClassName={overallClass}
                aria-label="综合评分"
                data-testid="analysis-overall-bar"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 优化建议 */}
      {optimizations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-body-md font-semibold text-on-surface">优化建议</h3>
          {optimizations.map((opt, i) => (
            <Card key={i} data-testid={`analysis-opt-${i}`}>
              <CardContent className="pt-4 space-y-1">
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 改写片段 */}
      {parsed.rewriteSnippet && (
        <Card className="border-primary/30 bg-primary/5" data-testid="analysis-rewrite">
          <CardContent className="pt-4">
            <h3 className="text-body-sm font-semibold text-on-surface mb-2">改写示例</h3>
            <p className="text-body-sm text-on-surface leading-relaxed">{parsed.rewriteSnippet}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
