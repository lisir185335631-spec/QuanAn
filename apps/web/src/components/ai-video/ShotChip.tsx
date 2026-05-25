/**
 * ShotChip.tsx — SHOT 底部 chip
 * icon + text · border-border + 金 text
 */
import type { LucideIcon } from 'lucide-react';

interface ShotChipProps {
  icon: LucideIcon;
  text: string;
  testId?: string;
}

export function ShotChip({ icon: Icon, text, testId }: ShotChipProps) {
  return (
    <div
      className="flex items-start gap-1.5 rounded-lg border border-border px-3 py-2"
      data-testid={testId}
    >
      <Icon className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
      <span className="text-xs text-muted-foreground">{text}</span>
    </div>
  );
}
