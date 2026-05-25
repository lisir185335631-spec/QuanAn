/**
 * AccountChipRow — 4 chip 横排 · 每 chip = lucide icon + label
 * § SPEC §3 · border + bg-card/40 + rounded-md + px-3 py-1
 */
import type { AccountChip } from '@/lib/constants/accounts';

interface AccountChipRowProps {
  chips: ReadonlyArray<AccountChip>;
}

export function AccountChipRow({ chips }: AccountChipRowProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => {
        const Icon = chip.icon;
        return (
          <span
            key={chip.label}
            className="inline-flex items-center gap-1.5 border border-border bg-card/40 rounded-md px-3 py-1 text-sm text-muted-foreground"
          >
            <Icon className="w-4 h-4 shrink-0" />
            {chip.label}
          </span>
        );
      })}
    </div>
  );
}
