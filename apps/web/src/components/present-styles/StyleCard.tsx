import { Eye } from 'lucide-react';
import { SCENE_LABEL, SCENE_VALUE_DEFAULT } from '@/lib/constants/present-styles';
import type { Style } from '@/lib/constants/present-styles';

export interface StyleCardProps {
  style: Style;
}

export default function StyleCard({ style }: StyleCardProps) {
  return (
    <div
      className="rounded-xl border border-border bg-card p-6 min-h-[200px] flex flex-col justify-between"
      data-testid={`style-card-${style.id}`}
    >
      <div className="space-y-3">
        <h3 className="text-xl font-semibold text-on-surface">{style.label}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{style.description}</p>
      </div>
      <div className="flex items-center gap-1.5 text-primary text-sm mt-6">
        <Eye className="w-4 h-4" aria-hidden="true" />
        <span>{SCENE_LABEL}：{SCENE_VALUE_DEFAULT}</span>
      </div>
    </div>
  );
}
