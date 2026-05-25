import { useState } from 'react';

import type { GuideSection } from '@/lib/constants/guide';

import { SectionHeader } from './SectionHeader';
import { SectionStepsList } from './SectionStepsList';
import { TipsBox } from './TipsBox';

interface SectionAccordionProps {
  section: GuideSection;
}

export function SectionAccordion({ section }: SectionAccordionProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div
      data-testid={`section-accordion-${section.id}`}
      className="rounded-xl border bg-card"
    >
      <SectionHeader
        section={section}
        isOpen={isOpen}
        onToggle={() => setIsOpen((prev) => !prev)}
      />
      {isOpen && (
        <div
          data-testid={`section-body-${section.id}`}
          className="p-5 pt-0 space-y-6"
        >
          <SectionStepsList steps={section.steps} />
          {section.tips.length > 0 && <TipsBox tips={section.tips} />}
        </div>
      )}
    </div>
  );
}
