import {
  Briefcase,
  BookOpen,
  Heart,
  Mic,
  Package,
  Target,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const DIMENSION_ICONS: Record<string, LucideIcon> = {
  positioning: Target,
  branding: Package,
  traffic: Zap,
  value: BookOpen,
  case: Briefcase,
  persona: Heart,
  authentic: Mic,
};

interface DimensionIconBlockProps {
  dimensionId: string;
  label: string;
  subtitle: string;
}

export function DimensionIconBlock({ dimensionId, label, subtitle }: DimensionIconBlockProps) {
  const Icon = DIMENSION_ICONS[dimensionId];
  if (!Icon) return null;

  return (
    <div
      data-testid={`dimension-icon-block-${dimensionId}`}
      className="flex items-center gap-4 rounded-xl bg-card p-5 mb-2"
    >
      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-background">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-lg font-bold text-on-surface">{label}</span>
        <span className="text-sm text-muted-foreground">{subtitle}</span>
      </div>
    </div>
  );
}
