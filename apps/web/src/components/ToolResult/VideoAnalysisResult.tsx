/**
 * VideoAnalysisResult — /video-analysis 工具页结果渲染 · PRD-5 US-001
 * Renders analysisViralOutput: 元素拆解 + 洞察 + 仿写版
 */

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

interface VideoAnalysisResultProps {
  data: unknown;
}

const IMPACT_COLORS: Record<string, string> = {
  '高': 'bg-error/10 text-error',
  '中': 'bg-amber-500/10 text-amber-600',
  '低': 'bg-surface-container text-muted-foreground',
};

export function VideoAnalysisResult({ data }: VideoAnalysisResultProps) {
  const d = (data ?? {}) as VideoAnalysisData;
  const analysis = d.analysis ?? {};
  const insights = d.insights ?? [];

  return (
    <div className="space-y-6" data-testid="tool-result-video-analysis">
      {/* 元素 + 公式 */}
      {(analysis.elements?.length ?? 0) > 0 && (
        <div className="rounded-lg border border-border bg-surface-container p-4 space-y-3">
          <h3 className="text-body-md font-semibold text-on-surface">爆款公式分析</h3>

          <div className="flex flex-wrap gap-1.5">
            {(analysis.elements ?? []).map((el) => (
              <span key={el} className="rounded-md bg-primary/10 px-2 py-0.5 text-body-xs text-primary">
                {el}
              </span>
            ))}
          </div>

          {analysis.structure && (
            <p className="text-body-sm text-on-surface">
              <span className="font-medium">结构：</span>{analysis.structure}
            </p>
          )}
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
        </div>
      )}

      {/* 洞察列表 */}
      {insights.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-body-md font-semibold text-on-surface">元素洞察</h3>
          {insights.map((ins, i) => (
            <div key={i} className="rounded-lg border border-border bg-surface-container p-3 space-y-1">
              <div className="flex items-center gap-2">
                {ins.element && (
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-body-xs font-medium text-primary">
                    {ins.element}
                  </span>
                )}
                {ins.impact && (
                  <span className={`rounded px-1.5 py-0.5 text-body-xs font-medium ${IMPACT_COLORS[ins.impact] ?? ''}`}>
                    {ins.impact}影响
                  </span>
                )}
              </div>
              {ins.explanation && (
                <p className="text-body-sm text-on-surface">{ins.explanation}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 仿写版 */}
      {d.rewriteVersion && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
          <h3 className="text-body-sm font-semibold text-on-surface mb-2">一键仿写版</h3>
          <pre className="whitespace-pre-wrap text-body-sm text-on-surface font-sans leading-relaxed">
            {d.rewriteVersion}
          </pre>
        </div>
      )}
    </div>
  );
}
