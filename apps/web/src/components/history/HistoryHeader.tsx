/**
 * HistoryHeader — h1 + subtitle · sally 1:1 复刻
 */

import { HISTORY_H1, HISTORY_SUBTITLE_TPL } from '@/lib/constants/historyPage';

interface HistoryHeaderProps {
  count: number;
}

export function HistoryHeader({ count }: HistoryHeaderProps) {
  return (
    <div data-testid="history-header" className="space-y-1">
      <h1
        data-testid="history-h1"
        className="text-2xl font-bold text-white"
      >
        {HISTORY_H1}
      </h1>
      <p
        data-testid="history-subtitle"
        className="text-sm text-muted-foreground"
      >
        {HISTORY_SUBTITLE_TPL(count)}
      </p>
    </div>
  );
}
