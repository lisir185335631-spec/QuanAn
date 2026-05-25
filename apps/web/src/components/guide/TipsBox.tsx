import { CheckCircle2, Lightbulb } from 'lucide-react';

import { GUIDE_TIPS_TITLE } from '@/lib/constants/guide';

interface TipsBoxProps {
  tips: ReadonlyArray<string>;
}

export function TipsBox({ tips }: TipsBoxProps) {
  return (
    <div
      data-testid="tips-box"
      className="rounded-lg border bg-card/40 p-4"
    >
      <h4 className="font-cn text-sm font-bold text-foreground mb-3 flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-primary flex-shrink-0" />
        {GUIDE_TIPS_TITLE}
      </h4>
      <ul className="space-y-2">
        {tips.map((tip) => (
          <li key={tip} className="flex gap-2 items-start">
            <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <span className="font-cn text-xs text-muted-foreground">{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
