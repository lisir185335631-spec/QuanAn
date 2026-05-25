/**
 * AdviceCard.tsx — 单建议 card
 * icon + label bold + content
 */
import { Lightbulb, Scissors, Music } from 'lucide-react';

import type { AdviceCardData } from '@/lib/constants/ai-video';

const ICON_MAP: Record<string, React.ReactNode> = {
  shooting: <Lightbulb className="w-5 h-5 text-primary flex-shrink-0" />,
  editing:  <Scissors  className="w-5 h-5 text-primary flex-shrink-0" />,
  music:    <Music     className="w-5 h-5 text-primary flex-shrink-0" />,
};

interface AdviceCardProps {
  advice: AdviceCardData;
}

export function AdviceCard({ advice }: AdviceCardProps) {
  return (
    <div
      className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
      data-testid={`advice-card-${advice.id}`}
    >
      {ICON_MAP[advice.id] ?? <Lightbulb className="w-5 h-5 text-primary flex-shrink-0" />}
      <p className="text-sm text-muted-foreground">
        <span className="font-bold text-on-surface">{advice.label}</span>
        {advice.content}
      </p>
    </div>
  );
}
