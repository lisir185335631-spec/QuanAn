import { ChevronDown, ChevronUp } from 'lucide-react';

import type { GuideSection } from '@/lib/constants/guide';

interface SectionHeaderProps {
  section: GuideSection;
  isOpen: boolean;
  onToggle: () => void;
}

export function SectionHeader({ section, isOpen, onToggle }: SectionHeaderProps) {
  const Icon = section.icon;
  return (
    <button
      data-testid={`section-header-${section.id}`}
      type="button"
      className="w-full flex items-center justify-between p-5 cursor-pointer text-left"
      onClick={onToggle}
      aria-expanded={isOpen}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-card border border-primary/30 flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="font-cn text-base font-bold text-foreground">{section.name}</p>
          <p className="font-cn text-xs text-muted-foreground">{section.sub}</p>
        </div>
      </div>
      {isOpen ? (
        <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      ) : (
        <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      )}
    </button>
  );
}
