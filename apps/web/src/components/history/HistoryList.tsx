/**
 * HistoryList — vertical stack of HistoryEntryCard · sally 1:1 复刻
 */

import type { HistoryEntry } from '@/lib/constants/historyPage';

import { HistoryEntryCard } from './HistoryEntryCard';

interface HistoryListProps {
  entries: ReadonlyArray<HistoryEntry>;
  onView: () => void;
  onCopy: (topic: string) => void;
  onDelete: () => void;
}

export function HistoryList({
  entries,
  onView,
  onCopy,
  onDelete,
}: HistoryListProps) {
  return (
    <div data-testid="history-list" className="space-y-4">
      {entries.map((entry) => (
        <HistoryEntryCard
          key={entry.id}
          entry={entry}
          onView={onView}
          onCopy={onCopy}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
