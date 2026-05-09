/**
 * BoomGenerateResult — /boom-generate 工具页结果渲染 · PRD-5 US-001
 * Renders boomOutput: 5 候选标题 + metadata
 */

interface BoomGenerateData {
  candidates?: string[];
  metadata?: {
    count?: number;
    elements?: string[];
  };
}

interface BoomGenerateResultProps {
  data: unknown;
}

export function BoomGenerateResult({ data }: BoomGenerateResultProps) {
  const d = (data ?? {}) as BoomGenerateData;
  const candidates = d.candidates ?? [];

  return (
    <div className="space-y-4" data-testid="tool-result-boom-generate">
      {d.metadata?.elements && d.metadata.elements.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {d.metadata.elements.map((el) => (
            <span key={el} className="rounded-md bg-primary/10 px-2 py-0.5 text-body-xs text-primary">
              {el}
            </span>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {candidates.map((candidate, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-surface-container p-4 hover:border-primary/40 transition-colors"
            data-testid={`boom-candidate-${i}`}
          >
            <div className="flex items-start gap-3">
              <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-body-xs font-medium text-primary">
                {i + 1}
              </span>
              <p className="text-body-sm text-on-surface leading-relaxed">{candidate}</p>
            </div>
          </div>
        ))}
      </div>

      {candidates.length === 0 && (
        <p className="text-body-sm text-muted-foreground text-center py-8">暂无结果</p>
      )}
    </div>
  );
}
