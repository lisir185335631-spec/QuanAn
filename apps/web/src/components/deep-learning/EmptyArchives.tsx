/**
 * EmptyArchives.tsx — empty state · Brain 大灰 + 2 行 text
 */
import { Brain } from 'lucide-react';

import { DL_EMPTY_DESC, DL_EMPTY_TITLE } from '@/lib/constants/deep-learning';

export function EmptyArchives() {
  return (
    <div
      data-testid="empty-archives"
      className="flex flex-col items-center gap-3 py-16 text-center"
    >
      <Brain className="h-16 w-16 text-muted-foreground/30" />
      <p className="text-base font-medium text-muted-foreground">{DL_EMPTY_TITLE}</p>
      <p className="text-sm text-muted-foreground/70">{DL_EMPTY_DESC}</p>
    </div>
  );
}
