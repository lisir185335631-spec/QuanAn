/**
 * HistoryEntryCard — 单 entry card · sally 1:1 复刻
 * rounded-xl border bg-card p-6 · 3 rows + 右上 3 icon btn
 */

import { Clock } from 'lucide-react';

import { HISTORY_ACTIONS, HISTORY_TOPIC_PREFIX } from '@/lib/constants/historyPage';
import type { HistoryEntry } from '@/lib/constants/historyPage';

import { HistoryChipRow } from './HistoryChipRow';

interface HistoryEntryCardProps {
  entry: HistoryEntry;
  onView: () => void;
  onCopy: (topic: string) => void;
  onDelete: () => void;
}

export function HistoryEntryCard({
  entry,
  onView,
  onCopy,
  onDelete,
}: HistoryEntryCardProps) {
  function handleAction(key: string) {
    if (key === 'view') onView();
    else if (key === 'copy') onCopy(entry.topic);
    else if (key === 'delete') onDelete();
  }

  return (
    <div
      data-testid={`history-entry-card-${entry.id}`}
      className="relative rounded-xl border border-border bg-card p-6 space-y-3"
    >
      {/* 右上 3 icon btn */}
      <div
        data-testid={`history-entry-actions-${entry.id}`}
        className="absolute top-4 right-4 flex gap-1"
      >
        {HISTORY_ACTIONS.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            data-testid={`history-btn-${key}-${entry.id}`}
            aria-label={label}
            onClick={() => handleAction(key)}
            className="rounded-full p-1.5 text-muted-foreground hover:text-amber-400 hover:bg-muted/30 transition-colors"
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>

      {/* row 1 · chip group */}
      <HistoryChipRow
        scriptType={entry.scriptType}
        elementKeys={entry.elementKeys}
      />

      {/* row 2 · 主题 */}
      <p data-testid={`history-topic-${entry.id}`} className="text-sm">
        <span className="text-muted-foreground">{HISTORY_TOPIC_PREFIX}</span>
        <span className="text-white">{entry.topic}</span>
      </p>

      {/* row 3 · timestamp */}
      <p
        data-testid={`history-timestamp-${entry.id}`}
        className="flex items-center gap-1 text-xs text-muted-foreground"
      >
        <Clock className="h-3 w-3" />
        {entry.timestamp}
      </p>
    </div>
  );
}
