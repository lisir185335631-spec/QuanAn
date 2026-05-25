/**
 * ArchiveListItem · archive entry row · ✓ + title + sub + 已学习 chip
 */
import { CheckCircle2 } from 'lucide-react';

import type { ArchiveEntry } from '@/lib/constants/evolution';
import { EVOLUTION_ARCHIVE_DONE_CHIP } from '@/lib/constants/evolution';

interface ArchiveListItemProps {
  archive: ArchiveEntry;
}

export function ArchiveListItem({ archive }: ArchiveListItemProps) {
  return (
    <div
      data-testid={`archive-item-${archive.id}`}
      className="flex items-center justify-between gap-4 bg-card/40 backdrop-blur-md border border-border/40 rounded-lg px-4 py-3"
    >
      {/* left: check + title + subtitle */}
      <div className="flex items-start gap-3 min-w-0">
        <div className="shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center mt-0.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="min-w-0">
          <p
            data-testid={`archive-title-${archive.id}`}
            className="text-sm font-bold text-on-surface truncate"
          >
            {archive.title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {archive.date}　{archive.source}
          </p>
        </div>
      </div>

      {/* right: 已学习 chip */}
      {archive.done && (
        <span
          data-testid={`archive-chip-${archive.id}`}
          className="shrink-0 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full"
        >
          {EVOLUTION_ARCHIVE_DONE_CHIP}
        </span>
      )}
    </div>
  );
}
