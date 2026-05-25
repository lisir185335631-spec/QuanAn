/**
 * EvolutionBreadcrumb · EVOLUTION > 智能体进化中心 chip
 */
import { ChevronRight } from 'lucide-react';

import {
  EVOLUTION_BREADCRUMB_LEFT,
  EVOLUTION_H1,
} from '@/lib/constants/evolution';

export function EvolutionBreadcrumb() {
  return (
    <div
      data-testid="evolution-breadcrumb"
      className="flex items-center gap-1 text-xs text-muted-foreground"
    >
      <span className="uppercase tracking-widest font-semibold text-primary">
        {EVOLUTION_BREADCRUMB_LEFT}
      </span>
      <ChevronRight className="w-3 h-3" />
      <span>{EVOLUTION_H1}</span>
    </div>
  );
}
