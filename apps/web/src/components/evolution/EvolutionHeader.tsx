/**
 * EvolutionHeader · breadcrumb + Brain h1 + subtitle highlights + 触发进化 btn
 */
import { Brain, Zap } from 'lucide-react';

import {
  EVOLUTION_H1,
  EVOLUTION_SUBTITLE_PARTS,
  EVOLUTION_TRIGGER_BTN,
} from '@/lib/constants/evolution';

import { EvolutionBreadcrumb } from './EvolutionBreadcrumb';

interface EvolutionHeaderProps {
  onTrigger: () => void;
}

export function EvolutionHeader({ onTrigger }: EvolutionHeaderProps) {
  return (
    <div data-testid="evolution-header" className="space-y-3">
      <EvolutionBreadcrumb />
      <div className="flex items-start justify-between gap-4">
        {/* left: h1 + subtitle */}
        <div className="space-y-2">
          <h1
            data-testid="evolution-h1"
            className="text-2xl font-bold flex items-center gap-2 text-on-surface"
          >
            <Brain className="w-7 h-7 text-primary" />
            {EVOLUTION_H1}
          </h1>
          <p className="text-sm text-muted-foreground">
            {EVOLUTION_SUBTITLE_PARTS.prefix}
            <span className="text-primary font-medium">{EVOLUTION_SUBTITLE_PARTS.highlight1}</span>
            {EVOLUTION_SUBTITLE_PARTS.middle}
            <span className="text-primary font-medium">{EVOLUTION_SUBTITLE_PARTS.highlight2}</span>
            {EVOLUTION_SUBTITLE_PARTS.suffix}
          </p>
        </div>
        {/* right: 触发进化 btn */}
        <button
          type="button"
          data-testid="trigger-evolution-btn"
          onClick={onTrigger}
          className="shrink-0 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Zap className="w-4 h-4" />
          {EVOLUTION_TRIGGER_BTN}
        </button>
      </div>
    </div>
  );
}
