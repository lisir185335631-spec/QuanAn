import { useState } from 'react';

import { FAQSection } from '@/components/guide/FAQSection';
import { FlowSection } from '@/components/guide/FlowSection';
import { GuideChip } from '@/components/guide/GuideChip';
import { SectionAccordion } from '@/components/guide/SectionAccordion';
import { Input } from '@/components/ui/input';
import { GUIDE_SEARCH_PLACEHOLDER, GUIDE_SECTIONS_14 } from '@/lib/constants/guide';

export default function Guide() {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = searchQuery
    ? GUIDE_SECTIONS_14.filter(
        (s) => s.name.includes(searchQuery) || s.sub.includes(searchQuery),
      )
    : GUIDE_SECTIONS_14;

  return (
    <main className="flex-1 container mx-auto max-w-5xl py-8 space-y-8">
      <GuideChip />
      {!searchQuery && <FlowSection />}
      <Input
        type="search"
        placeholder={GUIDE_SEARCH_PLACEHOLDER}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-md"
        data-testid="guide-search-input"
      />
      <div className="space-y-3">
        {filtered.map((section) => (
          <SectionAccordion key={section.id} section={section} />
        ))}
      </div>
      <FAQSection />
    </main>
  );
}
