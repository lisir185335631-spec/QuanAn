/**
 * HistoryChipRow — scriptType chip + element chips · sally 1:1 复刻
 * element emoji+label 复用 ALL_ELEMENTS lookup · 不重复定义
 */

import { ALL_ELEMENTS } from '@/lib/constants/elements';

interface HistoryChipRowProps {
  scriptType: string;
  elementKeys: ReadonlyArray<string>;
}

export function HistoryChipRow({ scriptType, elementKeys }: HistoryChipRowProps) {
  return (
    <div
      data-testid="history-chip-row"
      className="flex flex-wrap gap-2"
    >
      {/* 类型 chip — 金边金字 */}
      <span
        data-testid={`script-type-chip-${scriptType}`}
        className="border border-amber-400 text-amber-400 px-3 py-1 rounded text-sm"
      >
        {scriptType}
      </span>

      {/* element chips — 查 ALL_ELEMENTS by key */}
      {elementKeys.map((key) => {
        const el = ALL_ELEMENTS.find((e) => e.key === key);
        if (!el) return null;
        return (
          <span
            key={key}
            data-testid={`element-chip-${key}`}
            className="border border-border bg-card/40 rounded px-2 py-1 text-sm text-muted-foreground"
          >
            {el.emoji} {el.label}
          </span>
        );
      })}
    </div>
  );
}
