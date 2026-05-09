/**
 * FreeGenerateResult — /generate 工具页结果渲染 · PRD-5 US-001
 * Renders copywritingFreeOutput: markdown 文案 + metadata
 */

interface FreeGenerateData {
  markdown?: string;
  metadata?: {
    scriptType?: string;
    elements?: string[];
    structureSummary?: string;
    estimatedDuration?: string;
  };
}

interface FreeGenerateResultProps {
  data: unknown;
}

export function FreeGenerateResult({ data }: FreeGenerateResultProps) {
  const d = (data ?? {}) as FreeGenerateData;

  return (
    <div className="space-y-4" data-testid="tool-result-generate">
      {d.metadata && (
        <div className="flex flex-wrap gap-2 text-body-xs">
          {d.metadata.scriptType && (
            <span className="rounded-md bg-surface-container px-2 py-0.5 text-muted-foreground">
              {d.metadata.scriptType}
            </span>
          )}
          {d.metadata.estimatedDuration && (
            <span className="rounded-md bg-surface-container px-2 py-0.5 text-muted-foreground">
              {d.metadata.estimatedDuration}
            </span>
          )}
          {(d.metadata.elements ?? []).map((el) => (
            <span key={el} className="rounded-md bg-primary/10 px-2 py-0.5 text-primary">
              {el}
            </span>
          ))}
        </div>
      )}

      {d.metadata?.structureSummary && (
        <p className="text-body-xs text-muted-foreground border-l-2 border-primary/40 pl-3">
          {d.metadata.structureSummary}
        </p>
      )}

      <div className="rounded-lg border border-border bg-surface-container p-4">
        <pre className="whitespace-pre-wrap text-body-sm text-on-surface font-sans leading-relaxed">
          {d.markdown ?? ''}
        </pre>
      </div>
    </div>
  );
}
