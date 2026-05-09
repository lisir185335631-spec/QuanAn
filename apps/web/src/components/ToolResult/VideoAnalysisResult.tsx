/**
 * VideoAnalysisResult — /video-analysis 工具页结果渲染 · PRD-5 US-010
 * Accepts raw VideoAnalysisHistoryRow (content: string JSON) from trpc.videoAnalysis.analyze
 * JSON.parse(data.content) → analysis.elements Badge tag 列表 + insights Card + rewriteVersion markdown
 * LD-015: 0 hardcode color — Tailwind semantic classes only
 * AC-8: JSON.parse fail → "解析失败"
 * AC-10: elements 空数组 → "无识别元素"
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Card, CardContent } from '@/components/ui/card';
import { HOT_ELEMENTS_ZH } from '@/lib/constants/hotElementsZh';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ViralAnalysis {
  elements?: string[];
  structure?: string;
  hookType?: string;
  viralFormula?: string;
}

interface Insight {
  element?: string;
  explanation?: string;
  impact?: '高' | '中' | '低';
}

interface VideoAnalysisData {
  analysis?: ViralAnalysis;
  insights?: Insight[];
  rewriteVersion?: string;
}

interface VideoAnalysisHistoryRowLike {
  content?: string;
}

interface VideoAnalysisResultProps {
  data: unknown;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const IMPACT_CLASS: Record<string, string> = {
  '高': 'bg-error/10 text-error',
  '中': 'bg-amber-500/10 text-amber-600',
  '低': 'bg-surface-container text-muted-foreground',
};

const IMPACT_LABEL: Record<string, string> = {
  '高': '高影响',
  '中': '中影响',
  '低': '低影响',
};

// ── Main component ────────────────────────────────────────────────────────────

export function VideoAnalysisResult({ data }: VideoAnalysisResultProps) {
  const row = (data ?? {}) as VideoAnalysisHistoryRowLike;

  // AC-8: JSON.parse fail → 解析失败
  let parsed: VideoAnalysisData | null = null;
  try {
    if (row.content) {
      parsed = JSON.parse(row.content) as VideoAnalysisData;
    }
  } catch {
    return (
      <div
        className="rounded-lg border border-error bg-error/5 p-4"
        role="alert"
        data-testid="video-analysis-parse-error"
      >
        <p className="text-body-sm text-error">解析失败</p>
      </div>
    );
  }

  if (!parsed) {
    return (
      <div className="rounded-lg border border-border bg-surface-container p-4" data-testid="tool-result-video-analysis">
        <p className="text-body-sm text-muted-foreground text-center py-4">暂无结果</p>
      </div>
    );
  }

  const elements = parsed.analysis?.elements ?? [];
  const insights = parsed.insights ?? [];
  const analysis = parsed.analysis ?? {};

  return (
    <div className="space-y-6" data-testid="tool-result-video-analysis">
      {/* 爆款元素 Tag 列表 */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <h3 className="text-body-md font-semibold text-on-surface">识别爆款元素</h3>

          {/* AC-10: elements 空 → "无识别元素" */}
          {elements.length === 0 ? (
            <p className="text-body-sm text-muted-foreground" data-testid="video-analysis-no-elements">
              无识别元素
            </p>
          ) : (
            <div className="flex flex-wrap gap-2" data-testid="video-analysis-elements">
              {elements.map((el) => (
                <span
                  key={el}
                  className="rounded-md bg-primary/10 px-2.5 py-0.5 text-body-xs font-medium text-primary"
                  data-testid={`video-analysis-tag-${el}`}
                >
                  {HOT_ELEMENTS_ZH[el as keyof typeof HOT_ELEMENTS_ZH] ?? el}
                </span>
              ))}
            </div>
          )}

          {/* 公式 & 结构附加信息 */}
          {analysis.hookType && (
            <p className="text-body-sm text-on-surface">
              <span className="font-medium">钩子类型：</span>{analysis.hookType}
            </p>
          )}
          {analysis.viralFormula && (
            <p className="text-body-sm text-primary font-medium border-l-2 border-primary pl-3">
              {analysis.viralFormula}
            </p>
          )}
        </CardContent>
      </Card>

      {/* 洞察列表 */}
      {insights.length > 0 && (
        <div className="space-y-3" data-testid="video-analysis-insights">
          <h3 className="text-body-md font-semibold text-on-surface">元素洞察</h3>
          {insights.map((ins, i) => (
            <Card key={i} data-testid={`video-analysis-insight-${i}`}>
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {ins.element && (
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-body-xs font-medium text-primary">
                      {HOT_ELEMENTS_ZH[ins.element as keyof typeof HOT_ELEMENTS_ZH] ?? ins.element}
                    </span>
                  )}
                  {ins.impact && (
                    <span
                      className={`rounded px-1.5 py-0.5 text-body-xs font-medium ${IMPACT_CLASS[ins.impact] ?? ''}`}
                      data-testid={`video-analysis-impact-${i}`}
                    >
                      {IMPACT_LABEL[ins.impact] ?? `${ins.impact}影响`}
                    </span>
                  )}
                </div>
                {ins.explanation && (
                  <p className="text-body-sm text-on-surface">{ins.explanation}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 仿写版 — react-markdown */}
      {parsed.rewriteVersion && (
        <Card className="border-primary/30 bg-primary/5" data-testid="video-analysis-rewrite">
          <CardContent className="pt-4">
            <h3 className="text-body-sm font-semibold text-on-surface mb-3">一键仿写版</h3>
            <article className="prose prose-sm max-w-none text-on-surface prose-headings:text-on-surface prose-p:text-muted-foreground prose-strong:text-on-surface prose-li:text-muted-foreground prose-a:text-primary">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{parsed.rewriteVersion}</ReactMarkdown>
            </article>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
